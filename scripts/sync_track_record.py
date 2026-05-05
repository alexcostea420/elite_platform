#!/usr/bin/env python3
"""
sync_track_record.py - Pre-compute track record stats from trades.db
Writes to data/track_record_cache.json every 5 minutes via cron.
Replaces the need for better-sqlite3 in the Next.js API route.
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

TRADES_DB = os.path.expanduser("~/trading-bot/data/trades.db")
LIMITS_FILE = os.path.expanduser("~/trading-bot/data/dynamic_limits.json")
OUTPUT = os.path.expanduser("~/elite_platform/data/track_record_cache.json")
STARTING_EQUITY = 1000

def _load_dotenv(path: str) -> None:
    """Load KEY=value lines from a .env file into os.environ if not already set.
    Cron runs without inheriting shell env, so the script reads .env.local directly.
    """
    if not os.path.exists(path):
        return
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val
    except Exception as e:
        print(f"  ⚠ Could not read {path}: {e}")


_load_dotenv(os.path.expanduser("~/elite_platform/.env.local"))

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def push_to_supabase(payload):
    """Mirror cache to Supabase trading_data so the Vercel API route can read it."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠ Skipping Supabase push: SUPABASE_URL/SUPABASE_SERVICE_KEY not set")
        return False
    try:
        from supabase import create_client
    except ImportError:
        print("  ⚠ Skipping Supabase push: supabase-py not installed")
        return False
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        sb.table("trading_data").upsert(
            {
                "data_type": "track_record_cache",
                "data": payload,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="data_type",
        ).execute()
        return True
    except Exception as e:
        print(f"  ✗ Supabase push failed: {e}")
        return False

def main():
    # Read limits
    equity = 0
    try:
        with open(LIMITS_FILE) as f:
            limits = json.load(f)
            equity = limits.get("equity", 0)
    except Exception:
        pass

    # Read trades
    db = sqlite3.connect(TRADES_DB)
    db.row_factory = sqlite3.Row
    trades = db.execute(
        "SELECT bot_name, timestamp, side, entry_price, exit_price, pnl, status, reason "
        "FROM trades WHERE status = 'closed' AND pnl IS NOT NULL "
        "ORDER BY timestamp DESC"
    ).fetchall()
    db.close()

    trades = [dict(t) for t in trades]

    # Stats
    pnls = [t["pnl"] for t in trades]
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p <= 0]
    total_pnl = sum(pnls)
    win_rate = (len(wins) / len(pnls) * 100) if pnls else 0
    avg_win = (sum(wins) / len(wins)) if wins else 0
    avg_loss = (abs(sum(losses)) / len(losses)) if losses else 0
    pf = (avg_win * len(wins)) / (avg_loss * len(losses)) if losses and avg_loss > 0 else 0
    best = max(pnls) if pnls else 0
    worst = min(pnls) if pnls else 0

    # Equity curve
    sorted_trades = list(reversed(trades))
    cum = 0
    curve = []
    peak = STARTING_EQUITY
    max_dd = 0
    for t in sorted_trades:
        cum += t["pnl"]
        eq = STARTING_EQUITY + cum
        curve.append({"date": t["timestamp"][:10], "equity": round(eq, 2), "pnl": round(cum, 2)})
        if eq > peak:
            peak = eq
        dd = ((peak - eq) / peak) * 100
        if dd > max_dd:
            max_dd = dd

    # Assets
    assets = set()
    for t in trades:
        name = t["bot_name"].replace("portfolio_", "").split("_ml_")[0].upper()
        assets.add(name)

    # Recent trades (last 10, anonymized)
    recent = []
    for t in trades[:10]:
        asset = t["bot_name"].replace("portfolio_", "").split("_ml_")[0].upper()
        entry = t["entry_price"] or 0
        exit_p = t["exit_price"] or 0
        pnl_pct = ((exit_p - entry) / entry * 100 * (-1 if t["side"] == "short" else 1)) if entry > 0 else 0
        recent.append({
            "date": t["timestamp"][:10],
            "asset": asset,
            "direction": t["side"].upper(),
            "entry": round(entry, 2),
            "exit": round(exit_p, 2),
            "pnlPct": round(pnl_pct, 2),
            "pnlUsd": round(t["pnl"], 2),
            "type": t["reason"] or "SL/TP",
        })

    result = {
        "stats": {
            "starting_equity": STARTING_EQUITY,
            "current_equity": round(STARTING_EQUITY + total_pnl, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round((total_pnl / STARTING_EQUITY) * 100, 2),
            "total_trades": len(pnls),
            "win_rate": round(win_rate, 1),
            "profit_factor": round(pf, 2),
            "max_drawdown": round(max_dd, 1),
            "best_trade": round(best, 2),
            "worst_trade": round(worst, 2),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "assets_traded": len(assets),
        },
        "equity_curve": curve,
        "recent_trades": recent,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(result, f)

    pushed = push_to_supabase(result)
    suffix = " · pushed to Supabase" if pushed else ""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] track_record synced: {len(pnls)} trades, PnL=${total_pnl:.2f}{suffix}")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from common.lockfile import acquire_lock_or_exit
    acquire_lock_or_exit("sync_track_record")
    main()
