#!/usr/bin/env python3
"""
Daily audit: verify every active Elite profile has the Elite role on Discord.

For each profile in `profiles` with subscription_tier='elite', subscription_status='active',
and discord_user_id NOT NULL: query Discord guild member, ensure ELITE role is present.
If missing, PUT it. Logs results to logs/discord-role-audit.log and DMs Alex on Telegram
when drift is found and fixed.

Idempotent. Runs daily via crontab on Mac Mini.

Usage:
    python3 scripts/discord_role_audit.py
    python3 scripts/discord_role_audit.py --dry-run    # report only, no PUT
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env.local"

env: dict[str, str] = {}
if ENV_PATH.exists():
    for raw in ENV_PATH.read_text().splitlines():
        m = re.match(r"^([A-Z_]+)=(.*)$", raw.strip())
        if m:
            env[m.group(1)] = m.group(2).strip('"').strip("'")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")
BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN") or env.get("DISCORD_BOT_TOKEN")
GUILD_ID = os.environ.get("DISCORD_GUILD_ID") or env.get("DISCORD_GUILD_ID")
ELITE_ROLE_ID = os.environ.get("DISCORD_ROLE_ELITE_ID") or env.get("DISCORD_ROLE_ELITE_ID")
SOLDAT_ROLE_ID = os.environ.get("DISCORD_ROLE_SOLDAT_ID") or env.get("DISCORD_ROLE_SOLDAT_ID")
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN") or env.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_ALEX_CHAT_ID") or env.get("TELEGRAM_ALEX_CHAT_ID") or "5684771081"

USER_AGENT = "ElitePlatform-RoleAudit/1.0 (armatadetraderi.com)"


def fail(msg: str) -> None:
    print(f"FATAL: {msg}", file=sys.stderr)
    sys.exit(1)


for k, v in [
    ("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL),
    ("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY),
    ("DISCORD_BOT_TOKEN", BOT_TOKEN),
    ("DISCORD_GUILD_ID", GUILD_ID),
    ("DISCORD_ROLE_ELITE_ID", ELITE_ROLE_ID),
    ("DISCORD_ROLE_SOLDAT_ID", SOLDAT_ROLE_ID),
]:
    if not v:
        fail(f"missing env: {k}")


def fetch_active_elite_profiles() -> list[dict]:
    url = (
        f"{SUPABASE_URL}/rest/v1/profiles"
        "?select=id,full_name,discord_username,discord_user_id,subscription_expires_at"
        "&subscription_tier=eq.elite&subscription_status=eq.active&discord_user_id=not.is.null"
    )
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def discord_member_roles(discord_user_id: str) -> list[str] | None:
    """Return the list of role IDs, or None if member is not in the guild (404)."""
    url = f"https://discord.com/api/v10/guilds/{GUILD_ID}/members/{discord_user_id}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bot {BOT_TOKEN}",
        "User-Agent": USER_AGENT,
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
            return data.get("roles", [])
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def add_role(discord_user_id: str, role_id: str) -> bool:
    url = f"https://discord.com/api/v10/guilds/{GUILD_ID}/members/{discord_user_id}/roles/{role_id}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bot {BOT_TOKEN}",
        "User-Agent": USER_AGENT,
    }, method="PUT")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status in (204, 201)
    except urllib.error.HTTPError as e:
        print(f"  ! PUT {discord_user_id} role {role_id} failed: {e.code} {e.read()[:200].decode(errors='ignore')}")
        return False


def telegram_notify(text: str) -> None:
    if not TELEGRAM_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    data = json.dumps({"chat_id": TELEGRAM_CHAT_ID, "text": text}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        print(f"  ! Telegram notify failed: {e}")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    started = datetime.now(timezone.utc)
    print(f"[{started.isoformat()}] Discord role audit start (dry_run={args.dry_run})")

    profiles = fetch_active_elite_profiles()
    print(f"  scanning {len(profiles)} active Elite profiles with Discord linked")

    drift: list[tuple[str, str, str, str]] = []  # (full_name, username, discord_id, status)
    not_in_guild: list[tuple[str, str, str]] = []
    fixed = 0
    failed = 0

    for prof in profiles:
        did = prof.get("discord_user_id")
        name = prof.get("full_name") or "?"
        uname = prof.get("discord_username") or "?"
        if not did:
            continue
        try:
            roles = discord_member_roles(did)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # rate limit — back off and skip; next run will retry
                print(f"  rate-limited on {did}, sleeping 5s")
                time.sleep(5)
                continue
            print(f"  ! GET {did} failed: {e.code}")
            failed += 1
            continue

        if roles is None:
            not_in_guild.append((name, uname, did))
            continue

        missing = []
        if ELITE_ROLE_ID not in roles:
            missing.append(("ELITE", ELITE_ROLE_ID))
        if SOLDAT_ROLE_ID not in roles:
            missing.append(("SOLDAT", SOLDAT_ROLE_ID))

        if not missing:
            continue

        for label, rid in missing:
            if args.dry_run:
                drift.append((name, uname, did, f"WOULD_FIX_{label}"))
                print(f"  drift ({label}): {name} (@{uname}) {did}")
                continue

            if add_role(did, rid):
                fixed += 1
                drift.append((name, uname, did, f"FIXED_{label}"))
                print(f"  fixed ({label}): {name} (@{uname}) {did}")
            else:
                failed += 1
                drift.append((name, uname, did, f"FAILED_{label}"))

            time.sleep(0.25)  # gentle pacing — Discord global rate limit is 50 req/s

    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    print(f"  done in {elapsed:.1f}s · drift={len(drift)} · fixed={fixed} · failed={failed} · not_in_guild={len(not_in_guild)}")

    if drift or failed or not_in_guild:
        lines = [f"Discord role audit: {len(drift)} drift, {fixed} fixed, {failed} failed, {len(not_in_guild)} not in guild"]
        for name, uname, did, status in drift:
            lines.append(f"- [{status}] {name} (@{uname}) {did}")
        for name, uname, did in not_in_guild:
            lines.append(f"- [NOT_IN_GUILD] {name} (@{uname}) {did}")
        telegram_notify("\n".join(lines)[:3500])

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
