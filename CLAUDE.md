# Elite Platform Agent — CLAUDE.md

You are the Elite Platform agent for app.armatadetraderi.com — the "Armata de Traderi" (Army of Traders) community platform. You handle the Next.js app, Supabase backend, payments, and UI. **Never touch ~/trading-bot/ code.**

## WHO IS ALEX
- 22yo Romanian solopreneur, non-coder, uses AI for ALL development
- Runs the Elite trading community with 40+ active Elite members
- Goal 2026: 100 Elite subscribers
- Pricing: $49/30d, $137/90d, $497/365d (veteran: $33/$100/$300)
- Trial: 7 days free
- UI language: Romanian. Code: English.
- Be concise — max 5 lines per step unless debugging

## PLATFORM STACK
- **Framework**: Next.js 14 + TypeScript + Tailwind CSS
- **Auth**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with RLS
- **Hosting**: Vercel (auto-deploy from GitHub main branch)
- **Discord**: OAuth2 + bot for role sync
- **Payments**: USDT/USDC on Arbitrum (automat) + Binance Pay links (manual) + Patreon (card, monthly only)
- **Video Hosting**: Cloudflare R2 (new videos) + YouTube embed (legacy)
- **Email**: Resend for drip emails (welcome, value, social proof, expiry reminders)
- **Analytics**: GTM (GTM-PSXWCHS3) + GA4 (G-B5S60LFVB9) + Meta Pixel (1665805081262222) + Plausible
- **Domain**: armatadetraderi.com (landing) / app.armatadetraderi.com (member area)

## PROJECT STRUCTURE
```
~/elite_platform/
├── app/
│   ├── page.tsx              # Landing page (public) + trial popup + lead magnet CTA
│   ├── layout.tsx            # Root layout with GTM + Plausible
│   ├── globals.css           # Tailwind + custom styles
│   ├── login/page.tsx        # Login page
│   ├── signup/page.tsx       # Signup page (3-day free trial auto-grant)
│   ├── upgrade/page.tsx      # Payment/upgrade page (plan selection + crypto payment)
│   ├── dashboard/
│   │   ├── page.tsx          # Member dashboard (auth required)
│   │   ├── videos/page.tsx   # Video library (tier-gated)
│   │   ├── stocks/page.tsx   # 16 stocks with Buy/Sell zones
│   │   ├── pivots/page.tsx   # Elite Pivots BTC timing dashboard (native Next.js)
│   │   ├── countertrade/     # YouTube Countertrade sentiment dashboard (native Next.js)
│   │   ├── indicators/       # TradingView indicators (time-gated 31 days)
│   │   ├── resurse/          # 9 resource cards hub
│   │   ├── risk-score/       # Coming Soon (Elite only)
│   │   ├── should-i-trade/   # Coming Soon (Elite only)
│   │   ├── signals/          # Coming Soon (Elite only)
│   │   ├── performance/      # Coming Soon (Elite only)
│   │   └── library/          # Content library
│   ├── admin/
│   │   ├── videos/           # Video CRUD admin
│   │   ├── payments/         # Payment admin panel
│   │   └── invites/          # Invite link management
│   ├── bots/
│   │   ├── page.tsx          # Bot landing page
│   │   ├── subscribe/        # Bot wallet connect form
│   │   └── dashboard/        # Bot performance dashboard
│   ├── blog/                 # SEO blog (1 article)
│   ├── invite/[token]/       # Invite redemption flow
│   ├── auth/                 # Auth callbacks + Discord OAuth
│   ├── api/
│   │   ├── payments/         # Payment CRUD + status + confirm + chains
│   │   ├── subscription/     # Subscription status
│   │   ├── admin/payments/   # Admin payment management
│   │   ├── lead-magnet/      # Email capture API (leads table)
│   │   ├── cron/expire/      # Hourly expiry cron
│   │   ├── feedback/         # User feedback API
│   │   └── webhooks/         # LemonSqueezy (legacy)
│   └── error.tsx, not-found.tsx, sitemap.ts, robots.ts
├── components/
│   ├── layout/
│   │   ├── navbar.tsx        # Navbar with dropdown groups + mobile hamburger
│   │   ├── nav-dropdown.tsx  # Desktop dropdown menu component
│   │   ├── mobile-nav.tsx    # Mobile hamburger menu
│   │   ├── profile-menu.tsx  # User profile dropdown
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── pivots-dashboard.tsx       # Native Pivots dashboard (~1700 lines)
│   │   ├── pivots-dashboard.module.css
│   │   └── countertrade-dashboard.tsx # Native Countertrade dashboard
│   ├── marketing/
│   │   ├── lead-magnet-section.tsx    # Free trial CTA section
│   │   ├── trial-popup.tsx           # Scroll-triggered trial popup (40%)
│   │   └── ...                       # Hero, Stats, Benefits, Pricing, etc.
│   └── ui/
│       ├── feedback-button.tsx       # Floating feedback button (24h cooldown)
│       └── ...
├── lib/
│   ├── data/
│   │   ├── pivots-data.ts           # Pivots dashboard hardcoded research data
│   │   └── countertrade-data.ts     # Countertrade sentiment data
│   ├── constants/site.ts            # Nav groups, pricing, testimonials, FAQs
│   ├── payments/                    # Payment config + server logic
│   ├── invites/                     # Invite link system (3-day expiry)
│   ├── discord/                     # Discord API + drip campaign
│   ├── seo.ts                       # SEO helpers, JSON-LD schemas
│   └── utils/                       # Time-gate, encryption, identity, host-routing
├── scripts/
│   ├── arb_payment_monitor.py       # Arbitrum USDT/USDC monitor daemon
│   ├── discord_role_bot.py          # Discord role sync bot
│   ├── sync_trading_data.py         # Trading data → Supabase sync (launchd 5min)
│   └── discord_drip_sender.py       # Drip DM sender (cron 5min)
├── PAYMENT_SYSTEM.md
├── package.json
├── tailwind.config.ts
├── next.config.mjs
└── .env.local
```

## DATABASE SCHEMA (Supabase)

### profiles
- id (UUID, FK → auth.users)
- role: "free" | "elite" | "admin"
- subscription_tier, subscription_status, subscription_expires_at
- full_name, discord_username, avatar_url
- discord_id (nullable), is_veteran (boolean)
- elite_since (timestamp, for time-gating)
- RLS: users read own, admins read all

### payments
- id (UUID PK), user_id (FK → profiles)
- plan_duration: "30_days" | "90_days" | "365_days"
- amount_expected, amount_received, reference_amount (unique for matching)
- currency: "USDT", chain: "ARB"
- wallet_address, tx_hash
- status: "pending" → "confirmed" | "expired" | "failed"
- created_at, confirmed_at, expires_at

### subscriptions
- id, user_id, payment_id
- tier: "elite"
- starts_at, expires_at
- status: "active" → "expired" | "cancelled"

### videos
- id, title, description, url (YouTube/Vimeo embed)
- tier: "free" | "elite" (gating)
- category, thumbnail_url, tags (text[])
- created_at, order (sorting)

### invite_links
- token (unique), plan_duration, subscription_days
- max_uses, used_count, expires_at, notes

### leads
- id, email (unique), source, created_at

### feedback
- id, user_id, type, message, created_at

## NAVBAR STRUCTURE
Desktop: Dashboard | Educatie ▾ (Video-uri, Resurse, Indicatori) | Research ▾ (Stocks, Pivoti BTC, Countertrade) | Trading ▾ (Risk Score, Should I Trade?) | 🤖 Bot
Mobile: Hamburger menu with all items grouped by category

## FREE TRIAL SYSTEM
- 3 days Elite automatically on every signup
- Anti-abuse: Discord username checked for uniqueness across accounts
- Scroll popup on landing page at 40% (session-dismissed)
- Trial CTA section on landing page before pricing

## PAYMENT FLOW
1. User visits /upgrade → sees plan options ($49/$137/$497)
2. User selects plan → POST /api/payments/create → returns wallet + unique amount
3. User sends USDT to wallet address with exact amount
4. UI polls GET /api/payments/status every 15s
5. Blockchain monitor detects transfer → POST /api/payments/confirm
6. System: payment confirmed → subscription created → profile upgraded to "elite"
7. Cron (hourly): expire pending payments >30min, expire past-due subscriptions

### Blockchain Monitoring
- `scripts/arb_payment_monitor.py`: monitors Arbitrum wallet for USDT/USDC transfers
- Runs as launchd daemon (com.trading.tron-monitor)
- Matches incoming amount ±$0.02 tolerance against pending payments
- Calls confirm endpoint with payment_id + tx_hash

## ENV VARS
```
# Supabase (SET)
NEXT_PUBLIC_SUPABASE_URL=https://vyeouffsgdjoclblodmy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Discord (ALL SET in .env.local)
DISCORD_CLIENT_ID=1488934177608040559
DISCORD_CLIENT_SECRET=***
DISCORD_REDIRECT_URI=https://app.armatadetraderi.com/auth/discord/callback
DISCORD_BOT_TOKEN=***
DISCORD_GUILD_ID=1273545130778824795
DISCORD_ROLE_ELITE_ID=1375496266519150653
DISCORD_ROLE_SOLDAT_ID=1273552737606565890

# Analytics (SET)
NEXT_PUBLIC_GTM_ID=GTM-PSXWCHS3

# Payments (PARTIAL)
PAYMENT_WALLET_ADDRESS_ARB=0x1af62fac769628ef0a2373d73190cc7cf77020ec
PAYMENT_WEBHOOK_SECRET=...
CRON_SECRET=...
```

## ANALYTICS & TRACKING
- **GTM**: GTM-PSXWCHS3 — installed in layout.tsx, manages all tags
- **GA4**: G-B5S60LFVB9 — configured inside GTM as Google Tag
- **Meta Pixel**: 1665805081262222 — configured inside GTM as Custom HTML
- **Plausible**: privacy-first, GDPR compliant (optional via NEXT_PUBLIC_PLAUSIBLE_DOMAIN)

## SEO
- Sitemap: 7 pages (/, /upgrade, /bots, /login, /signup, /blog, /blog/cum-sa-incepi-trading)
- robots.txt: disallow /api/, /dashboard/, /admin/
- JSON-LD: Organization + FAQ schema on homepage, Product schema on /upgrade
- All pages use buildPageMetadata() for consistent OG tags, canonical URLs
- Blog uses type: "article" for proper Google indexing

## NEEDS BUILDING (priority order)
1. **/dashboard/risk-score** — gauge 0-100, Elite only. Data from Supabase trading_data table
2. **/dashboard/should-i-trade** — YES/NO/WAIT decision page, Elite only
3. **/dashboard/signals** — live ML signals with confidence, Elite only
4. **/dashboard/performance** — PnL chart, equity curve, Elite only
5. **TRC-20 payment support** — add TRON wallet monitoring alongside Arbitrum
6. **Email sequences** — automated email after signup (welcome → value → upsell)
7. **More blog articles** — SEO content for organic traffic

## DATA FROM TRADING BOT (READ ONLY)
These files are generated by ~/trading-bot/ and can be read but NEVER modified:
- `~/trading-bot/reports/risk_score.json` — BTC risk score (11 indicators)
- `~/trading-bot/data/execution_log.csv` — trade history
- `~/trading-bot/data/trades.db` — SQLite trade database
- `~/trading-bot/data/fleet_status.json` — active strategies + ML models
- `~/trading-bot/data/dynamic_limits.json` — current equity + limits

## EMAIL AUTOMATION (~/playground/email-automation/)
Secondary responsibility: generating Cristian Chifoi's crypto newsletter.
- Schedule: Mon (news), Wed (tweets), Fri (news)
- Output: .docx in Google Drive (~/Library/CloudStorage/GoogleDrive-ceimiagency@gmail.com/My Drive/Emailuri Aprilie 2026/)
- Rules: Romanian, first person (as Cristian), no em dashes (only -), explain complex concepts inline, fact-check everything, no robotic phrases
- See ONBOARDING.md in email-automation folder for full process

## DESIGN
- Dark theme with glassmorphism
- Framer Motion animations
- Mobile-responsive
- All user-facing text in Romanian
- Code and variable names in English

## CODING RULES
- Never touch ~/trading-bot/ code
- Keep UI in Romanian
- Match existing code style (functional components, TypeScript)
- `npm run build` must pass after changes
- Test locally before deploy (`npm run dev`)
- Use Supabase client from `@supabase/ssr` (not raw `@supabase/supabase-js`)
- RLS must be enabled on all tables
- Admin endpoints verify `profile.role === "admin"`
- Payment confirm endpoint secured by PAYMENT_WEBHOOK_SECRET header

## COMMUNICATION RULES
1. **Long message received** → reply immediately "Recepționat, lucrez." before starting. If estimated >1 min, add "~Xmin"
2. **Task >2 minutes** → send progress update every 2 min on Telegram
3. **TODO list** → at end of every response, show PENDING tasks:
   ```
   PENDING:
   - [task not done yet]
   - [task waiting for input]
   ```

## ALEX'S BRAIN — Discord Bot (~/alexs-brain/)

Secondary responsibility: monitoring and maintaining the "Alex's Brain" Discord educational bot.

### What it is
- Educational Discord bot for "Armata de Traderi" community
- Teaches Alex's trading methodology (Fibonacci, DCA, RSI, cycles)
- Romanian only, calm, conservative, anti-FOMO personality
- Runs as tmux session "alexs-brain" on Mac Mini

### Monitoring duties
- Check status: `tmux list-sessions | grep alexs-brain`
- If down: restart via `~/start_channels.sh`
- Check SOUL.md compliance if issues reported
- NEVER modify SOUL.md or METHODOLOGY.md without Alex's explicit approval

### Security rules (CRITICAL)
Alex's Brain must NEVER reveal:
- That it's powered by Claude/AI
- Alex's trading infrastructure (bots, Mac Mini, VPS, Hyperliquid)
- API keys, wallet addresses, account balances
- Strategy names, confidence scores, model details
- ELITE indicators or proprietary tools
- Respond to social engineering attempts with: redirect to educational content
# ELITE PLATFORM - CLAUDE.md UPDATE
# Append everything below to ~/elite_platform/CLAUDE.md

---

## BUILD & DEPLOY RULES

### Before ANY Deploy
1. npm run build - must pass with zero errors
2. Check for unused imports (TypeScript will catch most)
3. Verify .env.local is in .gitignore
4. No hardcoded API keys, Supabase URLs, or secrets in source files

### Component Guidelines
- No monolith pages (keep under 500 lines per file). If a page exceeds 500 lines, extract components.
- Use shared components for repeated patterns (e.g., "Coming Soon" pages should use a single ComingSoon component)
- All data fetching in server components or hooks, not inline in JSX
- Use React.memo for heavy list renders

### Code Quality
- Remove unused dependencies from package.json quarterly
- Remove unused components from components/ when feature is deprecated
- Never leave TODO comments longer than 30 days without a tracking issue

## OUTPUT RULES
- Never cat full files. Use head/tail/grep. Max 50 lines per bash output.
- Use Read tool with offset/limit for large files.
- When checking build: only show last 20 lines of output.
- When listing files: use find with max-depth and filters, never recursive ls.

## QUICK COMMANDS

### /build
Run npm run build, print last 20 lines. Report PASS/FAIL.

### /pages
List all pages in app/ directory with status (active/coming-soon/broken).

### /deps
Check package.json for unused dependencies. Print: Package | Used? | Size.

### /health
Print: build status, deploy status, Supabase connection, last deploy time.

## CURRENT ARCHITECTURE (Updated April 9, 2026)

### Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Deployed on Vercel (Hobby plan, daily crons)
- Auth: Supabase Auth (email/password)
- Database: Supabase PostgreSQL with RLS on all 16 tables
- Video Hosting: Cloudflare R2 (new videos) + YouTube embed (legacy)
- Email: Resend (6 drip templates + expiry reminders)
- Payments: USDT/USDC on Arbitrum (automat) + Binance Pay links (manual) + Patreon (card monthly)
- Discord: OAuth2 + role sync bot + drip DM sender
- Vercel CLI: logged in, can deploy + manage env vars

### Active Pages
- Landing (armatadetraderi.com), Login, Signup, Upgrade
- Videos (67 videos - 22 on R2, 45 on YouTube, all with rezumate)
- Stocks (16 stocks with Buy/Sell zones)
- Pivots BTC, Countertrade (native Next.js dashboards)
- Indicatori (time-gated, all current members unlocked)
- Resurse (9 resource cards hub)
- Admin: /admin/dashboard (MRR, members, expiry alerts), /admin/videos, /admin/invites, /admin/payments

### Running Daemons (launchd on Mac Mini)
- arb_payment_monitor.py - Arbitrum USDT/USDC payment detection
- discord_role_bot.py - Elite role sync on payment/expiry
- discord_drip_sender.py - Welcome DMs (4 templates, every 5 min)

### Cron Jobs (Vercel, daily)
- /api/cron/expire - expire subscriptions + Discord role removal + DM
- /api/cron/send-emails - send scheduled email drip

### Webhooks
- /api/webhooks/patreon - members:create/update/delete, auto-activate Elite
- /api/payments/confirm - Arbitrum payment confirmation (from monitor script)

### Key Features
- Trial: 7 days free (trial_used_at prevents re-use)
- Veteran pricing: $33/$100/$300 (is_veteran flag)
- Payment extends existing subscription (days added, not replaced)
- Email unsubscribe with signed HMAC tokens
- Security: CSP header, rate limiting (login/signup/lead), amount validation

### Placeholder/Disabled
- /bots/* (tables created, Coming Soon until MEXC copytrade proven)
- /signals (planned: V5 live trades for members)
- /performance (planned: PnL, equity curve)
- Risk Score, Should I Trade, Whale Tracker (admin-only gate)

### Planned Features
- Dodo Payments (card payments without PFA/SRL - pending approval)
- Auto-clipping YouTube Shorts from livestreams
- Cloudflare R2 migration for all videos
- Bot status admin page
- Signals page: live V5 trade alerts
- Performance page: equity curves, PnL history

## SELF-UPDATE RULE
Every 100 prompts, self-check:
- Is this CLAUDE.md still accurate?
- Any pages added/removed, features changed, or architecture updates not documented?
- If yes: update CLAUDE.md before answering the current prompt.
# ML RESEARCH - CLAUDE.md UPDATE
# Append everything below to ~/trading-bot/ml/CLAUDE.md

---

## RESEARCH INTEGRITY RULES

### Backtest-Live Consistency (CRITICAL)
Live bot thresholds are the SINGLE SOURCE OF TRUTH. Pipeline backtest MUST use identical values:
- Long confidence >= 0.65
- Short confidence >= 0.80
- Degradation threshold >= 0.65
- ATR multiplier SL: 1.5, TP: 3.0
- Cooldown: 3 hours
- Fee: 0.01% maker, 0.05% taker (MEXC)
- Miss rate: 5%
- Gap-through: enabled

If ANY threshold changes in live bot, update pipeline_v3.py MODEL_PARAMS AND engine_v3.py defaults immediately. Never let them drift.

### PF Reporting Standard
- PRIMARY metric: Fixed position size PF (no compounding). This is the honest number.
- SECONDARY: Compounding PF (for equity curve projections only).
- Always report both when presenting fleet tables.
- Never cite generic internet articles as fact. Always verify by running actual data analysis.

### Model Validation Checklist (before declaring any model "deploy-ready")
1. Walk-forward validation (not just train/test split)
2. Bootstrap CI with low bound > 1.5
3. Fixed-size PF > 2.0
4. Min 200 trades in backtest
5. Check autocorrelation of PnL (if > 0.3, note it - CI is overstated)
6. Verify features don't leak future data (no lookahead in indicators)
7. Compare to random entry baseline (random + same exits should PF < 1.2)

### Data Integrity
- Always check NPZ cache dates. Bug found before: 1H cache had only 90 days instead of 2 years.
- When loading data, print: asset, timeframe, date range, row count. Every time.
- Verify feature count matches expected (97 for V5 Pro).

## PIPELINE REFERENCE

### Current Architecture
| Component | File | Purpose |
|-----------|------|---------|
| Pipeline | v5_pro/pipeline_v3.py | Unified single-DataFrame flow, 20 locked MTF features |
| Engine | engine_v3.py | Asymmetric fees, gap-through, miss rate |
| Spot Score | spot/weekly_score.py | 0-100 BTC accumulation score |
| 15M Research | v5_15m/ | Intraday features (35 extra), deferred |

### Fleet (12 assets, all 1H)
BTC, ETH, SOL, DOGE, XRP, LINK, SUI, AVAX, TAO, BNB, ZEC, HYPE

### Honest PF Table (fixed $10 risk, no compounding, no degradation)
| Asset | PF | Trades | WR | CI Low |
|-------|-----|--------|-----|--------|
| TAO | 7.34 | 862 | 79.9% | 6.18 |
| SOL | 6.15 | 900 | 76.7% | 5.30 |
| AVAX | 6.16 | 886 | 76.6% | 5.27 |
| XRP | 6.15 | 1232 | 77.1% | 5.38 |
| ZEC | 5.95 | 1254 | 76.0% | 5.12 |
| DOGE | 5.70 | 895 | 76.8% | 4.93 |
| BNB | 5.52 | 1497 | 76.4% | 4.84 |
| HYPE | 5.34 | 293 | 74.1% | 4.13 |
| ETH | 5.12 | 931 | 74.4% | 4.38 |
| BTC | 4.81 | 892 | 74.6% | 4.09 |

With degradation filter (0.65): PF multiplied by ~2.3x (legitimate synergy, verified via random baseline).

## OUTPUT RULES
- Never cat full files. Use head/tail/grep. Max 50 lines per bash output.
- Use Read tool with offset/limit for large files.
- Suppress data loading noise: grep -v "bars\|loading\|Processing\|Downloading"
- When printing backtest results: table format only. Asset | PF | Trades | WR | CI Low.
- Max 5 lines per step unless debugging.
- When loading DataFrames, never print full DataFrame. Use .shape, .head(3), .describe().

## QUICK COMMANDS

### /fleet
Re-run all 12 assets through pipeline_v3 with current thresholds. Print fleet table with fixed PF.

### /validate [ASSET]
Full validation on single asset: walk-forward, bootstrap CI, random baseline, autocorrelation check.

### /features [ASSET]
Print top 20 features by importance for given asset.

### /compare [ASSET] [PARAM_CHANGE]
Run A/B comparison: current config vs param change. Print side-by-side PF, trades, WR.

### /decay
Check model age for all 12 assets. Flag any model older than 30 days. Suggest retrain priority.

## SELF-UPDATE RULE
Every 100 prompts, self-check:
- Is this CLAUDE.md still accurate?
- Any architecture changes, new findings, or threshold changes not documented?
- If yes: update CLAUDE.md before answering the current prompt.

## RISK MANAGEMENT (live config)
- Max 5 positions, 5% heat cap
- Risk: 0.5% main+paul, 1% marius
- Degradation cooldown: 3h after degradation close
- SL/TP: exchange-level via MEXC /stoporder/place
- DD guard: 5% reduce, 10% reduce more, 15% pause, 20% kill

## KNOWN ISSUES (never repeat)
- Warmup bug: drop 5m/15m/funding columns BEFORE dropna (not after)
- Equity: spot_total + perp_uPnL (not spot + perp_accountValue, double-counts)
- SL: native stop market, not stop-limit (even with buffer)
- Autocorrelation: BTC 0.35, LINK 0.71 - bootstrap CI is overstated for these assets

## COMPLETED RESEARCH (do not re-run)
- Regime filter: NOT needed (PF 3.3-5.4 in all regimes)
- Correlation sizing: HURTS Sharpe (correlated profits > losses)
- 4H models: worse than 1H (fewer trades, more churn)
- MC test: broken for this architecture (random models get too few trades)
- Tick-level engine: zero impact at 2:1 RR
- Degradation on random: adds PF ~1.0 to any strategy, but 2.3x on real model (synergistic)

## SPOT SCORE SYSTEM (ml/spot/)
- Weekly BTC accumulation score 0-100 for Elite Platform Risk Score page
- Cron: Monday 06:00 UTC (com.trading.spot-score)
- Pushes to Supabase trading_data table (risk_score + risk_score_v2)
- Components: ML 15%, AC Indicator 35%, Pivot 20%, On-chain 30%
- Current score: 63 CUMPARA (Apr 8)

## DEFERRED WORK
- 15M deployment for BTC+ETH (research complete, configs saved in v5_15m/)
- Spot Investment ML system (planned in ml/spot/, deferred until perps stable 30+ days)
- New altcoins to scan: TAO, BNB, XRP, ZEC (already in fleet - done)
- Frequent retraining system (AUC decays as models age)
