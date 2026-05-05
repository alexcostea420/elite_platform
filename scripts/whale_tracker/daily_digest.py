#!/usr/bin/env python3
"""
Whale daily digest → #🧠-alex-brain Discord channel.

Posts a single summary message every morning with what the top 20 Hyperliquid
whales did in the last 24 hours: biggest open, biggest close, net flow per
asset, biggest PnL win/loss.

Schedule: daily at 06:05 UTC (≈09:05 EEST), after fetch_pnl_history runs.
Crontab line:
  5 6 * * * cd /Users/server/elite_platform && /Library/Developer/CommandLineTools/usr/bin/python3 scripts/whale_tracker/daily_digest.py >> /Users/server/elite_platform/scripts/whale_tracker/logs/daily_digest.log 2>&1
"""

import json
import os
import sys
import urllib.parse
import urllib.request
import warnings
from collections import defaultdict
from datetime import datetime, timedelta, timezone

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY  # noqa: E402

ALEX_BRAIN_ENV = os.path.expanduser("~/alexs-brain/.env")
ALEX_BRAIN_CHANNEL_ID = "1479579144613400686"  # #🧠-alex-brain
DISCORD_API = "https://discord.com/api/v10"

LOOKBACK_HOURS = 24
MIN_NOTIONAL_FOR_DIGEST = 1_000
MIN_PER_ASSET_TOTAL = 10_000


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


def supabase_get(table, params):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read().decode())
    except Exception as e:
        log(f"  supabase GET {table} failed: {e}")
        return []


def fmt_usd(n):
    n = float(n or 0)
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


def fetch_recent_fills():
    cutoff = (datetime.now(tz=timezone.utc) - timedelta(hours=LOOKBACK_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = (
        f"select=address,asset,direction,action_type,notional_usd,closed_pnl,filled_at"
        f"&filled_at=gte.{cutoff}"
        f"&notional_usd=gte.{MIN_NOTIONAL_FOR_DIGEST}"
        f"&order=filled_at.desc"
        f"&limit=2000"
    )
    return supabase_get("whale_fills", params)


def fetch_consensus():
    return supabase_get(
        "whale_consensus",
        "select=asset,long_count,short_count,dominant_side&order=long_count.desc&limit=15",
    )


def aggregate_per_asset(fills):
    """Per asset: net OPEN long minus OPEN short, total volume."""
    per_asset = defaultdict(lambda: {"open_long": 0.0, "open_short": 0.0, "close_count": 0})
    for f in fills:
        n = float(f.get("notional_usd") or 0)
        a = per_asset[f["asset"]]
        if f["action_type"] == "OPEN":
            if f["direction"] == "LONG":
                a["open_long"] += n
            else:
                a["open_short"] += n
        else:
            a["close_count"] += 1
    rows = []
    for asset, v in per_asset.items():
        total = v["open_long"] + v["open_short"]
        if total < MIN_PER_ASSET_TOTAL:
            continue
        rows.append({
            "asset": asset,
            "open_long": v["open_long"],
            "open_short": v["open_short"],
            "net": v["open_long"] - v["open_short"],
            "total": total,
        })
    rows.sort(key=lambda r: r["total"], reverse=True)
    return rows[:5]


def build_digest(fills, consensus):
    if not fills:
        return None

    # Biggest single open
    opens = [f for f in fills if f["action_type"] == "OPEN"]
    biggest_open = max(opens, key=lambda f: float(f.get("notional_usd") or 0)) if opens else None

    # Biggest closed PnL win + loss
    closes = [f for f in fills if f["action_type"] != "OPEN" and f.get("closed_pnl") not in (None, 0)]
    big_win = max(closes, key=lambda f: float(f.get("closed_pnl") or 0)) if closes else None
    big_loss = min(closes, key=lambda f: float(f.get("closed_pnl") or 0)) if closes else None
    if big_win and float(big_win.get("closed_pnl") or 0) <= 0:
        big_win = None
    if big_loss and float(big_loss.get("closed_pnl") or 0) >= 0:
        big_loss = None

    per_asset = aggregate_per_asset(fills)

    lines = [
        "🐋 **WHALE DIGEST · 24h**",
        f"_{len(fills)} tranzacții ≥ {fmt_usd(MIN_NOTIONAL_FOR_DIGEST)} de la top 20 Hyperliquid_",
        "",
    ]

    if per_asset:
        lines.append("**Flux 24h pe asset (OPEN long minus short):**")
        for r in per_asset:
            net = r["net"]
            arrow = "🟢" if net > 0 else "🔴" if net < 0 else "⚪"
            sign = "+" if net >= 0 else ""
            lines.append(
                f"  {arrow} `{r['asset']}` net {sign}{fmt_usd(net)} "
                f"(L {fmt_usd(r['open_long'])} / S {fmt_usd(r['open_short'])})"
            )
        lines.append("")

    if biggest_open:
        n = float(biggest_open.get("notional_usd") or 0)
        emoji = "📈" if biggest_open["direction"] == "LONG" else "📉"
        lines.append(
            f"**Cel mai mare open:** {emoji} `{biggest_open['direction']}` `{biggest_open['asset']}` "
            f"{fmt_usd(n)} de `{short_addr(biggest_open['address'])}`"
        )

    if big_win:
        lines.append(f"**Cel mai mare profit:** +{fmt_usd(big_win['closed_pnl'])} pe `{big_win['asset']}` (`{short_addr(big_win['address'])}`)")
    if big_loss:
        lines.append(f"**Cea mai mare pierdere:** {fmt_usd(big_loss['closed_pnl'])} pe `{big_loss['asset']}` (`{short_addr(big_loss['address'])}`)")

    if consensus:
        # Find the asset where whale bias is most lopsided
        biased = [c for c in consensus if c["long_count"] + c["short_count"] >= 5]
        if biased:
            biased.sort(key=lambda c: abs(c["long_count"] - c["short_count"]), reverse=True)
            top = biased[0]
            total = top["long_count"] + top["short_count"]
            long_pct = round(top["long_count"] / total * 100) if total else 50
            lines.append("")
            lines.append(
                f"**Cea mai puternică convingere:** `{top['asset']}` "
                f"{long_pct}% long / {100 - long_pct}% short ({total} whales)"
            )

    lines.append("")
    lines.append("_Datele nu sunt sfat de investiții. Whales pierd și ele._")
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
            "User-Agent": "WhaleDigest/1.0",
        },
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return resp.status in (200, 201)
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

    log(f"daily digest starting (lookback={LOOKBACK_HOURS}h)")

    fills = fetch_recent_fills()
    log(f"fetched {len(fills)} fills")

    consensus = fetch_consensus()
    log(f"fetched consensus for {len(consensus)} assets")

    digest = build_digest(fills, consensus)
    if not digest:
        log("nothing to digest, skipping")
        return 0

    # Discord caps at 2000 chars
    if len(digest) > 1900:
        digest = digest[:1900] + "\n…(trunchiat)"

    token = load_token()
    if post_to_discord(token, digest):
        log(f"posted digest ({len(digest)} chars)")
        return 0
    else:
        log("FAILED to post digest")
        return 1


if __name__ == "__main__":
    sys.exit(main())
