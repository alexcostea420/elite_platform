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
