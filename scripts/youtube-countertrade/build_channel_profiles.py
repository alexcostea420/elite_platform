#!/usr/bin/env python3
"""
build_channel_profiles.py — Aggregate transcripts per channel into compact profiles.

Reads:
  transcripts/*.txt          (raw transcripts cached by fetch_transcripts.py)
  transcripts/weekly_*.json  (date+channel+title+video_id metadata)

Writes:
  profiles/<channel>.json    one profile per channel with:
    - total_videos, date range
    - avg_words, total_words
    - tickers_mentioned (frequency of BTC/ETH/SOL/etc)
    - common_phrases (top 30 bigrams/trigrams excluding stopwords)
    - per_video index (date, title, video_id, word_count, top_tickers) — no full transcript
    - raw_transcripts moved to profiles/<channel>/<video_id>.txt for archive

After running, you can `rm transcripts/*.txt` and `rm transcripts/_*_tmp/*` safely.

Usage: python build_channel_profiles.py [--keep-raw]
"""

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
TRANSCRIPTS_DIR = SCRIPT_DIR / "transcripts"
PROFILES_DIR = SCRIPT_DIR / "profiles"
PROFILES_DIR.mkdir(exist_ok=True)

# Tickers we care about for the dashboard
TRACKED_TICKERS = [
    "BTC", "Bitcoin", "ETH", "Ethereum", "SOL", "Solana", "BNB",
    "XRP", "ADA", "Cardano", "DOGE", "Doge", "AVAX", "Avalanche",
    "ARB", "Arbitrum", "OP", "Optimism", "MATIC", "Polygon",
    "LINK", "Chainlink", "DOT", "Polkadot", "PEPE", "SHIB",
    "altcoin", "alt season", "memecoin", "DeFi", "ETF",
]

# Romanian + crypto stopwords for phrase extraction
STOPWORDS = set("""
si in la de pe pentru cu un o ca nu sau dar cred ca este sunt am ai
are avut fost va vor mai foarte putin mult mult peste sub din asta
acel acea asta asa atat se ce cum cand unde cine fac face fac am are
ne ma tu eu noi voi ei ele lor nostru nostri vostri va prea desi
te tot toata toate fie chiar deci insa pentru cred trebuie poate
oricum acum ieri azi maine luni marti miercuri joi vineri sambata
duminica ora ore minute secunde
the and or but in on at to from of for is are was were has have had
will would could should can may might do does did this that these those
not no yes well just like very much more less some any all
""".split())


def extract_words(text):
    text = text.lower()
    return re.findall(r"\b[a-zăâîșţţ]+\b", text)


def count_tickers(text):
    """Case-insensitive ticker frequency."""
    counts = {}
    upper_text = text.upper()
    for t in TRACKED_TICKERS:
        n = upper_text.count(t.upper())
        if n > 0:
            counts[t] = n
    return counts


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keep-raw", action="store_true",
                        help="Don't move raw .txt to profiles/ archive")
    args = parser.parse_args()

    # Build video metadata index from weekly JSONs
    video_meta = {}  # video_id -> dict
    for json_file in sorted(TRANSCRIPTS_DIR.glob("weekly_*.json")):
        try:
            data = json.loads(json_file.read_text(encoding="utf-8"))
        except Exception:
            continue
        videos = data if isinstance(data, list) else data.get("videos", [])
        for v in videos:
            vid = v.get("video_id") or v.get("id")
            if not vid or vid in video_meta:
                continue
            video_meta[vid] = {
                "video_id": vid,
                "channel": v.get("channel", "Unknown"),
                "title": v.get("title", ""),
                "published": v.get("published", ""),
                "url": v.get("url", f"https://www.youtube.com/watch?v={vid}"),
            }

    # Group transcripts by channel
    by_channel = defaultdict(list)
    orphan_count = 0
    for txt_file in sorted(TRANSCRIPTS_DIR.glob("*.txt")):
        vid = txt_file.stem
        meta = video_meta.get(vid)
        if not meta:
            orphan_count += 1
            continue
        try:
            text = txt_file.read_text(encoding="utf-8")
        except Exception:
            continue
        if len(text) < 50:
            continue
        meta["transcript"] = text
        meta["transcript_path"] = str(txt_file)
        by_channel[meta["channel"]].append(meta)

    print(f"Indexed {len(video_meta)} videos across {len(by_channel)} channels"
          f" ({orphan_count} orphan transcripts without metadata)")

    # Build profile per channel
    for channel, videos in by_channel.items():
        videos.sort(key=lambda v: v.get("published", ""))
        total_words = 0
        ticker_totals = Counter()
        per_video = []
        per_word_counter = Counter()

        for v in videos:
            text = v["transcript"]
            words = extract_words(text)
            total_words += len(words)
            for w in words:
                if w not in STOPWORDS and len(w) > 3:
                    per_word_counter[w] += 1
            tickers = count_tickers(text)
            ticker_totals.update(tickers)
            per_video.append({
                "video_id": v["video_id"],
                "title": v["title"],
                "published": v["published"],
                "url": v["url"],
                "word_count": len(words),
                "top_tickers": dict(Counter(tickers).most_common(5)),
            })

        if not per_video:
            continue

        profile = {
            "channel": channel,
            "total_videos": len(per_video),
            "total_words": total_words,
            "avg_words_per_video": total_words // len(per_video) if per_video else 0,
            "date_range": {
                "first": per_video[0]["published"],
                "last": per_video[-1]["published"],
            },
            "tickers_mentioned": dict(ticker_totals.most_common(20)),
            "top_words": dict(per_word_counter.most_common(40)),
            "videos": per_video,
        }

        out_path = PROFILES_DIR / f"{channel}.json"
        out_path.write_text(json.dumps(profile, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {channel}: {len(per_video)} videos, {total_words} words → {out_path.name}")

        # Move raw transcripts under profiles archive (or keep)
        if not args.keep_raw:
            archive_dir = PROFILES_DIR / channel
            archive_dir.mkdir(exist_ok=True)
            for v in videos:
                src = Path(v["transcript_path"])
                if src.exists():
                    src.rename(archive_dir / f"{v['video_id']}.txt")

    print("\nDone.")
    if not args.keep_raw:
        print(f"Raw transcripts moved to {PROFILES_DIR}/<channel>/")


if __name__ == "__main__":
    main()
