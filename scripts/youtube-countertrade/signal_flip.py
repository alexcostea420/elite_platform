#!/usr/bin/env python3
"""
signal_flip.py - Detect if the latest signal direction changed from the previous one.

Returns the flip info as JSON, or None if no flip.
Usage: python signal_flip.py
"""

import json
from pathlib import Path

SIGNAL_LOG = Path("signal_log.jsonl")


def get_last_two_signals() -> tuple[dict | None, dict | None]:
    """Return (previous, latest) signal entries, skipping title-only entries."""
    if not SIGNAL_LOG.exists():
        return None, None

    entries = []
    for line in SIGNAL_LOG.read_text().strip().split("\n"):
        entry = json.loads(line)
        # Only consider full-transcript signals
        if entry.get("data_source") != "titles_only":
            entries.append(entry)

    if len(entries) < 2:
        return None, entries[-1] if entries else None
    return entries[-2], entries[-1]


def normalize_direction(signal: str) -> str:
    """Normalize signal to BULLISH or BEARISH."""
    s = signal.upper()
    if "BEAR" in s or "SHORT" in s:
        return "BEARISH"
    if "BULL" in s or "LONG" in s:
        return "BULLISH"
    return "NEUTRAL"


def detect_flip():
    """Return flip info dict if direction changed, None otherwise."""
    prev, latest = get_last_two_signals()
    if not prev or not latest:
        return None

    prev_dir = normalize_direction(prev.get("signal", ""))
    latest_dir = normalize_direction(latest.get("signal", ""))

    if prev_dir != latest_dir and prev_dir != "NEUTRAL" and latest_dir != "NEUTRAL":
        return {
            "flipped": True,
            "from": prev_dir,
            "to": latest_dir,
            "prev_date": prev["date"],
            "latest_date": latest["date"],
            "prev_signal": prev.get("signal"),
            "latest_signal": latest.get("signal"),
        }
    return None


if __name__ == "__main__":
    flip = detect_flip()
    if flip:
        print(f"SIGNAL FLIP: {flip['from']} -> {flip['to']}")
        print(f"  Previous: {flip['prev_date']} ({flip['prev_signal']})")
        print(f"  Current:  {flip['latest_date']} ({flip['latest_signal']})")
    else:
        print("No signal flip detected.")
