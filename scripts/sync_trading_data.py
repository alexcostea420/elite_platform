#!/usr/bin/env python3
"""
Sync trading bot data from local JSON files to Supabase.
Runs on Mac Mini every 5 minutes via launchd or cron.

Usage:
    python3 scripts/sync_trading_data.py

Env vars required:
    SUPABASE_URL
    SUPABASE_SERVICE_KEY
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

try:
    from supabase import create_client
except ImportError:
    print("Install supabase-py: pip3 install supabase")
    sys.exit(1)

# Config
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
TRADING_BOT_DIR = Path.home() / "trading-bot"

DATA_FILES = {
    "risk_score": TRADING_BOT_DIR / "reports" / "risk_score.json",
    "fleet_status": TRADING_BOT_DIR / "data" / "fleet_status.json",
    "dynamic_limits": TRADING_BOT_DIR / "data" / "dynamic_limits.json",
}

HASH_CACHE_DIR = Path.home() / ".cache" / "elite_platform_sync"
HASH_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _hash_payload(data: dict) -> str:
    return hashlib.sha256(json.dumps(data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _read_last_hash(data_type: str) -> Optional[str]:
    p = HASH_CACHE_DIR / f"{data_type}.sha256"
    return p.read_text().strip() if p.exists() else None


def _write_last_hash(data_type: str, h: str) -> None:
    (HASH_CACHE_DIR / f"{data_type}.sha256").write_text(h)


def load_json(path: Path) -> Optional[dict]:
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"  ⚠ Could not read {path.name}: {e}")
        return None


def sync_to_supabase(supabase, data_type: str, data: dict) -> bool:
    try:
        result = supabase.table("trading_data").upsert(
            {
                "data_type": data_type,
                "data": data,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="data_type",
        ).execute()
        return bool(result.data)
    except Exception as e:
        print(f"  ✗ Supabase error for {data_type}: {e}")
        return False


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars")
        print("  Set them in .env.local or export them")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Syncing trading data to Supabase...")

    synced = 0
    skipped = 0
    for data_type, file_path in DATA_FILES.items():
        data = load_json(file_path)
        if data is None:
            continue

        new_hash = _hash_payload(data)
        if _read_last_hash(data_type) == new_hash:
            skipped += 1
            continue

        if sync_to_supabase(supabase, data_type, data):
            _write_last_hash(data_type, new_hash)
            print(f"  ✓ {data_type} synced")
            synced += 1

    print(f"  Done: {synced} synced, {skipped} unchanged")
    return synced


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from common.lockfile import acquire_lock_or_exit
    acquire_lock_or_exit("sync_trading_data")

    # One-shot mode (for cron) or loop mode
    if "--loop" in sys.argv:
        interval = int(os.environ.get("SYNC_INTERVAL", "300"))  # 5 min default
        print(f"Running in loop mode (every {interval}s). Ctrl+C to stop.")
        while True:
            try:
                main()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\nStopped.")
                break
    else:
        main()
