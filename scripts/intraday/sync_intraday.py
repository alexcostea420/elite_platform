#!/usr/bin/env python3
"""Upload intraday_signal.json to Supabase trading_data table."""
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"
INPUT_FILE = SCRIPT_DIR / "intraday_signal.json"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    return env


def upsert(env, data_type, data):
    url_base = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url_base or not key:
        print("[ERROR] Missing Supabase credentials")
        return False
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    payload = json.dumps({
        "data_type": data_type,
        "data": data,
        "updated_at": data.get("timestamp", ""),
    }).encode("utf-8")
    try:
        req = urllib.request.Request(f"{url_base}/rest/v1/trading_data", data=payload, headers=headers, method="POST")
        urllib.request.urlopen(req, timeout=15)
        print(f"[INFO] Upserted {data_type}")
        return True
    except urllib.error.HTTPError:
        try:
            req = urllib.request.Request(
                f"{url_base}/rest/v1/trading_data?data_type=eq.{data_type}",
                data=json.dumps({"data": data, "updated_at": data.get("timestamp", "")}).encode("utf-8"),
                headers=headers,
                method="PATCH",
            )
            urllib.request.urlopen(req, timeout=15)
            print(f"[INFO] Updated {data_type}")
            return True
        except Exception as e:
            print(f"[ERROR] Sync failed: {e}")
            return False


def main():
    if not INPUT_FILE.exists():
        print(f"[ERROR] {INPUT_FILE} not found")
        sys.exit(1)
    with open(INPUT_FILE) as f:
        data = json.load(f)
    env = load_env()
    success = upsert(env, "intraday_signal", data)
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
