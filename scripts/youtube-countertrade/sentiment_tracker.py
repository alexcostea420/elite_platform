#!/usr/bin/env python3
"""
sentiment_tracker.py - Track per-channel sentiment scores over time.
Stores history in sentiment_history.json.

Usage:
  # Record scores for a run:
  python sentiment_tracker.py record '{"date":"2026-03-24","btc_price":69520,"eth_price":2127,"scores":{"DanielMihaiCrypto":20,"CristianChifoi":35}}'

  # Get latest + previous scores for comparison:
  python sentiment_tracker.py compare

  # Get full history:
  python sentiment_tracker.py history
"""

import json
import sys
from pathlib import Path

HISTORY_FILE = Path("sentiment_history.json")


def load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    return []


def save_history(history: list[dict]):
    HISTORY_FILE.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")


def record(entry_json: str):
    entry = json.loads(entry_json)
    history = load_history()
    # Avoid duplicate dates
    history = [h for h in history if h["date"] != entry["date"]]
    history.append(entry)
    history.sort(key=lambda x: x["date"])
    save_history(history)
    print(f"Recorded {len(entry.get('scores', {}))} channel scores for {entry['date']}")


def compare():
    history = load_history()
    if not history:
        print(json.dumps({"current": None, "previous": None}))
        return

    current = history[-1]
    previous = history[-2] if len(history) >= 2 else None

    result = {"current": current, "previous": previous}

    # Add trend arrows
    if previous and current:
        trends = {}
        for channel, score in current.get("scores", {}).items():
            prev_score = previous.get("scores", {}).get(channel)
            if prev_score is not None:
                diff = score - prev_score
                if diff > 5:
                    trends[channel] = "up"
                elif diff < -5:
                    trends[channel] = "down"
                else:
                    trends[channel] = "flat"
            else:
                trends[channel] = "new"
        result["trends"] = trends

    print(json.dumps(result, indent=2, ensure_ascii=False))


def history():
    h = load_history()
    print(json.dumps(h, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "compare"
    if cmd == "record":
        record(sys.argv[2])
    elif cmd == "compare":
        compare()
    elif cmd == "history":
        history()
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        sys.exit(1)
