#!/usr/bin/env python3
"""
Process Discord drip queue — sends scheduled DMs to users.
Runs every 5 minutes via cron or launchd on Mac Mini.

Usage:
    python3 scripts/discord_drip_sender.py
    python3 scripts/discord_drip_sender.py --loop  # continuous mode

Env vars:
    SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
    DISCORD_BOT_TOKEN
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests

try:
    from supabase import create_client
except ImportError:
    print("Install: pip3 install supabase")
    sys.exit(1)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
DISCORD_API = "https://discord.com/api/v10"


def send_discord_dm(discord_user_id: str, message: str) -> bool:
    """Send a DM to a Discord user via bot."""
    headers = {
        "Authorization": f"Bot {DISCORD_BOT_TOKEN}",
        "Content-Type": "application/json",
    }

    # Create DM channel
    resp = requests.post(
        f"{DISCORD_API}/users/@me/channels",
        headers=headers,
        json={"recipient_id": discord_user_id},
    )

    if resp.status_code != 200:
        print(f"  ✗ Failed to create DM channel for {discord_user_id}: {resp.status_code}")
        return False

    channel_id = resp.json().get("id")
    if not channel_id:
        return False

    # Send message
    resp = requests.post(
        f"{DISCORD_API}/channels/{channel_id}/messages",
        headers=headers,
        json={"content": message},
    )

    return resp.status_code == 200


def process_queue():
    """Process pending drip messages."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("✗ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return 0

    if not DISCORD_BOT_TOKEN:
        print("✗ Missing DISCORD_BOT_TOKEN")
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    now = datetime.now(timezone.utc).isoformat()

    # Get pending messages where send_at has passed
    result = supabase.table("discord_drip_queue").select("*").eq("sent", False).lte("send_at", now).order("send_at").limit(20).execute()

    messages = result.data or []

    if not messages:
        return 0

    print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing {len(messages)} drip messages...")
    sent = 0

    for msg in messages:
        success = send_discord_dm(msg["discord_user_id"], msg["message_text"])

        if success:
            supabase.table("discord_drip_queue").update({
                "sent": True,
                "sent_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", msg["id"]).execute()
            print(f"  ✓ Sent {msg['message_type']} to {msg['discord_user_id']}")
            sent += 1
        else:
            print(f"  ✗ Failed {msg['message_type']} to {msg['discord_user_id']}")

        # Rate limit: 1 DM per second
        time.sleep(1)

    return sent


def main():
    sent = process_queue()
    print(f"  Done: {sent} messages sent")
    return sent


if __name__ == "__main__":
    if "--loop" in sys.argv:
        interval = int(os.environ.get("DRIP_INTERVAL", "300"))
        print(f"Running drip sender (every {interval}s). Ctrl+C to stop.")
        while True:
            try:
                main()
                time.sleep(interval)
            except KeyboardInterrupt:
                print("\nStopped.")
                break
    else:
        main()
