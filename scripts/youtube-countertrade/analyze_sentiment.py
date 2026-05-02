#!/usr/bin/env python3
"""
analyze_sentiment.py - Automated Claude API analysis of YouTube transcripts.
Replaces the manual Claude Code step.

Usage:
  python analyze_sentiment.py                    # Analyze today's transcripts
  python analyze_sentiment.py --date 2026-04-20  # Analyze specific date
  python analyze_sentiment.py --backfill 7       # Analyze last 7 days

Requires: ANTHROPIC_API_KEY in .env or environment
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE

# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
TRANSCRIPTS_DIR = SCRIPT_DIR / "transcripts"
REPORTS_DIR = SCRIPT_DIR / "reports"
REPORTS_DIR.mkdir(exist_ok=True)
SIGNAL_LOG = SCRIPT_DIR / "signal_log.jsonl"

# Load env
_env = {}
for env_path in [SCRIPT_DIR / ".env", SCRIPT_DIR.parent.parent / ".env.local"]:
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    _env[k] = v

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or _env.get("ANTHROPIC_API_KEY", "")
USE_CLI = False  # set by --cli flag in main()


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def call_claude_cli(system_prompt, user_prompt):
    """Call `claude -p` (Claude Code CLI) — works on Max plan, no API key needed.
    Pipes the prompt via stdin to avoid OS arg-list limits on large inputs."""
    full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"
    try:
        result = subprocess.run(
            ["claude", "-p"],
            input=full_prompt,
            capture_output=True,
            text=True,
            timeout=900,
        )
        if result.returncode != 0:
            log(f"  CLI exit {result.returncode}: {result.stderr[:300]}")
            return None
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        log("  CLI timeout (900s)")
        return None
    except Exception as e:
        log(f"  CLI error: {e}")
        return None


def call_claude(system_prompt, user_prompt, max_tokens=4000):
    """Call Claude API with retries (or CLI if --cli flag set)."""
    if USE_CLI:
        return call_claude_cli(system_prompt, user_prompt)

    if not ANTHROPIC_API_KEY:
        log("  ERROR: ANTHROPIC_API_KEY not set (use --cli to fall back to Claude Code CLI)")
        return None

    body = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_prompt}],
    }).encode()

    for attempt in range(3):
        try:
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
            )
            resp = urllib.request.urlopen(req, timeout=120)
            data = json.loads(resp.read().decode())
            return data["content"][0]["text"]
        except urllib.error.HTTPError as e:
            err_body = e.read().decode() if e.fp else ""
            if e.code == 429:
                wait = 30 * (attempt + 1)
                log(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            log(f"  Claude API error {e.code}: {err_body[:200]}")
            return None
        except Exception as e:
            log(f"  Claude API error: {e}")
            if attempt < 2:
                time.sleep(5)
                continue
            return None
    return None


def analyze_date(date_str):
    """Analyze transcripts for a specific date."""
    weekly_file = TRANSCRIPTS_DIR / f"weekly_{date_str}.json"
    report_file = REPORTS_DIR / f"report_{date_str}.txt"

    if report_file.exists() and report_file.stat().st_size > 100:
        log(f"  {date_str}: report exists, skipping")
        return True

    if not weekly_file.exists():
        log(f"  {date_str}: no transcripts file, skipping")
        return False

    with open(weekly_file) as f:
        data = json.load(f)

    videos = data if isinstance(data, list) else data.get("videos", [])
    if not videos:
        log(f"  {date_str}: no videos, skipping")
        return False

    # Build transcript text for Claude
    transcript_parts = []
    ok_count = 0
    fail_list = []
    channels_seen = set()

    for v in videos:
        channel = v.get("channel", "Unknown")
        channels_seen.add(channel)
        title = v.get("title", "Unknown")
        transcript = v.get("transcript", "")

        if not transcript or len(transcript) < 50:
            fail_list.append(f"- {channel}: {title} (no transcript)")
            continue

        # Truncate very long transcripts
        if len(transcript) > 8000:
            transcript = transcript[:8000] + "\n[TRUNCATED]"

        transcript_parts.append(
            f"=== CHANNEL: {channel} ===\n"
            f"TITLE: {title}\n"
            f"DATE: {v.get('published', date_str)}\n\n"
            f"{transcript}\n"
        )
        ok_count += 1

    if ok_count == 0:
        log(f"  {date_str}: no usable transcripts")
        return False

    user_prompt = USER_PROMPT_TEMPLATE.format(
        date=date_str,
        num_channels=len(channels_seen),
        num_videos=ok_count,
        num_failed=len(fail_list),
        failed_list="\n".join(fail_list) if fail_list else "(none)",
        transcripts="\n\n".join(transcript_parts),
    )

    log(f"  {date_str}: analyzing {ok_count} videos from {len(channels_seen)} channels...")
    report = call_claude(SYSTEM_PROMPT, user_prompt, max_tokens=4000)

    if not report:
        log(f"  {date_str}: Claude analysis failed")
        return False

    # Save report
    with open(report_file, "w") as f:
        f.write(report)

    # Extract LOG line and append to signal_log
    log_match = re.search(r"LOG:\s*(.+)", report)
    if log_match:
        log_line = log_match.group(1).strip()
        # Parse into structured JSON
        fields = {}
        for part in log_line.split("|"):
            part = part.strip()
            if "=" in part:
                k, v = part.split("=", 1)
                fields[k.strip()] = v.strip()

        signal_entry = {
            "date": date_str,
            "videos": int(fields.get("videos", ok_count)),
            "consensus": fields.get("consensus", "UNKNOWN"),
            "strength": fields.get("strength", "UNKNOWN"),
            "signal": fields.get("signal", "NO SIGNAL"),
            "key_level": fields.get("key_level", ""),
            "outcome": "PENDING",
            "channels": list(channels_seen),
        }

        with open(SIGNAL_LOG, "a") as f:
            f.write(json.dumps(signal_entry) + "\n")

        log(f"  {date_str}: {signal_entry['consensus']} {signal_entry['strength']} → {signal_entry['signal']}")
    else:
        log(f"  {date_str}: no LOG line found in report")

    return True


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="Analyze specific date (YYYY-MM-DD)")
    parser.add_argument("--backfill", type=int, help="Analyze last N days")
    parser.add_argument("--cli", action="store_true", help="Use `claude -p` (Max plan) instead of API key")
    args = parser.parse_args()

    global USE_CLI
    USE_CLI = args.cli
    if USE_CLI:
        log("Using Claude Code CLI (Max plan) — no API key required")
    elif not ANTHROPIC_API_KEY:
        log("ERROR: ANTHROPIC_API_KEY not set. Use --cli for Max-plan fallback.")
        sys.exit(1)

    if args.backfill:
        log(f"Backfilling {args.backfill} days...")
        today = datetime.now(timezone.utc).date()
        success = 0
        for i in range(args.backfill, 0, -1):
            d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            if analyze_date(d):
                success += 1
            time.sleep(3)  # Rate limit between days
        # Also do today
        analyze_date(today.strftime("%Y-%m-%d"))
        log(f"Done: {success + 1} days processed")
    elif args.date:
        analyze_date(args.date)
    else:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        analyze_date(today)


if __name__ == "__main__":
    main()
