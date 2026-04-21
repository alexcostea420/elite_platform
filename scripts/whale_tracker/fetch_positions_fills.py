#!/usr/bin/env python3
"""
Fetch current positions and recent fills for all top 20 wallets.
Run every 30 minutes.

For each wallet:
1. Fetch clearinghouseState → open positions
2. Fetch userFills (last 2000) → recent trades
3. Mark old positions is_current=false, insert new ones
4. Insert fills with ON CONFLICT tid DO NOTHING
5. Update whale_wallets.last_activity
"""

import json
import math
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY, HL_API_BASE, RATE_LIMIT_DELAY


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def hl_post(body, retries=2):
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(
                HL_API_BASE,
                data=json.dumps(body).encode(),
                headers={"Content-Type": "application/json"},
            )
            resp = urllib.request.urlopen(req, timeout=15)
            return json.loads(resp.read().decode())
        except Exception as e:
            if attempt < retries:
                time.sleep(2 ** attempt)
                continue
            raise e


def supabase_req(method, table, params="", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    body = json.dumps(data).encode() if data else None
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal" if method == "POST" else "return=minimal",
    }
    if method == "GET":
        headers["Prefer"] = "return=representation"
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        content = resp.read().decode()
        return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        err = e.read().decode() if e.fp else ""
        log(f"  Supabase {method} {table} error {e.code}: {err[:200]}")
        return None


def fetch_meta_prices():
    """Fetch current mark prices for all assets."""
    data = hl_post({"type": "metaAndAssetCtxs"})
    prices = {}
    if isinstance(data, list) and len(data) >= 2:
        universe = data[0].get("universe", [])
        ctxs = data[1]
        for i, asset in enumerate(universe):
            if i < len(ctxs):
                prices[asset["name"]] = float(ctxs[i].get("markPx", "0"))
    return prices


def main():
    log("=" * 50)
    log("fetch_positions_fills starting...")

    # Get wallets from DB
    wallets = supabase_req("GET", "whale_wallets", "select=address,rank&order=rank.asc") or []
    if not wallets:
        log("No wallets in DB. Run fetch_top_wallets first.")
        return

    log(f"Processing {len(wallets)} wallets...")

    # Fetch mark prices once
    mark_prices = fetch_meta_prices()
    log(f"Got mark prices for {len(mark_prices)} assets")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    total_positions = 0
    total_fills = 0

    for w in wallets:
        addr = w["address"]
        rank = w["rank"]
        log(f"  #{rank} {addr[:10]}...")

        # 1. Fetch positions
        try:
            state = hl_post({"type": "clearinghouseState", "user": addr})
            positions = state.get("assetPositions", [])
        except Exception as e:
            log(f"    positions error: {e}")
            positions = []
            time.sleep(RATE_LIMIT_DELAY)
            continue

        time.sleep(RATE_LIMIT_DELAY)

        # Mark old positions as not current
        supabase_req("PATCH", "whale_positions", f"address=eq.{addr}&is_current=eq.true", {"is_current": False})

        # Insert new positions
        for p in positions:
            pos = p.get("position", p)
            coin = pos.get("coin", "")
            szi = float(pos.get("szi", "0"))
            if szi == 0:
                continue

            direction = "LONG" if szi > 0 else "SHORT"
            size = abs(szi)
            entry_px = float(pos.get("entryPx", "0"))
            mark_px = mark_prices.get(coin, entry_px)
            notional = size * mark_px

            lev_data = pos.get("leverage", {})
            leverage = float(lev_data.get("value", 0)) if isinstance(lev_data, dict) else 0
            unrealized = float(pos.get("unrealizedPnl", "0"))
            margin = float(pos.get("marginUsed", "0"))

            row = {
                "address": addr, "asset": coin, "direction": direction,
                "size": size, "entry_price": entry_px, "leverage": leverage,
                "unrealized_pnl": unrealized, "margin_used": margin,
                "notional_usd": round(notional, 2),
                "snapshot_at": now_iso, "is_current": True,
            }
            supabase_req("POST", "whale_positions", "", row)

            # Also append to history
            hist_row = dict(row)
            del hist_row["is_current"]
            supabase_req("POST", "whale_positions_history", "", hist_row)
            total_positions += 1

        # 2. Fetch fills
        try:
            fills = hl_post({"type": "userFills", "user": addr})
        except Exception as e:
            log(f"    fills error: {e}")
            fills = []

        time.sleep(RATE_LIMIT_DELAY)

        for f in fills[:200]:  # Limit to last 200 per cycle
            coin = f.get("coin", "")
            px = float(f.get("px", "0"))
            sz = float(f.get("sz", "0"))
            mark_px = mark_prices.get(coin, px)
            notional = sz * px
            tid = str(f.get("tid", ""))
            filled_ms = f.get("time", 0)
            filled_at = datetime.fromtimestamp(filled_ms / 1000, tz=timezone.utc).isoformat()

            # dir field: "Open Long", "Open Short", "Close Long", "Close Short"
            direction = f.get("dir", "")
            # Derive action type
            if "Open" in direction:
                action = "OPEN"
            elif "Close" in direction:
                action = "CLOSE"
            else:
                action = "TRADE"

            # Simplify direction to LONG/SHORT
            if "Long" in direction:
                dir_simple = "LONG"
            elif "Short" in direction:
                dir_simple = "SHORT"
            else:
                dir_simple = direction

            row = {
                "address": addr, "asset": coin, "direction": dir_simple,
                "price": px, "size": sz, "notional_usd": round(notional, 2),
                "closed_pnl": float(f.get("closedPnl", "0")),
                "action_type": action, "filled_at": filled_at, "tid": tid,
            }
            supabase_req("POST", "whale_fills", "on_conflict=tid", row)
            total_fills += 1

        # Update last_activity
        if fills:
            latest_ms = max(f.get("time", 0) for f in fills)
            if latest_ms > 0:
                latest_at = datetime.fromtimestamp(latest_ms / 1000, tz=timezone.utc).isoformat()
                supabase_req("PATCH", "whale_wallets", f"address=eq.{addr}", {"last_activity": latest_at})

    log(f"SUMMARY: {total_positions} positions, {total_fills} fills processed for {len(wallets)} wallets")
    log("fetch_positions_fills done.")


if __name__ == "__main__":
    main()
