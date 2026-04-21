#!/usr/bin/env python3
"""
send_telegram.py - Send a message to Telegram.
Reads from a file argument or stdin.

Usage:
  python send_telegram.py report.txt
  echo "test message" | python send_telegram.py
  python send_telegram.py --text "inline message"
"""

import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]


def send_message(text: str) -> bool:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

    # Split into chunks respecting Telegram's 4096 char limit
    chunks = split_message(text, 4096)
    success = True

    for i, chunk in enumerate(chunks):
        try:
            resp = requests.post(url, json={
                "chat_id": CHAT_ID,
                "text": chunk,
            }, timeout=30)
            if resp.status_code != 200:
                print(f"Telegram error (chunk {i+1}): {resp.status_code} - {resp.text}", file=sys.stderr)
                success = False
        except Exception as e:
            print(f"Telegram send failed: {e}", file=sys.stderr)
            success = False

    return success


def split_message(text: str, max_len: int) -> list[str]:
    if len(text) <= max_len:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, max_len)
        if split_at == -1:
            split_at = max_len
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks


def main():
    # Get text from --text arg, file arg, or stdin
    if "--text" in sys.argv:
        idx = sys.argv.index("--text")
        text = sys.argv[idx + 1]
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            text = f.read()
    else:
        text = sys.stdin.read()

    if not text.strip():
        print("No text to send.", file=sys.stderr)
        sys.exit(1)

    ok = send_message(text)
    if ok:
        print(f"Sent {len(text)} chars to Telegram.")
    else:
        print("Some chunks failed.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
