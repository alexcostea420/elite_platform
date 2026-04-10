#!/usr/bin/env python3
"""
Patreon member sync - polls Patreon API and syncs with Supabase.
Run via cron every hour to catch new payments/cancellations.
"""

import json
import os
import urllib.request
from datetime import datetime, timezone

# Load env
env = {}
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v

PATREON_TOKEN = env.get("PATREON_CREATOR_ACCESS_TOKEN", "")
SUPABASE_URL = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not PATREON_TOKEN or not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing env vars")
    exit(1)

def patreon_get(url):
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {PATREON_TOKEN}",
        "User-Agent": "ArmataBot/1.0",
    })
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read().decode())

def supabase_get(table, params=""):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{table}?{params}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read().decode())

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def main():
    log("Patreon sync starting...")

    # Get active Patreon members
    url = "https://www.patreon.com/api/oauth2/v2/campaigns?fields[campaign]=patron_count"
    try:
        campaigns = patreon_get(url)
        campaign_id = campaigns["data"][0]["id"]
        log(f"Campaign: {campaign_id}")
    except Exception as e:
        log(f"Error getting campaign: {e}")
        return

    # Get members
    members_url = f"https://www.patreon.com/api/oauth2/v2/campaigns/{campaign_id}/members?include=user&fields[member]=email,patron_status,last_charge_status,currently_entitled_amount_cents,pledge_relationship_start&fields[user]=email"

    try:
        members_data = patreon_get(members_url)
        members = members_data.get("data", [])
        included = {item["id"]: item for item in members_data.get("included", [])}
        log(f"Found {len(members)} Patreon members")

        active = []
        for m in members:
            attrs = m.get("attributes", {})
            status = attrs.get("patron_status")
            email = attrs.get("email")
            cents = attrs.get("currently_entitled_amount_cents", 0)

            if status == "active_patron" and email:
                active.append({
                    "email": email,
                    "cents": cents,
                    "status": status,
                })
                log(f"  Active: {email} (${cents/100})")

        log(f"Active patrons: {len(active)}")

    except Exception as e:
        log(f"Error getting members: {e}")

    log("Patreon sync done.")

if __name__ == "__main__":
    main()
