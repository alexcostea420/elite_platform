#!/usr/bin/env python3
"""
Patreon member sync — polls Patreon API and syncs with Supabase.
Run via cron every 6 hours to catch new payments/cancellations.

Logic:
1. Fetch all active Patreon members
2. For each: find matching user on platform by email
3. If user exists + subscription expired/missing → extend 30 days
4. If user doesn't exist + no active invite → create invite + queue welcome email
5. Log summary
"""

import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta

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
    print("ERROR: Missing env vars (PATREON_CREATOR_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_KEY)")
    sys.exit(1)


def log(msg: str):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def patreon_get(url: str) -> dict:
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {PATREON_TOKEN}",
        "User-Agent": "ArmataBot/1.0",
    })
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read().decode())


def supabase_request(method: str, table: str, params: str = "", data=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" if method in ("PATCH", "POST") else "return=representation",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        content = resp.read().decode()
        return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        body_err = e.read().decode() if e.fp else ""
        log(f"  Supabase {method} {table} error {e.code}: {body_err[:200]}")
        return None


def supabase_get(table: str, params: str = "") -> list:
    result = supabase_request("GET", table, params)
    return result if isinstance(result, list) else []


def supabase_patch(table: str, params: str, data: dict):
    supabase_request("PATCH", table, params, data)


def supabase_post(table: str, data: dict):
    supabase_request("POST", table, "", data)


def find_user_by_email(email: str):
    """Find a user in auth.users via Supabase GoTrue admin API."""
    url = f"{SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=500"
    page = 1
    while True:
        req_url = f"{SUPABASE_URL}/auth/v1/admin/users?page={page}&per_page=500"
        req = urllib.request.Request(req_url, headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        })
        try:
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read().decode())
            users = data.get("users", data) if isinstance(data, dict) else data
            if not users:
                break
            for u in users:
                if u.get("email") == email:
                    return u
            if len(users) < 500:
                break
            page += 1
        except Exception as e:
            log(f"  Error searching users page {page}: {e}")
            break
    return None


def get_active_patreon_members():
    """Fetch all active Patreon members with email, pledge amount."""
    # Get campaign ID
    campaigns = patreon_get("https://www.patreon.com/api/oauth2/v2/campaigns?fields[campaign]=patron_count")
    campaign_id = campaigns["data"][0]["id"]
    log(f"Campaign: {campaign_id}")

    members = []
    url = (
        f"https://www.patreon.com/api/oauth2/v2/campaigns/{campaign_id}/members"
        f"?include=user"
        f"&fields[member]=email,patron_status,last_charge_status,currently_entitled_amount_cents,pledge_relationship_start"
        f"&fields[user]=email"
    )

    while url:
        data = patreon_get(url)
        for m in data.get("data", []):
            attrs = m.get("attributes", {})
            status = attrs.get("patron_status")
            email = attrs.get("email")
            cents = attrs.get("currently_entitled_amount_cents", 0)
            charge = attrs.get("last_charge_status")

            if status == "active_patron" and email:
                members.append({
                    "email": email,
                    "cents": cents,
                    "status": status,
                    "last_charge": charge,
                    "is_veteran": (cents or 0) <= 3300,
                })

        # Pagination
        url = data.get("links", {}).get("next")

    return members


def main():
    log("=" * 50)
    log("Patreon sync starting...")

    try:
        active_members = get_active_patreon_members()
    except Exception as e:
        log(f"ERROR fetching Patreon members: {e}")
        sys.exit(1)

    log(f"Active Patreon members: {len(active_members)}")

    stats = {"already_active": 0, "extended": 0, "invite_created": 0, "invite_exists": 0, "not_found": 0}

    for member in active_members:
        email = member["email"]
        cents = member["cents"]
        is_veteran = member["is_veteran"]

        # Find user on platform
        user = find_user_by_email(email)
        time.sleep(0.2)  # Rate limit

        if user:
            user_id = user["id"]
            # Check current profile
            profiles = supabase_get("profiles", f"id=eq.{user_id}&select=subscription_tier,subscription_status,subscription_expires_at,is_veteran")
            if not profiles:
                log(f"  {email}: user found but no profile")
                continue

            profile = profiles[0]
            now = datetime.now(timezone.utc)
            expires_at = profile.get("subscription_expires_at")

            if expires_at and isinstance(expires_at, str):
                # Normalize timezone offset: "+00" → "+00:00" but avoid double replacement
                ts = expires_at
                if ts.endswith("+00"):
                    ts = ts + ":00"
                elif "+00:" not in ts and "Z" not in ts:
                    ts = ts.replace("+00", "+00:00")
                try:
                    exp_dt = datetime.fromisoformat(ts)
                except ValueError:
                    # Fallback: strip timezone and assume UTC
                    exp_dt = datetime.fromisoformat(ts[:19]).replace(tzinfo=timezone.utc)
            else:
                exp_dt = None

            is_active = (
                profile.get("subscription_status") == "active"
                and exp_dt
                and exp_dt > now
            )

            if is_active and (exp_dt - now).days > 7:
                # Already active with >7 days left, nothing to do
                log(f"  {email}: active, expires {expires_at[:10]}, OK")
                stats["already_active"] += 1
            elif is_active:
                # Active but expiring soon (<7 days) — shouldn't happen if webhook works
                # But don't auto-extend here, webhook handles recurring charges
                log(f"  {email}: active, expires soon ({expires_at[:10]}), waiting for webhook")
                stats["already_active"] += 1
            else:
                # Expired or no subscription — this means webhook missed a payment
                # Extend from now for 30 days
                new_expiry = (now + timedelta(days=30)).isoformat()
                supabase_patch("profiles", f"id=eq.{user_id}", {
                    "subscription_tier": "elite",
                    "subscription_status": "active",
                    "subscription_expires_at": new_expiry,
                    "is_veteran": is_veteran,
                })
                log(f"  {email}: EXTENDED to {new_expiry[:10]} (was expired/missing)")
                stats["extended"] += 1
        else:
            # No account on platform — check if invite exists
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            invites = supabase_get(
                "invite_links",
                f"used_count=eq.0&expires_at=gt.{now_iso}"
                f"&notes=ilike.*{email}*&select=token,expires_at"
            )

            if invites:
                log(f"  {email}: no account, invite exists (expires {invites[0].get('expires_at', '?')[:10]})")
                stats["invite_exists"] += 1
            else:
                # Create invite
                import secrets
                token = secrets.token_hex(16)
                invite_url = f"https://app.armatadetraderi.com/invite/{token}"

                supabase_post("invite_links", {
                    "token": token,
                    "plan_duration": "30_days",
                    "subscription_days": 30,
                    "max_uses": 1,
                    "used_count": 0,
                    "is_veteran_invite": is_veteran,
                    "notes": f"patreon_sync - {email} - ${cents / 100}/mo",
                    "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                })

                # Queue welcome email
                supabase_post("email_drip_queue", {
                    "email": email,
                    "template": "patreon_welcome",
                    "subject": "Bine ai venit in Armata de Traderi - activeaza-ti contul",
                    "scheduled_at": datetime.now(timezone.utc).isoformat(),
                    "status": "pending",
                })

                log(f"  {email}: no account, INVITE CREATED → {invite_url}")
                stats["invite_created"] += 1

        time.sleep(0.3)  # Rate limit between members

    log("-" * 50)
    log(f"SUMMARY: {len(active_members)} active patrons")
    log(f"  Already active: {stats['already_active']}")
    log(f"  Extended (webhook missed): {stats['extended']}")
    log(f"  Invite created: {stats['invite_created']}")
    log(f"  Invite already exists: {stats['invite_exists']}")
    log(f"  Not found (other): {stats['not_found']}")
    log("Patreon sync done.")


if __name__ == "__main__":
    main()
