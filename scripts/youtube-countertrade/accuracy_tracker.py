#!/usr/bin/env python3
"""
accuracy_tracker.py - Auto-evaluate past signal outcomes.
Checks if PENDING signals have resolved based on price movement.

Logic:
  - LONG signal: CORRECT if BTC rose 5%+ from signal price, INCORRECT if dropped 10%+
  - SHORT signal: CORRECT if BTC dropped 5%+ from signal price, INCORRECT if rose 10%+
  - Still within range: stays PENDING

Usage:
  python accuracy_tracker.py           # evaluate and update signal_log.jsonl
  python accuracy_tracker.py stats     # print win rate stats
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

SIGNAL_LOG = Path("signal_log.jsonl")

# Thresholds
WIN_THRESHOLD = 0.05    # 5% move in signal direction = CORRECT
LOSS_THRESHOLD = 0.10   # 10% move against signal = INCORRECT


def get_current_btc() -> float:
    try:
        resp = requests.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": "bitcoin", "vs_currencies": "usd"},
            timeout=10,
        )
        return resp.json()["bitcoin"]["usd"]
    except Exception:
        return 0


def load_signals() -> list[dict]:
    if not SIGNAL_LOG.exists():
        return []
    entries = []
    for line in SIGNAL_LOG.read_text(encoding="utf-8").strip().split("\n"):
        if line.strip():
            entries.append(json.loads(line))
    return entries


def save_signals(signals: list[dict]):
    with open(SIGNAL_LOG, "w", encoding="utf-8") as f:
        for s in signals:
            f.write(json.dumps(s) + "\n")


def evaluate_signal(signal: dict, current_btc: float):
    """Returns new outcome or None if still pending."""
    btc_at = signal.get("btc_at_signal")
    if not btc_at or btc_at == 0:
        return None

    sig = signal.get("signal", "").upper()
    is_long = "LONG" in sig or "BULLISH" in sig
    is_short = "SHORT" in sig or "BEARISH" in sig

    if not is_long and not is_short:
        return None

    pct_change = (current_btc - btc_at) / btc_at

    if is_long:
        if pct_change >= WIN_THRESHOLD:
            return "CORRECT"
        elif pct_change <= -LOSS_THRESHOLD:
            return "INCORRECT"
    elif is_short:
        if pct_change <= -WIN_THRESHOLD:
            return "CORRECT"
        elif pct_change >= LOSS_THRESHOLD:
            return "INCORRECT"

    return None  # still PENDING


def evaluate_all():
    """Check all PENDING signals and update outcomes."""
    signals = load_signals()
    current_btc = get_current_btc()
    if current_btc == 0:
        print("Failed to fetch current BTC price", file=sys.stderr)
        return []

    updated = []
    for s in signals:
        if s.get("outcome", "PENDING") == "PENDING":
            result = evaluate_signal(s, current_btc)
            if result:
                s["outcome"] = result
                s["outcome_btc"] = current_btc
                s["outcome_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                btc_at = s.get("btc_at_signal", 0)
                s["outcome_pct"] = round((current_btc - btc_at) / btc_at * 100, 2) if btc_at else 0
                updated.append(s)
                print(f"  {s['date']}: {s['signal']} -> {result} ({s['outcome_pct']:+.1f}% at {current_btc:,.0f} USD)")

    if updated:
        save_signals(signals)
        print(f"\nUpdated {len(updated)} signal(s)")
    else:
        print(f"No signals resolved (BTC now: {current_btc:,.0f} USD)")

    return updated


def print_stats():
    """Print win rate statistics."""
    signals = load_signals()
    total = len(signals)
    resolved = [s for s in signals if s.get("outcome") in ("CORRECT", "INCORRECT")]
    correct = [s for s in resolved if s["outcome"] == "CORRECT"]
    pending = [s for s in signals if s.get("outcome", "PENDING") == "PENDING"]

    print(f"Total signals: {total}")
    print(f"Resolved: {len(resolved)}")
    print(f"  Correct: {len(correct)}")
    print(f"  Incorrect: {len(resolved) - len(correct)}")
    print(f"  Win rate: {len(correct)/len(resolved)*100:.0f}%" if resolved else "  Win rate: N/A")
    print(f"Pending: {len(pending)}")

    if resolved:
        avg_pct = sum(s.get("outcome_pct", 0) for s in resolved) / len(resolved)
        print(f"Avg move at resolution: {avg_pct:+.1f}%")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "evaluate"
    if cmd == "stats":
        print_stats()
    else:
        evaluate_all()
