#!/usr/bin/env python3
"""
Generate clean Romanian summaries for the last N published videos.

Pipeline:
    local MP4 -> ffmpeg (16kHz wav) -> Whisper (Romanian) -> Gemini 2.5 (clean summary) -> Supabase videos.summary

Usage:
    python3 scripts/generate_video_summaries.py            # last 10 videos
    python3 scripts/generate_video_summaries.py --limit 5
    python3 scripts/generate_video_summaries.py --force    # re-summarize even if summary exists
    python3 scripts/generate_video_summaries.py --dry-run  # only print, no DB update
    python3 scripts/generate_video_summaries.py --video-id <youtube_id>
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VIDEOS_DIR = ROOT / "data" / "videos"
TRANSCRIPT_CACHE = ROOT / "data" / "transcript_cache"
TRANSCRIPT_CACHE.mkdir(parents=True, exist_ok=True)

# Load env
PAT = os.environ.get("SUPABASE_ACCESS_TOKEN")
PROJECT = os.environ.get("SUPABASE_PROJECT_REF")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

env_path = ROOT / ".env.local"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k == "SUPABASE_ACCESS_TOKEN" and not PAT: PAT = v
            elif k == "SUPABASE_PROJECT_REF" and not PROJECT: PROJECT = v
            elif k == "NEXT_PUBLIC_SUPABASE_URL" and not SUPABASE_URL: SUPABASE_URL = v
            elif k == "SUPABASE_SERVICE_ROLE_KEY" and not SERVICE_KEY: SERVICE_KEY = v
            elif k == "GEMINI_API_KEY" and not GEMINI_API_KEY: GEMINI_API_KEY = v

if not (PAT and PROJECT and SUPABASE_URL and SERVICE_KEY):
    sys.exit("Missing Supabase env (SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
if not GEMINI_API_KEY:
    sys.exit("Missing GEMINI_API_KEY (export from ~/.zshrc or set in .env.local)")

MGMT_API = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"
HEADERS_MGMT = {
    "Authorization": f"Bearer {PAT}",
    "Content-Type": "application/json",
    "User-Agent": "elite-platform-summary/1.0 (curl-compat)",
}


def run_sql(sql: str):
    req = urllib.request.Request(
        MGMT_API, data=json.dumps({"query": sql}).encode(), headers=HEADERS_MGMT, method="POST"
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def normalize_title(s: str) -> str:
    """Lowercase, strip diacritics + punctuation for fuzzy matching against MP4 filename."""
    s = s.lower()
    repl = {"ă": "a", "â": "a", "î": "i", "ș": "s", "ț": "t"}
    for a, b in repl.items():
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return s


def find_local_mp4(title: str) -> Path | None:
    norm = normalize_title(title)
    norm_words = set(norm.split())
    best, best_overlap = None, 0
    for mp4 in VIDEOS_DIR.glob("*.mp4"):
        f_norm = normalize_title(mp4.stem)
        f_words = set(f_norm.split())
        overlap = len(norm_words & f_words)
        if overlap > best_overlap:
            best, best_overlap = mp4, overlap
    if best_overlap >= 3:
        return best
    return None


def extract_audio(mp4: Path) -> Path:
    out = TRANSCRIPT_CACHE / f"{mp4.stem}.wav"
    if out.exists() and out.stat().st_size > 0:
        return out
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(mp4), "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(out)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return out


def transcribe(wav: Path) -> str:
    cache = TRANSCRIPT_CACHE / f"{wav.stem}.txt"
    if cache.exists() and cache.stat().st_size > 0:
        return cache.read_text()
    print(f"    transcribing (medium, ro)... this can take a few min", flush=True)
    import whisper  # type: ignore
    model = whisper.load_model("medium")
    result = model.transcribe(str(wav), language="ro", fp16=False)
    text = result["text"].strip()
    cache.write_text(text)
    return text


SUMMARY_PROMPT = """Ești editor pentru platforma românească de trading "Armata de Traderi". Ai mai jos transcrierea unui video. Scrie un rezumat util, concret, în română cu diacritice corecte (ă, â, î, ș, ț).

CONTEXT important (memorează):
- Alex și Cristian sunt cei doi traderi care țin video-urile. NU le inventa alte nume.
- "JDL" = "Jocul de Lichiditate" (cealaltă comunitate în care Alex apare, NU este a lui). Niciodată "Jurnalul de Lider".
- "Elite" / "Live Elite" = comunitatea proprie Armata de Traderi.
- Membrii sunt români, mulți începători. Scrie pentru ei: explică termenii când ai loc.

Reguli stricte:
- Fără em dash (—). NU folosi niciodată acest caracter. Înlocuiește cu punct, virgulă, două puncte sau cratimă scurtă (-).
- Fără hype: fără "ULTIMATE", "INCREDIBIL", "INSANE". Doar fapte din video.
- Fără promisiuni de profit, fără disclaimer.
- Începe direct cu conținutul. NU cu "Acest video discută...", "În acest live...", "Discuția s-a axat pe...".
- Limbaj clar, fără englezisme inutile.

Conținut (foarte important):
- Rezumatul TREBUIE să fie SPECIFIC, nu generic. Dacă în video se discută:
  - niveluri concrete (ex. BTC suport 70.000) → menționează-le
  - indicatori (RSI weekly, EMA 50, MACD) și valorile lor → menționează-le
  - setup-uri concrete (long pe ETH dacă rupe X, stop la Y) → descrie-le
  - evenimente macro (FOMC, CPI, NFP) → cum sunt așteptate să influențeze
- Dacă video-ul nu are conținut concret (e doar discuție generală), scrie un rezumat scurt și onest, fără să umfli.

Format output:
- 1 propoziție intro fără bullet (max 20 cuvinte).
- Linie goală.
- 3-5 bullet-uri "- " (cratimă + spațiu). Fiecare bullet: 1-2 propoziții, factual.
- Pentru highlight-uri folosește **text** (markdown bold). Maxim 1 bold/bullet, doar pentru ce e cu adevărat important.
- NU folosi *, •, titluri (##), tabele, cod.

TITLU video: {title}

Transcriere:
---
{transcript}
---

Rezumat:"""


def gemini_summarize(transcript: str, title: str = "") -> str:
    import google.generativeai as genai  # type: ignore
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
    # Truncate very long transcripts to ~50k chars (~12k tokens) - more than enough.
    safe = transcript[:50000]
    resp = model.generate_content(SUMMARY_PROMPT.format(transcript=safe, title=title))
    out = resp.text.strip()
    # Hard belt-and-suspenders: strip any em-dash that slipped through.
    out = out.replace("—", "-").replace("–", "-")
    return out


def update_summary(video_id: str, summary: str) -> None:
    # Use REST direct (faster, single op) via service role key
    url = f"{SUPABASE_URL}/rest/v1/videos?id=eq.{video_id}"
    req = urllib.request.Request(
        url,
        data=json.dumps({"summary": summary}).encode(),
        headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    urllib.request.urlopen(req, timeout=30).read()


def fetch_videos(limit: int, force: bool, only_id: str | None):
    if only_id:
        sql = f"SELECT id, youtube_id, title, summary FROM videos WHERE youtube_id = $${only_id}$$ LIMIT 1;"
    else:
        where = "is_published = true"
        if not force:
            where += " AND (summary IS NULL OR length(summary) < 50)"
        sql = f"SELECT id, youtube_id, title, summary FROM videos WHERE {where} ORDER BY upload_date DESC LIMIT {int(limit)};"
    return run_sql(sql)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--force", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--video-id", type=str)
    args = p.parse_args()

    videos = fetch_videos(args.limit, args.force, args.video_id)
    if not isinstance(videos, list):
        print(f"DB error: {videos}", file=sys.stderr)
        return 1
    if not videos:
        print("No videos to process.")
        return 0

    print(f"Processing {len(videos)} video(s)...")
    ok, missing, failed = 0, 0, 0
    for v in videos:
        title = v["title"]
        print(f"\n• {title}")
        mp4 = find_local_mp4(title)
        if not mp4:
            print("    ✗ no local MP4 match")
            missing += 1
            continue
        print(f"    file: {mp4.name} ({mp4.stat().st_size // (1024*1024)} MB)")
        try:
            wav = extract_audio(mp4)
            transcript = transcribe(wav)
            print(f"    transcript: {len(transcript)} chars")
            summary = gemini_summarize(transcript, title=v["title"])
            print(f"    summary preview:\n      {summary[:200]}...")
            if not args.dry_run:
                update_summary(v["id"], summary)
                print("    ✓ saved to DB")
            ok += 1
        except Exception as exc:
            print(f"    ✗ failed: {exc}")
            failed += 1

    print(f"\nDone. ok={ok} missing_mp4={missing} failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
