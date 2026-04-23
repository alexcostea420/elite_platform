# SECURITY AUDIT - Elite Platform

**Date:** 2026-03-18 | **Findings:** 3 CRITICAL, 6 HIGH, 7 MEDIUM, 4 LOW

## CRITICAL

### #1 Service Role Key in .env.local
- **File:** `.env.local:3`
- Real Supabase service role JWT in local file. Bypasses all RLS. Rotate immediately.

### #2 Discord Env Vars Missing - Runtime Crash
- **File:** `.env.local`, `lib/discord/server.ts:39-41,58-60`
- 7 Discord env vars completely absent. `/auth/discord/start` crashes with 500. `syncDiscordRole` silently fails on every dashboard load.

### #3 Admin Role Check Depends on RLS Policy
- **File:** `middleware.ts:87-91`, `app/admin/videos/actions.ts:44-57`
- Profile role query uses anon key - relies entirely on RLS being correctly configured. If RLS disabled, any user can read any role.

## HIGH

### #4 Open Redirect in loginAction
- **File:** `app/auth/actions.ts:30,43`
- `nextPath.startsWith("/")` allows `//evil.com`. Fix: regex validate relative path.

### #5 No Password Strength Validation
- **File:** `app/auth/actions.ts:46-54`
- Only checks non-empty. 1-char passwords pass. Supabase default is 6 chars (weak).

### #6 No Rate Limiting Anywhere
- **File:** All routes
- Login brute force, signup abuse, Discord OAuth spam all unprotected.

### #7 Raw Supabase Errors Leaked to Users
- **File:** `app/auth/actions.ts:40,63`, `app/admin/videos/actions.ts:88,110,130`
- `error.message` passed directly to URL params. Can expose table names, constraints.

### #8 Reflected Search Params in HTML
- **File:** `app/admin/videos/page.tsx:157-167`, `app/login/page.tsx:55-64`, `app/dashboard/page.tsx:343-349`
- URL params rendered in page. React escapes, but fragile pattern enables social engineering.

### #9 Wildcard allowedOrigins for Server Actions
- **File:** `next.config.mjs:18-20`
- `*.loca.lt` in `serverActions.allowedOrigins`. If deployed to production, weakens CSRF protection.

## MEDIUM

### #10 No CSP Header
- **File:** `next.config.mjs:36-44`

### #11 No HSTS Header
- **File:** `next.config.mjs:36-44`

### #12 Video youtube_id Leaks to Free Users
- **File:** `app/dashboard/videos/page.tsx:133-137,248`
- All videos fetched for all users. Free users can extract youtube_id from thumbnail URLs.

### #13 Service Role in Signup upsertProfile
- **File:** `app/auth/actions.ts:11-25`
- No input length validation. Long strings could cause issues.

### #14 No Input Validation on Admin Video Fields
- **File:** `app/admin/videos/actions.ts:66-77`
- No youtube_id format check, no URL validation on thumbnail_url, no max lengths.

### #15 Discord OAuth State Cookie Not Cleared on Error
- **File:** `app/auth/discord/callback/route.ts:33-42`

### #16 searchParams.video Not Validated as UUID
- **File:** `app/dashboard/videos/page.tsx:142-143`

## LOW

### #17 Source Maps Not Explicitly Disabled
### #18 robots.txt Advertises /admin/ Path
### #19 Missing X-Permitted-Cross-Domain-Policies Header
### #20 Logout Doesn't Revoke Refresh Token Globally
