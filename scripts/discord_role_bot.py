#!/usr/bin/env python3
"""
Discord Elite Role Bot — assigns/removes ⚜️-Elite role + sends payment-related DMs.

Sources of work (polled every 10s):
  - data/role_queue.json (file-based queue from arb_payment_monitor + manual scripts)
  - discord_drip_queue Supabase table (DM-only items: payment reminders, welcome series)

Reliability:
  - User-Agent header on every Discord call (Cloudflare requires it; was 403'ing).
  - 429 Retry-After honored with bounded backoff.
  - Per-item retry cap (10×) → drop + Telegram alert so we don't loop forever on
    invalid users (e.g. user left the server).
  - Heartbeat log every 5 minutes so we can see in `tail -f` that the bot is alive.

Runs as launchd daemon on Mac Mini (com.trading.discord-role-bot.plist).
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env.local"
ROLE_QUEUE = BASE_DIR / "data" / "role_queue.json"

USER_AGENT = "ArmataElitePayments (https://app.armatadetraderi.com, 1.0)"
MAX_RETRIES_PER_ITEM = 10
HEARTBEAT_INTERVAL_SEC = 300  # 5 min


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v
    tb_env = Path(os.path.expanduser("~/trading-bot/.env"))
    if tb_env.exists():
        for line in tb_env.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                env.setdefault(k, v)
    return env


def log(msg, level="INFO"):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def discord_api(method, endpoint, token, data=None, attempt=0):
    """Make Discord API request. Honors 429 Retry-After (bounded to 30s)."""
    url = f"https://discord.com/api/v10{endpoint}"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        if resp.status == 204:
            return {"ok": True}
        content = resp.read().decode()
        return json.loads(content) if content else {"ok": True}
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode() if e.fp else ""
        if e.code == 429 and attempt < 3:
            try:
                retry_after = float(json.loads(body_txt).get("retry_after", 1))
            except Exception:
                retry_after = float(e.headers.get("Retry-After", "1"))
            wait = min(retry_after, 30)
            log(f"429 rate-limited on {endpoint}, sleeping {wait}s (attempt {attempt + 1})", "WARN")
            time.sleep(wait)
            return discord_api(method, endpoint, token, data, attempt + 1)
        log(f"Discord API error {e.code} on {endpoint}: {body_txt[:200]}", "ERROR")
        return {"error": e.code, "message": body_txt[:200]}
    except Exception as e:
        log(f"Discord API error on {endpoint}: {e}", "ERROR")
        return {"error": str(e)}


def assign_elite_role(discord_user_id, env):
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")
    role_id = env.get("DISCORD_ROLE_ELITE_ID", "")
    if not all([token, guild_id, role_id]):
        log("Missing Discord config", "ERROR")
        return False
    result = discord_api("PUT", f"/guilds/{guild_id}/members/{discord_user_id}/roles/{role_id}", token)
    if "error" not in result:
        log(f"Elite role assigned to user {discord_user_id}")
        return True
    log(f"Failed to assign role to {discord_user_id}: {result}", "ERROR")
    return False


def remove_elite_role(discord_user_id, env):
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")
    role_id = env.get("DISCORD_ROLE_ELITE_ID", "")
    if not all([token, guild_id, role_id]):
        return False
    result = discord_api("DELETE", f"/guilds/{guild_id}/members/{discord_user_id}/roles/{role_id}", token)
    # 404 = role already gone (user left, role missing). Treat as success.
    if "error" not in result or result.get("error") == 404:
        log(f"Elite role removed from user {discord_user_id}")
        return True
    return False


def send_dm(discord_user_id, message, env):
    token = env.get("DISCORD_BOT_TOKEN", "")
    if not token:
        return False
    result = discord_api("POST", "/users/@me/channels", token, {"recipient_id": discord_user_id})
    channel_id = result.get("id")
    if not channel_id:
        return False
    res = discord_api("POST", f"/channels/{channel_id}/messages", token, {"content": message})
    return "error" not in res


def search_member_by_username(username, env):
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")
    result = discord_api(
        "GET",
        f"/guilds/{guild_id}/members/search?query={urllib.parse.quote(username)}&limit=5",
        token,
    )
    if isinstance(result, list) and result:
        return result[0]
    return None


def process_role_queue(env):
    """Process pending role assignments from data/role_queue.json."""
    if not ROLE_QUEUE.exists():
        return
    try:
        queue = json.loads(ROLE_QUEUE.read_text())
    except Exception:
        return
    if not queue:
        return

    remaining = []
    for item in queue:
        action = item.get("action", "assign")
        discord_id = item.get("discord_id")
        discord_username = item.get("discord_username")
        attempts = int(item.get("attempts", 0))

        # Drop items that have failed too many times to avoid forever-loops.
        if attempts >= MAX_RETRIES_PER_ITEM:
            log(f"Dropping {action} after {attempts} attempts: {discord_username or discord_id}", "WARN")
            notify_telegram(
                f"Discord role-queue item dropped after {MAX_RETRIES_PER_ITEM} retries: "
                f"{action} for {discord_username or discord_id}",
                env,
            )
            continue

        if not discord_id and discord_username:
            member = search_member_by_username(discord_username, env)
            if member:
                discord_id = member.get("user", {}).get("id")

        if not discord_id:
            log(f"Cannot find Discord user (attempt {attempts + 1}): {item}", "WARN")
            item["attempts"] = attempts + 1
            remaining.append(item)
            continue

        success = False
        if action == "assign":
            success = assign_elite_role(discord_id, env)
            if success:
                plan = item.get("plan", "Elite")
                send_dm(
                    discord_id,
                    f"🎉 **Bine ai venit în Elite!**\n\n"
                    f"Abonamentul tău **{plan}** a fost activat.\n"
                    f"Ai acces la toate canalele Elite.\n\n"
                    f"Întrebări → #general.\n\n"
                    f"—\n\n"
                    f"🔒 Acest bot NU cere bani și NU procesează plăți.\n"
                    f"Plățile se fac DOAR pe https://app.armatadetraderi.com/upgrade",
                    env,
                )
                notify_telegram(
                    f"Discord Elite role asignat la {discord_username or discord_id}",
                    env,
                )
        elif action == "remove":
            success = remove_elite_role(discord_id, env)
            if success:
                send_dm(
                    discord_id,
                    "⏰ Abonamentul tău Elite a expirat.\n"
                    "Reînnoiește pe https://app.armatadetraderi.com/upgrade ca să păstrezi accesul.\n\n"
                    "—\n\n"
                    "🔒 Acest bot NU cere bani și NU procesează plăți.",
                    env,
                )

        if not success:
            item["attempts"] = attempts + 1
            remaining.append(item)

    ROLE_QUEUE.write_text(json.dumps(remaining, indent=2))


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
        log(f"Supabase {method} {table} error {e.code}: {e.read().decode()[:200]}", "ERROR")
        return None


# In-memory retry counter for drip queue (id → attempts).
# Bounded retries without needing an extra DB column. Reset on bot restart, which
# is fine — restart means re-attempting any pending items is the right behavior.
_drip_attempts: dict[str, int] = {}


def process_drip_queue(env):
    """Process scheduled DMs from discord_drip_queue (welcome series + payment reminders)."""
    if "NEXT_PUBLIC_SUPABASE_URL" not in env or "SUPABASE_SERVICE_ROLE_KEY" not in env:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    rows = supabase_req(
        "GET", "discord_drip_queue",
        f"sent=eq.false&send_at=lte.{urllib.parse.quote(now_iso)}&order=send_at.asc&limit=20",
        env,
    ) or []

    for row in rows:
        rid = row["id"]
        attempts = _drip_attempts.get(rid, 0)
        if attempts >= MAX_RETRIES_PER_ITEM:
            supabase_req(
                "PATCH", "discord_drip_queue", f"id=eq.{rid}", env,
                {"sent": True, "sent_at": now_iso},
            )
            log(f"Dropped drip {row['message_type']} → {row['discord_user_id']} after {attempts} retries", "WARN")
            _drip_attempts.pop(rid, None)
            continue

        ok = send_dm(row["discord_user_id"], row["message_text"], env)
        if ok:
            supabase_req(
                "PATCH", "discord_drip_queue", f"id=eq.{rid}", env,
                {"sent": True, "sent_at": datetime.now(timezone.utc).isoformat()},
            )
            log(f"Drip {row['message_type']} sent to {row['discord_user_id']}")
            _drip_attempts.pop(rid, None)
        else:
            _drip_attempts[rid] = attempts + 1
        time.sleep(1)  # 1 DM/sec to stay well under Discord rate limits


def notify_telegram(msg, env):
    """Plain-text Telegram notification (no markdown — Alex's terminal renders ** literally)."""
    try:
        token = env.get("TELEGRAM_BOT_TOKEN", "")
        chat_id = env.get("TELEGRAM_CHAT_ID", "5684771081")
        if not token:
            return
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({"chat_id": chat_id, "text": msg}).encode()
        urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10)
    except Exception:
        pass


def verify_bot_connection(env):
    token = env.get("DISCORD_BOT_TOKEN", "")
    if not token:
        log("DISCORD_BOT_TOKEN missing", "ERROR")
        return
    result = discord_api("GET", "/users/@me", token)
    if "error" in result:
        log(f"Bot connection failed: {result}", "ERROR")
    else:
        log(f"Connected as: {result.get('username', '?')}#{result.get('discriminator', '0')}")


def main():
    env = load_env()
    log("=" * 50)
    log("DISCORD ELITE ROLE BOT STARTED")
    log(f"Guild: {env.get('DISCORD_GUILD_ID', 'not set')}")
    log(f"Elite Role: {env.get('DISCORD_ROLE_ELITE_ID', 'not set')}")
    log("=" * 50)
    verify_bot_connection(env)

    last_heartbeat = time.time()
    while True:
        try:
            env = load_env()
            process_role_queue(env)
            process_drip_queue(env)
        except KeyboardInterrupt:
            log("Bot stopped")
            break
        except Exception as e:
            log(f"Loop error: {e}", "ERROR")

        if time.time() - last_heartbeat >= HEARTBEAT_INTERVAL_SEC:
            log("heartbeat: alive")
            last_heartbeat = time.time()

        time.sleep(10)


if __name__ == "__main__":
    main()
