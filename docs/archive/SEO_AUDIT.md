# SEO Audit - Elite Platform

Date: 2026-03-16
Domain target: https://armatadetraderi.com
Framework: Next.js 14 App Router
Status: Phase 1 audit only. No SEO code changes applied.

## Summary

- [ ] Public routes do not have route-specific metadata.
- [ ] Open Graph, Twitter, canonical tags, and JSON-LD are missing project-wide.
- [ ] `robots.txt` and `sitemap.xml` do not exist.
- [ ] Homepage is more dynamic than necessary because the public navbar reads auth state server-side.
- [ ] Several raw `<img>` tags are still used instead of `next/image`.
- [ ] `next.config.mjs` has no SEO/performance headers, no image optimization config, no trailing-slash policy, and no i18n config.
- [ ] Fonts already use `next/font/google`, but `display: 'swap'` is not explicitly set.

---

## 1. Route Inventory & Metadata Coverage

| Route | File | Custom Title | Meta Description | OG/Twitter | Canonical | JSON-LD | Notes |
|---|---|---:|---:|---:|---:|---:|---|
| `/` | `app/page.tsx` | No | No | No | No | No | Inherits only root metadata from `app/layout.tsx` |
| `/login` | `app/login/page.tsx` | No | No | No | No | No | Uses global title/description |
| `/signup` | `app/signup/page.tsx` | No | No | No | No | No | Uses global title/description |
| `/upgrade` | `app/upgrade/page.tsx` | No | No | No | No | No | Public/commercial route with no page-specific SEO metadata |
| `/dashboard` | `app/dashboard/page.tsx` | No | No | No | No | No | Private/member route; should likely be noindex later |
| `/dashboard/videos` | `app/dashboard/videos/page.tsx` | No | No | No | No | No | Private/member route; should likely be noindex later |
| `/admin/videos` | `app/admin/videos/page.tsx` | No | No | No | No | No | Private/admin route; should be noindex later |
| `/auth/discord/start` | `app/auth/discord/start/route.ts` | N/A | N/A | N/A | N/A | N/A | Route handler, not HTML page |
| `/auth/discord/callback` | `app/auth/discord/callback/route.ts` | N/A | N/A | N/A | N/A | N/A | Route handler, not HTML page |

### Current root metadata
Source: `app/layout.tsx`

- Title: `Armata de Traderi`
- Description: `Învață să tranzacționezi ca un profesionist alături de Armata de Traderi.`

Issues:
- [ ] Too generic for route-level SEO.
- [ ] No OG/Twitter metadata in root metadata object.
- [ ] No `metadataBase` configured.
- [ ] No canonical handling.

---

## 2. `next.config.mjs` Audit

Source: `next.config.mjs`

### Present
- [x] `allowedDevOrigins` for `*.loca.lt`
- [x] `experimental.serverActions.allowedOrigins`

### Missing
- [ ] `images` config (`formats`, remote patterns, optimization settings)
- [ ] `headers()` for cache-control/security headers
- [ ] redirects/rewrites policy for trailing slash consistency
- [ ] `trailingSlash` explicit policy
- [ ] i18n config
- [ ] SEO/security headers such as:
  - `Cache-Control`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Referrer-Policy`

Risk note:
- No current evidence of wrong config, but SEO/performance defaults are under-optimized.

---

## 3. Sitemap & Robots

Findings:
- [ ] No `app/sitemap.ts`
- [ ] No `public/sitemap.xml`
- [ ] No `app/robots.ts`
- [ ] No `public/robots.txt`

Impact:
- Public pages are not explicitly exposed via a maintained sitemap.
- Crawlers are not given route-level allow/disallow hints.

---

## 4. Semantic HTML, Headings, and Accessibility Audit

### Semantic structure
Positive:
- [x] Main routes generally use semantic `<main>`.
- [x] Navbar uses semantic `<nav>`.
- [x] Many content blocks already use `<section>` / `<article>`.
- [x] Footer uses semantic `<footer>`.

Issues:
- [ ] Navbar `<nav>` has no `aria-label`.
- [ ] Footer social icon links are icon-only and lack explicit `aria-label` text.
- [ ] Placeholder legal/support links exist (`href="#"`) and should be treated as broken/non-final links.

### Heading hierarchy
#### Homepage (`/`)
- [x] Exactly one `<h1>` in hero.
- [x] Section heading pattern mostly uses `<h2>`.
- [ ] `about-section.tsx` contains a left-column `<h3>` before the main section heading `<h2>` in the right column. This is semantically awkward.
- [ ] `testimonials-section.tsx` jumps from section `<h2>` to testimonial name `<h4>` with no intermediate `<h3>`.

#### Login / Signup / Upgrade
- [x] One `<h1>` per page.
- [x] Upgrade page hierarchy is mostly clean (`h1 -> h2 -> h3`).

#### Private routes
- [x] `/dashboard/videos` has one `<h1>`.
- [x] `/admin/videos` has one `<h1>`.
- [ ] Private pages contain some dashboard stat cards using `<h3>` before nearby section `<h2>` blocks; not catastrophic, but not ideal hierarchy.

### Alt attributes
Findings:
- [x] All raw `<img>` tags found in the code currently include `alt`.
- [ ] Alt text quality is functional, but not yet SEO-optimized for Romanian keyword context.

---

## 5. Image Audit

Raw `<img>` usage found in:
- `components/marketing/about-section.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/videos/page.tsx`
- `components/dashboard/connect-discord-card.tsx`

Current state:
- [ ] `next/image` is not used in these places.
- [ ] No explicit `width` / `height` on these raw images.
- [ ] No `sizes` props, because `next/image` is not in use.
- [ ] Images are mostly remote YouTube thumbnails / Discord avatars.

Implications:
- Missed automatic optimization (`webp` / `avif`, responsive sizing, lazy loading control).
- Higher risk of layout instability and weaker LCP optimization.

Project asset state:
- [ ] No local image assets directory found at project root/public level.
- [ ] No OG image asset found.

---

## 6. Fonts Audit

Source: `app/layout.tsx`

Findings:
- [x] Fonts use `next/font/google` (`Inter`, `Orbitron`)
- [ ] `display: 'swap'` is not explicitly set
- [x] No raw Google Fonts `<link>` tags found

Interpretation:
- This is already better than loading fonts manually.
- Small optimization remains: set `display: 'swap'` explicitly.

---

## 7. Bundle / Client-Side Dependency Audit

Dependencies of note:
- `framer-motion`
- `@supabase/ssr`
- `@supabase/supabase-js`

Heavy-client findings:
- [ ] Homepage includes several client components:
  - `components/marketing/hero-section.tsx`
  - `components/marketing/about-section.tsx`
  - `components/marketing/faq-section.tsx`
  - `components/layout/marketing-discord-button.tsx`
- [ ] `framer-motion` is used in FAQ only.
- [ ] Modals in hero/about/marketing Discord button all require client hydration on homepage.

What is good:
- [x] No obvious oversized utility libraries like `moment` or full `lodash` found.
- [x] Dependency list is still relatively small.

Likely performance opportunities later:
- Lazy-load or isolate non-critical client interactions on homepage.
- Review whether some marketing interactive sections can defer hydration.

---

## 8. Static vs Dynamic Rendering Audit

### Homepage (`/`)
Current behavior risk:
- [ ] Public navbar checks auth state with Supabase inside `Navbar mode="marketing"`.
- [ ] That likely makes the homepage dynamic when it could otherwise be mostly static.

Why it matters:
- Static marketing pages are easier to cache and tend to perform better for SEO and Core Web Vitals.

### Private pages
- [x] `/dashboard`, `/dashboard/videos`, `/admin/videos` are appropriately dynamic.

### Auth pages
- [ ] `/login` and `/signup` also render the same marketing navbar auth-aware logic, increasing dynamic behavior.

---

## 9. Internal Linking / URL Hygiene

Positive:
- [x] Internal app links mostly use `next/link`.
- [x] Homepage can reach main sections via anchor navigation.
- [x] Pricing/upgrade/member routes are reachable from homepage/header/CTAs.

Issues:
- [ ] No sitemap for crawler discovery.
- [ ] Placeholder links exist:
  - footer legal links (`#`)
  - support/help placeholders in some areas
- [ ] `trailingSlash` policy is not explicit in `next.config.mjs`.
- [ ] No evidence of canonical normalization.

Reachability estimate:
- [x] Public pages are reachable within 3 clicks.
- [ ] No blog exists, so blog-related internal-link checks are not applicable.

---

## 10. Structured Data Audit

Findings:
- [ ] No JSON-LD found anywhere.

Missing but applicable later:
- Homepage: `Organization`
- Homepage FAQ: `FAQPage`
- Upgrade/Pricing: `Product` / `Offer`

Missing and not applicable now:
- Blog `Article` schema (no blog present)

---

## 11. Open Graph / Social Preview Audit

Findings:
- [ ] No explicit Open Graph tags found
- [ ] No explicit Twitter Card tags found
- [ ] No OG image asset found in repo

Impact:
- Weak social sharing previews
- No route-level social optimization

---

## 12. Route-by-Route SEO Risk Notes

### `/`
- [ ] Only root metadata
- [ ] No canonical
- [ ] No OG/Twitter
- [ ] No JSON-LD
- [ ] Homepage is likely dynamic because of auth-aware navbar
- [ ] Raw images present in composed sections

### `/upgrade`
- [ ] Commercial page with no dedicated metadata
- [ ] No pricing structured data
- [ ] No canonical/OG

### `/login` and `/signup`
- [ ] No route-specific metadata
- [ ] Should likely become `noindex` later

### `/dashboard`, `/dashboard/videos`, `/admin/videos`
- [ ] No route-specific metadata
- [ ] Should likely become `noindex` later
- [ ] Private routes do not belong in a public sitemap

---

## 13. Recommended Safe Phase 2 Targets

High-value, low-risk candidates:
- [ ] Add route-level metadata using App Router `metadata` exports.
- [ ] Add `metadataBase`, canonical URLs, OG, and Twitter cards.
- [ ] Add `app/sitemap.ts` and `app/robots.ts`.
- [ ] Add JSON-LD to homepage and upgrade route.
- [ ] Add image optimization config to `next.config.mjs`.
- [ ] Replace raw `<img>` with `next/image` where layout can be preserved exactly.
- [ ] Add `aria-label` to navbar/footer icon links.
- [ ] Explicitly set `display: 'swap'` on fonts.

Changes that should be treated carefully:
- [ ] Making the homepage static or less dynamic by separating auth-aware navbar behavior from the marketing shell.
- [ ] Heading-order cleanup in the About/Testimonial sections if it risks visible layout changes.

---

## 14. Skips / Ambiguities Noted Before Phase 2

- [ ] No blog exists, so blog SEO/article schema work is not applicable.
- [ ] Private pages (`/dashboard`, `/admin`) should likely be `noindex`, but implementation policy should be confirmed before changes.
- [ ] Currency/schema for pricing is ambiguous because visible prices are in USD while the brief referenced `RON/EUR`. This must be resolved before Offer schema is added.
- [ ] No OG image asset exists. This should be logged later in `SEO_CHANGES.md` if Phase 2 proceeds.

