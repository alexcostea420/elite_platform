#!/usr/bin/env python3
"""
Update video metadata: fetch YouTube durations and generate summaries.
Uses YouTube oEmbed (no API key) for basic info.
"""

import json
import re
import sys
import urllib.request
import urllib.error
import time
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def get_videos(env):
    """Fetch all videos from Supabase."""
    url = env["NEXT_PUBLIC_SUPABASE_URL"]
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        f"{url}/rest/v1/videos?select=id,youtube_id,title,category,duration_seconds,summary,tags&is_published=eq.true&order=upload_date.desc",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())


def update_video(env, video_id, updates):
    """Update a video in Supabase."""
    url = env["NEXT_PUBLIC_SUPABASE_URL"]
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    payload = json.dumps(updates).encode()
    req = urllib.request.Request(
        f"{url}/rest/v1/videos?id=eq.{video_id}",
        data=payload,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return resp.status


def generate_summary(title, category):
    """Generate a simple summary from title and category."""
    # Pattern-based summary generation
    title_lower = title.lower()

    if "update" in title_lower or "btc" in title_lower and "eth" in title_lower:
        return f"Analiza tehnica si update de piata: {title}. Niveluri cheie, structura de pret si scenarii pentru urmatoarea perioada."
    elif "bottom" in title_lower or "bounce" in title_lower:
        return f"Analiza zonelor de suport si potential reversal: {title}. Identificarea nivelurilor unde pretul ar putea sa se intoarca."
    elif "indicator" in title_lower or "elite" in title_lower:
        return f"Tutorial despre indicatorii Elite si cum sa ii folosesti in analiza ta zilnica. Setari, interpretare si exemple practice."
    elif "fibonacci" in title_lower or "fib" in title_lower:
        return f"Analiza Fibonacci si niveluri cheie: {title}. Cum sa identifici zone de interes folosind retrageri si extensii."
    elif "risk" in title_lower or "management" in title_lower:
        return f"Reguli de risk management si lot sizing: {title}. Cum sa iti protejezi capitalul si sa cresti consistent."
    elif "dca" in title_lower or "acumulare" in title_lower:
        return f"Strategie de acumulare si DCA: {title}. Cum sa cumperi inteligent in piata bear."
    elif "bear" in title_lower or "short" in title_lower:
        return f"Analiza bear market si strategii de protectie: {title}. Ce sa faci cand piata scade."
    elif "sesiune" in title_lower or "live" in title_lower:
        return f"Sesiune live de trading si analiza de piata. Intrebari, raspunsuri si analize in timp real cu Alex Costea."
    elif "lot" in title_lower or "size" in title_lower:
        return f"Tutorial lot sizing si position sizing: {title}. Cum sa calculezi marimea pozitiei pentru fiecare trade."
    else:
        return f"Analiza de piata si educatie trading: {title}. Strategii, niveluri si context pentru decizii informate."


def generate_tags(title, category):
    """Generate tags from title and category."""
    tags = []
    title_lower = title.lower()

    if category:
        tags.append(category)

    if "btc" in title_lower or "bitcoin" in title_lower:
        tags.append("BTC")
    if "eth" in title_lower or "ethereum" in title_lower:
        tags.append("ETH")
    if "alts" in title_lower or "altcoin" in title_lower:
        tags.append("Altcoins")
    if "update" in title_lower:
        tags.append("Update")
    if "indicator" in title_lower or "elite" in title_lower:
        tags.append("Indicatori")
    if "fibonacci" in title_lower or "fib" in title_lower:
        tags.append("Fibonacci")
    if "risk" in title_lower or "management" in title_lower:
        tags.append("Risk Management")
    if "lot" in title_lower or "size" in title_lower:
        tags.append("Lot Sizing")
    if "dca" in title_lower:
        tags.append("DCA")
    if "bear" in title_lower:
        tags.append("Bear Market")
    if "bounce" in title_lower or "bottom" in title_lower:
        tags.append("Bottom")
    if "live" in title_lower or "sesiune" in title_lower:
        tags.append("Live")

    # Ensure at least one tag
    if not tags:
        tags.append("Analiza")

    return list(set(tags))[:5]  # Max 5 unique tags


def main():
    env = load_env()
    videos = get_videos(env)
    print(f"[INFO] {len(videos)} videos found")

    updated = 0
    for i, video in enumerate(videos):
        vid = video["youtube_id"]
        updates = {}

        # Generate summary if missing
        if not video.get("summary"):
            summary = generate_summary(video["title"], video.get("category", ""))
            updates["summary"] = summary

        # Generate tags if missing/empty
        if not video.get("tags") or len(video.get("tags", [])) == 0:
            tags = generate_tags(video["title"], video.get("category", ""))
            updates["tags"] = tags

        if updates:
            status = update_video(env, video["id"], updates)
            print(f"  [{i+1}/{len(videos)}] {vid}: updated ({', '.join(updates.keys())})")
            updated += 1
            time.sleep(0.05)  # Rate limit
        else:
            print(f"  [{i+1}/{len(videos)}] {vid}: already has data")

    print(f"\n[INFO] Updated {updated} videos")


if __name__ == "__main__":
    main()
