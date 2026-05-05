# Pro-up: Data Dashboards Audit

Research-only document. Goal: stop the "made entirely with AI" feel on the data-heavy dashboards (stocks, crypto, news, calendar, risk score, indicators, should-i-trade) and push them toward terminal-grade UX. References point to real products that already solved the same problem we are solving.

Tone constraints applied throughout: Romanian copy with diacritics, no em dashes, mobile-first 375px, emerald accent on crypto-night background, never fabricate performance numbers, no member-facing Telegram bot.

Files audited:
- `/Users/server/elite_platform/app/dashboard/stocks/page.tsx`
- `/Users/server/elite_platform/app/dashboard/stocks/stocks-client.tsx`
- `/Users/server/elite_platform/app/dashboard/crypto/page.tsx`
- `/Users/server/elite_platform/app/dashboard/crypto/crypto-client.tsx`
- `/Users/server/elite_platform/app/dashboard/news/page.tsx`
- `/Users/server/elite_platform/app/dashboard/news/news-client.tsx`
- `/Users/server/elite_platform/app/dashboard/calendar/page.tsx`
- `/Users/server/elite_platform/app/dashboard/calendar/calendar-client.tsx`
- `/Users/server/elite_platform/app/dashboard/risk-score/page.tsx`
- `/Users/server/elite_platform/components/dashboard/risk-score-dashboard.tsx`
- `/Users/server/elite_platform/app/dashboard/indicators/page.tsx`
- `/Users/server/elite_platform/app/dashboard/should-i-trade/page.tsx`

---

## Page: Stocks Tracker (/dashboard/stocks)

### Current state
16 hardcoded tickers with manual Buy1/Buy2/Sell1/Sell2 zones from Alex. Live overlay from Finviz: price, %change, market cap, P/E, volume, 52W range. Desktop is a 14-column table with sortable headers (ticker, price, %azi, ATH, signal); mobile is a stack of glass cards with a thin progress bar between B2 and S2. Skeleton rows, price-flash animation on tick, BlurGuard for `?blur=1`. Filters: Buy/Hold/Sell summary cards toggle filter, plus a ticker search and a sector tag (color-coded: Tech, Crypto, Fintech, Auto/EV). Footer disclaimer in Romanian.

### What feels AI-generated
1. **Wall-of-columns table.** 14 columns crammed at `text-sm`/`px-4`. No column visibility toggle, no density switch, no sticky first column. Looks like Claude's first pass at a "complete" finance table.
2. **Sector chips are 9px text in `text-blue-400` next to the ticker.** Reads as filler metadata, not a real filter. Sectors are not used for grouping or filtering anywhere despite the SECTOR_COLORS map.
3. **Generic emerald/orange/red palette with no chart.** No sparkline, no candle preview, no zone-on-chart visualization. The 52W range bar is one tiny dot on a thin line and uses the same emerald as everything else.
4. **"Nearest zone" cell is a string like `12% > B1`.** Pro tools never show distance as raw text. They use a horizontal bar with the price token sliding inside a B2-B1-S1-S2 ladder, or a delta pill colored against your alert level.
5. **No comparison, no watchlist, no portfolio view.** A tracker without "compare 2 tickers", "save my list", or "show me only tickers within X% of zone" is generic. There's also no per-ticker history beyond a tiny `✓` checkmark when a zone was hit.

### Pro-up ideas (3-5 with refs)
1. **Heatmap-first hero, table second.** A Finviz-style heatmap of the 16 tickers sized by market cap and colored by % distance to nearest zone (not just daily %). Click a tile to drop into the row below. Ref: Finviz heatmap (https://finviz.com/map.ashx) and TradingView Stock Heatmap (https://www.tradingview.com/heatmap/stocks/). Yahoo Finance Pro's portfolio heatmap (https://finance.yahoo.com/portfolios) does the same with a tighter dark theme.
2. **Inline mini-candles per row instead of percentage cells.** A 30-bar candlestick spark in a 80x24px column plus a vertical dotted line at each B/S zone level. Vylos.io ships this on their watchlist; TradingView Screener rows have the same micro-chart (https://www.tradingview.com/screener/). It instantly communicates "where is price relative to my levels" better than four numeric columns.
3. **Zone ladder visualization replacing B1/B2/S1/S2 columns.** Vertical or horizontal price ladder per ticker with the live price token sliding between zones, colored bands for accumulation (B2-B1) and distribution (S1-S2). Refs: TradingView's Bookmap-style depth visual, CoinGlass liquidation map (https://www.coinglass.com/LiquidationData), Bloomberg Terminal LEVL function. This is the single biggest "looks pro" upgrade for this page.
4. **Saved views + density switcher.** Top-right pill row: "Toate / Aproape de Buy / Aproape de Sell / Vol spike / Crypto-correlated". Plus a density toggle (Compact / Confortabil / Expanded) that swaps row heights. Ref: TradingView Screener saved screens (https://www.tradingview.com/screener/), Bloomberg LAUNCHPAD layouts. Even a static set of 4 curated views beats AI-generic "Cumpără / Neutru / Vinde" filters.
5. **Per-ticker drawer with TradingView chart embed + zone overlay + earnings date.** Click a row, slide-in panel from right with: live TradingView mini-chart, the four zone lines drawn on it, last 4 earnings dates with surprise %, sector peers comparison, and the Alex-defined zones in the same panel where someone is actually looking at price. Refs: Yahoo Finance ticker page right rail (https://finance.yahoo.com/quote/AAPL), Koyfin dashboards (https://www.koyfin.com/), TradingView ticker hover card.

---

## Page: Crypto Screener (/dashboard/crypto)

### Current state
25 coins (BTC + ETH manual zones, 23 alts via formula: B1=peak*0.20, B2=peak*0.10, S1=fib 0.618, S2=peak*0.85). Live data from CoinGecko every 60s, weekly RSI from Yahoo Finance every hour. Disclaimer gate on first visit. Header with total cap, BTC dominance, avg 24h change. "Cum citesc?" expandable explainer. RSI legend chips. Buy/Neutru/Vinde summary buttons. Tabs (Toate / Top câștigători / Top perdanți). Search. Big desktop table: Rank, Coin, Price, 24h, 7d, RSI, Market Cap, Zone label, % Vârf, Range bar, Action pill with sub-label ("alocă ~50%"). Mobile: stacked cards with B2/B1/S1/S2 ladder and RSI badge.

### What feels AI-generated
1. **Emoji as primary visual language.** 🛒 for Buy, 💰 for Sell, 📊/🟢/🔴 in tabs, 📖 in the "Cum citesc?" header, 😨/😐/🤑 floating around the risk score. Pro crypto terminals (CoinGlass, Velo, Glassnode) use almost zero decorative emoji, only typographic semantics. The emoji density is the strongest "ChatGPT generated this" signal.
2. **No on-chain context anywhere.** A "crypto screener" without funding rates, OI, liquidations, exchange netflow, stablecoin supply, or a basic correlation matrix is not pro. It is a CoinGecko clone with zones bolted on.
3. **`Cum citesc tabelul?` as a `<details>` block.** Pro UIs never have a "How do I read this" disclosure. They use info ⓘ tooltips on each column header (already partly there) and assume literacy. The big detail block reads like onboarding copy that was added because the page was confusing, instead of fixing the page.
4. **The "Range" column is a 20px-wide horizontal bar.** Too small to be useful, too generic to be impressive. Same emerald/orange gradient as everything else. The position dot is a 4px white circle.
5. **No timeframe selector for change %.** 24h and 7d are hardcoded columns. Pros switch between 1h/24h/7d/30d/YTD on click. CoinGecko itself does this (https://www.coingecko.com/).

### Pro-up ideas (3-5 with refs)
1. **Add a derivatives strip per coin.** Funding rate (8h), OI change 24h, long/short ratio top traders, recent liquidation $ value. Pull from CoinGlass API or Velo (free tier). This single addition flips the page from "CoinGecko UI" to "trading desk UI". Refs: CoinGlass perp page (https://www.coinglass.com/currencies/BTC), Velo.xyz coin page (https://velo.xyz/data), Laevitas (https://app.laevitas.ch/). For each row, append a 4-cell strip: funding %, OI Δ24h, L/S, last liq.
2. **RSI heatmap mini-grid replacing the RSI legend chips.** A 5-cell strip showing RSI 1d/3d/1w/2w/1M for each coin, color-coded with the same scale already in code. Click to expand to a sparkline of RSI history. Refs: TradingView Crypto Heatmap (https://www.tradingview.com/crypto-heatmap/), Glassnode metric pages with multi-timeframe overlays (https://studio.glassnode.com/). Today the page only shows weekly RSI as a single number.
3. **Cycle position visual + dominance regime overlay.** Replace the "% Vârf" column with a circular cycle clock (% through 4-year halving cycle) and a top-of-page banner showing current regime: BTC dominance up / alt season / chop, with a Bitwise-style alt season index 0-100. Refs: Blockchain Center Altcoin Season Index (https://www.blockchaincenter.net/en/altcoin-season-index/), CoinGlass Bitcoin Rainbow / Halving (https://www.coinglass.com/bitcoin-rainbow-chart), Glassnode cycle workbench. Right now `pctFromCyclePeak` is just a colored % number with no cycle context.
4. **Replace emoji-heavy signals with typographic system.** Keep the colored pills but drop 🛒/💰. Use a small uppercase letter + dot system: `B2 ●`, `B1 ●`, `WAIT ○`, `S1 ●`, `S2 ●`. Add a one-letter tag for cycle position (E=early, M=mid, L=late). Pair with a Roboto Mono / JetBrains Mono number style at 13px tabular-nums. Refs: Bloomberg Terminal cell formatting, TradingView's screener pills (https://www.tradingview.com/screener/), Vylos.io dashboard pills.
5. **Pair-correlation grid + benchmark vs BTC.** A small 25x25 dot matrix at the bottom showing correlation strength between coins (last 30d returns), and a per-row "vs BTC 30d" delta column. Refs: CryptoQuant correlation dashboards (https://cryptoquant.com/), Coin Metrics Network Data Pro (https://charts.coinmetrics.io/correlations/), Macrobond / TradingEconomics matrix style. This is exactly what a portfolio operator wants and what no other Romanian crypto site has.

---

## Page: Știri Crypto (/dashboard/news)

### Current state
Single column feed of latest items aggregated from CoinDesk, CoinTelegraph, Decrypt, Bitcoin Magazine, CryptoSlate via the `/api/news` RSS aggregator. Each item is a glass card with the title (line-clamp-2), a colored source pill, and `timeAgo` (`5m`, `2h`, `1d`). Filter row at top: "Toate (n)" plus one button per source, single-select toggle. 5-minute auto-refresh. Empty state if filter returns 0. Skeleton blocks while loading. No navbar wrapper around the main column (page uses raw `<main>` instead of the standard navbar layout used elsewhere).

### What feels AI-generated
1. **Uniform card grid with no signal hierarchy.** Every story looks identical, regardless of whether it is a Fed rate decision or a memecoin promo from CoinTelegraph. No "trending now", no "breaking", no read/unread state, no priority weighting.
2. **No grouping, no time-of-day spine.** Pro readers (Feedly, Reuters Markets) group by hour or by morning/midday/evening. Here it is just a flat reverse-chronological dump.
3. **Filter is single-select-toggle.** Clicking "CoinDesk" again sets back to "Toate". You cannot select 2 sources, and there is no "exclude this source", no "search inside titles", no tag filter (regulation, BTC, ETH, ETF, on-chain).
4. **No deduplication or cross-source grouping.** When CoinDesk + Decrypt + Bitcoin Magazine all cover the same news, you see 3 cards instead of one cluster. Pro aggregators (Memeorandum, Techmeme, AllSides) collapse these into one event with multiple source dots.
5. **Source pills colored arbitrarily.** CoinDesk=blue, CoinTelegraph=emerald, Decrypt=purple, Bitcoin Magazine=amber. These are AI-picked, not brand colors. Decrypt's actual brand is bright pink/magenta; Bitcoin Magazine is orange-on-black; CoinTelegraph is yellow. Looks like a default Tailwind palette rotation.

### Pro-up ideas (3-5 with refs)
1. **Cluster by event, not by article.** Group similar headlines into a single card with N source dots beneath the lead title. Click to expand and see all source links. Refs: Techmeme (https://techmeme.com/) and Memeorandum (https://www.memeorandum.com/) pioneered this pattern; The Block's homepage (https://www.theblock.co/) does it for crypto specifically. Backend: simple TF-IDF or embedding similarity over titles within a 6h window.
2. **Two-pane reader layout, Feedly-style.** Left rail with sources + tag filters + search; center column with grouped headlines; right pane shows the full first paragraph + image + link out, plus a small "menționări" counter (how many sources covered it). Refs: Feedly Pro (https://feedly.com/), Substack reader (https://substack.com/inbox), The Block Pro feed. Mobile collapses to a single column with a slide-up reader.
3. **Time-of-day spine + "since you last visited" marker.** Sticky day headers ("Astăzi", "Ieri", "Vineri 25 apr"), a pill at the top "47 știri noi de la ultima vizită" that highlights unread items in emerald. Track via localStorage timestamp. Refs: Hacker News "new" comment markers (https://news.ycombinator.com/), Reuters Markets timeline (https://www.reuters.com/markets/), ZeroHedge live thread.
4. **Tag layer + impact tag.** Auto-tag each item with: BTC / ETH / Regulation / DeFi / ETF / Macro / Onchain. Add an "impact" tag (low/med/high) using simple keyword rules (Fed, SEC, ETF, FOMC, hack, exploit = high). Make tags filterable and stackable. Refs: Decrypt category nav (https://decrypt.co/news), The Block topic pages (https://www.theblock.co/category), Bloomberg Markets tags.
5. **Real source typography + favicon stripe.** Drop the colored pills, use the actual brand wordmark (24px) or favicon next to each headline like Hacker News does. Pair with a thin vertical stripe in the source's real brand color. Add a "preferate" star and a "Hide source" X. Refs: Hacker News (https://news.ycombinator.com/), Pocket (https://getpocket.com/), Inoreader (https://www.inoreader.com/). Strip emoji and decorative fluff — let the typography do the work.

---

## Page: Calendar Economic (/dashboard/calendar)

### Current state
Two tabs: "Săptămâna asta" (Forex Factory data) and "Istoric rezultate" (Trading Economics). Week tab shows a hero card for next upcoming event with countdown ("4h", "2z"), then events grouped by day with red/amber impact dots, "AZI" badge, expandable rows showing forecast/previous and a Romanian-language "Impact istoric pe BTC" copy. History tab groups by month, shows actual/forecast/previous columns with green/red/amber surprise color. Single timezone (browser local). All US-only events (no country flags).

### What feels AI-generated
1. **Only red and amber impact dots.** Forex Factory uses 4 levels (orange/red bull dots, plus low/holiday). Two colors, no shape variation, no event-type icon makes it feel like a placeholder.
2. **No country/region flags or central bank logos.** Every Forex Factory clone, Trading Economics, Investing.com puts a flag next to each event so you scan fast. Without it, FOMC, NFP, CPI all look identical. The page brands itself "Calendar Economic" but only shows USA, never says so.
3. **Impact-on-BTC paragraph is a single static Romanian sentence.** Looks like Claude wrote 1 sentence per event type and the same string repeats for every CPI release for the next 12 months. No actual historical data, no chart, no "last 5 prints with BTC reaction".
4. **History tab is a flat list of every release.** No filter by event type, no comparison ("show me all CPI prints last 24 months"), no surprise distribution chart. Surprise color goes green if `actual > forecast` regardless of whether higher actual is bullish or bearish for the asset (CPI higher = bearish for risk assets, but is colored green).
5. **No timezone toggle.** Users in Romania see browser-local time. No setting for UTC, NY, exchange close, or the user's preferred zone. Forex Factory ships this since 2008.

### Pro-up ideas (3-5 with refs)
1. **Real Forex Factory impact system + flags + event-type icons.** Use the 3-tier orange/red/yellow dot system (low/medium/high), add country flag emoji or SVG (US, EU, CN at minimum), and a small icon per event family (📊 employment, 🏦 central bank, 💰 inflation, 📈 GDP). Refs: Forex Factory calendar (https://www.forexfactory.com/calendar), Investing.com Economic Calendar (https://www.investing.com/economic-calendar/), Trading Economics calendar (https://tradingeconomics.com/calendar). Right now we have FF data but only render half of its semantics.
2. **Mini sparkline of last 12 prints inside each expandable row.** A small bar chart showing the last 12 monthly CPI / NFP / FOMC prints with actual vs forecast color, plus a marker at the median. The next print's forecast appears as a translucent ghost bar. Refs: Trading Economics indicator pages (https://tradingeconomics.com/united-states/inflation-cpi), FRED chart embeds (https://fred.stlouisfed.org/), Bloomberg ECO function. This replaces the static "impact pe BTC" sentence with real data.
3. **BTC reaction overlay panel on hover/expand.** When user expands an event, show a 3-panel mini chart: BTC % move 1h before / 1h after / 24h after, averaged across the last 6 prints, with a confidence band. Or even simpler: a horizontal bar chart "ultimele 6 print-uri NFP" with the BTC 24h move overlaid. Refs: Trading Economics market reaction module, Block Scholes event impact reports (https://blockscholes.com/research), Velo macro release tracker. This is the single feature that justifies the page existing alongside the standard FF calendar.
4. **Timezone toggle + week-of-week selector.** Top-right segmented control: Local / UTC / NY / London. A horizontal week strip (Sun-Mon-Tue-Wed-Thu-Fri-Sat) with event count dots per day, click a day to scroll. Add an "Important only" toggle that hides medium and low impact. Refs: Forex Factory timezone setter (top-right of FF calendar), Investing.com filter bar, TradingView Economic Calendar widget (https://www.tradingview.com/markets/economic-calendar/).
5. **Surprise direction-aware coloring + asset bias arrow.** Color the surprise based on whether it is bullish or bearish for risk assets, not just `actual > forecast`. CPI hotter than expected = red (bearish for BTC). Unemployment higher than expected = amber (mixed). Add a small arrow pill: ↑ Risk-on / ↓ Risk-off / − Mixed. Refs: Bloomberg Economic Surprise Index (https://www.bloomberg.com/quote/CESIUSD:IND), Citi Economic Surprise Index, Trading Economics surprise tags. Today the green/red is naive and misleading.

---

## Page: Risk Score V2 (/dashboard/risk-score)

### Current state
Big VerdictHero card on top with emoji, decision (CUMPARA / VINDE / ASTEAPTA), 0-100 score, conviction (Ridicată/Moderată/Scăzută), "Ce să faci acum" / "Ce să NU faci" two-column action box. Then: history chart (RiskScoreHistoryChart), animated SVG hero gauge, 5 layer score cards (On-Chain 30%, Tehnic 20%, Macro 25%, Derivate 15%, Ciclu 10%) with mini progress bars, flags & overrides section, 3 argument cards (Fear & Greed, distance from ATH, halving cycle), sentiment meter (long/short/funding), macro snapshot grid (Fear & Greed, VIX, DXY, Fed funds), detailed indicators grouped by category with weighted bars, glossary cards. Floating "Sus" button. Heavy framer-motion choreography.

### What feels AI-generated
1. **Three sequential hero sections.** VerdictHero card → history chart → another HeroGaugeSVG with the same score number. The score "47" appears 4-5 times on the page in 4 different visual styles. A pro UX would commit to one canonical way of showing the headline number.
2. **Emoji on every section header.** 🎯 🧱 ⚠️ 📌 📊 🏦 🔍 📚 + 😨 😐 🤑 inside cards + ⛓️ 📈 🏦 📊 🔄 on layer cards + ✓ ✗ in the action box. This is the densest emoji concentration of any page on the platform. Glassnode, CryptoQuant, CoinMetrics use exactly zero.
3. **"Ce să faci acum / Ce să NU faci" prescriptive action lists.** Strong tonal mismatch. Hardcoded bullet points like "Cumpără agresiv" / "Nu vinde acum" written by Claude based on a score band. Reads like a horoscope, not a quant signal. A serious risk dashboard tells you the inputs and lets you act; it does not order you around.
4. **Flat coloring scheme: red ≤30 / amber ≤50 / green >50.** Every gauge, every dot, every progress bar uses the exact same 3-band gradient. No sense of regime (bear/bull/range), no historical band, no "where this score sat in past cycles". Just a stoplight repeated 30 times.
5. **No regime overlay on the history chart.** The line wiggles between 0-100 with no shading for "this period was a bull market", no event markers (FTX collapse, halving, ETF approval), no comparison line to BTC price. Glassnode and TradingView chart-of-charts always layer regimes + events.

### Pro-up ideas (3-5 with refs)
1. **Single canonical hero combining gauge + sparkline + headline number.** One card replacing both VerdictHero and HeroGaugeSVG: large numerical score on the left, a 90-day sparkline on the right with a band showing 25/75th percentile of historical scores, a "regime" pill (Bear / Range / Bull / Euphoria) inferred from the layer mix. Cut the prescriptive "Ce să faci" copy entirely or move it behind a "Cum interpretez" disclosure. Refs: Glassnode metric pages (https://studio.glassnode.com/) with their distribution band overlay, CoinMetrics Network Data Pro charts (https://charts.coinmetrics.io/), TradingView indicator headers.
2. **Layer score breakdown as a stacked horizontal bar instead of 5 separate cards.** One 100% horizontal bar split into 5 weighted segments (30/20/25/15/10), each colored by its sub-score. Hover/tap a segment to drill down. Replace the 5-card row that takes a full screen on mobile. Refs: Vylos.io volatility regime cards (https://vylos.io/), Coinbase Cloud Index health bars, the way Snapshot.org renders proposal vote splits (https://snapshot.org/). This communicates "weights" much faster than 5 cards with `(20%)` text labels.
3. **History chart with regime overlay + macro events.** Background shading per regime, vertical event lines for: halvings, BTC ATH dates, FOMC pivots, major liquidation events. A toggleable secondary axis for BTC price. Refs: Glassnode workbench overlays (https://studio.glassnode.com/workbench), CryptoQuant charts (https://cryptoquant.com/), TradingView event markers, Bloomberg GP function. Today's history chart is just a line.
4. **Indicator cards as a TradingView-style heatmap matrix.** Replace the long vertical list in "Toți indicatorii" with a 5xN matrix: rows are layer groups (on-chain, technical, macro, derivatives, cycle), columns are individual indicators, color is the normalized score. Click a cell → expanded panel with raw value, definition, source link, mini chart. Refs: TradingView Stock Heatmap & Crypto Heatmap (https://www.tradingview.com/heatmap/crypto/), Glassnode Studio multi-metric grid, Bloomberg ECO heat. This kills the "scrolling forever through cards" feel.
5. **Drop the prescriptive action lists, add an inputs-and-history transparency block.** Replace "Ce să faci acum / Ce să NU faci" with a "De ce e scorul X azi" block: top 3 indicators that moved the score in the last week (with delta and direction), a "vs media ultimele 90 de zile" comparison, and a small "scoruri similare istoric" mini-table showing 3 past dates when score was within ±5 points and what BTC did 30/60/90 days later. Refs: Glassnode "what changed" alerts, CoinMetrics State of the Network (https://coinmetrics.substack.com/), Block Scholes risk reports. Trades transparency for emoji-prescription.

---

## Page: Indicatori Elite (/dashboard/indicators)

### Current state
Time-gated (30 days after Elite start, vets and admins skip). Once unlocked: green "Acces deblocat" banner with elite days count. Then a 2-column grid of 4 indicator cards (Elite Bands, Elite Momentum, Elite Levels, Elite Fib Zones), each with an emoji icon, a Romanian description, and an "Deschide pe TradingView" button that links to the invite-only script URL. Below: a video tutorial card linking to Alex's YouTube tutorial, then a 4-step "Cum adaugi indicatorii" instructions card. No live preview, no chart, no rendering of what the indicator actually looks like.

### What feels AI-generated
1. **Generic emoji icons (📈 ⚡ 🎯 🔮).** Crystal ball for "Elite Fib Zones" is the strongest tell. Pro indicator marketplaces use a real screenshot or SVG glyph specific to the indicator's visual signature (band shape, oscillator curve, level grid).
2. **Description text reads like a feature catalog Claude generated.** "Benzi de volatilitate custom bazate pe deviații standard adaptate la regimul de piață" — generic, no example, no proof, no chart. Same tone for all 4 cards.
3. **No screenshot, no GIF, no embedded TradingView preview.** This is a paid indicators page. The single most important visual is missing: what does it look like on a real chart? TradingView's own indicator pages always lead with the chart preview.
4. **The 4-step setup is text-only.** Pro indicator vendors use annotated screenshots of TradingView's UI (where to click, what the dialog looks like) or a 30-second video loop. Even a static image with a red arrow would beat the numbered list.
5. **No "what's new" or version log.** A premium TradingView indicator that updates is usually paired with a changelog. Right now nothing tells the member that the indicator is maintained.

### Pro-up ideas (3-5 with refs)
1. **Replace emoji icons with cropped screenshots of the indicator on a BTC chart.** A 16:9 thumbnail per card showing the actual visual signature: Elite Bands → cropped band image, Elite Momentum → cropped histogram, etc. Refs: TradingView Public Library cards (https://www.tradingview.com/scripts/), LuxAlgo (https://luxalgo.com/), Brian Shannon's indicator pages. The `/dashboard/videos` folder already has the R2 thumbnail pattern, reuse it.
2. **Embed TradingView Advanced Chart widget with the indicator pre-loaded.** TradingView ships an embeddable widget where you can hardcode `studies: ["STD;Elite_Bands"]` (works for invite-only scripts the user has access to). Member sees a live BTC chart with the indicator running, on the indicators page itself. Refs: TradingView widget docs (https://www.tradingview.com/widget/advanced-chart/), Trendspider embeds, Hublot-style live chart cards.
3. **Add a "Cum se citește" mini-cheatsheet per indicator.** A 3-row table per indicator: Signal → What it means → What to do. Two columns max, no prose. Refs: LuxAlgo docs (https://docs.luxalgo.com/), MultiCharts indicator references, Pine Script publication descriptions. The current single description paragraph is doing too much.
4. **Versioning + last update timestamp + roadmap.** Below each indicator: "v2.3 · actualizat 12 apr 2026" plus a `<details>` with the last 3 changelog entries. Add a small "În curs: Elite Volume Profile" card to signal active development. Refs: Plug-and-play indicator vendors (https://www.tradingview.com/u/MarketSmith/), GitHub releases UX, Substack changelogs. Closes the "is this maintained" question.
5. **Replace text-only setup with a 6-frame screenshot carousel or 20-second muted GIF.** Capture each step on TradingView itself (Indicators dialog → Invite-only tab → search → click → applied). Loop the GIF or use a horizontal snap-scroll carousel on mobile. Refs: Linear's onboarding GIFs (https://linear.app/), Stripe Docs walkthroughs (https://stripe.com/docs), Notion tutorial cards. Costs Alex 5 minutes of recording, removes the only friction point on the page.

---

## Page: Should I Trade? (/dashboard/should-i-trade)

### Current state
Note: this page is no longer "Coming Soon" — it now renders an `IntradayDashboard` component fed by `getIntradaySignal()`. Time-gated like other premium tools (30 days). Shows intraday BTC decision support: bias direcțional, RSI multi-TF, setup-uri long/short/squeeze, whale flow, niveluri pivot, VWAP. Refresh metadata says "60s update". Empty state if `getIntradaySignal()` returns null with a Romanian "Date intraday indisponibile" card. The actual rendering lives in `components/dashboard/intraday-dashboard.tsx` (not read in this audit pass — flagged as a follow-up if the dashboard itself needs scrutiny).

### What feels AI-generated
1. **Decision-first framing without a confidence interval.** "Should I trade?" as a single yes/no question is pop-quant. Pro intraday systems show a probability or expectancy, not a binary "yes / no / wait". Without seeing the inner component, the metadata description ("Suport decizional intraday BTC") already leans toward prescription-mode, same failure pattern as the risk score's "Ce să faci".
2. **Mixing 6+ data families (bias, RSI, setups, whale flow, pivots, VWAP) in a single screen.** From the metadata description alone, this risks becoming the same dense-table-plus-emoji-section pattern as the risk score page. Without seeing the dashboard, the breadth is a smell.
3. **Page name is the AI-tell.** "Should I Trade?" with a question mark is a ChatGPT-prompt-as-feature-name. Pros call it Intraday Bias, Day-Trade Brief, Pre-Open Briefing, Setup Scanner.
4. **60-second refresh metadata vs. revalidate=0 server fetch.** Mixed signaling about how live the page is — if it really refreshes every 60s, it should show a live-dot and last-tick countdown like Stocks/Crypto pages. If not, drop the "60s" claim.
5. **Empty state copy is generic.** "Date intraday indisponibile · Semnalul intraday se actualizează la 5 minute" is fine but does not show last-known data, last successful update timestamp, or a "deschide TradingView" fallback. Pro tools degrade gracefully.

### Pro-up ideas (3-5 with refs)
1. **Rename + reframe as "Briefing Intraday BTC" or "Setup Scanner".** Drop the question-as-title. Open with one sentence: "Bias scurt: LONG · expectanță 1.4R · 3 setup-uri active". Refs: Bloomberg Pre-Market Brief format, Benzinga Pro Squawk (https://www.benzinga.com/pro/), Trade Ideas Holly AI summary (https://www.trade-ideas.com/), Steve Burns' daily briefs. The framing is the brand: pros publish briefs, not chatbot prompts.
2. **Probability-and-expectancy primary tile, not yes/no.** A header card showing: probability of bullish day (e.g. 62%), expected R-multiple if you take the highest-conviction setup, and the conditional invalidation level. Refs: Trade Ideas (https://www.trade-ideas.com/), Polymarket-style probability bars (https://polymarket.com/), Kalshi event cards (https://kalshi.com/). Removes the moralistic "should you" framing.
3. **Setups as actionable cards with entry / stop / target / size hint.** Each active setup gets a card: name (e.g. "VWAP reclaim long"), entry price, stop, two targets, position size hint as % of portfolio. Mark the most recent invalidation/confirmation tick. Refs: Trendspider Strategy Tester output (https://trendspider.com/), Nicolas Darvas-style box plots in modern apps, TradingView's "Bar Replay + Notes" workflow, Atlas Trading channel layouts.
4. **Whale flow + funding strip pulled from existing whale tracker tables.** The platform already has `whale_consensus`, `whale_positions`, `whale_fills`. Render a top strip on this page: net long $, top whale moves last 1h, OI change, funding flip. Refs: HypurrScan whale page (https://hypurrscan.io/), CoinGlass derivatives strip (https://www.coinglass.com/), Velo perp dashboard (https://velo.xyz/data). Reuses tables we already maintain instead of inventing new data.
5. **Live tick + degrade-gracefully empty state.** Add a live-dot + "ultim update 47s" indicator like Stocks/Crypto pages. When intraday is null, show last successful snapshot with a faded "stale" badge instead of an "unavailable" wall. Add a "Deschide BTC pe TradingView" outbound button as a fallback action. Refs: Stripe Status page UX (https://status.stripe.com/), GitHub status indicators, the platform's own Stocks page live-dot pattern (already in `/Users/server/elite_platform/app/dashboard/stocks/stocks-client.tsx` lines 192-201 and 318-321). Consistency with Stocks/Crypto liveness UX is the cheap win.

---

## Cross-page patterns to fix everywhere

These showed up on 3+ pages and should be addressed as a system, not per-page:

- **Decorative emoji density.** Strip 70%+ of emoji use across stocks, crypto, calendar, risk-score, indicators, should-i-trade. Keep emoji only in the empty-state illustrations and the home dashboard. Replace section-header emoji with typographic uppercase labels in `tracking-[0.18em]` slate-500 (the platform already uses this style elsewhere).
- **Three-color stoplight (red/amber/green) reused for every visualization.** Add at least one secondary scale: a sequential teal-to-magenta for neutral metrics, a diverging blue-to-orange for "vs benchmark" deltas. Refs: Tableau color palette guide, Vega's diverging schemes, Bloomberg Terminal cell schemes.
- **Tables without column visibility / density toggle / saved views.** Add a single shared `TableControls` component (Compact ↔ Confortabil density, "show columns" multi-select, "save view" pill) wired to localStorage. Apply on stocks, crypto, calendar history.
- **Live-dot inconsistency.** Stocks and Crypto have `live-dot` + "Xm ago"; News, Calendar, Risk Score, Should-I-Trade do not. Standardize a `<LivePulse updatedAt={...} />` component used on every data page.
- **Romanian copy quality.** Several "Cum citesc?" and "Ce să faci acum" blocks read like translated AI prose. Ask Alex to rewrite the prescriptive copy in his voice (anti-FOMO, conservative, calm) — same rule as Cristian's emails. No em dashes anywhere (already fine on Stocks/Crypto, double-check Risk Score and Calendar).

---

## Suggested implementation order (cheapest pro-up first)

1. **News page event clustering + real source typography** — biggest visual delta for least code, no new data sources needed beyond the existing RSS aggregator.
2. **Stocks zone-ladder visual + per-row mini-candles** — kills the "wall of columns" feel, reuses Yahoo sparkline data we already fetch.
3. **Calendar flags + sparkline of last 12 prints** — Forex Factory already gives us the data, we just under-use it.
4. **Risk Score consolidation** (one canonical hero + stacked bar layer + heatmap matrix) — biggest copy-and-paste reduction.
5. **Crypto derivatives strip** — needs new data integration (CoinGlass / Velo) but flips the page from CoinGecko-clone to trading-desk.
6. **Indicators screenshots + embedded TradingView widget** — highest-conversion visual upgrade for the lowest-traffic page.
7. **Should I Trade rename + briefing reframe** — naming change is free, the rest depends on the existing IntradayDashboard component which needs a separate audit pass.
