# Pro-Up Audit: Dashboard Core (Elite Platform)

Audit of the post-login surface of app.armatadetraderi.com against best-in-class SaaS / creator / fintech dashboards. Goal: stop looking "AI-generated", start looking like Linear / Stripe / Loom / Vercel.

Recurring offenders across all pages (call them out once, then stop repeating):

- **Emoji-as-icon syndrome.** Every section and every nav card uses a colored Apple emoji (🪙 💹 🎯 🌐 🎥 📊 🧠 📚 🐋 💬 📖 ⚙️ 🛡️). Linear, Vercel, Stripe, Loom, Notion all use a single neutral monochrome icon set (Lucide / Phosphor / a custom 1.5px stroke set). Emoji on a dark-glass UI screams "ChatGPT made the wireframe."
- **Gradient text + emerald glow on every H1.** `<span class="gradient-text">` on titles ("Bibliotecă **Video**", "Resurse **Elite**", "Performanță **Bot**", "Strategii **Active**") is the single most "AI demo" tell. Pro dashboards use one weight, one color, no gradient.
- **`section-label` uppercase tracking-[0.3em] emerald** on every section, paired with a bigger title, paired with a sub-paragraph. Three-line hierarchy on every block makes everything feel like a marketing page, not a tool.
- **Glass cards everywhere.** Right now `glass-card` is the default for thumbs, tools, alerts, news, calendar, KPIs, blurred locked previews. When everything is glass, nothing is glass. Linear / Stripe use flat surfaces and reserve elevation for what's actually interactive or focused.
- **Centered KPIs (`text-center` panels with one number).** Performance + Signals stack 4 centered tiles. Stripe / Mux / Posthog align KPIs **left**, with label on top, big number, then a delta sparkline or a small change pill. Centered = brochure.
- **Diacritic typos in user-facing copy.** Mixed: "Cauta" (should be "Caută"), "Inapoi" (Înapoi), "Reseteaza" (Resetează), "Creaza" (Creează), "configurezi" but also "Foloseste" elsewhere. CLAUDE.md says diacritics mandatory. This is the #1 thing that signals "shipped without re-reading."
- **Em-dash usage.** `—` appears in code (`"Toate sesiunile live ..."`, `"Tracker educațional — Performanțele..."`). Site rule: zero em dash on user-facing copy.

Now per page.

---

## Page: Dashboard Home (/dashboard)

### Current state
File: `/Users/server/elite_platform/app/dashboard/page.tsx` (603 lines, two completely different render paths: Elite vs Free).

Elite path renders, top to bottom: greeting + days-left line, optional expiry warning, optional Discord prompt, onboarding checklist, single big Risk Score banner card, `TodayDigest` (3 alert tiles + Whale Top 3 + Calendar Today + News Critice), 4 "Analiză Live" tool cards, 3 latest videos, 4 "Educație & Comunitate" tool cards, Discord status footer card. Server-side does six parallel Supabase queries and a fire-and-forget Discord sync.

Free path: trial CTA or upsell hero, 4 blurred Elite tool tiles, 2 blurred preview cards (Risk Score 67 / Whale $142M), 3 video cards (locked thumbnails), "What you unlock" 6-feature grid.

### What feels AI-generated
1. **Eight sections stacked vertically with no narrative**. Greeting, alert banner, Discord prompt, checklist, Risk Score, TodayDigest (which itself has 5 sub-cards), 4 tool cards, 3 videos, 4 more tool cards, Discord footer. There is no answer to "what is the one thing this user should do right now." Every Linear / Vercel dashboard answers that in the top 1/3 of the screen.
2. **Random emoji bubbles for tools.** 🪙 🎯 🌐 🎥 in colored circles. This is the "AI startup landing page from 2023" look.
3. **Two big duplicate CTA areas for Free users.** Trial hero AND "What you unlock" 6-feature grid AND blurred Elite preview AND blurred Risk/Whale tiles. Four upsell sections in a row, no escalation.
4. **The "gradient-from-emerald via-emerald to-transparent" trial card** is the literal default Tailwind upgrade-card pattern. Every AI-generated SaaS uses it.
5. **`{daysLeft} zile rămase` in the header tucked next to greeting** is invisible and unstyled, while the trial uses 🎁 emoji + amber. Pro: one consistent subscription-status pill (Vercel does this with the team plan badge top-right).
6. **Hardcoded `+` after numbers** ("68+ video-uri", "21+ metrici", "41 active") even when the count is exact. AI-tic.

### Pro-up ideas
1. **Single "hero state" card driven by what changed since last login** (Linear "Inbox" / GitHub "For you" pattern). Show one of: "Risk Score crossed BUY 2h ago", "3 noi video-uri săptămâna asta", "Whale net long pe ETH +$24M peste noapte", "Trial tău expiră în 3 zile". Computed server-side, one card, one CTA. Refs: https://linear.app/inbox and https://vercel.com/dashboard (both put one curated "what's new for you" block at the top).
2. **Replace emoji tool grid with a Cmd+K-style "Quick actions" bar** under the hero, with 6–8 monochrome icon tiles and keyboard hints (`G then S` for Stocks, `G then R` for Risk Score). Refs: https://linear.app keyboard shortcuts grid, Cursor command palette (you already ship `command-search.tsx`, surface its actions on the home page).
3. **Today snapshot as a single-row "ticker strip" instead of 3 + 2 + 1 cards.** A horizontal scrollable strip with: BTC price + Δ24h + Risk Score, ETH price + Δ24h, F&G index, Whale net sentiment, DXY, gold, BTC dominance. Stripe Atlas dashboard and TradingView watchlists do this. Ref: https://www.tradingview.com/markets/cryptocurrencies/global-charts/ (compact KPI strip), https://dashboard.stripe.com (top stat row).
4. **Onboarding checklist becomes inline + auto-detected, not a giant card.** Right now it's 5 manual checkboxes saved in localStorage, which a) the user can fake-complete, b) doesn't hide once they actually used the page. Pull data: did they connect Discord (DB), did they open videos (event), did they hit Risk Score (event), did they save a watchlist. Show a slim progress bar in the navbar (1/5 → hide at 5/5). Refs: https://posthog.com/handbook/handbook (Posthog uses a slim top progress strip), Stripe's "Activate your account" pill.
5. **Free path: kill 3 of the 4 upsell blocks; make one "demo dashboard with synthetic data + watermark".** Vimeo OTT and Mux let non-customers preview the actual dashboard with overlay "Demo". Way more convincing than 4 blurred boxes with `🔒`. Ref: https://docs.mux.com/ (their hosted preview).

---

## Page: Video Library (/dashboard/videos)

### Current state
File: `/Users/server/elite_platform/app/dashboard/videos/page.tsx` (server) + `video-library-client.tsx` (447 lines, client).

Header: breadcrumb, big title "Biblioteca Video" with gradient on "Video", count badge, sub-text. Then `VideoLibraryClient` renders: optional player (R2 video or YouTube iframe) + summary + tags + duration; otherwise a "Featured Latest Video" half-and-half card with "Ultimul Video" emerald badge; search input + "NOU" toggle + tag pills; grid of R2 videos (md:grid-cols-2 xl:grid-cols-3) with locked overlay for non-Elite; collapsed accordion "Video-uri mai vechi (N)" for YouTube videos with a duplicate render block. Locked vs unlocked branches duplicate ~80 lines of card markup. `VideoTemplateThumbnail` generates the thumb (date + tag + title overlay).

### What feels AI-generated
1. **The "Featured Latest Video" half-and-half card** with `bg-accent-emerald` "Ultimul Video" sticker is a Tailwind UI free template circa 2022.
2. **Two completely separate code paths for R2 vs YouTube**, with YouTube hidden behind an accordion labeled "Video-uri mai vechi (N)". Loom / YouTube Studio / Mux never expose the storage backend in the UI. Filter by recency, by tag, by length, by watch progress, never by hosting.
3. **Tag pills row + NOU toggle + search bar all stacked** without grouping or alignment to any pro filter pattern. `NOU` as a button in caps next to a search box looks like a debug toggle.
4. **Locked card variant just dims the thumb to opacity-40 and writes "Elite"** in tiny tracking-[0.2em] caps in the center. Vimeo OTT, Loom, and Patreon all use a subtle padlock + clean blur + a single CTA "Upgrade for €X". The "tier_required" gating is also weird because everything is `elite` anyway, so the locked path basically never fires for Elite users.
5. **No watch progress, no "continue watching", no "watched ✓"**, no length-based grouping ("under 10 min" / "deep dives"). 67 videos with one flat grid + tag pills isn't a library, it's a folder.
6. **Duplicate diacritic misses in client copy**: "Cauta video", "Reseteaza filtre", "Inapoi la biblioteca", "Browserul tau nu suporta", "Niciun rezultat găsit" (this last one is fine).

### Pro-up ideas
1. **YouTube Studio / Mux Player layout: persistent left filter rail + main grid.** Left rail: search at top, then collapsible filter groups ("Tematică" tags, "Durată" <10/10-30/30+, "Ce-am văzut" Toate / În progres / Nevăzute, "Sortare" Recente / Lungime). Main: dense grid with hover scrub. Refs: https://studio.youtube.com (Content tab), https://www.mux.com/player (filter rail), https://www.loom.com/library (left filters + grid).
2. **Watch progress + "Continue watching" rail.** Track `currentTime` in localStorage per video id (or per user in DB if you want cross-device). Put a thin emerald progress bar under each thumb (Loom / YouTube exact pattern). At top of grid: "Continuă vizionarea" horizontal scroll rail showing 4–6 videos with progress 1–95%. Refs: Loom library "In progress" rail, YouTube home "Continue watching".
3. **Player page = real player page, not a card on the list page.** Right now the player renders inline above the grid when `?video=ID`. Move to `/dashboard/videos/[id]` with: 16:9 player on top, title H1, summary as collapsed "Show more", chapters/timestamps if present in `summary`, tags row, "Up next" 5 related thumbs sidebar on desktop or below on mobile. Refs: https://vimeo.com/ott (OTT player page), https://www.mux.com/player demos, https://www.loom.com share page.
4. **Replace "Featured Latest Video" hero with a hover-scrub thumbnail or a 6s preview loop** like YouTube and Mux do. `VideoTemplateThumbnail` already exists — render a `<video muted preload="none">` that plays on hover for 6s starting at 10% in. Mux does this natively with `<mux-player>` storyboards; for R2 you can pre-extract a webp sprite. Ref: https://www.mux.com/blog/video-thumbnails (storyboard images).
5. **Pro lock state**: blurred thumb (CSS `backdrop-blur` on a copy of the thumb) + clean Lucide `Lock` icon + one-line "Elite · €49/lună" + ghost CTA "Vezi planurile". Drop the all-caps tracking text. Ref: https://www.patreon.com locked posts, https://nebula.tv locked content.
6. **Drop the "Video-uri mai vechi" accordion** entirely. R2 vs YouTube is an implementation detail. Sort everything by `upload_date` desc. If you want a "Archive" feel, add a "Sortare: Cele mai vechi întâi" option in the filter rail.

---

## Page: Library (/dashboard/library) — legacy

### Current state
File: `/Users/server/elite_platform/app/dashboard/library/page.tsx` (169 lines).

Hardcoded array of 4 fake videos with `youtubeId: "dQw4w9WgXcQ"` (Rick Roll). Renders 2-col grid of YouTube embeds for Elite users, blurred placeholders for non-Elite, with a big "Devino membru Elite" CTA at bottom.

### What feels AI-generated
1. **Rick Roll YouTube ID hardcoded 4 times.** This page is in production, indexed at `/dashboard/library`, and shows fake videos. Pure AI scaffold leftover.
2. **Duplicate of `/dashboard/videos` purpose** but with worse UX (no search, no filter, no real data).
3. **`bg-gradient-to-br from-slate-800/80 to-crypto-ink/90 backdrop-blur-sm` placeholder + 🔒 emoji** in the locked variant — the Tailwind UI demo lock state.
4. **`tracking-[0.3em]` everywhere** — same overdone label hierarchy as the rest of the site.
5. **Diacritic typos** ("Sesiuni live si materiale educationale", "Acceseaza", "Inapoi in dashboard"). Confirms this page hasn't been touched since AI scaffolded it.

### Pro-up ideas
1. **Delete this page or 301 redirect to `/dashboard/videos`.** It's a duplicate route with fake data. Keeping it is the single biggest "made by AI" red flag because if a real user clicks it they'll see Rick Astley.
2. If you want a "Library" tab as a curated subset (e.g. "Live sessions only"), make it a filter preset on `/dashboard/videos?preset=live-sessions`. Refs: YouTube Studio "Filter presets", Linear "Saved views".
3. **If kept**, replace fake data with the same Supabase `videos` query filtered to `category = 'live'` (or whatever the actual tag is).
4. (n/a — the right answer is delete)
5. (n/a)

---

## Page: Today (/dashboard/today)

### Current state
File: `/Users/server/elite_platform/app/dashboard/today/page.tsx` (7 lines). Just `redirect("/dashboard")`.

### What feels AI-generated
1. The route exists but does nothing. This is "AI scaffolded a route, then we changed our mind, then we never deleted it." Cmd+K and any external bookmarks pointing at `/dashboard/today` silently 302.
2. No metadata, no `force-static` rationale, no comment.

### Pro-up ideas
1. **Either delete the route entirely** (remove the file + scrub any nav references) **or build it as a real "Today" tab.** A real "Today" tab is a Linear "Inbox" / Stripe "Home" pattern: today's market events on top, your watchlist movers, news in the last 24h, your trades opened/closed today (if you wire portfolio). Refs: https://linear.app/inbox, https://dashboard.stripe.com home, https://app.posthog.com/home.
2. If you keep the redirect, at minimum log `?from=today` so Cmd+K / nav usage is measurable, and remove from sitemap/robots to stop indexing dead routes.
3. (n/a)

---

## Page: Resurse (/dashboard/resurse)

### Current state
File: `/Users/server/elite_platform/app/dashboard/resurse/page.tsx` (186 lines). Server-rendered, gated `hasEliteAccess`. Renders breadcrumb + H1 "Resurse Elite" (gradient on Elite) + 9 cards in a 3-col grid (2 currently — there are 8 cards in the array). Each card: emoji-in-rounded-square, title, optional `tag` (OBLIGATORIU / ESENȚIAL / ESENȚIAL), description, list of ghost-button links (some external to YouTube/Google Docs/MEXC ref, some internal).

### What feels AI-generated
1. **Eight resource cards, eight different emoji** (📖 🎯 📈 ⚙️ 🛡️ 📊 🎥 💱), every one in a `bg-accent-emerald/5 border-accent-emerald/20 rounded-2xl` square. Tailwind UI "Features" template. Notion / Stripe / Linear use a single neutral icon style.
2. **All-caps tags "OBLIGATORIU" and "ESENȚIAL"** in tiny rounded pills shouting at the user. Pro pattern: small emerald dot or a "Start here" badge on exactly **one** card.
3. **Mixed link types** (external YouTube, Google Doc, MEXC affiliate, internal route) all rendered as identical `ghost-button` pills with a `↗` for external. No grouping ("Start here" / "Setup" / "Reference" / "Tools").
4. **"Biblioteca Video" listed as a resource card** — but it's a top-level dashboard tool, not a "resource". And "Indicatori Elite" is also a separate primary route. Cards point back to other dashboard pages. Resurse should be only **external** references + downloadable assets.
5. **Hardcoded "55+ video-uri"** in the description while the actual video page shows 67/68. Stale copy.

### Pro-up ideas
1. **Notion-style "Resources hub"**: one column of grouped sections ("Începe aici" with 2 must-watch videos, "Setup tehnic" with TradingView config, "Referință" with risk doc + chart links, "Externe" with MEXC ref). Each row is a one-line item with a small Lucide icon (BookOpen / Settings / ExternalLink / Download), title, source, and a single action. Ref: https://www.notion.so/help (resource hub layout), https://stripe.com/docs (left rail of grouped guides), https://www.linear.app/method.
2. **Pin the "Start here" item** as a featured banner with a play button, like the first row of YouTube Studio's "Resources" tab or Loom's onboarding course. Single CTA, single video, real thumbnail. Ref: https://support.google.com/youtube/?hl=en#topic=9257498 (top hero card pattern).
3. **External link cards should show source favicon**, not an emoji. `https://www.google.com/s2/favicons?domain=youtube.com&sz=32` or self-host. Vercel docs and Notion both do this. Way more legible at scale.
4. **Drop the 3-col grid for a 2-col "list + sidebar" layout**: main column = resources grouped by purpose, sidebar = "Ghid de start rapid în 3 pași" (a tiny stepper card pinned). Ref: https://docs.stripe.com (left rail + main), https://www.cursor.com/docs.
5. **Separate "Tools we use" (MEXC, TradingView) into a small footer block** with logos and one-liner referral disclaimer. Today MEXC is buried as card #8 next to "Indicatori Elite", which is incoherent. Ref: https://www.kraken.com/learn (their "trusted partners" footer style).

---

## Page: Portfolio (/dashboard/portfolio)

### Current state
Files: `/Users/server/elite_platform/app/dashboard/portfolio/page.tsx` (server, admin-only) + `/Users/server/elite_platform/components/portfolio/portfolio-dashboard.tsx` (375 lines, client).

Header: section-label "Tracker Privat" + amber "Admin only · beta" pill + H1 "Portofoliul Tău" + paragraph explaining what it does. Body (PortfolioDashboard): 4 KPI cards (Investiție inițială / Valoare curentă / P&L total / Randament), then conditional 4 mini-cards (Câștigătoare / În pierdere / Cea mai bună / Mix Crypto / Stocks), then a "+ Adaugă tranzacție" button row, then HoldingsTable + AllocationChart side-by-side, then TransactionsList, then disclaimer. Empty state: dashed-border 💼 card + CTA.

### What feels AI-generated
1. **8 KPI tiles in 2 rows of 4** (4 main + 4 mini), each in a rounded-2xl border-white/10 box. Stripe / Coinbase Pro / Plaid show **3 hero stats max** above the fold and push the rest into a "Stats" expandable section.
2. **Mini-card "Cea mai bună: BTC +24.50%"** — exposing the best-performing asset as a top-level KPI is a gimmick. Real fintech (Wealthfront, Plaid, Coinbase) shows top movers in a contextual "Movers" widget, not as a KPI tile.
3. **`+ Adaugă tranzacție` button** is a green pill in the middle of the page with no positioning. Pro pattern: top-right primary action button next to the page H1, exactly like Linear "New issue" / Notion "+ New" / Coinbase "Buy/Sell".
4. **Allocation chart sized at fixed 320px sidebar** while the holdings table is "1fr" — feels arbitrary. Coinbase Pro / Dune use 2:1 with the chart having actual interaction (click slice = filter table).
5. **Disclaimer "Tracker educațional. Performanțele trecute..."** with em-dash and centered. Em-dash violates site rule.
6. **Empty state is a 💼 emoji** in a circle. Linear / Stripe / Plaid empty states use a small custom illustration or a Lucide icon stroked at 1.5px, never an emoji.

### Pro-up ideas
1. **Coinbase Pro / Plaid layout: one big "total value" hero + 7-day equity sparkline + delta pill**, then a tabbed strip for "Holdings | Transactions | Allocation | What if". Compresses 8 tiles into a single hero. Refs: https://www.coinbase.com (logged-in dashboard), https://plaid.com/docs (transaction dashboard mock), https://www.wealthfront.com (portfolio screen).
2. **Allocation chart: interactive donut + legend that doubles as filter.** Click "BTC" slice → holdings table filters to BTC only. Refs: https://dune.com dashboards, https://www.coinbase.com portfolio donut.
3. **Move "Adaugă tranzacție" + "What if" into the page header as primary/secondary buttons.** Primary emerald, secondary ghost. Use a Cmd+N shortcut hint. Ref: https://linear.app any project page (top-right action cluster).
4. **Holdings table needs row sparklines.** Each row: asset, qty, avg cost, current, P&L $, P&L %, **7d sparkline**, action menu. Ref: https://www.tradingview.com/watchlist/ (sparkline column), https://coinmarketcap.com/ (compact sparkline column), https://dune.com/ tables.
5. **"What if" should be a comparison view, not a modal.** Side-by-side: "Realitate: BTC +18%" vs "Dacă luai SOL: +47%". With a single shared timeline chart overlaying both. Right now it's a modal triggered per-row, which hides the punch. Refs: https://app.dune.com (overlaid time series), https://wisesheets.io comparison views.
6. **Empty state with a single "import a CSV from Binance/MEXC/IBKR" CTA in addition to manual add.** Right now manual entry is the only path; that's the #1 friction. Refs: https://app.cointracker.io onboarding, https://www.delta.app (Etoro's import flows).

---

## Page: Performance (/dashboard/performance)

### Current state
File: `/Users/server/elite_platform/app/dashboard/performance/page.tsx` (356 lines). Three gates: not bot_active → `<BotLock>`, not admin → "Coming Soon" 🚀 card, no data → "Date indisponibile". Admin path renders: breadcrumb + H1 "Performanță Bot" (gradient on Bot) + sub. Section 1: 4 centered KPI panels (Equity Total / Daily P&L / Drawdown / Circuit Breaker). Section 2: 2-col, left = Long vs Short stacked horizontal bar + 3 line items, right = Risk Controls with 3 ProgressBars + 2 line items. Section 3: 2-col High Conviction / Recommended Disable strategy pill clouds. Section 4: "Fleet" 6 strategy cards. Footer: "Ultima actualizare: ..." centered.

### What feels AI-generated
1. **Centered KPIs again.** Equity / DailyP&L / Drawdown / Circuit Breaker all `text-center`. Stripe / Posthog / Mux KPIs are left-aligned with the label tiny and the number XL.
2. **No equity curve.** A page literally called "Performance" without an equity-over-time chart is the dead giveaway. AI generated "Performance dashboard" → put 4 numbers in tiles. A real performance dashboard leads with the chart.
3. **Stacked Long-vs-Short horizontal bar with `bg-green-400` / `bg-red-400` flat colors** is a 2019 Tailwind starter. Pro: Recharts area chart of long vs short equity over 30d, or a sankey for net exposure flow.
4. **Strategy pill clouds for "High Conviction" + "Recommended Disable"** are little colored chips with no PnL, no sample size, no CTA. They look like tags. Should be a sortable table.
5. **Fleet "6 strategies" hardcoded slice with a tag for risk on the right** but no pnl/sharpe/last trade timestamp. Same shape as Signals page → unclear why this exists separately.
6. **Footer disclaimer "datele sunt generate automat și nu constituie sfaturi de investiții"** with an em-dash before it (`&middot;`), centered, 12px gray. Looks AI-templated.

### Pro-up ideas
1. **Lead with a Recharts area chart of equity vs benchmark (BTC) over 30/90/365d** with hoverable crosshair. Below it: 3 left-aligned KPIs with delta pills (Equity, MTD P&L, Max DD). This is the standard hedge fund / quant tearsheet look. Refs: https://www.coinbase.com Pro performance, https://www.interactivebrokers.com PortfolioAnalyst, https://www.composer.trade (their backtest tearsheet).
2. **Drawdown chart underneath as a filled red mountain below zero.** Industry-standard tearsheet pattern. Refs: https://quantstats.io (sample tearsheet PDFs), https://composer.trade backtest report.
3. **Replace the Long/Short stacked bar with a "Net Exposure" line + filled area over time + current snapshot ring.** Refs: https://hyperliquid.xyz dashboards, https://www.deribit.com positions view.
4. **Risk Controls block: turn ProgressBars into "live gauges" with thresholds**. e.g. portfolio DD as a half-circle gauge with green/yellow/red bands and the current needle. AI tools love stacked progress bars; pro tools use semantic gauges. Ref: https://grafana.com gauge panels, https://www.datadoghq.com SLO views.
5. **Strategy fleet → a sortable table** with columns: Name, Type (ML/Rule), Risk, 30d PnL, Sharpe, Trades, Last signal time, Status toggle. Same component as Signals page (DRY). Refs: https://posthog.com (cohort tables), https://app.dune.com (data tables).
6. **Date freshness pill in the header**, not centered at the bottom. "Live · acum 2m" with a green dot, exactly like Stripe/Posthog. Ref: https://dashboard.stripe.com freshness indicators.

---

## Page: Signals (/dashboard/signals)

### Current state
File: `/Users/server/elite_platform/app/dashboard/signals/page.tsx` (323 lines). Same gating as Performance (bot_active → admin → data). Admin path: breadcrumb + H1 "Strategii Active" (gradient on Active) + sub. Section 1: 4 centered KPI tiles (Total / ML Models / Rule-Based / Dezactivate). Section 2: Market Regimes — 6 small centered cards per asset (BULL/BEAR/CHOP + confidence + sizing multiplier). Section 3: ML Strategies cards (2-col) — name + type pill + validation badge + 4-col grid of Strategy/Timeframe/Risk/PF + optional Trades+Sharpe footer. Section 4: same shape for Rule-Based. Footer: "Ultima actualizare" centered.

### What feels AI-generated
1. **Regex-parsing a `validation: string` field** like `"VALID PF=2.34 Sharpe=1.8 18 trades"` (see `parseValidation`). The shape of the data is wrong, and that wrongness leaks into a card that shows "Validat" + "PF: 2.34" + "Trades: 18" floating with no trend. Real ML tracking shows out-of-sample equity vs in-sample, drift, recent prediction history. Ref: https://wandb.ai (W&B run page), https://neptune.ai dashboards.
2. **Regime cards as individual centered tiles "BTC: BULL 78% confidence"** with no chart. A regime is a time series, not a tile. Should be a small horizontal bar showing the last 30 days of regime states (green/red/yellow blocks) per asset.
3. **Type pills "ML" purple, "Rule" blue, validation badge green/yellow/slate** — three pills next to each strategy name. The visual budget is overspent before any actual data shows up.
4. **"Strategie / Timeframe / Risk / Profit Factor" 4-col mini-grid inside each card** — looks like a debug dump of a row, not a designed component. Five things to read per card × N cards = noise.
5. **Hardcoded centered KPI count tiles** ("Total Active 12 / ML Models 7 / Rule-Based 5 / Dezactivate 3"). Counts of counts. Linear / Posthog show one number with a sparkline of "active over time", not 4 static integers.
6. **No way to drill into a strategy.** Card → nothing. A strategy named "ML_BTC_4H_v3" has no detail page. Pro pattern: each strategy is clickable → tearsheet page.

### Pro-up ideas
1. **W&B / MLflow / Neptune layout: master-detail.** Left: virtualized list of strategies with status dot, name, last signal time. Right: detail panel with equity curve, signal log, validation history, parameters. Refs: https://wandb.ai, https://mlflow.org/docs/latest/tracking.html, https://neptune.ai/.
2. **Regime: replace tile per asset with a heatmap** — rows = assets, cols = last 30 days, cell = green (bull) / yellow (chop) / red (bear). Single glance reveals correlation across assets. Refs: https://www.tradingview.com/screener/ heatmaps, https://coin360.com.
3. **Strategy table replacing card grid.** Columns: status dot, name, type (ML/Rule), timeframe, 30d PnL, Sharpe, PF, Trades, Last signal, "View →". Sortable. Multi-select for bulk enable/disable. Refs: https://posthog.com Insights list, https://app.dune.com query list.
4. **Validation badge → tiny inline OOS bar** showing validation score 0–100 colored. Scrappable in 1px-per-day slot rather than text "Validat". Ref: https://www.kaggle.com competition leaderboards (delta + score in one cell).
5. **Stats row gets sparklines.** "Active Strategies: 12 ↗" with a 30d sparkline of how many were active over time. Fewer numbers, more story. Ref: https://posthog.com dashboards (number + sparkline), https://linear.app insights.
6. **Click-through to `/dashboard/signals/[name]`** with a real strategy tearsheet (equity, drawdown, signal table, parameter card). Today the page is terminal. Ref: https://www.composer.trade strategy detail.

---

## Page: Trial Feedback (/dashboard/trial-feedback)

### Current state
File: `/Users/server/elite_platform/app/dashboard/trial-feedback/page.tsx` (206 lines). Client-only. 3-question wizard with auto-advance on select (300ms), top progress bar (`Întrebarea X din 3` + 3 segmented dashes), each question a card with 4–5 options (`[emoji] [label]`). Submit posts to `/api/feedback`. On submit: a "Mulțumim!" or "🎉 Bine!" card depending on whether `blocker === "will_subscribe"`. If `blocker === "price"`, shows a price-anchoring tooltip with €1.52/zi math.

### What feels AI-generated
1. **Emoji on every option** (🔥 👍 😐 👎 / 🎥 💬 📊 📈 🧠 / 💰 ⏳ 🤔 👥 ✅) makes the survey feel like a Mailchimp template, not a Typeform. Pro surveys (Typeform, Tally, Posthog feedback widget) use either no emoji or one carefully chosen icon system.
2. **3-question linear wizard** with auto-advance on click → user can't review answers without going back. Typeform and Tally let you see all answers on the final summary screen.
3. **Hardcoded English values mixed with Romanian labels** (`"useful"`, `"will_subscribe"`, `"not_at_all"` as `value` props). Fine for storage, but the JSON sent to `/api/feedback` is `{"useful":"very","favorite":"discord","blocker":"price"}` with no schema. Posthog / Sprig / Refiner store both the question text and the option text for forensic clarity.
4. **Final card with "💡 Știai?" anchoring math** is fine in concept but visually it's the same emerald-glass card as everything else. Anchoring deserves a moment — different surface, larger numbers, side-by-side €49/€137/€497 comparison.
5. **No free-text "anything else?" question.** AI surveys give 3 multiple-choice questions and call it a day. Real churn-prevention surveys (Profitwell Retain, Refiner) always end with one open-text "what would have made you stay?" — that's where the gold is.
6. **"Sari peste → vezi planurile"** as a 12px slate-600 link at the bottom — looks accidental. Either commit (top-right "Skip") or remove.

### Pro-up ideas
1. **Typeform-style one-question-per-screen with big type and keyboard control.** Press `1`-`5` to answer. Animated transitions. Final screen summarizes all answers + free-text. Refs: https://www.typeform.com (any live form), https://tally.so, https://refiner.io product surveys.
2. **Branch on first answer.** If "Foarte util" → skip "blocker" question, go straight to upgrade with prefilled "save my trial progress" message. If "Nu mi-a fost util" → ask "ce lipsea?" with free text. Refs: https://refiner.io branching surveys, https://www.profitwell.com Retain.
3. **Replace emoji with Lucide icons** at 16px next to each option, or remove icons entirely. Refs: https://posthog.com surveys (icon-less, clean radio), https://linear.app feedback widget.
4. **Final "anchoring" card → real comparison table** with the 3 plans (€49 / €137 / €497) side by side, day-rate calculated, "Veteran" tier called out if applicable. Same component as `/upgrade` so users see a consistent price story. Refs: https://stripe.com/pricing, https://linear.app/pricing.
5. **Track time-on-question to detect dishonest speed-clicking.** Posthog/Refiner do this. Helps Alex weight feedback. Plus capture `localStorage.trial_started_at` and `daysUsed` to attach context to the response server-side.
6. **Mandatory free-text "Ce am putea face mai bine?" as Q4** (skippable but visible). Saved to `feedback.message` alongside the JSON answers. This is the single highest-ROI pro-up because the structured answers are mostly noise; the open text is signal.

---

## Cross-page checklist (apply once, fixes 70% of "AI-feel")

- [ ] Replace all emoji icons with one Lucide / Phosphor / custom 1.5px stroke set (Linear/Vercel pattern). Currently 30+ emoji across these pages.
- [ ] Remove `gradient-text` from every H1. One color, one weight.
- [ ] Remove `tracking-[0.3em] uppercase emerald` "section labels" except on the public landing/marketing pages. Inside the app: just use a normal-weight slate-300 label.
- [ ] Centered KPI cards → left-aligned KPI cards with delta pill + sparkline.
- [ ] Glass cards → flat `bg-white/[0.02] border-white/5` for content, reserve `glass-card` for **modals + the 1 hero card per page**.
- [ ] Diacritic pass: every `Cauta`, `Inapoi`, `Reseteaza`, `Acceseaza`, `Foloseste`, `Creaza`, `intelegere`, `tau`, `nostru` etc. CLAUDE.md mandates ă/â/î/ș/ț.
- [ ] Em-dash purge in `app/dashboard/**/*.tsx` and `components/dashboard/**/*.tsx`. Replace with period, comma, colon, or hyphen.
- [ ] `+` after counts (`68+`, `21+`, `41`) → exact counts when known. Or drop the count entirely.
- [ ] Add a single page-level "freshness" indicator (green dot + "actualizat acum Xm") in the header, not as a centered footer paragraph.
- [ ] Top-right primary action button per page (Add transaction / Add filter / Refresh / Open in new tab) — this single pattern (Linear, Stripe, Notion, Cursor) is the biggest visual cue that something is a "tool".

---

## Reference URLs used (master list)

Dashboards & SaaS: https://linear.app/inbox · https://vercel.com/dashboard · https://dashboard.stripe.com · https://app.posthog.com/home · https://www.cursor.com · https://stripe.com/docs · https://linear.app/method

Video / creator: https://studio.youtube.com · https://www.loom.com/library · https://vimeo.com/ott · https://www.mux.com/player · https://docs.mux.com · https://www.mux.com/blog/video-thumbnails · https://www.patreon.com · https://nebula.tv

Fintech / portfolio: https://www.coinbase.com · https://www.tradingview.com/watchlist/ · https://www.tradingview.com/screener/ · https://coinmarketcap.com · https://app.dune.com · https://plaid.com/docs · https://www.wealthfront.com · https://app.cointracker.io · https://www.delta.app · https://wisesheets.io

Quant / ML: https://wandb.ai · https://mlflow.org/docs/latest/tracking.html · https://neptune.ai · https://www.composer.trade · https://quantstats.io · https://www.kaggle.com · https://grafana.com · https://www.datadoghq.com

Surveys: https://www.typeform.com · https://tally.so · https://refiner.io · https://www.profitwell.com · https://posthog.com surveys

Hubs / docs: https://www.notion.so/help · https://www.kraken.com/learn · https://support.google.com/youtube
