#!/usr/bin/env python3
"""Fetch historical economic events from Trading Economics (guest API).
Fetches high-impact USD events for the last 12 months.
Output: JSON file for use by the calendar page.
"""
import json
import os
import time
import urllib.request
from datetime import datetime, timedelta

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "economic_history.json")

def fetch_events(start: str, end: str) -> list:
    """Fetch high-impact events for a date range."""
    url = f"https://api.tradingeconomics.com/calendar/country/united%20states/{start}/{end}?c=guest:guest&importance=3"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read().decode())
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  Error {start}-{end}: {e}")
        return []

def main():
    all_events = []
    seen = set()

    # Fetch month by month for last 12 months
    now = datetime.now()
    for months_ago in range(12, -1, -1):
        start_date = now - timedelta(days=months_ago * 30)
        end_date = start_date + timedelta(days=30)
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")

        print(f"Fetching {start_str} to {end_str}...")
        events = fetch_events(start_str, end_str)

        for e in events:
            key = f"{e.get('Date','')}-{e.get('Event','')}"
            if key not in seen:
                seen.add(key)
                all_events.append({
                    "date": e.get("Date", ""),
                    "event": e.get("Event", ""),
                    "actual": e.get("Actual"),
                    "previous": e.get("Previous"),
                    "forecast": e.get("Forecast"),
                    "category": e.get("Category", ""),
                    "importance": e.get("Importance", 0),
                })

        time.sleep(1)  # Be nice to the API

    # Sort by date
    all_events.sort(key=lambda x: x["date"])

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump({"fetched_at": now.isoformat(), "events": all_events}, f, indent=2)

    print(f"\nSaved {len(all_events)} events to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
