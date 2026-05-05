# Pro-Up Marketing Audit – Armata de Traderi

Scope: 6 public pages (landing, upgrade, track-record, sesiuni, legal x3, blog index). Goal: kill the "made entirely with AI" feel. Focus on what can be upgraded without changing the brand voice or the dark-emerald system. All references are real shipping sites.

Site rules respected: no em dashes in user copy, mobile-first 375px, emerald `#10B981` on `#09090B`, no fake performance numbers, no member Telegram bot.

---

## Page: Landing (/)

File: `app/page.tsx` (355 lines) + `components/marketing/hero-section.tsx`, `testimonials-section.tsx`, `pricing-section.tsx`.

### Current state
Long single-column scroll: HeroIntro → Hero (aurora bg + 4 stat tiles) → About → red-tinted Track Record teaser → 5 alternating "Instrumentele Tale" feature blocks (each with a hand-built fake mini widget in a glass card) → Alex's Brain → 3 big % stats with NumberTicker → emoji marquee → Testimonials (initial-letter avatars, 5 stars hardcoded) → Pricing → FAQ → final CTA.

### What feels AI-generated
- **Mini-widgets are obviously fake** — the Risk Score circle hardcodes "83 CUMPARA" while the page also fetches the live `riskScore` from Supabase but never uses it; the Stocks card lists TSLA/MSFT/GOOG/NVDA/ORCL with frozen prices ($360.59, $373.46…) that will look stale in a week; the Pivots card shows "3/9" forever. Every fake widget is wrapped in the same `glass-card rounded-2xl` pattern, so all 5 features visually rhyme to the point of monotony.
- **Stat soup with no source** — "85% spun că au înțeles mai bine piața", "70% spun că au evitat o decizie proastă". No methodology, no n=, no date, no link to a survey. Reads like AI filler. Same for the "350+ traderi activi" repeated 3 times on the page (hero badge, hero strip, stat block, marquee).
- **Emoji marquee trust bar** — `⚡ Risk Score săptămânal · 📊 55+ Video-uri Elite · 🎯 Indicatori TradingView exclusivi…` is the single clearest "ChatGPT wrote this" tell. Pro fintechs do not put emoji bullets on a logo bar; they put logos.
- **Testimonials are weakest social proof tier** — initial-circle avatars, hardcoded 5-star row, "Discord member" labels. No avatars, no Discord screenshot, no @handle, no date. The fact that the Tracking Record page has real Discord screenshots and this page does not is the giveaway.
- **Generic h1 + sub** — "Investește și tranzacționează cu un plan clar / Comunitate de investitori și traderi cu rezultate reale". Could belong to any trading group on the planet. The actual differentiator (Alex called -60% crash, 100% USDC before October) is buried 3 sections down.

### Pro-up ideas
1. **Lead with the receipt, not the promise** — Replace the abstract h1 with a dated, specific claim and a real Discord screenshot inline (like Track Record's Oct 10 entry). Stripe does this with code samples in the hero, Linear does it with an actual app shot. Reference: https://stripe.com (look at the live invoice/code panel right of the headline) and https://linear.app (the headline is "The system for modern software development" but the visual is the actual app, not a fake widget).
2. **Make the 5 feature widgets live, not stubs** — The risk-score query is already in the file. Use the real `riskScore`/`riskDecision`/`btcPrice` you fetch, render an actual sparkline from Supabase, label it "Live • actualizat acum X minute". For Stocks, pull the same Finviz-cached JSON the dashboard uses; for the educational module, pull last 3 published videos with real R2 thumbnails. Reference: https://dune.com (every panel on their landing is a live query) and https://www.tradingview.com (every chart is real data, not a mock).
3. **Replace the emoji marquee with a real proof bar** — Logos of platforms used (TradingView, Discord, Stripe, Arbitrum, Cloudflare R2, Patreon) in monochrome, plus 1 line of press/badge if any. If no press, swap for a "Cum ne folosesc membrii" 3-card strip with quoted Discord messages + timestamp + Discord avatar (use the OAuth avatars you already have permission for). Reference: https://resend.com (logo strip "Powering email at…") and https://vercel.com landing logo wall.
4. **Testimonials = embedded Discord screenshots** — Drop the avatar circles entirely. Replace each `SpotlightCard` with a faux-Discord message bubble: avatar + display name + role pill + message + timestamp. Same component you already render for Track Record. Bonus: include a "View on Discord" deep link. Reference: https://www.notion.com/customers (real headshots + role + company, never initials), https://cursor.com (testimonials are tweets with verified blue checks, not paraphrased quotes).
5. **Kill the duplicate "350+ traderi" repetition; replace 3rd stat block with one big interactive panel** — The 85%/70%/350+ block is the weakest section. Replace with a "Last 30 days at Armata" live ticker: messages on Discord, video views, members joined, BTC calls posted (numbers from your real DB). Reference: https://plausible.io/sites (live counters), https://www.cursor.com (uses "X million developers" with verifiable GitHub data), https://www.42macro.com home (live regime indicator, no fake stats).
6. **Hero stat strip needs hierarchy, not 4 equal pills** — Currently 350+ Traderi · 55+ Video-uri · 4+ Ani Experiență · 7 Zile Trial all the same weight, all CountUp-animating at once = noisy. Make one hero number (e.g. "92% cash înainte de crash, 30 octombrie 2025") and demote the rest to a quiet supporting line. Reference: https://stenoresearch.com (one bold claim, supporting subtext) and https://www.anthropic.com (single hero metric, never a 4-pill row).

---

## Page: Upgrade (/upgrade)

File: `app/upgrade/page.tsx` (424 lines) + `components/upgrade/stripe-pay-button.tsx`, `trial-activate-button.tsx`.

### Current state
Header → "Free vs Elite" 14-row comparison table → trial banner (logged-in vs logged-out variants) → 3 paid plan cards (30/3mo/12mo) with veteran price toggle, USDT/USDC and Binance Pay buttons, Stripe gated to admins → Bot Copytrade Coming Soon (2-card bundle vs standalone) → "Vrei să plătești dar nu știi cum?" lead form.

### What feels AI-generated
- **No anchor pricing, no /month equivalent, no "save X%"** — €49 / €137 / €497 sit raw with no "€45/lună (3mo)" or "€41/lună (12mo)" callout. The only savings hint is `plan.savings` from constants but it is shown small and inconsistently. The 12-month plan should scream "10x ROI vs monthly".
- **14-row Free vs Elite table is wall-of-checkmarks** — every Elite cell is a green ✓, every Free cell except 2 is a red ✗. This is the literal output you get if you paste "make me a comparison table for a SaaS" into ChatGPT. No grouping (Community / Tools / Education), no tooltips, no "preview" links to dashboards, no row icons.
- **Three Coming Soon disabled buttons in a row on the Bot section** — "Disponibil în curând" appears 2x in the same panel, plus the standalone card lists 3 grey ✗ items (Fără acces / Fără suport / Fără indicatori) which is anti-conversion: you are advertising what they DON'T get. Pro pages frame negatives as positives or hide them.
- **Stat tiles "12 Active · 62 Tranzacții · 51.6% Win Rate · 24/7"** at the bottom of a Coming Soon section — those 4 numbers shout AI. 51.6% win rate on a Coming Soon product also borders the "fake performance" line.
- **No payment method logos** — "Plătește cu crypto (USDT/USDC)" and "Plătește cu Binance" are text-only buttons; no Tether/Circle/Binance/Stripe glyphs. Looks like prototype copy. Trust signals (refund policy, ANPC link, encrypted padlock) are completely absent next to the buy CTA.

### Pro-up ideas
1. **Add a 30/90/365 segmented toggle with monthly-equivalent prices** — Stripe-style segmented control above the cards: "Lunar / 3 luni / Anual (–17%)". Each card highlights the monthly equivalent in big numbers and the total in small. Reference: https://linear.app/pricing (annual/monthly toggle with "save 2 months"), https://www.notion.com/pricing (monthly-equivalent in headline, total in subtext), https://stripe.com/pricing (segmented frequency).
2. **Group the comparison table and add row icons + tooltips** — Break the 14 rows into 3 collapsible groups: "Comunitate", "Instrumente live", "Educație". Each row gets a 16px icon and a tooltip that links to a screenshot of the actual feature. Reference: https://www.notion.com/pricing (grouped feature comparison with hover tooltips), https://supabase.com/pricing (icon + tooltip per row), https://posthog.com/pricing (best-in-class grouped comparison).
3. **Replace fake bot stats with a "Notify me" form and a real preview** — Drop the 12/62/51.6%/24/7 tiles, replace with: a dated changelog line ("Backtest în curs · lansare estimată Iunie 2026"), one screenshot/loom of the dashboard from `/data/track_record_cache.json`, and an email capture "Anunță-mă când e gata". Reference: https://linear.app changelog, https://www.cursor.com waitlist signup pattern, https://fly.io launch pages.
4. **Add a "Most popular" badge that animates and price-anchor against the monthly** — The 3-month card already has `highlighted: true` but the badge is a static pill. Animate it (subtle pulse), and on hover/scroll show a side-by-side "Plătit ca lunar = €147 · Tu plătești €137". Reference: https://framer.com/pricing (animated popular badge + savings callout), https://vercel.com/pricing (Pro is visually heavier, with a glow ring), https://railway.com/pricing.
5. **Add trust strip directly under each price** — Small horizontal row under the price showing: Stripe logo / Visa / Mastercard / Tether / USDC / Binance Pay logos in monochrome + a "Plată sigură · ANPC" link + "Garanție 7 zile trial". Currently those signals are scattered or missing. Reference: https://www.coinbase.com/institutional (trust badges directly under CTA), https://stripe.com/payments (logos as the proof, not text), https://plaid.com (security badges adjacent to action).
6. **FAQ inline at bottom of pricing page** — Right now FAQ only lives on the landing. Pricing page needs its own 6-8 question FAQ targeting buying objections (refund policy, what happens after 7d trial, can I switch from monthly to annual mid-cycle, etc.). Reference: https://linear.app/pricing (FAQ block right under tiers), https://www.notion.com/pricing, https://posthog.com/pricing.

---

## Page: Track Record (/track-record)

File: `app/track-record/page.tsx` (189 lines) + `track-record-client.tsx`.

### Current state
Single column 900px max: hero (h1 + sub) → 3-stat glass card (92% / 100% / 3 luni) → narrative callout with emerald left border → vertical timeline of 15 dated entries with cash% bar and clickable lightbox screenshots → LivePerformanceSection (live equity) → closing CTA.

This page is by far the strongest of the six. It has real screenshots, real dates, real claims. It is the model the rest of the site should be measured against.

### What feels AI-generated
- **Diacritics are missing in the entries** — "Saptamana 1 deja 55% cash", "AM VANDUT TOT", "Astept sa vad ce se intampla". The rest of the site uses ă/â/î/ș/ț everywhere; this page reads like it was machine-translated and then stripped. CLAUDE.md explicitly requires diacritics.
- **3-stat header has same problem as landing** — "92% / 100% / 3 luni" in a generic 3-col glass card. The narrative is great, but the number presentation is identical to every AI starter dashboard. No visual hierarchy, no chart.
- **Timeline rows look like a todo list** — dot + date + title + cash bar + arrow. After 5 rows the eye glazes. There is one `highlight: true` row (Oct 10) with a red border but the others have zero visual differentiation between major events ("AM VANDUT TOT") and minor updates.
- **No equity curve at the top** — The single most powerful asset Alex has (a chart showing portfolio survived crash) is rendered as 15 timeline dots and a separate `LivePerformanceSection` lower down. Should be one big chart with annotations referencing the dots. This is exactly how 42macro and Steno present a thesis.
- **Lightbox is a generic dark overlay** — clicking a row opens a basic modal with "Inchide" link. No prev/next, no caption with the original Discord channel name, no zoom, no copy-link-to-anchor.

### Pro-up ideas
1. **Add diacritics on every entry, immediately** — Re-write the 15 `Entry.title`/`context` strings with proper Romanian. This is the single highest-leverage 5-minute fix on the whole site. (Site rule from CLAUDE.md.)
2. **Replace 3-stat header with one annotated equity chart** — Render the actual `track_record_cache.json` line and overlay markers at the same dates as the timeline entries. Click a marker, scroll-snap to the corresponding timeline row. Reference: https://www.bridgewater.com (chart-first thesis), https://www.42macro.com (annotated equity charts), https://stenoresearch.com (chart-with-callouts is their entire format), https://research.fidelity.com.
3. **Differentiate timeline rows by event severity** — 3 visual tiers: routine update (current style, dimmed), pivot (medium emerald accent), turning point (full-width card with screenshot inline, like Oct 10). Reference: https://linear.app/changelog (clear tier hierarchy between fixes / features / breaking changes), https://github.com/features/changelog, https://vercel.com/changelog.
4. **Upgrade the lightbox to a proper article-mode viewer** — keyboard prev/next, caption with channel name + author + Discord deep link, "Copy link to this entry" anchor, image zoom. Match the polish of Linear's media viewer or Notion's image preview. Reference: https://linear.app (image preview UX), https://www.notion.com.
5. **Add a "verified by timestamp" pill on each entry** — Discord messages have immutable IDs, you can construct a `discord.com/channels/.../...` deep link. Render a small pill `verified · discord.com/channels/...` that opens the original message. Currently the page says "timestamp imuabil" in copy but does not prove it. Reference: https://www.kalshi.com (event proofs link out to source), https://polymarket.com (every market has source links).

---

## Page: Sesiuni 1-la-1 (/sesiuni)

File: `app/sesiuni/page.tsx` (315 lines) + `components/sesiuni/booking-form.tsx`.

### Current state
Hero ("Învață să tranzacționezi singur") + dual CTA → 6 subject cards in 3-col grid (each: emoji + title + 2-line desc) → amber callout for "active traders need 3+ sessions" → 2 pricing cards (€75 1h vs €197 pack) → booking form panel → 8-question FAQ → closing CTA with Discord/Elite alternatives.

### What feels AI-generated
- **6 emoji-icon cards in identical glass panels** — 📊🪙📈🛡️📰🎯. This is the Lovable / Bolt / v0 default output for "make me a services page". Real coaching pages use either custom illustrations, headshots, or course outlines, not emoji + 2-sentence bullets.
- **No headshot, no Loom intro, no calendar** — Alex's face does not appear on the page. For 1:1 mentoring at €75/hr the buyer needs to see who they're paying. Booking is an email form ("te contactez în 24h cu opțiuni de oră") instead of a Cal.com / SavvyCal embed showing real availability.
- **Pricing cards are identical to the /upgrade pricing cards** — same `panel card-hover rounded-[1.5rem]`, same emerald accent, same "POPULAR" badge. Two different products on the same site share an identical layout, which makes the whole site feel like the same template applied twice.
- **No social proof** — There is a /track-record full of receipts on the public site, but /sesiuni has zero quotes from past 1:1 clients, zero "X people booked this month", zero before/after. The FAQ is the only page asset doing trust work.
- **"Ce poți învăța" copy is generic course-marketing** — "TradingView de la zero", "Cum îți alegi monedele", "Risk management de bază". Could be any trading coach. No specific deliverable per session ("you leave with: a saved TradingView layout, a watchlist of 12 tickers, a position-size calculator").

### Pro-up ideas
1. **Embed Cal.com (or SavvyCal) directly on the page; remove the email-back-to-you form** — Real availability calendar = trust + 30% conversion lift on coaching offers. The booking form is currently the friction point. Reference: https://cal.com/rick (live coach booking), https://savvycal.com (better UX for paid coaching), https://lennypodcast.com/coaching-sessions (Lenny Rachitsky's coaching page is the gold standard for solopreneur coaching pages).
2. **Add a 60-second Loom intro from Alex at the top of the hero** — Face on the page. Voice. One sentence about who this is for and who it isn't. Reference: https://lennysnewsletter.com/p/coaching, https://www.julian.com (Julian Shapiro's services page: video first, copy second), https://anthonyacri.com.
3. **Replace 6 emoji subject cards with a "What you walk away with" deliverable list** — Each subject becomes a 3-line block: outcome verb + concrete artifact + screenshot. e.g. "Pleci cu un layout TradingView salvat: 4 timeframes, 7 indicatori configurați, alerte pe BTC + ETH" + actual screenshot of the layout. Reference: https://maven.com/courses (deliverable-led course landing pages), https://www.julian.com/copywriting/ (artifact-led service pricing), https://www.typeshare.co.
4. **Add 3 client testimonials with full name, before/after one-liner, date** — Even just "Andrei, 28, București: am venit cu 0 setup TradingView, am plecat cu watchlist de 12 monede + alertă risk score. 14 martie 2026". Reference: https://www.julian.com (Julian's coaching uses raw client quotes with full names), https://lennysnewsletter.com/coaching, https://www.typeshare.co.
5. **Differentiate the pricing cards from /upgrade pricing cards** — Use a different layout: maybe a single hero card with "1h €75" toggling to "Pachet 3 ore €197" (like Apple's product configurator), instead of two parallel cards that mirror the SaaS pricing pattern. Reference: https://www.apple.com/shop/buy-iphone (configurator-style switch), https://framer.com/pricing (single-card with plan switcher), https://www.figma.com/pricing.
6. **Pin Alex's headshot + 2-line bio in a sticky side rail on desktop** — Alex's face stays visible while the user scrolls subjects/pricing/booking. On mobile it can collapse to the hero. Reference: https://lennypodcast.com/coaching-sessions sticky author panel, https://www.julian.com.

---

## Page: Termeni / Confidențialitate / Rambursare (/termeni, /confidentialitate, /rambursare)

Files: `app/termeni/page.tsx` (330 lines), `app/confidentialitate/page.tsx` (281 lines), `app/rambursare/page.tsx` (191 lines).

### Current state
Same template across all three: Navbar + Container max-w-3xl + emerald `gradient-text` h1 + last-updated date + a series of `<Section>` components (h2 + bullets/paragraphs). All content is in Romanian with diacritics. PFA details (CUI 54517198) are filled in. Cross-links between the three pages exist.

### What feels AI-generated
- **No table of contents / no anchor nav** — 16 sections on /termeni, ~10 on the others. User has to scroll-search to find "Refund" or "Cookies". Pro legal pages have a sticky left rail or a "Sărit la secțiune" select.
- **Identical visual treatment across all three pages** — same `gradient-text` h1, same `last-updated` line, same Section component. Looks like one prompt that generated three files. Stripe/Linear differentiate legal pages by adding a small page-purpose summary card at the top.
- **No "What changed" log** — "Ultima actualizare: 15 aprilie 2026" but no diff. When you update terms, users have no way to see what changed since their last login.
- **Inline italic blockquote on /rambursare** — "Sunt de acord cu livrarea imediată..." rendered as italic in a thin glass box. Looks like a markdown render, not a designed legal artifact.
- **No print/PDF export, no contact-shortcut card** — These are pages that get linked from emails and Stripe checkout receipts. They need a "Contactează-ne pentru întrebări" sticky CTA and a "Print PDF" button at the top.

### Pro-up ideas
1. **Sticky left-rail TOC on desktop, sticky select on mobile** — Auto-generate from the `<Section>` titles. Highlights current section on scroll. Reference: https://stripe.com/legal (sticky TOC, current-section highlight), https://linear.app/terms, https://vercel.com/legal/terms.
2. **Top-of-page summary card** — Above the h1, a small "Pe scurt" panel: 3 plain-language bullets (e.g. "Conținut digital, livrat instant. Trial 7 zile, fără card. Rambursarea se face doar în primele 7 zile de trial."). Reference: https://basecamp.com/about/policies (every legal page opens with a "What this is" card), https://gumroad.com/legal/terms-of-use (plain-English summary above the legal text).
3. **"Diff de la ultima versiune" expandable** — Below the last-updated line, a `<details>` block that lists what changed in this version vs the previous one. Reference: https://www.notion.com/notion/Notion-Personal-Information-Use-Policy-FAQ (changelog of policy changes), https://stripe.com/legal/ssa (versioned with diffs).
4. **Make the three legal pages a single `LegalShell` component** — Same TOC + same header + section children passed in. Right now each page reimplements `<Section>` and the header markup. Cleaner code = easier audit. Reference: https://vercel.com/legal (consistent shell across all 9 legal pages).
5. **Add ANPC/SOL footer block + "Contactează DPO" sidebar card** — Currently /termeni has the ANPC links buried in section 15. Pull them into a persistent side card alongside the contact email; required by ANPC consumer-protection guidance for RO ecommerce. Reference: https://www.emag.ro/info/termeni-si-conditii (RO ecommerce gold standard for ANPC display), https://www.elefant.ro/info/termeni.

---

## Page: Blog (/blog)

File: `app/blog/page.tsx` (91 lines).

### Current state
Header (eyebrow + h1 + description) → 2-card vertical list (1-col grid). Each card: category pill (emerald) + date + read-time + h2 + 2-line excerpt + "Citește articolul →". That's the entire page.

### What feels AI-generated
- **Two articles, displayed as huge stacked cards** — Looks like a placeholder, not a content hub. With 2 posts you should not be using a 1-column grid that makes the page 1500px tall.
- **Hardcoded `articles` array in the component** — No CMS, no MDX index, no `generateStaticParams` from filesystem. With only 2 posts that's defensible, but the moment you ship a 3rd you'll be editing tsx by hand. (Confirmed: the two slugs in `app/blog/` are also hand-built directories.)
- **No author, no cover image, no tags** — Just date + read-time + a single "Analiză"/"Educație" pill. Compare any modern dev/finance blog: cover, author headshot, multiple tags, view count.
- **No newsletter capture, no related posts, no search** — A blog with 2 posts and no email capture is missed conversion. Each post + the index should have a "Abonează-te la newsletter Cristian Chifoi" inline CTA (you already have the email-automation pipeline for this).
- **Empty SEO surface** — 2 articles are not enough to rank. The blog has 6+ months of Discord analyses and YouTube countertrade reports that could be turned into 20+ posts almost mechanically.

### Pro-up ideas
1. **Switch to MDX (or Contentlayer / Velite) and a real index** — `content/blog/*.mdx` with frontmatter (title, date, cover, author, tags, excerpt). Build-time index, RSS feed, sitemap entries. Reference: https://leerob.io/blog (Lee Robinson's MDX setup is the canonical Next.js blog reference), https://vercel.com/blog (real CMS), https://shadcn.com/blog (lightweight MDX).
2. **Add cover images, author block, tags** — Each card needs a 16:9 cover, Alex's avatar + name, 2-3 colored tags. The Track Record page already proves the codebase can handle real screenshots; reuse the R2 bucket pattern. Reference: https://stripe.com/blog (cover + author + reading time done minimally well), https://linear.app/blog (clean author + cover), https://anthropic.com/news.
3. **Add a featured post hero + 2-col grid below** — With even 4-5 posts, a magazine-style layout (1 large featured + 4 in a grid) reads as a destination, not a placeholder. Reference: https://www.bloomberg.com/markets-magazine (top story + grid), https://www.dwarvesf.com/blog, https://every.to.
4. **Inline newsletter capture + related posts at end of every article** — Right now there's no email capture on /blog at all. Use the existing Resend + email-drip queue. Reference: https://stratechery.com (Ben Thompson's email capture is the SaaS-blog gold standard), https://every.to, https://lennysnewsletter.com.
5. **Repurpose YouTube countertrade + risk-score history into evergreen posts** — You already have `/scripts/youtube-countertrade/` running daily Claude analysis and historical risk-score snapshots in Supabase. A weekly/monthly auto-generated "Buletinul Pieței" post (human-edited) doubles your SEO surface in 30 days. Reference: https://www.42macro.com/insights (newsletter-style market posts), https://stenoresearch.com/research, https://research.coinbase.com.
6. **Add reading-progress bar + sticky article TOC on individual post pages** — Standard for any 8-12min read. Reference: https://leerob.io/blog/* (reading progress + TOC), https://www.smashingmagazine.com, https://overreacted.io.

---

## Cross-cutting fixes (apply everywhere)

These are things that show up on multiple pages and would lift the whole site:

1. **Stop using `glass-card rounded-2xl` as the universal container.** Every section on every page wraps in the same translucent card. Add 2-3 alternate surface treatments (solid `surface-graphite`, bordered-only, raw `bg-transparent` with a left rule like the Track Record callout). Even 3 surface variants cuts 80% of the AI-feel.

2. **Replace all 5-star rows and emoji-bullet trust strips** — neither passes for B2B/prosumer SaaS in 2026. Logos, screenshots, or quoted Discord messages.

3. **Audit every hardcoded number** — Risk Score "83", Stocks "$360.59", "85%/70%", "12/62/51.6%", "350+" appears 4+ times on landing. Either wire to live data or remove. AI sites are full of these placeholders that nobody updates; pro sites either show live data or no data.

4. **Diacritics audit** — /track-record entries are missing them; verify others. Site rule from CLAUDE.md.

5. **Em-dash audit** — Site rule says no `—` in user-facing copy. I spotted at least one in `components/marketing/pricing-section.tsx` line 26 (`După 7 zile decizi dacă merită.`) — that one's fine, but `app/sesiuni/page.tsx` lines 36, 102, 114 do use `—`. Worth a global grep before launch.

6. **Add a single global "Powered by" / build-info footer line** — `Vercel · Supabase · Stripe · Cloudflare R2 · Discord` in dim text under copyright. Tiny detail, big credibility uplift. Reference: https://railway.com footer, https://supabase.com footer.
