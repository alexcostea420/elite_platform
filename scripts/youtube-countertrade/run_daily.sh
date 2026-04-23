#!/bin/bash
# Daily countertrade pipeline - runs at 12:05 UTC
# 1. Fetch transcripts
# 2. Update prices + Fear & Greed
# 3. Claude Code analyzes transcripts and generates report

set -e
cd "$(dirname "$0")"

DATE=$(date -u +%Y-%m-%d)
LOG="logs/daily_${DATE}.log"
mkdir -p logs

echo "[$(date)] Starting daily countertrade pipeline..." >> "$LOG"

# Step 1: Fetch transcripts
python3 fetch_transcripts.py --days 2 >> "$LOG" 2>&1

# Step 2: Prices + Fear & Greed
python3 price_tracker.py >> "$LOG" 2>&1
python3 fear_greed.py >> "$LOG" 2>&1

# Step 3: Check previous signal outcomes
python3 accuracy_tracker.py >> "$LOG" 2>&1 || true

# Step 4: Claude Code reads transcripts and generates analysis
TRANSCRIPT_FILE="transcripts/weekly_${DATE}.json"
if [ -f "$TRANSCRIPT_FILE" ]; then
  echo "[$(date)] Running Claude analysis..." >> "$LOG"
  claude -p "Read the file $(pwd)/${TRANSCRIPT_FILE} and the prompts in $(pwd)/prompts.py. Analyze the YouTube transcripts following the 4-phase process in the SYSTEM_PROMPT. Save the report to $(pwd)/reports/report_${DATE}.txt. Then update the sentiment_history.json using sentiment_tracker.py record with the per-channel scores. Also append the signal to signal_log.jsonl. Be concise." --allowedTools Read,Write,Bash >> "$LOG" 2>&1
else
  echo "[$(date)] No transcript file for today, skipping analysis." >> "$LOG"
fi

# Step 5: Check for signal flip
python3 signal_flip.py >> "$LOG" 2>&1 || true

echo "[$(date)] Pipeline complete." >> "$LOG"
