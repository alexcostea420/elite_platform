#!/usr/bin/env python3
"""
Test harness for the Discord bot. Run from the Mac Mini, targets the admin
Discord account (Alex). Use these commands to verify everything works before
trusting the bot with real members.

Usage:
  python3 scripts/test_discord_bot.py dm "test message"        # plain DM via direct API
  python3 scripts/test_discord_bot.py drip                     # enqueue a "now" drip into Supabase, bot picks up
  python3 scripts/test_discord_bot.py reminder-7d              # enqueue an expiry_7d reminder due now
  python3 scripts/test_discord_bot.py reminder-1d              # enqueue an expiry_1d reminder due now
  python3 scripts/test_discord_bot.py role-cycle               # PUT role → verify → DELETE role → verify
  python3 scripts/test_discord_bot.py role-via-queue           # queue role assign in role_queue.json (full path)

The "drip" / "reminder-*" commands write to discord_drip_queue with send_at = now,
so the running daemon picks them up within ~10s. If the daemon is not running,
nothing will happen and the row stays unsent in the table.
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env.local"
ROLE_QUEUE = BASE_DIR / "data" / "role_queue.json"

# Admin / Alex — confirmed via profiles table (role=admin)
ADMIN_USER_ID = "994074d3-e95a-4f90-a6a3-2421e2f37536"
ADMIN_DISCORD_ID = "233298789924864002"
ADMIN_DISCORD_USERNAME = "alexcostea"

USER_AGENT = "ArmataElitePayments-Test (https://app.armatadetraderi.com, 1.0)"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    tb_env = Path("/Users/server/trading-bot/.env")
    if tb_env.exists():
        for line in tb_env.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


def discord_api(method, endpoint, token, data=None):
    url = f"https://discord.com/api/v10{endpoint}"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        if resp.status == 204:
            return {"ok": True, "_status": 204}
        content = resp.read().decode()
        return json.loads(content) if content else {"ok": True}
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode() if e.fp else ""
        return {"error": e.code, "message": body_txt[:300]}
    except Exception as e:
        return {"error": str(e)}


def supabase_req(method, table, params, env, body=None):
    url = f"{env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{table}?{params}"
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        content = resp.read().decode()
        return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        print(f"  ✗ Supabase {method} {table}: {e.code} {e.read().decode()[:200]}")
        sys.exit(1)


def cmd_dm(message, env):
    """Send a DM directly via the API (does not go through the queue)."""
    token = env["DISCORD_BOT_TOKEN"]
    print(f"→ Sending DM directly to {ADMIN_DISCORD_USERNAME} ({ADMIN_DISCORD_ID})")
    ch = discord_api("POST", "/users/@me/channels", token, {"recipient_id": ADMIN_DISCORD_ID})
    if "error" in ch:
        print(f"  ✗ DM channel failed: {ch}"); sys.exit(1)
    res = discord_api("POST", f"/channels/{ch['id']}/messages", token, {"content": message})
    if "error" in res:
        print(f"  ✗ DM send failed: {res}"); sys.exit(1)
    print(f"  ✓ DM sent (message id {res.get('id')})")


def cmd_drip(env, message_type="test_drip", text=None):
    """Enqueue a drip in discord_drip_queue with send_at=now → daemon picks up within ~10s."""
    text = text or f"🧪 Test drip ({message_type}) — dacă vezi mesajul ăsta, daemon-ul citește din discord_drip_queue corect."
    now_iso = datetime.now(timezone.utc).isoformat()
    row = {
        "user_id": ADMIN_USER_ID,
        "discord_user_id": ADMIN_DISCORD_ID,
        "message_type": message_type,
        "message_text": text,
        "send_at": now_iso,
    }
    res = supabase_req("POST", "discord_drip_queue", "", env, [row])
    rid = res[0]["id"] if res else "?"
    print(f"  ✓ Enqueued {message_type} (id {rid}). Daemon should DM within ~10s.")


def cmd_reminder_7d(env):
    cmd_drip(env, "expiry_7d",
        "⏰ **(TEST) Abonamentul tău Elite expiră peste 7 zile.**\n\n"
        "Reînnoiește din timp ca să nu pierzi accesul.\n\n"
        "👉 https://app.armatadetraderi.com/upgrade\n\n"
        "—\n\n🧪 Acesta este un mesaj de TEST.")


def cmd_reminder_1d(env):
    cmd_drip(env, "expiry_1d",
        "🚨 **(TEST) Abonamentul tău Elite expiră MÂINE.**\n\n"
        "Plătește astăzi ca să continui.\n\n"
        "👉 https://app.armatadetraderi.com/upgrade\n\n"
        "—\n\n🧪 Acesta este un mesaj de TEST.")


def cmd_role_cycle(env):
    """Assign role → verify → remove role → verify. Direct API, no queue."""
    token = env["DISCORD_BOT_TOKEN"]
    guild_id = env["DISCORD_GUILD_ID"]
    role_id = env["DISCORD_ROLE_ELITE_ID"]
    print(f"→ Role cycle test on {ADMIN_DISCORD_USERNAME} (guild {guild_id}, role {role_id})")

    # Snapshot current roles
    before = discord_api("GET", f"/guilds/{guild_id}/members/{ADMIN_DISCORD_ID}", token)
    if "error" in before:
        print(f"  ✗ Cannot read member: {before}"); sys.exit(1)
    had_role = role_id in before.get("roles", [])
    print(f"  · current roles include Elite? {had_role}")

    # 1. Assign
    print("  → PUT role…")
    res = discord_api("PUT", f"/guilds/{guild_id}/members/{ADMIN_DISCORD_ID}/roles/{role_id}", token)
    if "error" in res:
        print(f"  ✗ assign failed: {res}"); sys.exit(1)
    time.sleep(1)
    after_assign = discord_api("GET", f"/guilds/{guild_id}/members/{ADMIN_DISCORD_ID}", token)
    if role_id not in after_assign.get("roles", []):
        print(f"  ✗ role not present after PUT — Discord state diverged"); sys.exit(1)
    print("  ✓ role present after PUT")

    # 2. Remove (only if it wasn't already there before — preserve original state)
    if not had_role:
        print("  → DELETE role (cleanup, since you didn't have it before)…")
        res = discord_api("DELETE", f"/guilds/{guild_id}/members/{ADMIN_DISCORD_ID}/roles/{role_id}", token)
        if "error" in res and res.get("error") != 404:
            print(f"  ✗ remove failed: {res}"); sys.exit(1)
        time.sleep(1)
        after_remove = discord_api("GET", f"/guilds/{guild_id}/members/{ADMIN_DISCORD_ID}", token)
        if role_id in after_remove.get("roles", []):
            print(f"  ✗ role still present after DELETE — Discord state diverged"); sys.exit(1)
        print("  ✓ role gone after DELETE")
    else:
        print("  · skipping cleanup DELETE since role was already on you")

    print("  ✓ Role cycle complete.")


def cmd_role_via_queue():
    """Queue an assign in role_queue.json — exercises the full role-bot path."""
    queue = []
    if ROLE_QUEUE.exists():
        try:
            queue = json.loads(ROLE_QUEUE.read_text())
        except Exception:
            pass
    queue.append({
        "action": "assign",
        "discord_id": ADMIN_DISCORD_ID,
        "discord_username": ADMIN_DISCORD_USERNAME,
        "plan": "TEST",
    })
    ROLE_QUEUE.write_text(json.dumps(queue, indent=2))
    print(f"  ✓ Queued assign in {ROLE_QUEUE}. Daemon picks up within ~10s and DMs you.")


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    env = load_env()
    cmd = sys.argv[1]
    if cmd == "dm":
        msg = sys.argv[2] if len(sys.argv) > 2 else "🧪 Test DM din test_discord_bot.py"
        cmd_dm(msg, env)
    elif cmd == "drip":
        cmd_drip(env)
    elif cmd == "reminder-7d":
        cmd_reminder_7d(env)
    elif cmd == "reminder-1d":
        cmd_reminder_1d(env)
    elif cmd == "role-cycle":
        cmd_role_cycle(env)
    elif cmd == "role-via-queue":
        cmd_role_via_queue()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
