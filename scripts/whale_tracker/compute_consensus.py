#!/usr/bin/env python3
"""
Compute consensus: aggregate current positions across top 20 per asset.
Run after fetch_positions_fills.

For each asset: long_count, short_count, net notional, avg leverage per side, dominant side.
"""

import json
import os
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def supabase_req(method, table, params="", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    body = json.dumps(data).encode() if data else None
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal" if method == "POST" else "return=representation",
    }
    if method in ("PATCH", "DELETE"):
        headers["Prefer"] = "return=minimal"
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
    log("compute_consensus starting...")

    # Get all current positions
    positions = supabase_req(
        "GET", "whale_positions",
        "is_current=eq.true&select=address,asset,direction,size,notional_usd,leverage"
    ) or []

    log(f"Processing {len(positions)} current positions")

    # Aggregate per asset
    assets = defaultdict(lambda: {
        "longs": [], "shorts": [],
        "long_notional": 0, "short_notional": 0,
    })

    for p in positions:
        asset = p["asset"]
        notional = float(p.get("notional_usd", 0))
        leverage = float(p.get("leverage", 0))

        if p["direction"] == "LONG":
            assets[asset]["longs"].append(leverage)
            assets[asset]["long_notional"] += notional
        else:
            assets[asset]["shorts"].append(leverage)
            assets[asset]["short_notional"] += notional

    # Clear old consensus
    supabase_req("DELETE", "whale_consensus", "asset=neq.___placeholder___")

    now_iso = datetime.now(timezone.utc).isoformat()

    for asset, data in sorted(assets.items(), key=lambda x: -(x[1]["long_notional"] + x[1]["short_notional"])):
        long_count = len(data["longs"])
        short_count = len(data["shorts"])
        net = data["long_notional"] - data["short_notional"]
        avg_long_lev = sum(data["longs"]) / long_count if long_count else None
        avg_short_lev = sum(data["shorts"]) / short_count if short_count else None

        if long_count > short_count:
            dominant = "LONG"
        elif short_count > long_count:
            dominant = "SHORT"
        else:
            dominant = "NEUTRAL"

        row = {
            "asset": asset,
            "long_count": long_count,
            "short_count": short_count,
            "net_long_notional_usd": round(net, 2),
            "avg_long_leverage": round(avg_long_lev, 1) if avg_long_lev else None,
            "avg_short_leverage": round(avg_short_lev, 1) if avg_short_lev else None,
            "dominant_side": dominant,
            "updated_at": now_iso,
        }
        supabase_req("POST", "whale_consensus", "on_conflict=asset", row)

    log(f"SUMMARY: consensus computed for {len(assets)} assets")
    log("compute_consensus done.")


if __name__ == "__main__":
    main()
