# Elite Platform — CLAUDE.md
# Last updated: 2026-05-05

You are the Elite Platform agent for app.armatadetraderi.com (Armata de Traderi). You handle the Next.js app, Supabase backend, payments, UI. **Never touch ~/trading-bot/ code.**

## ALEX
- 22yo Romanian solopreneur, non-coder, builds via AI
- 54 active Elite (67 Patreon). Goal 2026: 100 Elite
- Pricing €49/137/497 (vet €33/100/300). Trial: 7 days, global limit 1/day
- PFA opens ~Apr 29 2026 → Stripe live keys after that
- UI = Romanian with diacritics (ă â î ș ț). Code = English
- Concise replies (≤5 lines unless debugging). Telegram for comms

## STACK
Next.js 14 + TS + Tailwind · Supabase Auth + PG (project vyeouffsgdjoclblodmy, 20MB free tier, RLS on every table) · Vercel (auto-deploy from main) · Discord OAuth + bot · Payments: USDT/USDC Arbitrum auto + Binance Pay manual + Patreon · Stripe (test only until PFA) · R2 + YouTube for video · Resend (7 drip templates) · Recharts (Chart.js only for /dashboard/pivots) · GTM-PSXWCHS3 + GA4 + Meta Pixel + Plausible · Domain: armatadetraderi.com (landing) / app.armatadetraderi.com (member) · contact@armatadetraderi.com

## REPO LAYOUT (high-level — `ls` for details)
- `app/` — App Router. Public: `/`, `/upgrade`, `/track-record`, legal. Auth: `/login`, `/signup`. Member: `/dashboard/*`. Tools: `/tools/whale-tracker`. Admin: `/admin/*`. APIs: `/api/*` with explicit elite/admin gates
- `components/` — `layout/` (Navbar w/ ⌘K, Footer), `dashboard/`, `ui/` (command-search, blur-guard, feedback-button), `marketing/`, `upgrade/`
- `lib/` — `auth/elite-gate.ts`, `supabase/server.ts`, `payments/stripe.ts`, `discord/server.ts`, `data/*` (hardcoded research data)
- `scripts/` — Python daemons + crons (whale_tracker/, youtube-countertrade/, v2/, sync_*, patreon_sync, arb_payment_monitor, discord_role_bot, alexs_brain_bot)
- `supabase/migrations/` — DDL (24 migrations as of 2026-05-05)

## DB TABLES (26, ~20MB)
Core: `profiles` (role, subscription_*, is_veteran, discord_user_id, trial_used_at) · `payments` · `subscriptions` · `videos` (68, tier-gated, R2/YT) · `invite_links` · `platform_config` (global trial state) · `email_drip_queue` (7 templates)
Whale (RLS admin full / elite SELECT, plus `whale_favorites` user-scoped): `whale_wallets`, `whale_positions(_history)`, `whale_fills` (tid dedup), `whale_pnl_daily`, `whale_consensus`, `whale_churn_log`, `whale_favorites`
Other: `trading_data` (risk_score / risk_score_v2 / macro_dashboard) · `macro_metrics` · `leads` · `feedback` · `rate_limits` · `discord_drip_queue`

## CRONS + DAEMONS
Run `crontab -l` for the truth. Roughly: hourly cron-expire, every 5min sync_trading_data + sync_track_record + cron-send-emails, every 30min whale fills+consensus, every 6h patreon_sync, every 8h risk_score_v2, weekly Mon 07:00 fetch_top_wallets, daily 06:15 fetch_pnl_history, daily 06:05 whale daily_digest → Discord, daily 12:05 youtube-countertrade.
Always-on launchd daemons: `arb_payment_monitor`, `discord_role_bot` (also handles drip DMs — `discord_drip_sender` plist is disabled), `alexs_brain_bot`.

## DESIGN SYSTEM (HARD RULE)
**Always invoke the `page-design-system` skill before any UI/page/dashboard work.** It enforces theme + mobile (375px) + fonts + animations + Romanian diacritics + the 7 non-negotiables. Quick reminders:
- bg `crypto-dark` #09090B · accent `accent-emerald` #10B981 · cards `glass-card` (never raw bg-white/5)
- General Sans (Fontshare 400/500/600/700 only — **never `font-black`**). Numbers: `font-data`/`font-mono` + `tabular-nums`
- Shared CSS: `card-hover`, `animate-fade-in-up`, `live-dot`, `price-flash`, `skeleton` (use these before reaching for Framer Motion)
- Mobile-first: every page works at 375px, tap targets ≥44px, no horizontal scroll
- No em dashes anywhere user-facing (period/comma/colon/hyphen instead)
- Romanian with full diacritics — never ASCII Romanian

## KEY FEATURES (so you don't break them)
- ⌘K universal command search (CommandSearchTrigger in navbar)
- `?blur=1` Presentation Mode on Stocks/Crypto: blurs zones+signals (and RSI on crypto) for YouTube recordings; CTA → /upgrade
- Price flash green/red on auto-refresh, live "Xm ago" countdowns, skeleton loaders on data pages
- RSI weekly heatmap (Yahoo) on crypto, Fibonacci zones from cycle peaks/lows, partial-fill aggregation in whale activity feed

## CODING RULES
- Never touch `~/trading-bot/`
- `npm run build` must pass before push (pre-push hook also type-checks HEAD)
- Always verify Vercel deploy after push (`vercel ls elite-platform`) — local green ≠ production green
- Supabase: client from `@supabase/ssr`, RLS on every table, select explicit columns (no `select("*")`), admin routes verify `profile.role === "admin"`, sensitive APIs gated via `hasEliteAccess(profile)` from `lib/auth/elite-gate.ts`
- Romanian with diacritics in all UI/email copy

## COMMUNICATION
1. Long message → "Recepționat, lucrez." + time estimate
2. Task >2 min → progress pings on Telegram
3. End of response → show PENDING tasks

## CURRENTLY ADMIN-ONLY (Coming Soon for members)
`/dashboard/pivots`, `/dashboard/countertrade`, `/bots/*`

## POST-PFA (after Apr 29)
Stripe live keys → card payments · CUI in footer (placeholder now) · MEXC copytrade onboarding (stays Coming Soon)

## SISTER PROJECTS (different repos — referenced for context, don't conflate)
- `~/Playground/email-automation/` — Cristian Chifoi newsletter. Rules: Romanian + diacritics, first person, no em dashes, no englezisme, conversational ("Ahoy!", anti-FOMO), one idea per email, DOCX → Google Drive
- `~/alexs-brain/` — Educational Discord bot. Romanian only, calm/conservative tone, runs in tmux `alexs-brain`. **Never modify `SOUL.md` or `METHODOLOGY.md` without Alex's approval. Never reveal it's AI-powered.**
