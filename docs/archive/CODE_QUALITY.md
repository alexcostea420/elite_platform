# CODE QUALITY - Elite Platform

**Date:** 2026-03-18

## Dead Code

### #1 lib/supabase/browser.ts never imported - LOW
Zero references. Entire browser Supabase client is unused.

## Duplicate Code

### #2 SubscriptionTier defined 5 times - MEDIUM
dashboard/page.tsx, dashboard/videos/page.tsx, discord/callback, subscription-card.tsx, discord/server.ts

### #3 tierLabel map duplicated 3 times - MEDIUM
dashboard/page.tsx, dashboard/videos/page.tsx, subscription-card.tsx

### #4 VideoRow type defined 2 times - LOW
admin/videos/page.tsx, dashboard/videos/page.tsx

### #5 getTrimmedValue duplicated 2 times - LOW
auth/actions.ts, admin/videos/actions.ts

### #6 getSupabaseConfig duplicated in middleware - MEDIUM
middleware.ts has local copy of lib/supabase/config.ts logic.

### #7 SVG logo duplicated - LOW
Inline in navbar.tsx and footer.tsx.

## Inconsistencies

### #8 Auth check patterns vary - MEDIUM
Each page has inline auth check. Only admin actions extracted requireAdmin().

### #9 Discord sync duplicated in 2 pages - MEDIUM
Identical try/catch in dashboard and videos page.

### #10 Error banner markup not componentized - LOW

### #11 Navbar userIdentity prop shape inconsistent - LOW

## TypeScript

### #12 No any types (GOOD)
### #13 Untyped Supabase query results - MEDIUM
### #14 Unsafe `as Type` casts on Discord API - MEDIUM

## Environment

### #15 .env.local.example missing 7 Discord vars - HIGH

## Tooling

### #16 No lint script in package.json - MEDIUM
### #17 No ESLint config - MEDIUM
### #18 No test framework - MEDIUM

## Cleanup

### #19 dashboard.html and elite.html leftover prototypes - LOW
### #20 Vim swap file app/upgrade/.page.tsx.swp - LOW
### #21 Hard-coded fake dashboard stats - MEDIUM
### #22 Placeholder href="#" links - LOW
### #23 .gitignore missing *.swp, *.swo, *~ patterns - LOW
