#!/usr/bin/env python3
"""
Sync V2 - Uploads risk_score_v2.json to Supabase trading_data table.
Runs after risk_score_v2.py generates the data.

Usage: python3 sync_v2.py
Cron: */480 * * * * (every 8 hours)
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"
RISK_SCORE_FILE = SCRIPT_DIR / "risk_score_v2.json"


def load_env():
    """Load .env.local variables."""
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    return env


def upsert_supabase(env, data_type, data):
    """Upsert data into Supabase trading_data table."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not service_key:
        print("[ERROR] Supabase credentials not found in .env.local")
        return False

    url = f"{supabase_url}/rest/v1/trading_data?data_type=eq.{data_type}"

    payload = json.dumps({
        "data_type": data_type,
        "data": data,
        "updated_at": data.get("timestamp", ""),
    }).encode("utf-8")

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        resp = urllib.request.urlopen(req, timeout=15)
        print(f"[INFO] Synced {data_type} to Supabase (status {resp.status})")
        return True
    except urllib.error.HTTPError as e:
        # Try PATCH if POST fails
        try:
            req = urllib.request.Request(
                f"{supabase_url}/rest/v1/trading_data?data_type=eq.{data_type}",
                data=json.dumps({"data": data, "updated_at": data.get("timestamp", "")}).encode("utf-8"),
                headers=headers,
                method="PATCH",
            )
            resp = urllib.request.urlopen(req, timeout=15)
            print(f"[INFO] Updated {data_type} in Supabase (status {resp.status})")
            return True
        except Exception as e2:
            print(f"[ERROR] Supabase sync failed: {e2}")
            return False


def upsert_history_row(env, data):
    """Append today's score to risk_score_history (UPSERT on date)."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_key:
        return False

    ts = data.get("timestamp", "")
    date_str = ts[:10] if ts else ""
    if not date_str:
        print("[WARN] no timestamp in risk score JSON; skipping history insert")
        return False

    score = data.get("score")
    decision = data.get("decision", "HOLD")
    btc_price = data.get("btc_price")
    components = data.get("components", {})

    if score is None:
        print("[WARN] no score in risk score JSON; skipping history insert")
        return False

    payload = json.dumps([{
        "date": date_str,
        "total_score": score,
        "level": decision,
        "btc_price": btc_price,
        "components": components,
        "source": "live",
    }]).encode("utf-8")

    url = f"{supabase_url}/rest/v1/risk_score_history"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
        resp = urllib.request.urlopen(req, timeout=15)
        print(f"[INFO] Appended history row for {date_str} (status {resp.status})")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:300]
        print(f"[ERROR] history insert failed (HTTP {e.code}): {body}")
        return False
    except Exception as e:
        print(f"[ERROR] history insert failed: {e}")
        return False


def main():
    env = load_env()

    if not RISK_SCORE_FILE.exists():
        print(f"[ERROR] {RISK_SCORE_FILE} not found. Run risk_score_v2.py first.")
        sys.exit(1)

    with open(RISK_SCORE_FILE) as f:
        data = json.load(f)

    print(f"[INFO] Loading risk score v2: score={data.get('score')}, decision={data.get('decision')}")

    # Sync to Supabase as 'risk_score_v2' (separate from V1 trading bot data)
    success = upsert_supabase(env, "risk_score_v2", data)

    # Append a daily snapshot to risk_score_history for the chart on /dashboard/risk-score
    upsert_history_row(env, data)

    if success:
        print("[INFO] Sync complete!")
    else:
        print("[ERROR] Sync failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
