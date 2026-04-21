#!/usr/bin/env python3
"""
Fetch top 20 wallets by 90-day PnL from Hyperliquid leaderboard.
Run weekly (Monday 07:00 UTC).

1. Pull top 40 from month leaderboard
2. Filter by account_value > 0 (active wallets)
3. Sort by month PnL, keep top 20
4. Upsert whale_wallets, detect churn, log to whale_churn_log
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from config import SUPABASE_URL, SUPABASE_KEY, HL_LEADERBOARD_URL, HL_API_BASE, WALLET_COUNT, RATE_LIMIT_DELAY


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
        "Prefer": "return=minimal" if method != "GET" else "return=representation",
    }
    if method == "POST":
        headers["Prefer"] = "resolution=merge-duplicates,return=minimal"
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
    log("fetch_top_wallets starting...")

    # 1. Get leaderboard
    req = urllib.request.Request(HL_LEADERBOARD_URL, headers={"User-Agent": "ArmataBot/1.0"})
    resp = urllib.request.urlopen(req, timeout=30)
    lb = json.loads(resp.read().decode())
    rows = lb.get("leaderboardRows", [])
    log(f"Leaderboard: {len(rows)} traders total")

    # 2. Filter active wallets with significant AV and month PnL
    candidates = []
    for r in rows:
        av = float(r.get("accountValue", "0"))
        if av < 50000:
            continue
        wp = {w[0]: w[1] for w in r.get("windowPerformances", [])}
        month_pnl = float(wp.get("month", {}).get("pnl", "0"))
        all_time_pnl = float(wp.get("allTime", {}).get("pnl", "0"))
        month_vlm = float(wp.get("month", {}).get("vlm", "0"))
        candidates.append({
            "address": r["ethAddress"],
            "display_name": r.get("displayName"),
            "account_value": av,
            "pnl_90d": month_pnl,  # Using month PnL as proxy for 90d
            "volume_90d": month_vlm,
        })

    # Sort by month PnL descending
    candidates.sort(key=lambda x: -x["pnl_90d"])
    top = candidates[:WALLET_COUNT]
    log(f"Top {len(top)} wallets selected (from {len(candidates)} candidates)")

    # 3. Get current top 20 from DB
    existing = supabase_req("GET", "whale_wallets", "select=address,rank&order=rank.asc") or []
    old_addrs = {w["address"]: w["rank"] for w in existing}
    new_addrs = {w["address"] for w in top}

    # 4. Detect churn
    entered = new_addrs - set(old_addrs.keys())
    exited = set(old_addrs.keys()) - new_addrs
    now_iso = datetime.now(timezone.utc).isoformat()

    for addr in entered:
        rank = next((i + 1 for i, w in enumerate(top) if w["address"] == addr), None)
        supabase_req("POST", "whale_churn_log", "", {
            "address": addr, "event": "ENTERED",
            "rank_before": None, "rank_after": rank,
            "happened_at": now_iso,
        })
        log(f"  ENTERED: {addr[:10]}... rank #{rank}")

    for addr in exited:
        supabase_req("POST", "whale_churn_log", "", {
            "address": addr, "event": "EXITED",
            "rank_before": old_addrs[addr], "rank_after": None,
            "happened_at": now_iso,
        })
        log(f"  EXITED: {addr[:10]}... was rank #{old_addrs[addr]}")

    # 5. Upsert whale_wallets
    for i, w in enumerate(top):
        rank = i + 1
        prev_rank = old_addrs.get(w["address"])
        row = {
            "address": w["address"],
            "rank": rank,
            "previous_rank": prev_rank,
            "display_name": w["display_name"],
            "account_value": w["account_value"],
            "pnl_90d": w["pnl_90d"],
            "volume_90d": w["volume_90d"],
            "updated_at": now_iso,
        }
        if w["address"] not in old_addrs:
            row["in_top_20_since"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        supabase_req("POST", "whale_wallets", "on_conflict=address", row)

    # 6. Remove wallets no longer in top 20
    for addr in exited:
        supabase_req("DELETE", "whale_wallets", f"address=eq.{addr}")

    log(f"SUMMARY: {len(top)} wallets upserted, {len(entered)} entered, {len(exited)} exited")
    log("fetch_top_wallets done.")


if __name__ == "__main__":
    main()
