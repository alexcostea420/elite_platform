#!/usr/bin/env python3
"""
Whale alerts → #🧠-alex-brain Discord channel.

Reads recent OPEN fills from whale_fills (Hyperliquid top 20 wallets), filters
to notional >= $1M, and posts a formatted alert to Discord. Tracks alerted
fill IDs in a state file to avoid duplicates across runs.

Schedule: every 30 min, 3 minutes after fetch_positions_fills.py finishes.
Crontab line:
  3,33 * * * * cd /Users/server/elite_platform && /Library/Developer/CommandLineTools/usr/bin/python3 scripts/whale_tracker/alert_big_positions.py >> /Users/server/elite_platform/scripts/whale_tracker/logs/alert_big_positions.log 2>&1
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY  # noqa: E402

# Bot token & channel
ALEX_BRAIN_ENV = os.path.expanduser("~/alexs-brain/.env")
ALEX_BRAIN_CHANNEL_ID = "1479579144613400686"  # #🧠-alex-brain
DISCORD_API = "https://discord.com/api/v10"

MIN_ALERT_NOTIONAL = 1_000_000  # $1M
LOOKBACK_MIN = 35  # safety margin around 30-min cron
STATE_PATH = os.path.expanduser("~/elite_platform/scripts/whale_tracker/.alert_state.json")
ALERT_RATE_LIMIT_SLEEP = 1.2  # seconds between Discord posts


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def load_token():
    if not os.path.exists(ALEX_BRAIN_ENV):
        raise RuntimeError(f"Missing {ALEX_BRAIN_ENV}")
    with open(ALEX_BRAIN_ENV) as f:
        for line in f:
            line = line.strip()
            if line.startswith("DISCORD_TOKEN="):
                return line.split("=", 1)[1]
    raise RuntimeError("DISCORD_TOKEN not found in alexs-brain .env")


def load_state():
    if not os.path.exists(STATE_PATH):
        return {"alerted_tids": [], "last_run": None}
    try:
        with open(STATE_PATH) as f:
            data = json.load(f)
        # Trim to last 1000 to keep file small
        data["alerted_tids"] = data.get("alerted_tids", [])[-1000:]
        return data
    except Exception:
        return {"alerted_tids": [], "last_run": None}


def save_state(state):
    state["last_run"] = datetime.now(tz=timezone.utc).isoformat()
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f)
    os.replace(tmp, STATE_PATH)


def supabase_get(table, params):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as e:
        log(f"  supabase GET {table} failed: {e}")
        return []


def fetch_recent_opens():
    """Get OPEN fills from the last LOOKBACK_MIN minutes with notional >= MIN_ALERT_NOTIONAL."""
    cutoff = (datetime.now(tz=timezone.utc) - timedelta(minutes=LOOKBACK_MIN)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = (
        f"select=tid,address,asset,direction,price,size,notional_usd,filled_at"
        f"&action_type=eq.OPEN"
        f"&filled_at=gte.{cutoff}"
        f"&notional_usd=gte.{MIN_ALERT_NOTIONAL}"
        f"&direction=in.(LONG,SHORT)"
        f"&order=filled_at.asc"
        f"&limit=50"
    )
    return supabase_get("whale_fills", params)


def fetch_wallet_pnl_7d(address):
    """Sum closed_pnl over last 7d for context."""
    cutoff = (datetime.now(tz=timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = (
        f"select=closed_pnl"
        f"&address=eq.{address}"
        f"&filled_at=gte.{cutoff}"
        f"&limit=2000"
    )
    rows = supabase_get("whale_fills", params)
    return sum(float(r.get("closed_pnl", 0) or 0) for r in rows)


def fetch_consensus(asset):
    """Top-20 long/short bias for this asset."""
    asset_q = urllib.parse.quote(asset, safe="")
    rows = supabase_get(
        "whale_consensus",
        f"select=long_pct,short_pct,long_count,short_count&asset=eq.{asset_q}&limit=1",
    )
    return rows[0] if rows else None


def fmt_usd(n):
    n = float(n)
    if abs(n) >= 1_000_000_000:
        return f"${n/1_000_000_000:.2f}B"
    if abs(n) >= 1_000_000:
        return f"${n/1_000_000:.2f}M"
    if abs(n) >= 1_000:
        return f"${n/1_000:.1f}k"
    return f"${n:.0f}"


def short_addr(addr):
    if not addr or len(addr) < 10:
        return addr or "?"
    return f"{addr[:6]}…{addr[-4:]}"


def estimate_liq_pct(direction):
    # We do not have leverage on fills directly. Return a conservative narrative bucket.
    return None  # we annotate via wallet position instead, or leave blank


def fetch_position_leverage(address, asset, direction):
    """Look up current open position to get leverage + entry."""
    asset_q = urllib.parse.quote(asset, safe="")
    params = (
        f"select=leverage,entry_price,size,direction"
        f"&address=eq.{address}"
        f"&asset=eq.{asset_q}"
        f"&direction=eq.{direction}"
        f"&is_current=eq.true"
        f"&limit=1"
    )
    rows = supabase_get("whale_positions", params)
    return rows[0] if rows else None


def estimate_liq_price(entry, leverage, direction):
    if not entry or not leverage or leverage <= 0:
        return None
    buf = 1.0 / leverage
    return entry * (1 - buf) if direction == "LONG" else entry * (1 + buf)


def build_message(fill, position, consensus, pnl_7d):
    direction = fill["direction"]
    asset = fill["asset"]
    price = float(fill["price"])
    notional = float(fill["notional_usd"])
    address = fill["address"]

    arrow = "📈" if direction == "LONG" else "📉"
    side_word = "LONG" if direction == "LONG" else "SHORT"

    lines = [
        f"🐋 **WHALE WATCH** · {arrow} `{side_word}` `{asset}` · {fmt_usd(notional)}",
        f"`{short_addr(address)}` (top 20 Hyperliquid)",
        f"Entry: **${price:,.2f}**",
    ]

    if position:
        lev = position.get("leverage")
        entry = float(position.get("entry_price") or price)
        liq = estimate_liq_price(entry, lev, direction)
        if lev and liq:
            move_pct = (liq - price) / price * 100
            lines.append(
                f"Leverage: **{lev}x** · Liq estimat: **${liq:,.0f}** ({move_pct:+.1f}%)",
            )

    if consensus:
        lp = float(consensus.get("long_pct") or 0)
        sp = float(consensus.get("short_pct") or 0)
        bias = "LONG" if lp > sp else "SHORT"
        lines.append(f"Bias top 20 pe {asset}: **{lp:.0f}% long / {sp:.0f}% short** ({bias})")

    if pnl_7d:
        sign = "+" if pnl_7d >= 0 else ""
        lines.append(f"PnL 7d wallet: **{sign}{fmt_usd(pnl_7d)}**")

    lines.append("")
    lines.append("_Alertă auto: poziție deschisă acum, nu semnal de tranzacție._")
    return "\n".join(lines)


def post_to_discord(token, content):
    url = f"{DISCORD_API}/channels/{ALEX_BRAIN_CHANNEL_ID}/messages"
    body = json.dumps({"content": content}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bot {token}",
            "Content-Type": "application/json",
            "User-Agent": "AlexsBrainAlerts/1.0",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status == 200 or resp.status == 201
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        log(f"  discord POST failed {e.code}: {body[:200]}")
        return False
    except Exception as e:
        log(f"  discord POST error: {e}")
        return False


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: missing Supabase credentials in .env.local")
        return 1

    token = load_token()
    state = load_state()
    alerted = set(state["alerted_tids"])

    fills = fetch_recent_opens()
    log(f"fetched {len(fills)} opens >= ${MIN_ALERT_NOTIONAL/1_000_000}M in last {LOOKBACK_MIN}m")

    posted = 0
    for f in fills:
        tid = str(f["tid"])
        if tid in alerted:
            continue

        position = fetch_position_leverage(f["address"], f["asset"], f["direction"])
        consensus = fetch_consensus(f["asset"])
        pnl_7d = fetch_wallet_pnl_7d(f["address"])

        msg = build_message(f, position, consensus, pnl_7d)

        if post_to_discord(token, msg):
            alerted.add(tid)
            posted += 1
            log(f"  posted alert for tid={tid} {f['direction']} {f['asset']} ${f['notional_usd']:,.0f}")
        else:
            log(f"  FAILED to post tid={tid}")

        time.sleep(ALERT_RATE_LIMIT_SLEEP)

    state["alerted_tids"] = list(alerted)
    save_state(state)
    log(f"done. posted={posted} skipped={len(fills) - posted}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
