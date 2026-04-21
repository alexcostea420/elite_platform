# Contrarian Crypto Signal System - Complete Guide

## What This System Does

This system monitors 11 Romanian crypto YouTube channels, extracts what influencers are saying about the market, scores their sentiment, and generates **contrarian trading signals** - the logic being that when retail YouTubers reach strong consensus, the market usually moves the opposite way.

It runs daily at 12:05 PM via Claude Code's scheduled tasks and delivers a formatted report to your personal Telegram.

---

## Architecture

```
Every day at 12:05 PM, the scheduled task runs this flow:

1. fetch_transcripts.py
   |  Checks YouTube RSS feeds for all 11 channels
   |  Pulls transcripts (Romanian/English) via youtube-transcript-api
   |  Falls back to yt-dlp if primary method is blocked
   |  Caches all transcripts locally so they're never re-fetched
   |  Output: transcripts/weekly_YYYY-MM-DD.json
   v
2. accuracy_tracker.py
   |  Checks if previous PENDING signals resolved
   |  LONG signal: CORRECT if BTC rose 5%, INCORRECT if dropped 10%
   |  SHORT signal: CORRECT if BTC dropped 5%, INCORRECT if rose 10%
   |  Updates signal_log.jsonl with outcomes
   v
3. price_tracker.py
   |  Fetches current BTC/ETH prices from CoinGecko API (free, no key)
   |  Stores daily snapshot in price_history.json
   v
4. sentiment_tracker.py compare
   |  Gets previous run's per-channel scores for trend arrows (up/down/flat)
   v
5. Claude Code reads the transcripts JSON
   |  Analyzes each video: narrative, claims, price targets, sentiment
   |  Scores each channel 1-100 (1=extremely bearish, 100=extremely bullish)
   |  Extracts cross-channel consensus (direction + strength)
   |  Generates contrarian signal by inverting the consensus
   v
6. signal_flip.py
   |  Compares new signal direction vs previous
   |  Alerts if direction flipped (e.g., BULLISH -> BEARISH)
   v
7. send_telegram.py
   |  Delivers compact report to your Telegram
   |  Splits long messages into 4096-char chunks (Telegram limit)
   v
8. sentiment_tracker.py record
   |  Saves today's per-channel scores to sentiment_history.json
   |  This builds the historical dataset for the dashboard chart
   v
9. fear_greed.py
   |  Fetches Bitcoin Fear & Greed Index from alternative.me (free)
   |  Value 0-100: 0=Extreme Fear, 100=Extreme Greed
   v
10. generate_dashboard.py
    |  Rebuilds dashboard.html with all updated data
    |  Charts: sentiment vs BTC price, channel heatmap, F&G overlay
    |  Output: dashboard.html (open in any browser)
```

---

## Files Explained (10 Python scripts)

### Core Pipeline

**fetch_transcripts.py** (fetches data)
- Reads channel list from channels.py
- Hits YouTube RSS feeds: `youtube.com/feeds/videos.xml?channel_id=UC...`
- For each video from the last 24 hours, extracts the transcript
- Primary method: `youtube-transcript-api` (fast, no download)
- Fallback: `yt-dlp` with `--impersonate chrome` (slower, works when API is blocked)
- Caches every transcript as `transcripts/{video_id}.txt` - never re-fetches
- Output: `transcripts/weekly_YYYY-MM-DD.json` with all video data + transcripts

**send_telegram.py** (delivers reports)
- Reads text from: `--text "..."` argument, a file path, or stdin
- Sends via Telegram Bot API: `api.telegram.org/bot{TOKEN}/sendMessage`
- Auto-splits messages over 4096 chars at newline boundaries
- Requires: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env

**channels.py** (channel registry)
- Dictionary of 11 channels with:
  - `handle`: YouTube @handle
  - `url`: Full channel URL
  - `channel_id`: The `UC...` ID needed for RSS feeds
- Current channels: CryptoAce, DanielMihaiCrypto, DanielNitaCrypto, MrCrypto5, AltcoinBro, StoeanStefan, BlockchainRomania, ABCryptoRomania, CristianChifoi, StoicaVlad, CryptoVineri

**prompts.py** (analysis instructions)
- Contains the system prompt that defines how Claude should analyze transcripts
- Kept as reference - the actual analysis is done by Claude Code's scheduled task
- Defines the 4-phase process: per-video summary -> consensus extraction -> signal generation -> log entry

### Tracking & Analytics

**sentiment_tracker.py** (per-channel scores over time)
- Commands: `record`, `compare`, `history`
- `record`: Saves a JSON entry with date, BTC/ETH prices, and per-channel scores (1-100)
- `compare`: Returns current vs previous run with trend arrows (up/down/flat, 6-point threshold)
- Stores in: `sentiment_history.json`

**price_tracker.py** (BTC/ETH price history)
- Commands: `fetch` (default), `backfill N`, `history`
- `fetch`: Gets current prices from CoinGecko, stores in price_history.json
- `backfill 30`: Fills last 30 days of historical prices
- API: CoinGecko free tier (no API key, rate limited)
- Stores in: `price_history.json`

**fear_greed.py** (market fear indicator)
- Commands: `current` (default), `history`
- Fetches Bitcoin Fear & Greed Index from alternative.me API
- Scale: 0 = Extreme Fear, 25 = Fear, 50 = Neutral, 75 = Greed, 100 = Extreme Greed
- Used as additional confirmation for contrarian signals

**accuracy_tracker.py** (signal win/loss tracking)
- Commands: `evaluate` (default), `stats`
- Reads signal_log.jsonl, checks PENDING signals against current BTC price
- LONG signal: CORRECT if BTC rose 5%+, INCORRECT if dropped 10%+
- SHORT signal: CORRECT if BTC dropped 5%+, INCORRECT if rose 10%+
- Asymmetric thresholds: winning requires less movement than losing (realistic)
- Updates signal_log.jsonl with outcome, outcome_btc, outcome_date, outcome_pct

**signal_flip.py** (direction change detector)
- Compares the last two signals in signal_log.jsonl
- If direction changed (BULLISH->BEARISH or vice versa), returns flip info
- Skips "titles_only" entries (lower quality signals)
- Used to prepend a "SIGNAL FLIP" alert to the Telegram message

### Visualization

**generate_dashboard.py** (interactive charts)
- Reads: sentiment_history.json, price_history.json, signal_log.jsonl, Fear & Greed API
- Generates: dashboard.html with Chart.js
- Charts included:
  - Dual-axis line: Average sentiment score (left) vs BTC price (right)
  - Per-channel sentiment heatmap over time
  - Fear & Greed overlay
  - Signal history with correct/incorrect markers
  - Win rate statistics
- Open dashboard.html in any browser to view

---

## Data Files

| File | Format | What It Stores |
|------|--------|----------------|
| `transcripts/{id}.txt` | Plain text | Cached video transcripts (never re-fetched) |
| `transcripts/weekly_YYYY-MM-DD.json` | JSON | Daily fetch output with all videos + transcripts |
| `reports/report_YYYY-MM-DD.txt` | Plain text | Full daily analysis report (all phases) |
| `sentiment_history.json` | JSON array | Per-channel scores + BTC/ETH price per run date |
| `price_history.json` | JSON array | Daily BTC/ETH price snapshots |
| `signal_log.jsonl` | JSONL | Signal entries with direction, prices, outcomes |
| `fetch.log` | Log | Transcript fetch logs (errors, successes) |

---

## Configuration

**.env** (2 secrets)
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_BotFather
TELEGRAM_CHAT_ID=your_numeric_telegram_user_id
```

**No other API keys needed.** YouTube transcripts, CoinGecko prices, and Fear & Greed are all free/keyless. The Claude analysis is done by Claude Code itself (no Anthropic API key).

---

## Dependencies

```
youtube-transcript-api>=1.2.0   # pulls YouTube transcripts without API key
requests>=2.31.0                # HTTP calls (Telegram, CoinGecko, Fear&Greed)
feedparser>=6.0.0               # parses YouTube RSS/Atom feeds
python-dotenv>=1.0.0            # loads .env file
```

Optional: `yt-dlp` (installed via `pip install yt-dlp` or `brew install yt-dlp`) - used as fallback when youtube-transcript-api is blocked.

---

## How the Contrarian Logic Works

1. **Collect**: Pull transcripts from all 11 Romanian crypto YouTubers
2. **Score**: Each channel gets a sentiment score 1-100 (1=very bearish, 100=very bullish)
3. **Consensus**: If 3+ channels agree on direction = STRONG consensus
4. **Invert**:
   - YouTubers are STRONGLY BULLISH -> our signal is SHORT (bearish)
   - YouTubers are STRONGLY BEARISH -> our signal is LONG (bullish)
   - Mixed/weak consensus -> NO SIGNAL (sit out)
5. **Track**: Every signal is logged with the BTC price at the time
6. **Validate**: accuracy_tracker.py auto-checks if past signals were correct

The thesis: retail crypto influencers tend to be loudest at extremes. When they all agree the market is going up, it often reverses. When they all panic, it often bounces.

---

## Scheduled Task

The system runs as a Claude Code scheduled task:
- **Task ID**: `youtube-countertrade-weekly`
- **Schedule**: Daily at 12:05 PM local time
- **Cron**: `3 12 * * *`
- **Requires**: Claude Code running + Mac awake at trigger time

The task prompt (in `~/.claude/scheduled-tasks/youtube-countertrade-weekly/SKILL.md`) orchestrates all 10 steps above.

---

## Mac Mini Setup Instructions

To move this to a Mac Mini that runs 24/7:

### 1. Copy the project
```bash
# On your current Mac, create a zip of the clean project:
cd /Users/alex/Documents
zip -r youtube-countertrade-export.zip youtube-countertrade/ \
  -x "youtube-countertrade/venv/*" \
  -x "youtube-countertrade/__pycache__/*"

# Transfer to Mac Mini (via AirDrop, scp, USB, etc.)
```

### 2. On the Mac Mini
```bash
# Extract
cd ~/Documents
unzip youtube-countertrade-export.zip

# Create Python venv
cd youtube-countertrade
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install yt-dlp  # optional fallback

# Verify .env has your Telegram credentials
cat .env
```

### 3. Install Claude Code on Mac Mini
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Or download the desktop app from claude.ai/code
```

### 4. Set up the scheduled task
Open Claude Code on the Mac Mini in the project directory:
```bash
cd ~/Documents/youtube-countertrade
claude
```

Then ask Claude to create the scheduled task (copy the SKILL.md content from your current setup).

### 5. Prevent Mac Mini from sleeping
System Settings -> Energy Saver -> Prevent automatic sleeping when the display is off: ON

### 6. For the website private section
The `dashboard.html` file is a self-contained static HTML file. To serve it on your website:
- Copy `dashboard.html` to your web server's private section
- The dashboard reads data embedded at generation time, so it needs to be regenerated daily
- Option A: After each run, `scp dashboard.html` to your web server
- Option B: Serve the project directory directly via nginx/apache with auth
- Option C: Set up a simple Python HTTP server with basic auth on the Mac Mini

---

## Telegram Message Format

Each daily report looks like:

```
CONTRARIAN SIGNAL — 2026-04-04

SENTIMENT SCORES (1=bearish, 100=bullish):
DanielMihaiCrypto:  25 ↓
DanielNitaCrypto:   15 →
MrCrypto5:          30 ↑
AltcoinBro:         20 ↓
StoeanStefan:       10 →
BlockchainRomania:  25 ↑
ABCryptoRomania:    20 →
CristianChifoi:     35 ↓
StoicaVlad:         -- (no video)
CryptoVineri:       -- (no video)
AVG: 22/100

WHAT YOUTUBE IS SAYING:
Most Romanian crypto influencers are bearish, citing war risks,
recession probability, and Fear & Greed at extreme fear levels.

WHAT WE DO (OPPOSITE):
Signal: LONG
Confidence: HIGH
Why: Strong bearish consensus + extreme fear = historically reliable buy zone

TRADE LEVELS (BTC):
Buy zone: 78,000 USD to 82,000 USD
Target 1: 92,000 USD
Target 2: 98,000 USD
Stop loss: 74,000 USD

PRICES NOW: BTC 84,249 USD | ETH 2,162 USD

RISKS:
- War escalation could push to 62,000 USD briefly
- Trump tweets cause 3,000 USD swings
- Rate hike if oil stays elevated

Channels: 11 | Videos: 32 | Consensus: BEARISH STRONG
```

---

## Scoring System Explained

Each channel gets a score from 1 to 100 after Claude reads their video transcripts:
- **1-20**: Very bearish (predicting crashes, telling people to sell)
- **21-40**: Bearish (cautious, warning about risks)
- **41-60**: Neutral (mixed signals, no clear direction)
- **61-80**: Bullish (optimistic, telling people to buy)
- **81-100**: Very bullish (euphoric, predicting moon, FOMO-inducing)

The **average score** drives the contrarian signal:
- AVG below 30 with 3+ channels agreeing = STRONG bearish consensus = our signal is LONG
- AVG above 70 with 3+ channels agreeing = STRONG bullish consensus = our signal is SHORT
- AVG 30-70 or mixed = weak consensus = NO SIGNAL

Scores are tracked historically so you can see how each channel's sentiment evolves alongside price.
