# PERFORMANCE AUDIT - Elite Platform

**Date:** 2026-03-18

## HIGH Impact

### #1 framer-motion for single component
Only `FaqItem.tsx` uses it. ~32KB gzipped. Replace with CSS grid-rows transition.

### #2 Dashboard: sequential Supabase waterfall
`app/dashboard/page.tsx` - 3 sequential awaits + Discord sync. Profile + videos fetch can be parallelized.

### #3 Videos page: same sequential waterfall
`app/dashboard/videos/page.tsx` - Same pattern. Profile + videos should use Promise.all.

### #4 syncDiscordRole on every load
3 Discord API calls + 1 DB write per page load. No cooldown check against discord_role_synced_at.

### #5 syncDiscordRole blocks page render
Awaited inline. Should be fire-and-forget.

## MEDIUM Impact

### #6 Discord role add/remove are sequential
`lib/discord/server.ts:244-246` - addRole and removeRole are independent, can be Promise.all.

### #7 No caching on video catalog queries
Video list fetched fresh every request. Should use unstable_cache with 60s TTL.

### #8 No loading.tsx skeletons
No streaming/Suspense. Users see blank screen during data fetch.

### #9 Homepage not statically generatable
Navbar auth check makes every marketing page dynamic.

### #10 Admin page sequential fetches
Profile + videos fetch after auth can be parallelized.

## Positive Findings
- All images use next/image with proper sizes prop
- Fonts loaded correctly via next/font with display: swap
- Client/server component split is appropriate
- Static asset caching headers are optimal (1yr immutable)
- No unnecessary client components found
