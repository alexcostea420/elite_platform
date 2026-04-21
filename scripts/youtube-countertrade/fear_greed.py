#!/usr/bin/env python3
"""
fear_greed.py - Fetch Bitcoin Fear & Greed Index.
Returns current value (0-100) and classification.

Usage:
  python fear_greed.py          # prints JSON: {"value": 23, "classification": "Extreme Fear", "timestamp": "..."}
  python fear_greed.py history   # prints last 30 days
"""

import json
import sys
import requests


def get_current() -> dict:
    """Fetch current Fear & Greed index."""
    try:
        resp = requests.get("https://api.alternative.me/fng/?limit=1", timeout=10)
        resp.raise_for_status()
        data = resp.json()["data"][0]
        return {
            "value": int(data["value"]),
            "classification": data["value_classification"],
            "timestamp": data["timestamp"],
        }
    except Exception as e:
        return {"value": None, "classification": "unavailable", "error": str(e)}


def get_history(days: int = 30) -> list[dict]:
    """Fetch Fear & Greed history."""
    try:
        resp = requests.get(f"https://api.alternative.me/fng/?limit={days}", timeout=10)
        resp.raise_for_status()
        return [
            {
                "value": int(d["value"]),
                "classification": d["value_classification"],
                "timestamp": d["timestamp"],
            }
            for d in resp.json()["data"]
        ]
    except Exception as e:
        return [{"error": str(e)}]


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "current"
    if cmd == "history":
        print(json.dumps(get_history(), indent=2))
    else:
        print(json.dumps(get_current(), indent=2))
