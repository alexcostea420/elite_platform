#!/usr/bin/env python3
"""
Fetch PnL history for all top 20 wallets.
Run daily at 06:15 UTC.

Uses Hyperliquid portfolio endpoint (allTime window) to get cumulative PnL history.
Derives daily PnL from differences between consecutive data points.
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY, HL_API_BASE, RATE_LIMIT_DELAY


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def hl_post(body):
    req = urllib.request.Request(
        HL_API_BASE,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read().decode())


def supabase_req(method, table, params="", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    body = json.dumps(data).encode() if data else None
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal" if method == "POST" else "return=representation",
    }
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        content = resp.read().decode()
        return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        err = e.read().decode() if e.fp else ""
        log(f"  Supabase {method} {table} error {e.code}: {err[:200]}")
        return None


def main():
    log("=" * 50)
    log("fetch_pnl_history starting...")

    wallets = supabase_req("GET", "whale_wallets", "select=address,rank&order=rank.asc") or []
    if not wallets:
        log("No wallets. Run fetch_top_wallets first.")
        return

    log(f"Processing {len(wallets)} wallets...")
    total_points = 0

    for w in wallets:
        addr = w["address"]
        rank = w["rank"]

        try:
            portfolio = hl_post({"type": "portfolio", "user": addr})
        except Exception as e:
            log(f"  #{rank} {addr[:10]}... portfolio error: {e}")
            time.sleep(RATE_LIMIT_DELAY)
            continue

        time.sleep(RATE_LIMIT_DELAY)

        # Find perpAllTime or allTime window
        pnl_data = None
        for window in portfolio:
            if window[0] in ("perpAllTime", "allTime"):
                pnl_data = window[1].get("pnlHistory", [])
                break

        if not pnl_data:
            log(f"  #{rank} {addr[:10]}... no PnL data")
            continue

        # Group by date and take last value per day
        daily = {}
        for ts_ms, pnl_str in pnl_data:
            dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
            date_str = dt.strftime("%Y-%m-%d")
            daily[date_str] = float(pnl_str)

        # Only keep last 90 days
        cutoff = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%d")
        daily = {d: v for d, v in daily.items() if d >= cutoff}

        # Compute daily deltas
        sorted_dates = sorted(daily.keys())
        prev_pnl = 0
        for date_str in sorted_dates:
            cum_pnl = daily[date_str]
            daily_pnl = cum_pnl - prev_pnl
            prev_pnl = cum_pnl

            supabase_req("POST", "whale_pnl_daily", "on_conflict=address,date", {
                "address": addr,
                "date": date_str,
                "cumulative_pnl": round(cum_pnl, 2),
                "daily_pnl": round(daily_pnl, 2),
            })
            total_points += 1

        log(f"  #{rank} {addr[:10]}... {len(sorted_dates)} days")

    log(f"SUMMARY: {total_points} PnL data points for {len(wallets)} wallets")
    log("fetch_pnl_history done.")


if __name__ == "__main__":
    main()
