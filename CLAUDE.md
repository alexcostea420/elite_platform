# Elite Platform Agent — CLAUDE.md
# Last updated: 2026-04-23

You are the Elite Platform agent for app.armatadetraderi.com — the "Armata de Traderi" (Army of Traders) community platform. You handle the Next.js app, Supabase backend, payments, and UI. **Never touch ~/trading-bot/ code.**

## WHO IS ALEX
- 22yo Romanian solopreneur, non-coder, uses AI for ALL development
- Runs the Elite trading community with 54 active Elite members (67 Patreon patrons)
- Goal 2026: 100 Elite subscribers
- Pricing: €49/30d, €137/90d, €497/365d (veteran: €33/€100/€300)
- Trial: 7 days free, global limit 1 per day
- PFA opening ~April 29 2026, Stripe live keys after that
- UI language: Romanian with diacritics (ă, â, î, ș, ț). Code: English.
- Be concise — max 5 lines per step unless debugging
- Communicates via Telegram (plugin:telegram)

## PLATFORM STACK
- **Framework**: Next.js 14 + TypeScript + Tailwind CSS
- **Auth**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with RLS (project: vyeouffsgdjoclblodmy, free tier, 20MB/500MB)
- **Hosting**: Vercel (auto-deploy from GitHub main branch)
- **Discord**: OAuth2 + bot for role sync (temporarily can be buggy)
- **Payments**: USDT/USDC on Arbitrum (automat) + Binance Pay links (manual) + Patreon (card, monthly)
- **Stripe**: Test mode only (live keys after PFA April 29)
- **Video Hosting**: Cloudflare R2 (new videos) + YouTube embed (legacy)
- **Email**: Resend for drip emails (7 templates including patreon_welcome)
- **Charts**: Recharts (primary) + Chart.js (pivots dashboard only)
- **Analytics**: GTM (GTM-PSXWCHS3) + GA4 + Meta Pixel + Plausible
- **Domain**: armatadetraderi.com (landing) / app.armatadetraderi.com (member area)
- **Email contact**: contact@armatadetraderi.com (Cloudflare routing → Gmail)

## PROJECT STRUCTURE
```
~/elite_platform/
├── app/
│   ├── page.tsx              # Landing page (public)
│   ├── layout.tsx            # Root layout + GTM + CommandSearch
│   ├── globals.css           # Tailwind + price-flash, live-dot, skeleton, glass-card variants
│   ├── login/, signup/       # Auth pages
│   ├── upgrade/page.tsx      # Pricing (Elite plans + Copytrade Coming Soon bundle)
│   ├── track-record/         # Public live equity tracker + Discord timeline
│   ├── dashboard/
│   │   ├── page.tsx          # Member dashboard with onboarding steps
│   │   ├── videos/           # Video library (67 videos, tier-gated)
│   │   ├── stocks/           # 16 stocks: zones, 52W range, volume, PE, sectors, search
│   │   ├── crypto/           # 25 coins: Fib zones, RSI weekly, sparklines, tabs, search
│   │   ├── pivots/           # Pivots BTC timing research (admin-only, Coming Soon for members)
│   │   ├── countertrade/     # YouTube sentiment dashboard (admin-only)
│   │   ├── calendar/         # Economic Calendar (Forex Factory + Trading Economics)
│   │   ├── news/             # Live crypto news feed (RSS aggregation)
│   │   ├── macro/            # Macro Dashboard (21 metrics, regime detection)
│   │   ├── risk-score/       # Risk Score V2 with layer scores
│   │   ├── indicators/       # TradingView indicators (time-gated)
│   │   ├── resurse/          # 9 resource cards hub
│   │   ├── should-i-trade/   # Coming Soon
│   │   └── ask-alex/         # Alex's Brain Discord bot
│   ├── tools/
│   │   └── whale-tracker/    # Hyperliquid top 20 whales (elite-only)
│   ├── bots/                 # Bot landing (Coming Soon buttons)
│   ├── admin/                # Videos, payments, invites admin
│   ├── auth/discord/         # Discord OAuth callback
│   ├── api/
│   │   ├── whale-tracker/    # Whale data API (auth: elite-only)
│   │   ├── crypto/           # CoinGecko prices + /rsi (Yahoo Finance weekly)
│   │   ├── stocks/           # Finviz scraping + Yahoo sparklines
│   │   ├── news/             # RSS aggregation (5 sources)
│   │   ├── track-record/     # Live equity from JSON cache
│   │   ├── calendar/         # Forex Factory + Trading Economics
│   │   ├── payments/         # Payment CRUD + status + confirm + chains
│   │   ├── trial/            # Global daily trial (platform_config table)
│   │   ├── cron/             # expire + send-emails (hourly/5min via Vercel)
│   │   ├── webhooks/stripe/  # Stripe checkout.session.completed → activate Elite + Discord sync
│   │   └── webhooks/patreon/ # Patreon members:create/update/delete with dedup
│   ├── termeni/, confidentialitate/, rambursare/  # Legal pages
│   └── error.tsx, not-found.tsx, sitemap.ts, robots.ts
├── components/
│   ├── layout/               # Navbar (with CommandSearchTrigger), footer, nav-dropdown, mobile-nav
│   ├── dashboard/            # pivots-dashboard (1665 lines), countertrade-dashboard
│   ├── ui/
│   │   ├── command-search.tsx    # ⌘K universal search modal
│   │   ├── blur-guard.tsx        # Presentation mode (?blur=1) for YouTube recordings
│   │   └── feedback-button.tsx
│   ├── upgrade/              # StripePayButton, TrialActivateButton
│   └── marketing/            # Hero, stats, pricing, trial popup
├── lib/
│   ├── data/
│   │   ├── pivots-data.ts        # Pivots research data (hardcoded, 245 lines)
│   │   └── countertrade-data.ts  # Sentiment + signals + F&G (updated to Apr 21)
│   ├── constants/site.ts         # Nav groups, pricing, testimonials, FAQs
│   ├── payments/stripe.ts        # Stripe config (EUR plans)
│   ├── discord/server.ts         # Discord OAuth + role sync
│   └── utils/                    # Rate-limit, encryption, identity, host-routing
├── scripts/
│   ├── arb_payment_monitor.py    # Arbitrum USDT/USDC monitor daemon
│   ├── discord_role_bot.py       # Discord role sync bot
│   ├── discord_drip_sender.py    # Welcome DMs (launchd only, NOT crontab)
│   ├── sync_trading_data.py      # Trading data → Supabase (every 5min)
│   ├── sync_track_record.py      # trades.db → JSON cache (every 5min)
│   ├── patreon_sync.py           # Patreon → Supabase sync (every 6h)
│   ├── whale_tracker/            # Hyperliquid whale tracking (4 scripts)
│   │   ├── fetch_top_wallets.py      # Weekly: leaderboard → top 20
│   │   ├── fetch_positions_fills.py  # Every 30min: positions + fills (incremental)
│   │   ├── compute_consensus.py      # Every 30min: aggregate per asset
│   │   └── fetch_pnl_history.py      # Daily: PnL history from portfolio
│   ├── youtube-countertrade/     # YouTube sentiment pipeline (11 channels)
│   │   ├── fetch_transcripts.py      # RSS + youtube-transcript-api
│   │   ├── analyze_sentiment.py      # Claude API or Claude CLI analysis
│   │   ├── run_daily.sh              # Daily 12:05 UTC pipeline
│   │   ├── channels.py               # 11 Romanian crypto YouTube channels
│   │   └── prompts.py                # Contrarian signal extraction prompt
│   └── v2/                       # Risk score V2 + whale scanner
├── data/
│   └── track_record_cache.json   # Pre-computed from trades.db
└── supabase/migrations/          # 4 migration files
```

## DATABASE SCHEMA (26 tables, 20MB)

### Core Tables
- **profiles** — id, role (member/admin), subscription_tier/status/expires_at, is_veteran, elite_since, discord_user_id, trial_used_at
- **payments** — user_id, plan_duration, amount, currency, chain, status, tx_hash
- **subscriptions** — user_id, tier, starts_at, expires_at, status
- **videos** — 68 videos, tier-gated, tags, R2/YouTube URLs
- **invite_links** — token, plan_duration, max_uses, is_veteran_invite, notes
- **platform_config** — global trial availability (1 per day)
- **email_drip_queue** — template-based email system (7 templates)

### Whale Tracker Tables (RLS: admin full, elite SELECT)
- **whale_wallets** — top 20 by PnL, refreshed weekly
- **whale_positions** — current positions (is_current flag)
- **whale_positions_history** — snapshots (90-day retention)
- **whale_fills** — trades with tid dedup (incremental fetch)
- **whale_pnl_daily** — cumulative + daily PnL
- **whale_consensus** — per-asset long/short aggregation
- **whale_churn_log** — entered/exited top 20

### Other Tables
- **trading_data** — risk_score, risk_score_v2, macro_dashboard
- **macro_metrics** — 21 macro indicators time series
- **leads**, **feedback**, **rate_limits**, **discord_drip_queue**

## CRON JOBS (Mac Mini crontab)
```
# Vercel crons (via shell scripts calling curl)
0 * * * *     cron-expire (hourly)
*/5 * * * *   cron-send-emails (every 5min)

# Data sync
*/5 * * * *   sync_trading_data.py (trading bot → Supabase)
*/5 * * * *   sync_track_record.py (trades.db → JSON cache)
0 */6 * * *   patreon_sync.py (Patreon → platform)
0 */8 * * *   risk_score_v2 (every 8h)

# Whale Tracker
0 7 * * 1     fetch_top_wallets.py (weekly Monday)
*/30 * * * *  fetch_positions_fills.py + compute_consensus.py
15 6 * * *    fetch_pnl_history.py (daily)

# YouTube Countertrade
5 12 * * *    run_daily.sh (fetch + Claude analysis)

# Maintenance
0 3 * * 0     log rotation (truncate >1MB weekly)
```

## LAUNCHD DAEMONS (always running)
- arb_payment_monitor.py — Arbitrum USDT/USDC detection
- discord_role_bot.py — Elite role sync
- discord_drip_sender.py — Welcome DMs (launchd only, NOT crontab)

## KEY FEATURES
- **Presentation Mode**: ?blur=1 on Stocks/Crypto pages blurs zones+signals for YouTube recordings
- **⌘K Search**: Universal search across all pages/tools
- **Price Flash**: Green/red animations on price updates (60s auto-refresh)
- **Live Countdown**: "Xm ago" timestamps on data pages
- **Skeleton Loading**: Animated placeholders on all data pages
- **RSI Weekly**: Calculated from Yahoo Finance, color-coded heatmap
- **Fibonacci Zones**: Crypto Buy/Sell zones calculated from cycle peaks/lows
- **Whale Aggregation**: Partial fills combined in activity feed

## PRESENTATION MODE (?blur=1)
For YouTube recordings. Add ?blur=1 to URL:
- Stocks: blurs Buy/Sell zones + signal → "🔒 Elite Only" links to /upgrade
- Crypto: blurs RSI + zone range + signal
- Prices, sparklines, % remain visible (hook for viewers)

## DESIGN SYSTEM
- **Skill:** Use `page-design-system` skill before ANY UI/page/dashboard work — enforces theme + branding + layout + animations + fonts + sizes + mobile (375px) checklist. Mandatory pre-delivery walk-through.
- Background: #09090B (crypto-dark)
- Accent: #10B981 (emerald)
- Glass cards: `glass-card` class (never raw bg-white/5)
- Font: General Sans (Fontshare loads 400/500/600/700 only — **never use `font-black`**, max is `font-bold`). JetBrains Mono / `font-data` for numbers
- Animations: shared classes in globals.css (`card-hover`, `animate-fade-in-up`, `live-dot`, `price-flash`, `skeleton`). Framer Motion only for orchestrated/scroll/layout animations
- All numbers: `tabular-nums` + `font-mono` or `font-data`
- Mobile-first: every page must work at 375px (iPhone SE/mini) — no horizontal scroll, tap targets ≥44px

## CODING RULES
- Never touch ~/trading-bot/ code
- Keep UI in Romanian with diacritics (ă, â, î, ș, ț)
- `npm run build` must pass before deploy
- Use Supabase client from `@supabase/ssr`
- RLS enabled on all tables
- Admin endpoints verify `profile.role === "admin"`
- Select explicit columns (not select("*"))
- API routes that expose sensitive data MUST have auth checks

## COMMUNICATION RULES
1. **Long message received** → reply "Recepționat, lucrez." + time estimate
2. **Task >2 minutes** → progress updates on Telegram
3. **End of response** → show PENDING tasks

## CURRENTLY ADMIN-ONLY (not visible to members)
- /dashboard/pivots — Coming Soon for non-admin
- /dashboard/countertrade — Coming Soon for non-admin
- /bots/* — Coming Soon buttons

## UPCOMING (after PFA April 29)
- Stripe live keys → enable card payments
- CUI in footer (placeholder now)
- MEXC copytrade onboarding flow (stays Coming Soon)

## EMAIL AUTOMATION (~/Playground/email-automation/)
Cristian Chifoi newsletter. Rules:
- Romanian with diacritics, first person, no em dashes, no englezisme
- Conversational tone, Cristian's voice ("Ahoy!", "Ursul Hitler", anti-FOMO)
- One main idea per email, explain concepts inline
- DOCX output to Google Drive
- Prompt template available for Claude chat (no Claude Code needed)

## ALEX'S BRAIN — Discord Bot (~/alexs-brain/)
- Educational bot, Romanian only, calm/conservative personality
- Runs as tmux session "alexs-brain"
- NEVER modify SOUL.md or METHODOLOGY.md without Alex's approval
- NEVER reveal it's AI-powered
