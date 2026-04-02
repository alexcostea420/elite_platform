#!/usr/bin/env python3
"""
Discord Elite Role Bot — assigns ⚜️-Elite role after payment confirmed.

Listens for role assignment requests from the payment monitor.
Also handles /status command in Discord for members to check subscription.

Runs as launchd daemon on Mac Mini.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env.local"
ROLE_QUEUE = BASE_DIR / "data" / "role_queue.json"

# Load env
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


def discord_api(method, endpoint, token, data=None):
    """Make Discord API request."""
    url = f"https://discord.com/api/v10{endpoint}"
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
    }
    if data:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)

    try:
        resp = urllib.request.urlopen(req, timeout=15)
        if resp.status == 204:
            return {"ok": True}
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        log(f"Discord API error {e.code}: {body[:200]}", "ERROR")
        return {"error": e.code, "message": body[:200]}
    except Exception as e:
        log(f"Discord API error: {e}", "ERROR")
        return {"error": str(e)}


def assign_elite_role(discord_user_id, env):
    """Assign ⚜️-Elite role to a Discord user."""
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")
    role_id = env.get("DISCORD_ROLE_ELITE_ID", "")

    if not all([token, guild_id, role_id]):
        log("Missing Discord config", "ERROR")
        return False

    result = discord_api(
        "PUT",
        f"/guilds/{guild_id}/members/{discord_user_id}/roles/{role_id}",
        token
    )

    if "error" not in result:
        log(f"Elite role assigned to user {discord_user_id}")
        return True
    else:
        log(f"Failed to assign role: {result}", "ERROR")
        return False


def remove_elite_role(discord_user_id, env):
    """Remove ⚜️-Elite role from a Discord user (subscription expired)."""
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")
    role_id = env.get("DISCORD_ROLE_ELITE_ID", "")

    if not all([token, guild_id, role_id]):
        return False

    result = discord_api(
        "DELETE",
        f"/guilds/{guild_id}/members/{discord_user_id}/roles/{role_id}",
        token
    )

    if "error" not in result:
        log(f"Elite role removed from user {discord_user_id}")
        return True
    return False


def send_dm(discord_user_id, message, env):
    """Send DM to a Discord user."""
    token = env.get("DISCORD_BOT_TOKEN", "")

    # Create DM channel
    result = discord_api("POST", "/users/@me/channels", token, {"recipient_id": discord_user_id})
    channel_id = result.get("id")
    if not channel_id:
        return False

    # Send message
    discord_api("POST", f"/channels/{channel_id}/messages", token, {"content": message})
    return True


def search_member_by_username(username, env):
    """Search for a guild member by username."""
    token = env.get("DISCORD_BOT_TOKEN", "")
    guild_id = env.get("DISCORD_GUILD_ID", "")

    result = discord_api("GET", f"/guilds/{guild_id}/members/search?query={urllib.parse.quote(username)}&limit=5", token)
    if isinstance(result, list) and result:
        return result[0]  # best match
    return None


def process_role_queue(env):
    """Process pending role assignments from payment monitor."""
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

        # Try to find user by username if no ID
        if not discord_id and discord_username:
            member = search_member_by_username(discord_username, env)
            if member:
                discord_id = member.get("user", {}).get("id")

        if not discord_id:
            log(f"Cannot find Discord user: {item}", "WARN")
            remaining.append(item)  # keep for retry
            continue

        if action == "assign":
            success = assign_elite_role(discord_id, env)
            if success:
                # Send welcome DM
                plan = item.get("plan", "Elite")
                send_dm(discord_id,
                    f"🎉 **Bine ai venit în Elite!**\n\n"
                    f"Abonamentul tău **{plan}** a fost activat.\n"
                    f"Acum ai acces la toate canalele Elite.\n\n"
                    f"Dacă ai întrebări, scrie în #general.",
                    env
                )
                # Telegram notification
                notify_telegram(f"✅ Discord Elite role assigned to {discord_username or discord_id}", env)
            else:
                remaining.append(item)

        elif action == "remove":
            remove_elite_role(discord_id, env)
            send_dm(discord_id,
                "⏰ Abonamentul tău Elite a expirat.\n"
                "Reinnoiește pe armatadetraderi.com pentru a păstra accesul.",
                env
            )

    ROLE_QUEUE.write_text(json.dumps(remaining, indent=2))


def notify_telegram(msg, env):
    try:
        token = env.get("TELEGRAM_BOT_TOKEN", "")
        chat_id = env.get("TELEGRAM_CHAT_ID", "5684771081")
        if token:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = urllib.parse.urlencode({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
            urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=10)
    except Exception:
        pass


def main():
    env = load_env()

    log("=" * 50)
    log("DISCORD ELITE ROLE BOT STARTED")
    log(f"Guild: {env.get('DISCORD_GUILD_ID', 'not set')}")
    log(f"Elite Role: {env.get('DISCORD_ROLE_ELITE_ID', 'not set')}")
    log("=" * 50)

    # Verify bot connection
    token = env.get("DISCORD_BOT_TOKEN", "")
    if token:
        import subprocess
        result = subprocess.run(
            ["curl", "-s", "-H", f"Authorization: Bot {token}", "https://discord.com/api/v10/users/@me"],
            capture_output=True, text=True, timeout=10
        )
        try:
            bot = json.loads(result.stdout)
            log(f"Connected as: {bot.get('username', '?')}")
        except Exception:
            log("Bot connection failed", "ERROR")

    while True:
        try:
            env = load_env()
            process_role_queue(env)
        except KeyboardInterrupt:
            log("Bot stopped")
            break
        except Exception as e:
            log(f"Error: {e}", "ERROR")

        time.sleep(10)


if __name__ == "__main__":
    main()
