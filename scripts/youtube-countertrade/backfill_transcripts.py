#!/usr/bin/env python3
"""
backfill_transcripts.py - Fetch transcripts for a date range using yt-dlp to discover videos.
Unlike fetch_transcripts.py (RSS-based, ~2 weeks), this uses yt-dlp which can go back months.

Usage:
  python backfill_transcripts.py --start 2026-04-04 --end 2026-04-20
"""

import argparse
import json
import logging
import subprocess
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

from channels import CHANNELS
from fetch_transcripts import extract_transcript as extract_with_fallbacks

TRANSCRIPTS_DIR = Path("transcripts")
TRANSCRIPTS_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("backfill")


def list_channel_videos(channel_name, channel_info, start_date, end_date):
    """Use yt-dlp to list videos from a channel in a date range."""
    url = channel_info["url"] + "/videos"
    start_str = start_date.replace("-", "")
    end_str = end_date.replace("-", "")

    try:
        result = subprocess.run(
            [sys.executable, "-m", "yt_dlp",
             "--flat-playlist",
             "--print", "%(id)s|||%(title)s|||%(upload_date)s",
             "--playlist-end", "100",
             url],
            capture_output=True, text=True, timeout=60
        )
        videos = []
        for line in result.stdout.strip().split("\n"):
            if "|||" not in line:
                continue
            parts = line.split("|||")
            if len(parts) < 3:
                continue
            vid_id, title, upload_date = parts[0], parts[1], parts[2]

            # Filter by date range (upload_date might be 'NA')
            if upload_date and upload_date != "NA":
                if upload_date < start_str or upload_date > end_str:
                    continue
            else:
                # Try to infer from title (many have date in title)
                pass

            videos.append({
                "id": vid_id,
                "title": title,
                "channel": channel_name,
                "upload_date": upload_date,
            })

        # If dates are NA, include all and filter later
        if all(v["upload_date"] == "NA" for v in videos):
            videos = videos[:30]  # Limit to last 30

        return videos
    except Exception as e:
        log.error(f"  {channel_name}: yt-dlp error: {e}")
        return []


def fetch_transcript(video_id, channel_name="?"):
    """Fetch transcript using full fallback chain (api → yt-dlp subs → mlx-whisper)."""
    cache_file = TRANSCRIPTS_DIR / f"{video_id}.txt"
    if cache_file.exists() and cache_file.stat().st_size > 50:
        return cache_file.read_text(encoding="utf-8")
    return extract_with_fallbacks(video_id, channel_name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="Start date YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="End date YYYY-MM-DD")
    args = parser.parse_args()

    log.info(f"Backfilling transcripts from {args.start} to {args.end}")

    # Group by date for daily JSON files
    daily_videos = defaultdict(list)

    for channel_name, channel_info in CHANNELS.items():
        log.info(f"  Scanning {channel_name}...")
        videos = list_channel_videos(channel_name, channel_info, args.start, args.end)
        log.info(f"    Found {len(videos)} videos in range")

        for v in videos:
            # Fetch transcript (uses api → yt-dlp subs → mlx-whisper fallback)
            transcript = fetch_transcript(v["id"], channel_name)
            time.sleep(1)  # Rate limit

            entry = {
                "channel": channel_name,
                "video_id": v["id"],
                "title": v["title"],
                "published": v["upload_date"],
                "transcript": transcript or "",
            }

            # Determine date for grouping
            date_str = v["upload_date"]
            if date_str and date_str != "NA" and len(date_str) == 8:
                date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            else:
                date_str = args.end  # Default to end date

            daily_videos[date_str].append(entry)

        time.sleep(2)  # Rate limit between channels

    # Save daily JSON files
    for date_str, videos in sorted(daily_videos.items()):
        out_file = TRANSCRIPTS_DIR / f"weekly_{date_str}.json"
        if out_file.exists():
            # Merge with existing
            existing = json.loads(out_file.read_text(encoding="utf-8"))
            existing_vids = existing if isinstance(existing, list) else existing.get("videos", [])
            existing_ids = {v.get("video_id", v.get("id", "")) for v in existing_vids}
            for v in videos:
                if v["video_id"] not in existing_ids:
                    existing_vids.append(v)
            videos = existing_vids

        out_file.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
        ok = len([v for v in videos if len(v.get("transcript", "")) > 50])
        log.info(f"  {date_str}: {len(videos)} videos ({ok} with transcripts)")

    log.info(f"Backfill complete. {sum(len(v) for v in daily_videos.values())} total videos across {len(daily_videos)} days.")


if __name__ == "__main__":
    main()
