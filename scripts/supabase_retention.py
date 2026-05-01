#!/usr/bin/env python3
"""
Supabase retention + maintenance.
Runs daily on Mac Mini cron. Prunes aging rows from high-churn tables and
runs VACUUM ANALYZE so disk IO budget on free tier stops getting eaten.

Targets:
    whale_positions_history  > 30 days  (snapshots every 60min, 30d still gives charts)
    whale_fills              > 30 days  (activity feed only needs recent)
    rate_limits              > 7 days   (trial/throttle counters; old entries useless)
    email_drip_queue         > 90 days AND status IN (sent, skipped)
    discord_drip_queue       > 30 days AND sent=true

Runs `VACUUM ANALYZE` after deletes to reclaim space + refresh planner stats.

Usage:
    python3 scripts/supabase_retention.py            # apply
    python3 scripts/supabase_retention.py --dry-run  # report only
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

PAT = os.environ.get("SUPABASE_ACCESS_TOKEN")
PROJECT = os.environ.get("SUPABASE_PROJECT_REF")

if not PAT or not PROJECT:
    # Fallback: load from .env.local
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k == "SUPABASE_ACCESS_TOKEN":
                    PAT = PAT or v
                elif k == "SUPABASE_PROJECT_REF":
                    PROJECT = PROJECT or v

if not PAT or not PROJECT:
    print("✗ Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in env or .env.local")
    sys.exit(1)

API = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"

# (table, where clause, label)
RULES = [
    ("whale_positions_history", "snapshot_at < now() - interval '30 days'", "snapshots > 30d"),
    ("whale_fills",              "filled_at  < now() - interval '30 days'", "fills > 30d"),
    ("rate_limits",              "created_at < now() - interval '7 days'",  "rate_limits > 7d"),
    ("email_drip_queue",         "status IN ('sent','skipped') AND scheduled_at < now() - interval '90 days'", "drip emails > 90d"),
    ("discord_drip_queue",       "sent = true AND send_at < now() - interval '30 days'", "discord drips > 30d"),
]

# Tables to VACUUM ANALYZE after pruning (heaviest IO).
VACUUM_TABLES = [
    "whale_positions_history",
    "whale_fills",
    "whale_positions",
    "rate_limits",
    "email_drip_queue",
    "trading_data",
]


def run_sql(sql: str) -> list | dict:
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {PAT}",
            "Content-Type": "application/json",
            "User-Agent": "elite-platform-retention/1.0 (curl-compat)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTP {e.code}: {body}") from e


def main(dry_run: bool) -> int:
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    print(f"[{ts}] Supabase retention {'DRY RUN' if dry_run else 'APPLY'}")

    total_deleted = 0
    for table, where, label in RULES:
        # Count first
        count_sql = f"SELECT count(*) AS n FROM public.{table} WHERE {where};"
        try:
            res = run_sql(count_sql)
        except Exception as exc:
            print(f"  ✗ {label}: count failed: {exc}")
            continue
        n = res[0]["n"] if isinstance(res, list) and res else 0
        if n == 0:
            print(f"  · {label}: 0 rows to delete")
            continue
        if dry_run:
            print(f"  ◯ {label}: would delete {n} rows from {table}")
            total_deleted += n
            continue
        del_sql = f"DELETE FROM public.{table} WHERE {where};"
        try:
            run_sql(del_sql)
            print(f"  ✓ {label}: deleted {n} rows from {table}")
            total_deleted += n
        except Exception as exc:
            print(f"  ✗ {label}: delete failed: {exc}")

    if not dry_run and total_deleted > 0:
        print("  Running VACUUM ANALYZE on hot tables...")
        for tbl in VACUUM_TABLES:
            try:
                run_sql(f"VACUUM (ANALYZE) public.{tbl};")
                print(f"    ✓ vacuum {tbl}")
            except Exception as exc:
                print(f"    ✗ vacuum {tbl}: {exc}")

    print(f"[{ts}] Done. {total_deleted} rows {'would be' if dry_run else ''} deleted.")
    return 0


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv or "-n" in sys.argv
    sys.exit(main(dry))
