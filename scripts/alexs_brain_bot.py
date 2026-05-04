#!/usr/bin/env python3
"""
Alex's Brain auto-poster + Trader role opt-in daemon.

Run every minute via cron / launchd. Each tick does three things:

1. At 10:00 Europe/Bucharest, post the daily brief in #🧠-alex-brain:
   BTC PDL / PDH / PWL / PWH + today's high-impact USD events from Forex Factory.

2. T-15 min before each high-impact ("red") USD event today, post a tag
   for @Trader. Each pre-alert posted at most once.

3. For every auto-post the bot has made, poll its ✅ / ❌ reactions and
   sync the Trader role: ✅ → assign, ❌ → remove. Idempotent per user.

State lives in ~/alexs-brain/data/state.json so re-runs don't double-post.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

# --- paths -----------------------------------------------------------------
ELITE_ROOT = Path(__file__).resolve().parent.parent
BRAIN_ROOT = Path.home() / "alexs-brain"
STATE_PATH = BRAIN_ROOT / "data" / "state.json"
LOG_PATH = BRAIN_ROOT / "data" / "alexs_brain_bot.log"
STATE_PATH.parent.mkdir(parents=True, exist_ok=True)

# --- env -------------------------------------------------------------------
def _load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text().splitlines():
        m = re.match(r"^([A-Z_][A-Z0-9_]*)=(.*)$", raw.strip())
        if m:
            out[m.group(1)] = m.group(2).strip('"').strip("'")
    return out


_brain_env = _load_env(BRAIN_ROOT / ".env")
_elite_env = _load_env(ELITE_ROOT / ".env.local")

DISCORD_TOKEN = _brain_env.get("DISCORD_TOKEN") or os.environ.get("DISCORD_TOKEN")
# elite_platform bot has Manage Roles permission via its integration role
# (Alex's Brain bot's integration role is too low to manage Trader/Soldat).
ROLE_BOT_TOKEN = _elite_env.get("DISCORD_BOT_TOKEN") or os.environ.get("DISCORD_BOT_TOKEN")
GUILD_ID = _elite_env.get("DISCORD_GUILD_ID") or os.environ.get("DISCORD_GUILD_ID")
TELEGRAM_TOKEN = _elite_env.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = _elite_env.get("TELEGRAM_ALEX_CHAT_ID") or "5684771081"

CHANNEL_ID = "1479579144613400686"            # #🧠-alex-brain
WELCOME_CHANNEL_ID = "1451543310370996264"    # #🔒-bine-ai-venit
TRADER_ROLE_ID = "1465376624802533599"
SOLDAT_ROLE_ID = "1273552737606565890"
WELCOME_EMOJI = "🪖"

USER_AGENT = "ElitePlatform-AlexBrainBot/1.0"
TZ_RO = ZoneInfo("Europe/Bucharest")


def log(msg: str) -> None:
    line = f"[{datetime.now(TZ_RO).isoformat(timespec='seconds')}] {msg}"
    print(line)
    try:
        with open(LOG_PATH, "a") as f:
            f.write(line + "\n")
    except OSError:
        pass


def fail(msg: str) -> None:
    log(f"FATAL: {msg}")
    sys.exit(1)


for k, v in [
    ("DISCORD_TOKEN", DISCORD_TOKEN),
    ("DISCORD_BOT_TOKEN (elite_platform, for role grants)", ROLE_BOT_TOKEN),
    ("DISCORD_GUILD_ID", GUILD_ID),
]:
    if not v:
        fail(f"missing env: {k}")


# --- state -----------------------------------------------------------------
def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"daily_brief_date": None, "alerts": {}, "tracked": {}}
    try:
        return json.loads(STATE_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {"daily_brief_date": None, "alerts": {}, "tracked": {}}


def save_state(s: dict) -> None:
    tmp = STATE_PATH.with_suffix(".tmp")
    tmp.write_text(json.dumps(s, indent=2))
    tmp.replace(STATE_PATH)


# --- discord ---------------------------------------------------------------
def discord_request(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict | None]:
    url = f"https://discord.com/api/v10{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "Authorization": f"Bot {token or DISCORD_TOKEN}",
        "User-Agent": USER_AGENT,
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode(errors="ignore") if e.fp else ""
        if e.code == 429:
            try:
                retry = json.loads(body_txt).get("retry_after", 1)
            except json.JSONDecodeError:
                retry = 1
            log(f"  discord 429, sleeping {retry}s ({method} {path})")
            time.sleep(min(retry + 0.5, 5))
            return discord_request(method, path, body, token=token)
        log(f"  discord {method} {path} -> {e.code} {body_txt[:200]}")
        return e.code, None
    except urllib.error.URLError as e:
        log(f"  discord {method} {path} -> URLError {e}")
        return 0, None


def post_message(content: str, channel_id: str = CHANNEL_ID) -> str | None:
    status, data = discord_request("POST", f"/channels/{channel_id}/messages", {"content": content})
    if status in (200, 201) and data:
        return data["id"]
    return None


def add_reaction(message_id: str, emoji: str, channel_id: str = CHANNEL_ID) -> bool:
    encoded = urllib.parse.quote(emoji)
    status, _ = discord_request(
        "PUT", f"/channels/{channel_id}/messages/{message_id}/reactions/{encoded}/@me"
    )
    return status in (204, 200)


def fetch_reaction_users(message_id: str, emoji: str, channel_id: str = CHANNEL_ID) -> list[str]:
    encoded = urllib.parse.quote(emoji)
    users: list[str] = []
    after = ""
    while True:
        path = f"/channels/{channel_id}/messages/{message_id}/reactions/{encoded}?limit=100"
        if after:
            path += f"&after={after}"
        status, data = discord_request("GET", path)
        if status != 200 or not isinstance(data, list):
            break
        users.extend(u["id"] for u in data if not u.get("bot"))
        if len(data) < 100:
            break
        after = data[-1]["id"]
    return users


def grant_role(user_id: str) -> bool:
    return grant_role_id(user_id, TRADER_ROLE_ID)


def revoke_role(user_id: str, role_id: str = TRADER_ROLE_ID) -> bool:
    status, _ = discord_request(
        "DELETE", f"/guilds/{GUILD_ID}/members/{user_id}/roles/{role_id}",
        token=ROLE_BOT_TOKEN,
    )
    return status in (204, 200, 404)


def grant_role_id(user_id: str, role_id: str) -> bool:
    status, _ = discord_request(
        "PUT", f"/guilds/{GUILD_ID}/members/{user_id}/roles/{role_id}",
        token=ROLE_BOT_TOKEN,
    )
    return status in (204, 201, 200)


# --- BTC OHLC --------------------------------------------------------------
def fetch_btc_levels() -> dict | None:
    """PDL/PDH = yesterday's low/high. PWL/PWH = previous calendar (Mon-Sun) week's low/high."""
    url = "https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?range=1mo&interval=1d"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read())
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        log(f"  yahoo BTC fetch failed: {e}")
        return None

    result = data.get("chart", {}).get("result", [])
    if not result:
        return None
    ts = result[0].get("timestamp", [])
    q = result[0].get("indicators", {}).get("quote", [{}])[0]
    highs = q.get("high", [])
    lows = q.get("low", [])
    closes = q.get("close", [])

    today_utc = datetime.now(timezone.utc).date()
    yesterday = today_utc - timedelta(days=1)

    # Previous completed ISO week (Mon-Sun before the Monday of this week)
    weekday = today_utc.weekday()  # Mon=0
    this_week_mon = today_utc - timedelta(days=weekday)
    prev_week_mon = this_week_mon - timedelta(days=7)
    prev_week_sun = this_week_mon - timedelta(days=1)

    pdl = pdh = None
    pwl = pwh = None
    last_close = None

    for i, t in enumerate(ts):
        d = datetime.fromtimestamp(t, tz=timezone.utc).date()
        h = highs[i] if i < len(highs) else None
        lo = lows[i] if i < len(lows) else None
        c = closes[i] if i < len(closes) else None
        if h is None or lo is None:
            continue
        if d == yesterday:
            pdl, pdh = lo, h
        if prev_week_mon <= d <= prev_week_sun:
            pwl = lo if pwl is None else min(pwl, lo)
            pwh = h if pwh is None else max(pwh, h)
        if c is not None:
            last_close = c

    if None in (pdl, pdh, pwl, pwh):
        return None
    return {
        "pdl": pdl, "pdh": pdh, "pwl": pwl, "pwh": pwh,
        "last_close": last_close,
        "prev_week": f"{prev_week_mon.isoformat()} → {prev_week_sun.isoformat()}",
        "yesterday": yesterday.isoformat(),
    }


# --- Forex Factory calendar ------------------------------------------------
# Calendar barely changes within a day (events resolve hourly; new entries land
# weekly). Cache aggressively to disk + back off hard on 429 so the per-minute
# launchd daemon (StartInterval=60) doesn't burn through FF's rate limit.
FF_CACHE_PATH = BRAIN_ROOT / "data" / "ff_calendar_cache.json"
_FF_TTL_SEC = 900  # 15 min — calendar fields stable on this scale
_FF_BACKOFF_SEC = 3600  # 1h cool-off after a 429


def _load_ff_cache() -> dict:
    try:
        return json.loads(FF_CACHE_PATH.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_ff_cache(cache: dict) -> None:
    try:
        FF_CACHE_PATH.write_text(json.dumps(cache))
    except OSError as e:
        log(f"  ff cache write failed: {e}")


def fetch_red_usd_events_today() -> list[dict]:
    """Return today's USD HIGH-impact events (Forex Factory red folder).

    Disk cache: 15 min TTL. After a 429 we go fully silent for an hour and
    serve stale cached data, so the per-minute daemon never re-hammers FF.
    """
    url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
    cache = _load_ff_cache()
    now = time.time()
    raw = cache.get("raw")
    fetched_at = float(cache.get("fetched_at", 0.0))
    blocked_until = float(cache.get("blocked_until", 0.0))
    fresh = (now - fetched_at) < _FF_TTL_SEC
    blocked = now < blocked_until

    if not fresh and not blocked:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                raw = json.loads(r.read())
            cache["raw"] = raw
            cache["fetched_at"] = now
            cache["blocked_until"] = 0.0
            _save_ff_cache(cache)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                cache["blocked_until"] = now + _FF_BACKOFF_SEC
                _save_ff_cache(cache)
                log(f"  ff calendar 429, backing off {_FF_BACKOFF_SEC // 60}m, serving cache")
            else:
                log(f"  ff calendar fetch failed: {e}")
        except (urllib.error.URLError, json.JSONDecodeError) as e:
            log(f"  ff calendar fetch failed: {e}")

    if not isinstance(raw, list):
        return []

    today_ro = datetime.now(TZ_RO).date()
    events: list[dict] = []
    for e in raw:
        if e.get("country") != "USD" or e.get("impact") != "High":
            continue
        try:
            dt = datetime.fromisoformat(e["date"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        if dt.astimezone(TZ_RO).date() != today_ro:
            continue
        events.append({
            "id": f"{e['date']}|{e['title']}",
            "title": e["title"],
            "title_ro": EVENT_TRANSLATIONS_RO.get(e["title"], e["title"]),
            "dt_utc": dt.astimezone(timezone.utc),
            "dt_ro": dt.astimezone(TZ_RO),
            "forecast": e.get("forecast") or "-",
            "previous": e.get("previous") or "-",
        })
    events.sort(key=lambda x: x["dt_utc"])
    return events


EVENT_TRANSLATIONS_RO: dict[str, str] = {
    "CPI m/m": "Inflație CPI (lunar)",
    "CPI y/y": "Inflație CPI (anual)",
    "Core CPI m/m": "Core CPI (lunar)",
    "Core CPI y/y": "Core CPI (anual)",
    "PPI m/m": "PPI (lunar)",
    "Core PPI m/m": "Core PPI (lunar)",
    "Federal Funds Rate": "Rata dobânzii Fed",
    "FOMC Statement": "Declarația FOMC",
    "FOMC Meeting Minutes": "Minutele FOMC",
    "FOMC Press Conference": "Conferința FOMC",
    "Non-Farm Employment Change": "NFP (locuri de muncă)",
    "Unemployment Rate": "Rata șomajului",
    "Average Hourly Earnings m/m": "Câștiguri orare (lunar)",
    "Advance GDP q/q": "PIB preliminar (T)",
    "Final GDP q/q": "PIB final (T)",
    "GDP q/q": "PIB (T)",
    "Retail Sales m/m": "Vânzări retail (lunar)",
    "Core Retail Sales m/m": "Core Retail Sales",
    "ISM Manufacturing PMI": "ISM Manufactură",
    "ISM Services PMI": "ISM Servicii",
    "PCE Price Index m/m": "PCE (lunar)",
    "Core PCE Price Index m/m": "Core PCE (lunar)",
    "JOLTS Job Openings": "JOLTS (joburi deschise)",
    "ADP Non-Farm Employment Change": "ADP",
}


# --- formatting ------------------------------------------------------------
def fmt_usd(n: float) -> str:
    return f"${n:,.0f}".replace(",", ".")


def build_daily_brief(levels: dict, events: list[dict]) -> str:
    lines = [
        "**☀️ Bună dimineața, Armata!**",
        "",
        "**🧭 BTC — niveluri pe care nu le pierdem din ochi azi**",
        f"```",
        f"PDH (ieri high)   {fmt_usd(levels['pdh'])}",
        f"PDL (ieri low)    {fmt_usd(levels['pdl'])}",
        f"PWH (săpt. trec.) {fmt_usd(levels['pwh'])}",
        f"PWL (săpt. trec.) {fmt_usd(levels['pwl'])}",
        f"```",
        "Pierderea PDL deschide drumul spre PWL. Spargerea PDH testează PWH.",
        "",
    ]
    if events:
        lines.append("**📅 Știri USD high-impact azi (Forex Factory):**")
        for e in events:
            time_ro = e["dt_ro"].strftime("%H:%M")
            lines.append(f"• `{time_ro}` — {e['title_ro']} (forecast {e['forecast']}, prev {e['previous']})")
        lines.append("")
        lines.append(f"Cu 15 min înainte de fiecare știre primești tag <@&{TRADER_ROLE_ID}>.")
    else:
        lines.append("**📅 Azi nu sunt știri USD red din Forex Factory.** Zi calmă pe macro.")

    lines.extend([
        "",
        "**Vrei să fii notificat la fiecare știre roșie?**",
        f"Reacționează cu ✅ ca să primești rolul <@&{TRADER_ROLE_ID}>.",
        "Reacționează cu ❌ dacă vrei să-l scoți.",
    ])
    return "\n".join(lines)


WELCOME_MESSAGE = (
    "**Bine ai venit în Armata de Traderi.** ⚔️\n"
    "\n"
    "Citește atent. Aici nu îți promit profit, aici învățăm să tradăm cu structură, disciplină și răbdare.\n"
    "\n"
    "**Discordul are două niveluri:**\n"
    "\n"
    "🪖 **Soldat** (gratuit)\n"
    "• acces la <#1273545130778824800>\n"
    "• vezi anunțurile de bază\n"
    "• fără analize zilnice, fără chart-uri private\n"
    "\n"
    "🔒 **Elite** (privat)\n"
    "• analize zilnice pe BTC, ETH, altcoins\n"
    "• chart-urile mele reale, postate în timp real\n"
    "• indicatori TradingView privați\n"
    "• live-uri săptămânale și acces direct la mine\n"
    "• dashboard complet: Risk Score, Whale Tracker, Macro, Stocks, Crypto, calendar economic și mult mai mult\n"
    "\n"
    "🌐 **Site:** https://app.armatadetraderi.com\n"
    "\n"
    "**Cum primești acces:**\n"
    "👉 Pentru acces gratuit, reacționează aici cu 🪖\n"
    "👉 Pentru Elite, urmează pașii din <#1374504121343807669>\n"
    "\n"
    "_P.S. Aici nu se vând semnale și nu promit profit. Dacă cineva îți dă DM cu „trade-uri sigure\", e scam. Block și raportezi._"
)


def maybe_register_welcome(state: dict) -> None:
    """Post the welcome message once if not already registered."""
    if state.get("welcome", {}).get("message_id"):
        return
    if not os.environ.get("ALEXBRAIN_INSTALL_WELCOME"):
        return

    msg_id = post_message(WELCOME_MESSAGE, channel_id=WELCOME_CHANNEL_ID)
    if not msg_id:
        log("  welcome install: post failed")
        return
    add_reaction(msg_id, WELCOME_EMOJI, channel_id=WELCOME_CHANNEL_ID)
    state["welcome"] = {"message_id": msg_id, "channel_id": WELCOME_CHANNEL_ID, "granted": []}
    save_state(state)
    log(f"  welcome message installed: {msg_id}")
    telegram_notify(f"Alex's Brain: mesaj de bun venit postat în #🔒-bine-ai-venit. Poți elimina Carl-bot.")


def sync_welcome(state: dict) -> None:
    welcome = state.get("welcome")
    if not welcome or not welcome.get("message_id"):
        return
    msg_id = welcome["message_id"]
    channel_id = welcome.get("channel_id", WELCOME_CHANNEL_ID)
    granted = set(welcome.get("granted", []))

    reactors = set(fetch_reaction_users(msg_id, WELCOME_EMOJI, channel_id=channel_id))
    new_reactors = reactors - granted
    for uid in new_reactors:
        if grant_role_id(uid, SOLDAT_ROLE_ID):
            granted.add(uid)
            log(f"  soldat granted to {uid} (welcome reaction)")

    welcome["granted"] = sorted(granted)
    save_state(state)


def build_pre_alert(event: dict) -> str:
    time_ro = event["dt_ro"].strftime("%H:%M")
    return (
        f"⚠️ <@&{TRADER_ROLE_ID}> — în 15 minute (la `{time_ro}`):\n"
        f"**{event['title_ro']}**\n"
        f"• Forecast: `{event['forecast']}`\n"
        f"• Anterior: `{event['previous']}`\n\n"
        "Atenție la spike-uri pe BTC. Stai pe mâini până se așază piața.\n\n"
        f"Reacționează ✅ ca să primești rolul <@&{TRADER_ROLE_ID}>, ❌ ca să-l scoți."
    )


# --- pipeline steps --------------------------------------------------------
def maybe_post_daily_brief(state: dict) -> None:
    now_ro = datetime.now(TZ_RO)
    today_str = now_ro.date().isoformat()
    if state.get("daily_brief_date") == today_str:
        return
    if now_ro.hour < 10:
        return
    # Only fire inside the 10:00–10:30 window. If we wake up later (e.g., daemon
    # restarted at noon), mark today as done so we never post a "Bună dimineața"
    # mid-day. Use ALEXBRAIN_FORCE=1 to override for one-shot tests.
    in_window = now_ro.hour == 10 and now_ro.minute <= 30
    if not in_window and not os.environ.get("ALEXBRAIN_FORCE"):
        state["daily_brief_date"] = today_str
        save_state(state)
        return

    levels = fetch_btc_levels()
    if not levels:
        log("  daily brief: BTC levels unavailable, retrying next tick")
        return
    events = fetch_red_usd_events_today()

    content = build_daily_brief(levels, events)
    msg_id = post_message(content)
    if not msg_id:
        log("  daily brief: post failed, will retry next tick")
        return

    add_reaction(msg_id, "✅")
    add_reaction(msg_id, "❌")

    state["daily_brief_date"] = today_str
    state.setdefault("tracked", {})[msg_id] = {"kind": "brief", "date": today_str, "seen": {"yes": [], "no": []}}
    save_state(state)
    log(f"  daily brief posted: {msg_id}")
    telegram_notify(f"Alex's Brain: brief postat ({len(events)} știri red USD azi)")


def maybe_post_pre_alerts(state: dict) -> None:
    events = fetch_red_usd_events_today()
    if not events:
        return
    now_utc = datetime.now(timezone.utc)
    alerts = state.setdefault("alerts", {})
    for e in events:
        if e["id"] in alerts:
            continue
        delta = (e["dt_utc"] - now_utc).total_seconds()
        # Fire if we're inside [event - 15min, event - 5min].
        # Bottom of window catches cron drift; if we're past T-5 we skip
        # to avoid a stale "in 15 minutes" message arriving 2 minutes before.
        if not (300 <= delta <= 900):
            continue
        content = build_pre_alert(e)
        msg_id = post_message(content)
        if not msg_id:
            log(f"  pre-alert post failed for {e['title']}")
            continue
        add_reaction(msg_id, "✅")
        add_reaction(msg_id, "❌")
        alerts[e["id"]] = {"message_id": msg_id, "posted_at": now_utc.isoformat()}
        state.setdefault("tracked", {})[msg_id] = {"kind": "alert", "event": e["title"], "seen": {"yes": [], "no": []}}
        save_state(state)
        log(f"  pre-alert posted for {e['title']} @ T-{int(delta/60)}m")
        telegram_notify(f"Alex's Brain: pre-alert postat — {e['title_ro']}")


def sync_reactions(state: dict) -> None:
    tracked = state.get("tracked", {})
    if not tracked:
        return
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    stale: list[str] = []

    for msg_id, info in list(tracked.items()):
        seen_yes = set(info.get("seen", {}).get("yes", []))
        seen_no = set(info.get("seen", {}).get("no", []))

        yes_users = set(fetch_reaction_users(msg_id, "✅"))
        no_users = set(fetch_reaction_users(msg_id, "❌"))

        for uid in yes_users - seen_yes:
            if grant_role(uid):
                seen_yes.add(uid)
                log(f"  trader role granted to {uid} (msg {msg_id})")

        for uid in no_users - seen_no:
            if revoke_role(uid):
                seen_no.add(uid)
                log(f"  trader role revoked from {uid} (msg {msg_id})")

        info["seen"] = {"yes": sorted(seen_yes), "no": sorted(seen_no)}

        # Drop tracked messages older than 14 days
        posted_at = info.get("date") or info.get("posted_at")
        if posted_at:
            try:
                posted = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                if posted.tzinfo is None:
                    posted = posted.replace(tzinfo=timezone.utc)
                if posted < cutoff:
                    stale.append(msg_id)
            except ValueError:
                pass

    for msg_id in stale:
        tracked.pop(msg_id, None)

    save_state(state)


# --- telegram --------------------------------------------------------------
def telegram_notify(text: str) -> None:
    if not TELEGRAM_TOKEN:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    body = json.dumps({"chat_id": TELEGRAM_CHAT_ID, "text": text}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except (urllib.error.URLError, OSError):
        pass


# --- main ------------------------------------------------------------------
def main() -> int:
    state = load_state()
    try:
        maybe_register_welcome(state)
    except Exception as ex:
        log(f"  welcome install error: {ex}")
    try:
        maybe_post_daily_brief(state)
    except Exception as ex:
        log(f"  daily brief error: {ex}")
    try:
        maybe_post_pre_alerts(state)
    except Exception as ex:
        log(f"  pre-alert error: {ex}")
    try:
        sync_reactions(state)
    except Exception as ex:
        log(f"  reaction sync error: {ex}")
    try:
        sync_welcome(state)
    except Exception as ex:
        log(f"  welcome sync error: {ex}")
    return 0


if __name__ == "__main__":
    import urllib.parse  # noqa: E402
    sys.exit(main())
