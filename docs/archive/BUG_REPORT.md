# BUG REPORT - Elite Platform

**Date:** 2026-03-18

## Runtime Errors

### #1 No app/error.tsx - HIGH
No error boundary. Any server error shows raw Next.js error page.

### #2 No app/not-found.tsx - MEDIUM
Custom 404 missing. Unstyled default page on invalid routes.

### #3 No loading.tsx anywhere - MEDIUM
Dashboard/videos pages make multiple async calls. Users see blank white screen.

### #4 syncDiscordRole on every page load - HIGH
`app/dashboard/page.tsx:111`, `app/dashboard/videos/page.tsx:123`
3 Discord API calls per page load, no debounce. Will hit rate limits.

### #5 searchParams sync pattern - LOW
Will break on Next.js 15+ upgrade (searchParams becomes Promise).

### #6 Vim swap file - LOW
`app/upgrade/.page.tsx.swp` should be deleted.

### #7 Navbar calls auth on marketing pages - MEDIUM
`components/layout/navbar.tsx:35` - Supabase getUser() runs on homepage, adds latency.

## Data Flow

### #8 No client-side form validation - MEDIUM
Only HTML `required`. No password length, no format checks.

### #9 No double-submit protection - MEDIUM
No button disable, no useFormStatus(). Double-click creates duplicates.

### #10 Open redirect via next param - HIGH
`app/auth/actions.ts:43` - `//evil.com` passes startsWith("/") check.

### #11 Partial account on profile failure - LOW
Auth user created but profile upsert fails = user stuck.

## Edge Cases

### #12 Stale subscription access - MEDIUM
No real-time expiry check. User keeps access until next page load.

### #13 Supabase outage crashes middleware - HIGH
`middleware.ts:76-77` - No try/catch on getUser(). 500 on every page.

### #14 Dead links (href="#") - MEDIUM
6+ non-functional links across dashboard, footer, analyses.

### #15 Hard-coded stale data in dashboard - MEDIUM
Fake stats, fake dates, fake analyses. Misleading for Elite users.

### #16 Pricing buttons do nothing - HIGH
`components/marketing/pricing-section.tsx:29` - No onClick. Primary conversion path broken.

### #17 Middleware no error handling - HIGH
`middleware.ts:87-91` - Admin profile query has no try/catch.
