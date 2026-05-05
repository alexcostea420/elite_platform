# Pro-Up: Global UI Audit (Elite Platform)

Scope: every component shared across all pages: navbar, mobile nav, dropdowns, footer, command bar, design tokens, animations, marketing hero/stats/pricing/testimonials/FAQ, trial popup, payment buttons, blur guard, loading states, feedback widget, profile menu.

The recurring theme: components are technically functional, dark-mode emerald, Tailwind defaults. Everything looks like it was assembled in one afternoon by someone who reads documentation, not someone who has shipped a product. Spacing is uniform but not deliberate, hierarchy is flat, microinteractions are absent, copy is OK but typography is generic, emojis are doing the work that custom icons should be doing. That is the "made entirely with AI" feeling.

The targets below are not "make it look like Linear" copies. They are concrete primitives those teams ship that the platform currently lacks.

---

## Element: Top Navbar (desktop)

File: `components/layout/navbar.tsx`

### Current state
Fixed top bar, `bg-crypto-dark/95 backdrop-blur-sm`, white/5 bottom border. Brand = soldier helmet emoji + gradient-text wordmark + "by Alex Costea" 10px caption. Dashboard mode shows: Dashboard link in emerald, three NavDropdown groups, "🤖 Bot" link, "Prelungeste" link, then CommandSearchTrigger + ProfileMenu + MobileNav button. Marketing mode shows: 4 marketingNav links, MarketingDiscordButton, "Cont" ghost button, "Intra" accent button.

### What feels AI-generated
1. Soldier emoji (🪖) is the brand mark. Emoji renders differently per OS (Apple vs Win vs Android) and screams "I had no SVG so I used the closest emoji". No real logo, no glyph, no monogram.
2. Every nav item is the same weight (`font-medium`), same color (`text-slate-200`), same hover (`hover:text-accent-emerald`). No visual hierarchy between primary and secondary, no active-section underline animation, no "you are here" indicator beyond pure color swap.
3. "Prelungeste" sits in the same row as nav links but uses emerald font-semibold. It is neither a button nor a link. It floats between states. A real product separates "renew/upgrade" into a pill button with subtle pulse, not inline text.
4. Active route detection in NavDropdown uses `pathname.startsWith(item.href)` and just swaps text color. No animated underline (`layoutId`), no left-rail indicator, no breadcrumb echo.
5. Brand caption ("by Alex Costea") is `tracking-[0.15em]` on a 10px line. That tracking works for uppercase eyebrows, not Title Case. It looks copy-pasted from a CSS tip.

### Pro-up ideas
1. Replace 🪖 with a 1-glyph SVG monogram (A or AT in a hand-drawn-ish but consistent stroke), shipped as a React component with the same fill rules everywhere. Reference: Linear's L-mark stays identical at 16px and 64px (https://linear.app), Vercel's triangle (https://vercel.com), Resend's "R" (https://resend.com). Even Mercury uses a custom wordmark, never an emoji (https://mercury.com).
2. Add an animated active-route indicator: bottom 2px line that slides between nav items using Framer Motion `layoutId`. Linear does this on their nav rail, Cursor.com does it on the homepage tabs (https://cursor.com), Posthog does it on docs nav (https://posthog.com/docs).
3. Group the right-hand controls into a single pill cluster with a divider, like Vercel's globalnav: command-bar trigger | notifications | avatar, all inside one rounded container with a 1px white/5 border (https://vercel.com/dashboard). Currently three free-floating elements with `gap-2`.
4. Promote "Prelungeste" to a real renewal pill that shows `Xz rămase` countdown when subscription is < 14 days from expiry. Hide otherwise. Linear, Notion, and Apollo all surface trial-end / billing warnings as a pill in the navbar, not as a permanent link (https://linear.app, https://www.apollo.io).
5. Add a theme/density switcher in ProfileMenu like Stripe Dashboard's "compact view" toggle (https://dashboard.stripe.com). Even if Alex never lights mode, surfacing the affordance signals "this is a real product".

---

## Element: NavDropdown

File: `components/layout/nav-dropdown.tsx`

### Current state
Click-to-open dropdown. `min-w-[180px]`, rounded-xl, white/10 border, `bg-crypto-dark/95`. Items are emoji + label + optional badge. Outside-click + Escape close it.

### What feels AI-generated
1. Emoji as icons. Same problem as the brand: 📈 💹 ₿ 🐋 render differently per platform, sit on uneven baselines, and don't tint. Linear, Posthog, Resend all use Lucide / custom SVG icons that inherit `currentColor`.
2. Open animation = none. The `{open && <div>}` pattern just snaps the dropdown into view. No fade-in, no scale-from-top, no `transformOrigin`. Pro dropdowns animate.
3. Badges are a generic emerald pill with `text-[10px] font-bold`. No size variation, no danger color for warnings, no "NEW" pulse.
4. Single column only, no sub-grouping inside a group, no descriptions under labels. Compare to Vercel's "Products" mega-menu where each item has icon + title + 1-line description (https://vercel.com).
5. No keyboard navigation inside the dropdown — arrow keys do nothing. Only Escape closes. This is a basic a11y miss for what's supposed to be a pro tool.

### Pro-up ideas
1. Replace all emoji with a Lucide icon set used consistently across nav, command bar, mobile nav, sidebar. Reference: Linear navigation icons (https://linear.app), Notion's left rail icons (https://www.notion.so).
2. Add open/close motion: `framer-motion` with `initial={{ opacity: 0, y: -4, scale: 0.98 }}`, exit, `transformOrigin: top`, 150ms cubic-bezier. Stripe's product menu (https://stripe.com) does exactly this.
3. Add a description line under each item for dashboard groups (e.g. "Risk Score BTC — model săptămânal cu 12 inputuri"). Reference: Vercel's product mega-menu (https://vercel.com), Plaid's "Products" dropdown (https://plaid.com).
4. Implement Roving tabindex inside the dropdown so Up/Down/Home/End work, with visible focus ring matching globals.css `focus-visible` ring. Reference: Radix UI navigation-menu primitive used by every serious 2025 SaaS.
5. Add a footer row inside the dropdown for "what's new" or "shortcuts hint" (e.g. "⌘K pentru căutare rapidă"). Linear's command-bar trigger from inside menus, Posthog dropdowns end with a small docs link.

---

## Element: Mobile Nav

File: `components/layout/mobile-nav.tsx`

### Current state
Hamburger button (44x44 with white/10 border). Opens fullscreen overlay with `backgroundColor: #080808`, body scroll lock. Items are 56px tall with emerald active state. Groups have uppercase 12px tracking labels.

### What feels AI-generated
1. Hardcoded inline `style={{ backgroundColor: "#080808" ... position: "fixed", width: "100vw", height: "100vh" }}`. The repeated `top:0, left:0, right:0, bottom:0, position:"fixed"` defensive style screams "I had a bug and I bandaged it". Pro code uses Tailwind utilities + a tested portal.
2. No open/close animation. It just appears and disappears. Mercury, Cursor, Linear all slide the panel from the right or fade-up sheet-style.
3. No bottom nav (tab bar) for the most-used 4 destinations. Mobile users on a trading app reach for thumbs-bottom, not top-right hamburger 60 times a session. Mercury Mobile (https://mercury.com) has a 5-tab bottom nav. Even Notion mobile gives you a bottom bar.
4. Active state is just a tinted bg + emerald text. No left rail indicator, no haptic feedback hint (subtle scale-down on tap), no chevron for groups.
5. Group label is `text-xs font-semibold uppercase tracking-wider` — same default eyebrow Tailwind ships. Could be a real "section divider" with a thin emerald line + clearer hierarchy.

### Pro-up ideas
1. Build a bottom tab bar for `/dashboard/*` with 4-5 anchors (Dashboard / Crypto / Stocks / Whale / Profil). Reference: Mercury banking iOS (https://mercury.com), Robinhood's tab bar, Notion mobile's bottom drawer. Glass-morphic with safe-area inset. Hamburger then becomes a "More" tab.
2. Animate the fullscreen menu in. `motion.div` with `initial={{ x: "100%" }} animate={{ x: 0 }}` for a sheet-from-right pattern. Reference: Linear iOS app sheet, Resend mobile menu (https://resend.com).
3. Add 60ms `transform: scale(0.96)` on tap for every nav item via `active:scale-[0.97]`. Reference: Stripe's button language (https://stripe.com), Apollo's mobile (https://apollo.io).
4. Replace inline-style `#080808` with the actual design token + a backdrop-blur gradient header that fades the navbar smoothly into the menu. Reference: Anthropic.com mobile menu, Linear iOS sheet.
5. Add a search field at the top of the mobile menu that triggers the same command bar (Cmd+K equivalent for touch). Reference: Notion mobile, Posthog mobile docs.

---

## Element: Footer

File: `components/layout/footer.tsx`

### Current state
4-column grid (brand+blurb+social on cols 1-2, Quick links, Legal). Below: copyright row, PFA legal row, 3 disclaimer paragraphs in red-tinted muted text. Compact variant for dashboard pages = single row of links + logout.

### What feels AI-generated
1. 📺 and 💬 emoji as social icons. No YouTube glyph, no Discord glyph. Massive credibility gap on a "pro trading platform".
2. Disclaimer wall takes the same visual weight as nav links. Three paragraphs of legal copy at 12px in `text-slate-600`. It reads "I copied compliance text and slammed it under copyright". Real fintech (Mercury, Plaid, Stripe) hides the wall behind a `Termeni & Risc` link or a collapsible.
3. PFA address row is a single sentence with pipe separators (`CUI: 54517198 | F2026020803003 | B-dul ...`). That's a CSV. Pro footers separate company info into a labeled block (Sediu / CUI / Reg Com / Email).
4. Section headings ("Link-uri Rapide", "Legal") are emerald `font-bold` 16px. Generic. No eyebrow treatment, no spacing rhythm with the link list.
5. No status indicator, no sitemap link, no language switcher placeholder, no "made in Romania" / "powered by" line, no newsletter capture. Footer is dead space.

### Pro-up ideas
1. Replace emoji socials with proper Lucide / Simple Icons SVG (YouTube + Discord + X if applicable). Reference: every footer on https://stripe.com, https://vercel.com, https://ramp.com, https://mercury.com.
2. Add a "Status" block (e.g. "Toate sistemele funcționează · Live" with pulsing green dot) linking to a future status page. Reference: Linear footer status (https://linear.app), Resend footer (https://resend.com), Vercel footer (https://vercel.com).
3. Restructure PFA info as a 3-column legal block: Sediu / Identificare fiscală / Contact. Reference: Ramp's compliance footer (https://ramp.com), Mercury's "Mercury is a financial technology company..." disclaimer block (https://mercury.com) — exactly the tone you want.
4. Promote the disclaimer wall into a `<details>` collapsible labeled "Risc & Disclaimer financiar". Default closed. Reference: Plaid's risk disclosure pattern (https://plaid.com/legal), Coinbase's collapsed regulatory text.
5. Add a sitemap-style 4-column structure: Produs / Comunitate / Companie / Legal — even if some columns have only 2 links. Reference: https://posthog.com (their footer is huge and intentional), https://vercel.com, https://www.notion.so. Better to look "real" than "thin".

---

## Element: Command Search (⌘K)

File: `components/ui/command-search.tsx`

### Current state
Hardcoded list of 22 items grouped into Pagini / Educație / Invest / Trading / Cont. Cmd+K toggles. Arrow keys + Enter navigate. Close on backdrop click or Escape. Trigger button is `hidden md:flex` so mobile has no equivalent.

### What feels AI-generated
1. The item list is hardcoded inline at the top of the file. No dynamic source from the actual nav config (`dashboardNavGroups`). When Alex adds a page, two places drift. Pro command bars read from a single registry.
2. No recents, no favorites, no AI suggestions, no "Jump to" sections. Just a static list. Linear's command bar (Cmd+K) opens with "Recently visited" + "Suggested actions" + "Search results" + "AI" tabs.
3. No actions, only navigation. Cannot toggle blur mode, log out, copy current URL, switch theme, contact Alex, file feedback, see hotkeys. Vercel and Linear ship hundreds of actions in their command bar.
4. No fuzzy match, no scoring. Plain `String.includes`. Typing "rsk" returns nothing for "Risk Score". Reference: cmdk library (https://cmdk.paco.me) used by Vercel, Resend, Linear's spec.
5. The trigger button (`md:flex` only) is inside the navbar but on mobile users get no equivalent. There's no floating ⌘K button, no pull-down search, nothing. Mercury and Notion mobile both surface a global search at the top of mobile.

### Pro-up ideas
1. Migrate to the [cmdk](https://cmdk.paco.me) library by Paco/Rauno (used by Vercel, Resend, Linear's pattern). Free fuzzy search, accessible roving focus, animated open. Reference: https://cmdk.paco.me + https://vercel.com command bar.
2. Add sections in this order: Recents (last 5 routes from sessionStorage) · Acțiuni (logout, blur on, copy url, dă feedback) · Pagini · Tools · Întrebări frecvente. Reference: Linear command bar groups (https://linear.app), Notion's `/` (https://www.notion.so), Posthog's command palette (https://posthog.com).
3. Add an "Întreabă pe Alex" row that pipes free text into the existing Discord bot endpoint when no match is found. Reference: Anthropic's site command bar AI fallback, Linear's "Ask AI" row (https://linear.app/changelog).
4. Reuse the same modal on mobile triggered by a search icon in the top bar or a swipe-from-top gesture. Add an iOS-style spotlight invocation. Reference: Notion mobile search, Linear iOS Cmd+K equivalent.
5. Keyboard hint footer at the bottom of the modal: `↑↓ navighează · ↵ deschide · ⌘K închide`. Reference: every cmdk implementation on https://cmdk.paco.me, Vercel, Resend (https://resend.com).

---

## Element: Design tokens & Animations

File: `app/globals.css`

### Current state
CSS variables for colors. Global `*:focus-visible` ring. Components: `.gradient-text`, `.card-hover` (translate-y-0.5), `.panel`, `.accent-button`, `.ghost-button`, `.glass-card` (+ blue/green/amber variants), `.section-label`. Animations: `fadeInUp` (0.5s), `scaleIn`, `priceFlashUp/Down` (0.8s bg flash), `livePulse` (2s opacity), `shimmer` (1.5s skeleton), `auroraSlow` (18s blob), `marquee-left/right`, `rotateAngle` (4s conic gradient border), `livePulseRipple`. `prefers-reduced-motion` block at the end.

### What feels AI-generated
1. Two `.skeleton` definitions (lines 154-160 and 207-213). Duplicate. The second overrides the first. Tells the reader "this CSS was iteratively patched, never refactored".
2. Every animation is generic ease (`ease-out`, `ease-in-out`). No spring physics, no custom cubic-bezier branding. Linear has a signature ease (`cubic-bezier(0.16, 1, 0.3, 1)`) you can recognize across every transition. We use Tailwind defaults.
3. `card-hover` = `hover:-translate-y-0.5` (2px). That's the most generic SaaS-card hover that exists. No depth-shadow change calibrated, no scale shift, no border glow timing.
4. No motion design system. Animations have random durations: 0.5s fade, 0.8s flash, 2s pulse, 1.5s shimmer, 18s aurora. No `--duration-fast` / `--duration-normal` / `--duration-slow` token. Pro systems define a 3-step duration scale and use it everywhere.
5. The `gradient-border-animated` conic-gradient + `@property --angle` is fancy but used only on hero CTAs, and combined with a magnetic button, and it spins forever at 4s. It looks like a tutorial showpiece, not a restrained accent.

### Pro-up ideas
1. Define a motion token scale: `--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)`, `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`, `--dur-fast: 120ms`, `--dur-base: 180ms`, `--dur-slow: 320ms`. Apply consistently. Reference: Linear's motion principles (https://linear.app/blog), Apple HIG, Vercel design system docs.
2. Replace `card-hover` with a Stripe-style hover: 1px border glow + 8% bg lift + 0px translate (less is more). Stripe's product cards (https://stripe.com/products) demonstrate this. Mercury cards (https://mercury.com/treasury) too.
3. Calibrate `livePulse` to feel like a heartbeat (sharp rise, slow decay) instead of equal opacity in/out. Reference: Linear's live indicators in changelog, Posthog's "events live" indicator (https://posthog.com).
4. Add a global `.surface-elevated` token with depth tiers (E1/E2/E3) using calibrated shadows + 1px highlight on top edge. Reference: Mercury's card depth (https://mercury.com), Apollo's dashboard cards (https://apollo.io). Currently every card looks like every other card.
5. Dedupe `.skeleton`, ship a `<Skeleton variant="card | line | avatar | chart" />` component that matches the actual content shape (see Loading States below). Reference: Posthog's matching skeletons (https://posthog.com), Vercel deployments table skeleton (https://vercel.com/dashboard).

---

## Element: Buttons (`accent-button`, `ghost-button`)

File: `app/globals.css` (lines 60-69)

### Current state
`accent-button` = emerald bg, dark text, shadow-glow, hover swap to soft emerald + stronger glow, active scale 0.98. `ghost-button` = transparent with white/10 border, hover white/20 + bg white/3 + white text. Used everywhere via `className="accent-button ..."`.

### What feels AI-generated
1. Only 2 button variants for the entire platform. No `danger`, `subtle`, `link`, `icon-only`, `tonal` variant. Real systems ship 5-7 variants. We force-mix them by adding ad-hoc Tailwind classes inline.
2. No size prop. Each call site sets `px-` and `py-` independently (compare hero `px-8 py-4 text-lg` vs nav `px-3 py-1.5 text-[11px]`). Result: button heights are inconsistent across the app.
3. No loading state baked in. Every button that fetches reimplements its own spinner (StripePayButton, TrialActivateButton, FeedbackButton). Code drift.
4. No focus ring tied to the button itself, just the global `*:focus-visible`. So focused emerald button + emerald ring + dark offset = bleeds together.
5. Hover is a hard color swap on `bg-accent-soft` with no transition delay. Stripe's button feels expensive because color shifts 80ms before the shadow blooms. Ours fires both at once.

### Pro-up ideas
1. Build a `<Button variant size loading icon iconRight>` component (Radix Slot pattern) with variants: `primary | secondary | ghost | danger | tonal | link`. Reference: shadcn/ui button (https://ui.shadcn.com/docs/components/button), Vercel's geist Button (https://vercel.com/geist/button), Resend's Button.
2. Add the Stripe microinteraction: 80ms color transition + 200ms shadow bloom + 1px translate-y on press. Reference: hover any button on https://stripe.com or https://stripe.com/payments.
3. Add a built-in loading prop that animates from text to spinner (text crossfade, not just replacement). Reference: Linear's "Create" button on issue creation, Resend's submit (https://resend.com/signup).
4. Custom focus ring per variant: emerald ring on primary, white ring on ghost, red ring on danger. Reference: Radix UI focus management, Stripe Dashboard buttons.
5. Add a `<MagneticButton>`-free version for non-hero use. Currently magnetic-button is overused on landing CTAs. Pros use magnetic effects on 1-2 hero CTAs max, never on form submits. Reference: Cursor.com homepage (https://cursor.com) uses magnetic only on the download CTA.

---

## Element: Hero Section

File: `components/marketing/hero-section.tsx`

### Current state
Aurora bg + grid-glow + radial gradient. Pill badge "350+ traderi · Peste 50 membri Elite". H1 with gradient-text "cu un plan clar." 3-line description. Two CTAs (magnetic + accent-border-animated, plus ghost "Vezi prezentarea"). Stats row with CountUp. Video modal opens YouTube embed.

### What feels AI-generated
1. Gradient text on the punchline ("cu un plan clar.") is the most overused 2024 hero pattern. Every AI-generated landing page has emerald gradient text on the keyword.
2. Animated conic-gradient border around the primary CTA + magnetic effect + glow + gradient-text H1 + aurora bg + grid + count-up stats = 5 effects competing for attention. Pro heroes pick one or two and let them breathe.
3. Stat divider row uses `<span className="h-3 w-px bg-white/10" />` between items. Functional but fragile, and the stats themselves are conventional (350+, 55+, 4+, 7) without context. Linear's "Used by 10,000+ teams" + 6 customer logos says more.
4. No product visual. The hero promises a trading platform but shows a YouTube modal button. Reference: Linear, Vercel, Mercury, Cursor — all have a product UI screenshot or interactive widget in the hero. We have aurora.
5. CountUp animates to "350+" on every page load. Without a sense of scale or timeframe ("+50 in ultima luna"), the count feels decorative.

### Pro-up ideas
1. Replace the emerald gradient on the punchline with a single accent word in solid emerald + a subtle hand-drawn underline SVG. Reference: Stripe's "Financial infrastructure for the internet" (https://stripe.com), Mercury's "Banking that does more" (https://mercury.com), Anthropic.com homepage.
2. Drop the conic-gradient border on the primary CTA. Use a calmer hover-bloom + 1 magnetic CTA only. Reference: Cursor.com homepage (https://cursor.com) has exactly one magnetic button.
3. Add an actual product preview: a glass-card snippet showing the live Risk Score V2 dial or the whale-tracker top-3 list, animating in below the CTA. Reference: Linear's hero shows the actual app (https://linear.app), Mercury shows account UI (https://mercury.com), Posthog shows a product chart (https://posthog.com).
4. Replace stat dividers with a horizontal rule of muted emerald dots, or skip them. Add tooltips on hover for context ("+12 noi în martie"). Reference: Ramp's hero stats (https://ramp.com), Plaid's "100M+ accounts connected" (https://plaid.com).
5. Add a "scroll cue" mark that fades on first scroll. Tiny detail but signals craft. Reference: Anthropic.com homepage, Cursor.com (https://cursor.com).

---

## Element: Stats Section

File: `components/marketing/stats-section.tsx`

### Current state
2/4 column grid with NumberTicker animating in on scroll. Tone alternates green/gold. Default: 350+ membri / 55+ video-uri / 4+ ani / 7 zile trial.

### What feels AI-generated
1. Stats are descriptive (count of members, count of videos), not outcome-driven. Same as 1000 other AI landing pages. No "X% reducere FOMO", no "Y% rămân peste 90 zile", no "average trial→paid conversion".
2. NumberTicker fires on every scroll into view, including back-scroll. Becomes noise on a page revisit.
3. `tone === "green" ? text-crypto-green : text-accent-emerald` — alternating colors with no pattern. Reads random.
4. No source/timestamp. "350+ membri" since when? Pros put a small "actualizat aprilie 2026" caption.
5. `text-4xl font-bold` numbers + `text-slate-400` labels. Default Tailwind type scale. No tabular-nums, no font-data, no monospace. The numbers are the point and they look like body text.

### Pro-up ideas
1. Switch the metrics to outcomes per CLAUDE.md "no fake performance numbers" rule. Real outcomes you can use: number of Discord messages, number of analyses delivered, number of weekly Risk Score updates, hours of video. Reference: Posthog's stats (https://posthog.com/about) — they show real product stats.
2. Wrap each stat in a SpotlightCard with an icon + tooltip. Reference: Stripe's payment-volume stats (https://stripe.com), Vercel's deploy stats (https://vercel.com).
3. Use `tabular-nums font-data` for the digits. Add a soft underline that draws in on view. Reference: Mercury's "$X+ saved" stat block (https://mercury.com).
4. Add a "ca de" date next to each stat in `text-slate-600 text-xs`. Reference: Resend's "X emails sent" stats with timestamp (https://resend.com).
5. Drop the green/gold alternation. Pick one: emerald for everything, or emerald + neutral white. Reference: Linear's stats are all white text (https://linear.app/customers), Vercel uses single-tone numbers (https://vercel.com).

---

## Element: Pricing Section

File: `components/marketing/pricing-section.tsx`

### Current state
Standalone trial CTA card on top (large, emerald-bordered, gradient-border-animated button). Below: 3-column paid plan grid using SpotlightCard. Highlighted plan = thicker emerald border, "POPULAR" badge. Each card: name / 5xl emerald price / period / details / savings / perks list with ★ or ✓ / CTA button. Below grid: satisfaction guarantee pill, "Plăți securizate" subtext, 3 emojis (💳 🔐 ₿).

### What feels AI-generated
1. ★ for "prioritar" perks vs ✓ for normal. The star is an emoji, color-mismatched with the bullet, and the conditional check `perk.includes("prioritar")` is fragile string matching. Pro cards use icon badges (🚀 Prioritar) or grouped perk sections.
2. 💳 🔐 ₿ as payment-method indicators. Same emoji problem. No real Stripe / Visa / Mastercard / USDT logos. Looks like a placeholder.
3. Highlighted card differentiated only by `border-2 border-accent-emerald` and `shadow-glow`. No depth lift, no scale, no different bg. Easily missed.
4. Price font is `text-5xl font-bold text-accent-emerald` — that's the only treatment. No struck-through "was X", no monthly equivalent for annual plans, no currency icon styling, no tabular-nums explicitly.
5. CTA buttons inside cards: `bg-accent-emerald text-crypto-dark hover:bg-accent-soft` for highlighted, `bg-slate-700 text-white hover:bg-slate-600` for others. Slate-700 button is the most generic Tailwind tutorial color in existence and looks "AI" instantly.

### Pro-up ideas
1. Replace ★/✓ with a custom Lucide CheckCircle2 in emerald + a Sparkles icon in amber for premium perks. Group perks into "Inclus" / "Bonus" sections. Reference: Stripe pricing (https://stripe.com/pricing), Linear pricing (https://linear.app/pricing), Vercel pricing (https://vercel.com/pricing).
2. Show actual payment provider logos under the cards (Stripe wordmark, USDT, Visa, MC). Reference: Mercury checkout (https://mercury.com), Ramp pricing (https://ramp.com/pricing).
3. Differentiate the highlighted plan with: 1px emerald gradient border + 4px translate-up + subtle emerald inner shadow + "RECOMANDAT" badge with sparkle animation. Reference: Posthog pricing highlight (https://posthog.com/pricing), Resend pricing (https://resend.com/pricing).
4. For the 90/365-day plans, show the per-month equivalent in muted text (€45.66/mo on 90d, €41.42/mo on 365d). Reference: Vercel pricing's per-month math (https://vercel.com/pricing), Plaid's annual/monthly toggle (https://plaid.com/pricing).
5. Replace `bg-slate-700` non-highlighted CTA with `ghost-button` so it reads as "alternative" not "default". Reference: Linear pricing (https://linear.app/pricing) where every non-primary CTA is outlined.

---

## Element: Testimonials Section

File: `components/marketing/testimonials-section.tsx`

### Current state
2-column grid. SpotlightCard with circular emerald avatar (first letter), name, meta, ★★★★★ as text, italic quote.

### What feels AI-generated
1. ★★★★★ as plain text characters. Not real stars, no half-stars, no per-testimonial variance, baseline depends on font.
2. Avatar is the first letter of the name on emerald circle. Generic Gravatar-style fallback that everyone uses. No real photos, no Discord avatars.
3. Italic quote inside `&ldquo; &rdquo;` HTML entities. Reads like blog template.
4. No source attribution beyond `meta` field — no Discord handle link, no date, no "verified member" indicator. Reads like Alex wrote them himself.
5. No carousel, no marquee, no filtering by topic, no "Read more on Discord" CTA. Static grid.

### Pro-up ideas
1. Pull real Discord avatars (with consent) and use them. If not feasible, swap the letter-circle for an animated identicon (boring-avatars library) so each testimonial has visual identity. Reference: Linear's customer page (https://linear.app/customers) with logos, Cursor's testimonials (https://cursor.com) with photos.
2. Add a "verified member" pill (small Discord icon + "membru Elite din ian 2025") — establishes credibility without needing to share PII. Reference: Apollo testimonials (https://apollo.io), Resend "loved by" wall (https://resend.com).
3. Swap text stars for a custom 5-star SVG with consistent kerning + half-star support. Reference: Trustpilot widget styling, Stripe "trust" elements.
4. Add a marquee row of Discord handle bubbles ("@alex.r joined Elite", "@maria_t reached profit goal") under the testimonial grid. Reference: Posthog wall of love (https://posthog.com/wall-of-love), Resend testimonial wall (https://resend.com/customers).
5. Each testimonial card = "Read on Discord →" link to the original message (or to a public showcase page). Reference: Loom testimonial wall (https://loom.com/customers), Vercel customer stories.

---

## Element: FAQ Section

File: `components/marketing/faq-section.tsx`

### Current state
Container `max-w-4xl`. SectionHeading + a list of FaqItem accordion rows. Default first item open. Toggling closes others (single-open).

### What feels AI-generated
1. Single-open is implemented via `openIndex: number | null` state. No animation on the chevron rotation, no measured-height transition, no smooth grow. Just toggle visibility (depending on FaqItem impl).
2. No category tabs (Plata / Acces / Refund / Discord). Linear, Posthog, Stripe all categorize FAQ questions.
3. No search inside FAQ. With 10+ questions users scroll forever.
4. No "still have questions" CTA at the bottom of FAQ pointing to Discord / email.
5. Section heading uses gradient-text on "Întrebări Frecvente". Reusing the same emerald gradient on every section H2 makes them all bleed together.

### Pro-up ideas
1. Add categorized tabs above the FAQ list (Plata · Acces · Refund · Discord · Tehnic). Reference: Stripe support hub (https://support.stripe.com), Notion FAQ (https://www.notion.so/help).
2. Animate accordion with measured height + chevron rotation via Framer Motion / Radix Accordion. Reference: shadcn Accordion (https://ui.shadcn.com/docs/components/accordion) used by Vercel, Resend.
3. Add a search bar above the FAQ that filters questions live. Reference: Plaid docs FAQ (https://plaid.com/docs), Posthog docs (https://posthog.com/docs).
4. End the section with a "Nu ai găsit răspunsul?" card linking to Discord + email. Reference: Linear FAQ (https://linear.app/contact), Resend support widget.
5. Drop the gradient-text on every section heading. Reserve gradient for hero only; use solid white + emerald accent word. Reference: Anthropic.com section heads, Mercury sections.

---

## Element: Trial Popup

File: `components/marketing/trial-popup.tsx`

### Current state
Triggers when user scrolls past 40% of page. Backdrop + centered modal. Soldier emoji, "7 zile gratuit. Zero risc." headline, blurb, accent CTA, "Nu acum" dismiss link. SessionStorage suppresses re-show.

### What feels AI-generated
1. Scroll-trigger at exact 40% is the most generic exit-intent fallback pattern. No exit-intent (mouse-leave-top), no time-on-page consideration, no scroll-direction logic. Just hits everyone at 40%.
2. Soldier emoji again as the eye-catcher. Same brand consistency problem.
3. Modal opens with no animation (just `if (!show) return null`). Pro popups slide-up from bottom or fade-scale from center.
4. Two dismiss paths (X button + "Nu acum" link) but no "Don't show again for 7 days" option. SessionStorage means it returns next visit.
5. CTA copy "Începe acum - gratuit" is generic. Could be specific ("Activează cele 7 zile") with a countdown to today's trial slot.

### Pro-up ideas
1. Replace scroll-40% with smarter trigger logic: exit-intent on desktop, 60s dwell on mobile, scroll-up after 50% on either. Reference: Stripe's onboarding nudges, Linear's growth modals (study via marketing).
2. Animate from bottom on mobile (sheet style) and fade-scale on desktop. Reference: Mercury web modals (https://mercury.com), Resend signup flow (https://resend.com/signup).
3. Add today's trial-slot status: "Slotul de azi: 1/1 disponibil" with a live dot. Connects to the existing `/api/trial/status`. Reference: Resend "join the waitlist" with realtime count (https://resend.com), Notion's "active users" feel.
4. Replace soldier emoji with a small animated emerald checkmark or a subtle confetti burst. Reference: Stripe's "ready to go" celebration (https://stripe.com/atlas), Plaid's success states.
5. Localize storage key per session AND per visit count. Reference: Posthog's announcement banners (https://posthog.com), Notion's first-time popups.

---

## Element: Stripe Pay Button + Trial Activate Button

Files: `components/upgrade/stripe-pay-button.tsx`, `components/upgrade/trial-activate-button.tsx`

### Current state
StripePayButton: redirects to `/upgrade/pay/card?plan=...`, shows spinner + "Se deschide…" while routing. TrialActivateButton: fetches `/api/trial/status` on mount, POST `/api/trial` on click, redirects to `/dashboard`. Three states: available / loading / 429-cooldown.

### What feels AI-generated
1. Each component reimplements its own button styles inline. `bg-accent-emerald text-crypto-dark hover:bg-accent-soft` repeated. No shared `<Button loading>` primitive. Code drift visible.
2. Spinner is the Tailwind default `animate-spin border-t-transparent` — exactly the spinner every cmd-c cmd-v tutorial gives you. Stripe's spinner is a rotating gradient ring, Linear's is a 3-dot pulse.
3. Error state in TrialActivateButton: `<p className="mt-2 text-sm text-red-400">{error}</p>`. No icon, no shake animation, no retry button, no support link. Just text.
4. Cooldown state ("Trial-ul de azi a fost luat. Revino mâine la 08:00") is a static amber pill. No countdown timer to 08:00, no "notify me" CTA, no "of luck try X" alt path.
5. Trial activate emoji-free but uses generic ASCII arrow `→` in the CTA. Cute but pro buttons render a Lucide ArrowRight that animates 2px on hover.

### Pro-up ideas
1. Migrate both buttons to a shared `<Button variant="primary" size="lg" loading={loading} loadingLabel="Se deschide…">`. Reference: shadcn Button + AsyncButton patterns (https://ui.shadcn.com), Vercel Geist Button (https://vercel.com/geist).
2. Replace the default spinner with a branded one: 3-dot pulse, or a 2px emerald ring with a longer-than-default rotation (1.4s) and ease that signals work. Reference: Linear's loading dots, Resend's submit spinner (https://resend.com/signup).
3. For the cooldown state, show a live `data-mono` countdown to next trial slot ("Următorul slot peste 3h 24m"). Reference: Resend "rate limit" toasts, Plaid sandbox cooldowns.
4. Wrap errors in a toast (see Toast section below) with icon + retry button + 5s autoclose. Don't render error text inline as the button's child. Reference: Stripe checkout errors (https://stripe.com), Mercury error toasts (https://mercury.com).
5. Add a Lucide ArrowRight that translates +2px on group-hover. Reference: every Vercel CTA (https://vercel.com), Linear "Get started" (https://linear.app).

---

## Element: Blur Guard (presentation mode)

File: `components/ui/blur-guard.tsx`

### Current state
Wraps content. If `?blur=1`, applies `blur-[6px]` + pointer-events-none + a centered "🔒 Elite Only" link to /upgrade.

### What feels AI-generated
1. 6px blur is uniform but jarring at small text sizes. Numbers become unreadable smudges. Pro paywalls use a layered approach (blur + gradient mask + tilt).
2. Lock emoji again. Inconsistent across platforms.
3. The center button is the same on every blurred area regardless of context (stocks zone, RSI, signals all show identical CTA). Plaid and Mercury vary the lock copy by context.
4. No teaser preview. Whole region is blurred. Pro teases the first row sharp + fades-out the rest, so the prospect knows what's behind the curtain.
5. The guard does the right thing structurally but visually it's just `blur(6px)` + a button. No effort spent on the upgrade moment, which is exactly when conversion happens.

### Pro-up ideas
1. Replace uniform 6px blur with a vertical gradient mask — top 30% sharp (preview), bottom blurred + dark gradient. Reference: Apollo's "Upgrade to see more" rows (https://apollo.io), Mercury's "premium feature" overlay (https://mercury.com).
2. Replace 🔒 emoji with a Lucide Lock icon + slight bounce-in animation on hover. Reference: Linear's read-only state icons (https://linear.app), Notion locked-page state.
3. Vary CTA copy by context via a `variant` prop: "Vezi zonele Buy/Sell" / "Vezi RSI complet" / "Deblochează semnalul Elite". Reference: Plaid sandbox upgrade prompts (https://plaid.com), Posthog feature flags upgrade (https://posthog.com).
4. Add a one-line value proposition under the CTA in the blur-guard ("54 membri folosesc azi · 7 zile gratuit"). Reference: Resend feature gates, Vercel "upgrade for X" prompts.
5. Animate the unlock on hover: lock icon shakes then opens. Reference: Stripe checkout's payment-method confirmations, Notion's lock-on-shared-page interaction.

---

## Element: Loading States

Files: every `app/dashboard/*/loading.tsx`

### Current state
Identical pattern across 22 files: `flex min-h-screen items-center justify-center` + spinning emerald ring + "Se încarcă X..." text.

### What feels AI-generated
1. 22 copies of the same component with one word changed in the loading message. No shared `<PageLoader label="..."/>`. The cost of a typo is 22 edits.
2. The full-screen centered spinner is the most beginner React pattern. The user sees a blank layout with a spinning circle, then the actual content materializes. Modern apps stream skeletons that match the eventual layout.
3. `min-h-screen` ignores the navbar — the spinner appears centered behind/over the navbar position momentarily.
4. No staggered reveal. When content arrives, it pops in with no transition.
5. "Se încarcă..." is functional Romanian but adds nothing. Pros leave loading silent or use friendly micro-copy (Linear: "Hang tight", Notion: "Just a sec").
6. No timeout fallback. If a page hangs for 10s+, user just sees the spinner forever with no "still working" or "retry" prompt.

### Pro-up ideas
1. Replace each loading.tsx with a content-shape skeleton matching the actual page layout (header skeleton, 3 card skeletons in a grid, table skeleton with 5 rows). Reference: Posthog's matching skeletons (https://posthog.com), Vercel deployments table skeleton (https://vercel.com/dashboard), Linear's project list skeleton (https://linear.app).
2. Build a `<Skeleton variant="card | line | avatar | chart | table" />` primitive in `components/ui/skeleton.tsx` and compose page-specific skeletons from it. Reference: shadcn Skeleton (https://ui.shadcn.com/docs/components/skeleton).
3. Stream content with React Suspense `loading.tsx` boundaries that scope to a section (header → toolbar → cards), so users see the page filling in like Vercel's project page does (https://vercel.com).
4. Add a 4s timeout that swaps the skeleton for a "Mai durează puțin..." note + retry CTA. Reference: Resend's slow-load fallback, Notion's "Still loading" message.
5. Animate content arrival with `animate-fade-in-up stagger-1/2/3` (already exists in globals.css) so the skeleton-to-content swap doesn't pop. Reference: Linear's content reveal, Mercury's dashboard.

---

## Element: Empty States (when data unavailable)

Note: there is no shared empty-state component in the codebase.

### Current state
Each dashboard handles "no data" inline with a div, a sentence, and sometimes an emoji. No shared treatment.

### What feels AI-generated
1. Every page invents its own empty state. Some show "Nu sunt date" in slate-500, some show nothing, some show a generic message.
2. No illustrations. No mascot. No actionable next-step.
3. Empty != error in pro apps but here they often render the same.

### Pro-up ideas
1. Build an `<EmptyState icon title description action />` component used everywhere. Reference: Linear's empty boards with mascot illustrations (https://linear.app), Notion's empty pages with playful art (https://www.notion.so).
2. Use the existing Armata mascot (referenced in MEMORY for emails — `/email/armata-mascot.gif` on R2) as the friendly empty-state illustration. Reference: Loom's mascot in empty states (https://www.loom.com), Posthog's hedgehog (https://posthog.com).
3. Differentiate empty (no data yet) vs error (failed to load) vs gated (need to upgrade). Three components or one with variants. Reference: Mercury error/empty/gated states (https://mercury.com), Stripe Dashboard.
4. Add a primary action to every empty state ("Sincronizează acum", "Conectează Discord", "Începe trial"). Reference: Apollo's empty CRM lists (https://apollo.io), Linear's empty cycles (https://linear.app).
5. Match empty-state typography and spacing to the eventual filled state (same heading size, same vertical rhythm) so the layout doesn't shift. Reference: Vercel's deployments empty (https://vercel.com).

---

## Element: Toast / Notification System

Note: there is no toast system in the codebase. Errors are inline `<p className="text-red-400">...</p>` per-button.

### What feels AI-generated
1. Form errors render as red paragraphs under buttons. No icon, no animation, no autoclose.
2. Success states either redirect or briefly flip a button to "✅ Multumim!" before closing the modal. No persistent feedback after navigation.
3. No undo on destructive actions. Logout, dismiss, "Nu acum" all happen instantly with no rescue.
4. No global error capture. A failed fetch in an obscure widget renders nothing.
5. Inconsistent error tone — some say "Eroare la activare", some "Eroare de conexiune", some "Eroare. Incearca din nou." All slightly different.

### Pro-up ideas
1. Adopt `sonner` (https://sonner.emilkowal.ski) — used by Vercel, Resend, shadcn. Top-right or bottom-right, swipe to dismiss, ToastProvider in layout.tsx. Reference: every Vercel dashboard interaction.
2. Standardize tone with an `<ErrorToast title description action />` and `<SuccessToast />` pair. Reference: Linear's toasts (https://linear.app), Resend's after-send toast (https://resend.com).
3. Add undo on dismissive actions: "Trial popup închis. Anulează" with 5s timer. Reference: Notion's "Page deleted. Undo" (https://www.notion.so), Linear's archive undo (https://linear.app).
4. Hook all `fetch` errors in shared client into a global toast handler so silent failures stop. Reference: Mercury's network-error toast (https://mercury.com), Stripe's API error display (https://dashboard.stripe.com).
5. Persist a "last toast" on navigation (e.g. after redirect post-payment, the new page shows "Plata reușită · Acces Elite activ"). Reference: Stripe checkout → confirmation flow, Resend signup → dashboard toast.

---

## Element: Modal / Dialog Pattern

Files: `hero-section.tsx` (video modal), `trial-popup.tsx`, `feedback-button.tsx`, `command-search.tsx` — each implements its own modal.

### What feels AI-generated
1. Four separate modal implementations with copy-pasted backdrop divs (`absolute inset-0 bg-black/60 backdrop-blur-sm`). No shared primitive.
2. Body scroll lock implemented inconsistently — `useEffect` with `document.body.style.overflow = "hidden"` in some, missing in others.
3. No animation on open/close in trial-popup or feedback-button. Hero video modal has nothing either. They just appear.
4. Escape-to-close logic duplicated 4 times. Some have it, some don't.
5. No focus trap. Tab cycles out of the modal, into the page behind it. A11y miss.

### Pro-up ideas
1. Adopt Radix Dialog (https://www.radix-ui.com/primitives/docs/components/dialog) as the single dialog primitive. Free focus trap, Esc handling, scroll lock, animation hooks, a11y. Reference: shadcn Dialog (https://ui.shadcn.com/docs/components/dialog) used by Vercel, Resend, Linear's pattern.
2. Wrap Radix Dialog in a `<Modal title size>` component branded for the platform (rounded-2xl, surface-graphite, emerald accent). Single source of truth.
3. Animate consistently with `data-[state=open]` Tailwind patterns: 150ms fade-in + 8px translate-up, 100ms fade-out. Reference: shadcn (https://ui.shadcn.com), Vercel modals.
4. Add a Sheet variant (mobile bottom-sheet) for trial-popup and feedback on mobile. Reference: Mercury bottom sheets (https://mercury.com), Notion mobile sheets (https://www.notion.so).
5. Standardize close affordance: top-right close button uses Lucide X, bottom-right secondary text-link "Închide", Esc always works. Reference: Linear modals (https://linear.app), Stripe checkout modal.

---

## Element: Form Input Styling

Files: forms scattered (login, signup, feedback-button, lead-magnet-form, etc.) — no shared `<Input>`, `<Label>`, `<FormField>`.

### What feels AI-generated
1. Every input is `className="w-full rounded-xl border border-white/10 bg-crypto-dark px-4 py-3 text-white outline-none transition focus:border-accent-emerald"` — copy-pasted at 5+ call sites with minor drift.
2. No labels (most inputs use `placeholder=` only). Bad a11y, bad UX once user starts typing and forgets which field.
3. No error states on inputs themselves (red border, red helper text). Errors render below button as a single line.
4. No helper text under inputs ("Email-ul de Discord. Folosit pentru sync.").
5. No validation icons (green check on valid, red X on invalid).

### Pro-up ideas
1. Build `<Input>`, `<Label>`, `<FormField label helper error>` shared in `components/ui/`. Reference: shadcn form (https://ui.shadcn.com/docs/components/form), Resend's signup form (https://resend.com/signup).
2. Float label pattern (label inside, animates up on focus) for elite/branded feel. Reference: Stripe's input fields (https://stripe.com), Mercury's onboarding fields (https://mercury.com).
3. Add per-field error states with red ring + 1-line helper. Reference: Linear's settings forms (https://linear.app), Vercel's project settings.
4. Add validation icons (Lucide Check / X / Loader) inside the input on the right. Reference: Plaid's bank-account-link form (https://plaid.com), Stripe Elements (https://stripe.com/docs/payments/elements).
5. Add password-strength hint, email format hint, and async availability check on signup with debounced feedback. Reference: Resend signup (https://resend.com/signup), Cursor's onboarding (https://cursor.com).

---

## Element: Mobile Bottom Nav / Floating Action

Note: does not exist. There is a single floating feedback button bottom-right.

### Current state
Only floating thing on mobile is `<FeedbackButton>` — a 48px round button bottom-right with 💬 emoji.

### What feels AI-generated
1. The most-used mobile pattern (bottom tab bar) is missing entirely. Mobile users must open hamburger → fullscreen menu → scroll → tap → wait. Every interaction is 3 taps.
2. Feedback button uses 💬 emoji. Still emoji. Still inconsistent across platforms.
3. No floating "Trial: 5 zile rămase" indicator on mobile when user is in trial.
4. No swipe gestures, no pull-to-refresh on data pages.
5. No iOS PWA install prompt or "add to home screen" hint despite being a daily-use trading tool.

### Pro-up ideas
1. Add a 5-tab bottom bar on `/dashboard/*` mobile only, with safe-area-bottom padding. Tabs: Home / Crypto / Stocks / Tools / Profil. Reference: Mercury iOS (https://mercury.com), Notion mobile, Robinhood. CLAUDE.md confirms "no member-facing Telegram bot" — bottom nav is the right replacement for in-app push affordance.
2. Replace floating feedback emoji with a Lucide MessageCircle icon. Reference: Intercom widget, Linear's help button (https://linear.app).
3. Add a floating "trial countdown" pill bottom-left on mobile that animates in for users in active trial. Reference: Notion's trial banner, Resend's quota indicator.
4. Add pull-to-refresh on data dashboards. Reference: Mercury's pull-to-refresh, Robinhood's price update gesture.
5. Add a PWA install prompt component that fires after 3 visits + dismissable. Reference: Twitter/X's Add to Home Screen prompt, Notion mobile PWA prompt.

---

## Element: Profile Menu

File: `components/layout/profile-menu.tsx`

### Current state
Pill button: name + emerald avatar (initials). Click opens dropdown: Dashboard / Setări / (admin links if admin) / Logout.

### What feels AI-generated
1. Button shows "Bine ai venit, {name}" inline. Eats horizontal space and feels redundant after the user has been in the app for 5 minutes.
2. Avatar is initials on solid emerald. No real avatar upload, no Discord avatar pull, no animated ring for active session.
3. Admin links use 4 ⚙️ emojis stacked. Same problem.
4. Menu has no "Theme" / "Density" / "Hotkeys" / "What's new" — just navigation.
5. No user metadata in the menu (subscription status, days remaining, plan name). User has to navigate to /upgrade to remember when their plan ends.

### Pro-up ideas
1. Drop "Bine ai venit, {name}" — show only avatar + tiny chevron on desktop. Save the welcome for /dashboard onboarding. Reference: Linear avatar pill (https://linear.app), Vercel avatar (https://vercel.com).
2. Pull Discord avatar via the existing Discord OAuth `discord_user_id` and render it. Add a 2px emerald ring if subscription active, amber if expiring < 7d. Reference: Discord's own server-member sidebar, Slack's online-status ring.
3. Replace ⚙️ emojis with Lucide Settings/Shield/Image/CreditCard icons. Reference: Linear settings menu (https://linear.app/settings), Vercel team menu (https://vercel.com).
4. Surface subscription summary at the top of the dropdown: "Elite · 23 zile rămase" with a mini progress ring. Reference: Notion plan badge in profile menu (https://www.notion.so), Vercel team plan strip (https://vercel.com).
5. Add a "What's new" entry that opens a changelog drawer. Reference: Linear changelog opener (https://linear.app/changelog), Resend's "Updates" badge (https://resend.com).

---

## Element: Feedback Button

File: `components/ui/feedback-button.tsx`

### Current state
Floating bottom-right round button with 💬. Opens a modal with type tabs (🐛 Bug / 💡 Idee / 💬 General), textarea, submit. 24h cooldown via localStorage.

### What feels AI-generated
1. All 4 emojis (💬 🐛 💡 💬) doing icon-work.
2. Modal has no animation, generic backdrop.
3. 24h cooldown explained only after user tries to send second one. No visible quota indicator.
4. Success state: green box "Multumim! Feedback-ul a fost trimis. ✅". Auto-closes after 2s. No explanation of what happens next ("Alex îl va citi în Telegram").
5. No screenshot attachment, no current-page URL preview shown to user, no severity selector.

### Pro-up ideas
1. Replace emoji with Lucide MessageCircle / Bug / Lightbulb / MessageSquare for each section. Reference: Linear's bug-report widget (https://linear.app), Posthog's session-recording feedback widget (https://posthog.com).
2. Animate modal as a bottom-sheet on mobile, fade-scale on desktop, via shared `<Modal>` primitive. Reference: Notion in-app feedback (https://www.notion.so), Resend feedback flow (https://resend.com).
3. Show the cooldown state proactively as muted text under the textarea ("Poți trimite 1 feedback / 24h. Următor disponibil în 14h."). Reference: Plaid quota indicators, Resend rate-limit feedback (https://resend.com).
4. Tell the user what happens after submit: "Alex citește toate mesajele. Așteaptă 1-3 zile pentru răspuns pe Discord/email." Reference: Linear's "we read all of these" footer (https://linear.app), Stripe Atlas support widget.
5. Add an optional screenshot capture (html2canvas) and the current URL automatically. Reference: Bird Eats Bug, Posthog's session-recording attachment (https://posthog.com), Linear's screenshot widget.

---

## Cross-cutting recommendations

These appear in nearly every element above. Listing once.

1. **Single icon library**: ban emoji from UI. Adopt Lucide React + a small custom-SVG set for brand glyphs (helmet logo, mascot accent, lock, success). Reference: every product mentioned above.
2. **Single Button + Input + Modal + Toast + Skeleton + EmptyState primitive**: ship `components/ui/` with shadcn-style headless components, used across the app. Eliminates copy-paste drift across 22 loading.tsx files, 4 modal implementations, 5 form inputs.
3. **Motion design tokens**: 3 durations + 3 easings + 3 elevations. Apply consistently. Reference: Linear motion principles (https://linear.app/blog), Apple HIG.
4. **One brand glyph (no emoji), one hero treatment (gradient OR aurora OR conic — not all three), one pricing card highlight pattern**: pro brands restrain themselves. The current platform uses every effect on every page.
5. **A11y baseline**: focus traps in modals, roving tabindex in dropdowns, real labels on inputs, skip-to-content link in navbar. Reference: Radix UI primitives, Vercel's accessibility commitments (https://vercel.com/design/accessibility).

---

## Where to start (pragmatic order)

1. Replace emoji icons with Lucide everywhere (1 day, biggest "feels pro" win for least effort).
2. Build shared Button + Modal + Toast + Skeleton + EmptyState in `components/ui/` (3 days, eliminates 80% of code drift).
3. Migrate command bar to cmdk + add recents + actions + AI fallback (2 days, signature interaction).
4. Replace 22 loading.tsx with content-shape skeletons (1 day, eliminates "spinner of shame").
5. Add mobile bottom-tab nav for `/dashboard/*` (1-2 days, daily-use win for the 60%+ mobile traffic).

Total: about 8-10 days of focused work to flip the "made entirely with AI" perception. The rest (footer restructuring, hero overhaul, pricing polish) is incremental and can ship per-page.
