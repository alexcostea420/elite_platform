#!/usr/bin/env python3
"""
fetch_transcripts.py - Fetch recent YouTube videos and extract transcripts.
Outputs structured JSON for Claude Code to analyze.

Usage: python fetch_transcripts.py [--days 7]
"""

import json
import logging
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

from channels import CHANNELS

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

LOOKBACK_DAYS = 1
TRANSCRIPTS_DIR = Path("transcripts")
TRANSCRIPTS_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("fetch.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("fetch")

# ---------------------------------------------------------------------------
# Step 1: Fetch recent videos from RSS feeds
# ---------------------------------------------------------------------------

def get_recent_videos(channel_name: str, channel_id: str, days: int) -> list[dict]:
    if not channel_id:
        log.warning(f"  {channel_name}: no channel_id configured - skipping")
        return []

    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    try:
        feed = feedparser.parse(feed_url)
        if feed.bozo and not feed.entries:
            log.warning(f"  {channel_name}: RSS feed error - {feed.bozo_exception}")
            return []
    except Exception as e:
        log.error(f"  {channel_name}: failed to fetch RSS - {e}")
        return []

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    videos = []

    for entry in feed.entries:
        published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
        if published >= cutoff:
            video_id = entry.yt_videoid
            videos.append({
                "channel": channel_name,
                "video_id": video_id,
                "title": entry.title,
                "published": published.isoformat(),
                "url": f"https://www.youtube.com/watch?v={video_id}",
            })

    log.info(f"  {channel_name}: {len(videos)} videos in last {days} days")
    return videos


# ---------------------------------------------------------------------------
# Step 2: Extract transcripts
# ---------------------------------------------------------------------------

def _fetch_via_ytdlp(video_id: str):
    """Fallback: use yt-dlp to download subtitles when youtube-transcript-api is blocked."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    tmp_dir = TRANSCRIPTS_DIR / "_ytdlp_tmp"
    tmp_dir.mkdir(exist_ok=True)
    out_template = str(tmp_dir / video_id)

    # Try manual subs first (ro, en), then auto-generated
    for sub_flag in (["--write-subs", "--no-write-auto-subs"], ["--write-auto-subs"]):
        cmd = [
            "yt-dlp",
            "--skip-download",
            *sub_flag,
            "--sub-langs", "ro-orig,ro,en",
            "--sub-format", "vtt",
            "--convert-subs", "vtt",
            "--impersonate", "chrome",
            "-o", out_template,
            url,
        ]
        try:
            subprocess.run(cmd, capture_output=True, timeout=60)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue

        # Look for downloaded subtitle files
        for lang in ("ro-orig", "ro", "en"):
            for ext in (f"{lang}.vtt",):
                candidate = tmp_dir / f"{video_id}.{ext}"
                if candidate.exists():
                    raw = candidate.read_text(encoding="utf-8")
                    # Strip VTT headers and timestamps, keep only text lines
                    lines = []
                    for line in raw.splitlines():
                        line = line.strip()
                        if not line or line.startswith("WEBVTT") or line.startswith("Kind:") \
                                or line.startswith("Language:") or "-->" in line \
                                or line.isdigit():
                            continue
                        line = re.sub(r"<[^>]+>", "", line)
                        if line and line not in lines[-1:]:  # deduplicate consecutive
                            lines.append(line)
                    text = " ".join(lines)
                    # Cleanup tmp files
                    for f in tmp_dir.glob(f"{video_id}*"):
                        f.unlink()
                    return text if len(text) > 20 else None

    # Cleanup on failure
    for f in tmp_dir.glob(f"{video_id}*"):
        f.unlink()
    return None


def extract_transcript(video_id: str, channel: str):
    # Check cache first
    cache_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
    if cache_path.exists():
        text = cache_path.read_text(encoding="utf-8")
        if len(text) > 20:
            log.info(f"  {channel} ({video_id}): using cached transcript")
            return text

    ytt = YouTubeTranscriptApi()
    formatter = TextFormatter()

    # Primary: youtube-transcript-api (fast, no download needed)
    try:
        transcript = ytt.fetch(video_id, languages=["ro", "en"])
        text = formatter.format_transcript(transcript)
        cache_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
        cache_path.write_text(text, encoding="utf-8")
        return text
    except Exception as e:
        log.info(f"  {channel} ({video_id}): primary method failed, trying yt-dlp...")

    # Fallback: yt-dlp
    try:
        text = _fetch_via_ytdlp(video_id)
        if text:
            cache_path = TRANSCRIPTS_DIR / f"{video_id}.txt"
            cache_path.write_text(text, encoding="utf-8")
            log.info(f"  {channel} ({video_id}): yt-dlp fallback succeeded")
            return text
        else:
            log.warning(f"  {channel} ({video_id}): yt-dlp found no subtitles")
    except Exception as e2:
        log.warning(f"  {channel} ({video_id}): yt-dlp fallback also failed - {e2}")

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    days = LOOKBACK_DAYS
    if "--days" in sys.argv:
        idx = sys.argv.index("--days")
        days = int(sys.argv[idx + 1])

    log.info(f"Fetching videos from last {days} days across {len(CHANNELS)} channels...")

    # Step 1: Get recent videos
    all_videos = []
    for name, info in CHANNELS.items():
        videos = get_recent_videos(name, info.get("channel_id"), days)
        all_videos.extend(videos)

    log.info(f"Total videos found: {len(all_videos)}")

    if not all_videos:
        log.info("No new videos found.")
        # Still write output so the scheduled task knows
        output = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "channels_monitored": len(CHANNELS),
            "videos_found": 0,
            "videos_with_transcripts": 0,
            "videos_failed": 0,
            "failed_list": [],
            "videos": [],
        }
        output_path = TRANSCRIPTS_DIR / f"weekly_{datetime.now().strftime('%Y-%m-%d')}.json"
        output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
        log.info(f"Output saved to {output_path}")
        return

    # Step 2: Extract transcripts
    successes = []
    failures = []

    for v in all_videos:
        log.info(f"  {v['channel']}: {v['title'][:60]}...")
        text = extract_transcript(v["video_id"], v["channel"])
        if text:
            # Truncate very long transcripts to ~12k words
            words = text.split()
            if len(words) > 12000:
                text = " ".join(words[:12000]) + f"\n\n[TRUNCATED - original was {len(words)} words]"
            v["transcript"] = text
            successes.append(v)
        else:
            failures.append(v)

    log.info(f"Transcripts: {len(successes)} OK, {len(failures)} failed")

    # Build output JSON
    output = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "channels_monitored": len(CHANNELS),
        "videos_found": len(all_videos),
        "videos_with_transcripts": len(successes),
        "videos_failed": len(failures),
        "failed_list": [
            {"channel": v["channel"], "title": v["title"]} for v in failures
        ],
        "videos": [
            {
                "channel": v["channel"],
                "title": v["title"],
                "published": v["published"],
                "url": v["url"],
                "transcript": v["transcript"],
            }
            for v in successes
        ],
    }

    output_path = TRANSCRIPTS_DIR / f"weekly_{datetime.now().strftime('%Y-%m-%d')}.json"
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info(f"Output saved to {output_path}")
    log.info("Fetch complete.")


if __name__ == "__main__":
    main()
