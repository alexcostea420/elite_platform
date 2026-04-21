#!/usr/bin/env python3
"""
price_tracker.py - Track BTC/ETH prices over time using CoinGecko.
Stores daily snapshots in price_history.json.

Usage:
  python price_tracker.py              # fetch and store today's prices
  python price_tracker.py backfill 30  # backfill last 30 days from CoinGecko
  python price_tracker.py history      # print full history
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

HISTORY_FILE = Path("price_history.json")
COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    return []


def save_history(history: list[dict]):
    history.sort(key=lambda x: x["date"])
    HISTORY_FILE.write_text(json.dumps(history, indent=2), encoding="utf-8")


def fetch_current():
    """Fetch current BTC/ETH prices."""
    try:
        resp = requests.get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": "bitcoin,ethereum", "vs_currencies": "usd"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "btc": data["bitcoin"]["usd"],
            "eth": data["ethereum"]["usd"],
        }
    except Exception as e:
        print(f"Error fetching prices: {e}", file=sys.stderr)
        return None


def fetch_and_store():
    """Fetch current prices and append to history."""
    entry = fetch_current()
    if not entry:
        return
    history = load_history()
    # Replace if same date exists
    history = [h for h in history if h["date"] != entry["date"]]
    history.append(entry)
    save_history(history)
    print(f"Stored: BTC {entry['btc']:,.0f} USD | ETH {entry['eth']:,.0f} USD ({entry['date']})")


def backfill(days: int = 30):
    """Backfill price history from CoinGecko market_chart endpoint."""
    history = load_history()
    existing_dates = {h["date"] for h in history}

    try:
        # CoinGecko market_chart gives us daily data
        resp = requests.get(
            f"{COINGECKO_BASE}/coins/bitcoin/market_chart",
            params={"vs_currency": "usd", "days": days, "interval": "daily"},
            timeout=15,
        )
        resp.raise_for_status()
        btc_data = {
            datetime.fromtimestamp(p[0] / 1000, tz=timezone.utc).strftime("%Y-%m-%d"): p[1]
            for p in resp.json()["prices"]
        }

        time.sleep(1)  # rate limit

        resp = requests.get(
            f"{COINGECKO_BASE}/coins/ethereum/market_chart",
            params={"vs_currency": "usd", "days": days, "interval": "daily"},
            timeout=15,
        )
        resp.raise_for_status()
        eth_data = {
            datetime.fromtimestamp(p[0] / 1000, tz=timezone.utc).strftime("%Y-%m-%d"): p[1]
            for p in resp.json()["prices"]
        }

        added = 0
        for date in btc_data:
            if date not in existing_dates and date in eth_data:
                history.append({
                    "date": date,
                    "btc": round(btc_data[date], 2),
                    "eth": round(eth_data[date], 2),
                })
                added += 1

        save_history(history)
        print(f"Backfilled {added} days of price data (total: {len(history)} entries)")

    except Exception as e:
        print(f"Backfill error: {e}", file=sys.stderr)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    if cmd == "backfill":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        backfill(days)
    elif cmd == "history":
        print(json.dumps(load_history(), indent=2))
    else:
        fetch_and_store()
