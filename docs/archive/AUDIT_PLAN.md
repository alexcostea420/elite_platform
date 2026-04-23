# AUDIT PLAN - Elite Platform (armatadetraderi.com)

## Tech Stack
- **Framework:** Next.js 14.2.32 (App Router)
- **Language:** TypeScript (strict mode)
- **Auth:** Supabase Auth (email/password + Discord OAuth link)
- **Database:** Supabase (PostgreSQL via supabase-js, no Prisma/ORM)
- **Styling:** Tailwind CSS 3.4.17 + framer-motion 12.36
- **Hosting:** Multi-subdomain (marketing / app / admin)
- **External Services:** Discord (OAuth + Bot role sync), YouTube (embeds + thumbnails)

## Architecture Map

### Routes
| Route | Purpose | Auth Required | Admin Only |
|-------|---------|:---:|:---:|
| `/` | Marketing landing page | No | No |
| `/login` | Email/password login | No | No |
| `/signup` | Registration (name, discord, email, pwd) | No | No |
| `/upgrade` | Pricing / upgrade CTA page | No | No |
| `/dashboard` | Member dashboard (stats, videos, discord) | Yes | No |
| `/dashboard/videos` | Video library with player | Yes | No |
| `/admin/videos` | CRUD video management | Yes | Yes |

### API Routes (GET handlers)
| Route | Purpose |
|-------|---------|
| `/auth/discord/start` | Initiates Discord OAuth flow |
| `/auth/discord/callback` | Handles Discord OAuth callback, saves identity, syncs roles |

### Server Actions
| Action | File | Purpose |
|--------|------|---------|
| `loginAction` | `app/auth/actions.ts` | Email/password sign-in |
| `signupAction` | `app/auth/actions.ts` | Registration + profile upsert |
| `logoutAction` | `app/auth/actions.ts` | Sign out |
| `createVideoAction` | `app/admin/videos/actions.ts` | Insert video (admin) |
| `updateVideoAction` | `app/admin/videos/actions.ts` | Update video (admin) |
| `deleteVideoAction` | `app/admin/videos/actions.ts` | Delete video (admin) |

### Authentication Flow
1. User signs up with email/password via Supabase Auth
2. Profile row upserted with full_name + discord_username (service role)
3. Login via `signInWithPassword`
4. Middleware checks `supabase.auth.getUser()` on protected paths
5. Admin routes additionally check `profiles.role === "admin"`
6. Discord OAuth links Discord identity to profile, syncs guild roles

### Database Tables (inferred from queries)
- **profiles**: id, full_name, discord_username, subscription_tier, subscription_status, subscription_expires_at, discord_user_id, discord_avatar, discord_connected_at, discord_role_synced_at, role
- **videos**: id, youtube_id, title, description, category, tier_required, duration_seconds, thumbnail_url, is_published, upload_date

### External Service Connections
- **Supabase**: Auth + DB (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- **Discord OAuth**: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI
- **Discord Bot**: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_ROLE_ELITE_ID, DISCORD_ROLE_SOLDAT_ID

### Environment Variables
| Variable | Scope | Present in .env.local |
|----------|-------|:---:|
| NEXT_PUBLIC_SUPABASE_URL | Client + Server | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client + Server | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Server only | Yes |
| DISCORD_CLIENT_ID | Server only | No (missing) |
| DISCORD_CLIENT_SECRET | Server only | No (missing) |
| DISCORD_REDIRECT_URI | Server only | No (missing) |
| DISCORD_BOT_TOKEN | Server only | No (missing) |
| DISCORD_GUILD_ID | Server only | No (missing) |
| DISCORD_ROLE_ELITE_ID | Server only | No (missing) |
| DISCORD_ROLE_SOLDAT_ID | Server only | No (missing) |

### Middleware
- Multi-host routing: redirects paths between marketing/app/admin subdomains
- Auth gate: redirects unauthenticated users from /dashboard and /admin to /login
- Admin gate: checks profile.role === "admin" for /admin paths
- Logged-in redirect: sends authenticated users away from /login and /signup
- Matcher: `["/", "/dashboard/:path*", "/admin/:path*", "/login", "/signup", "/upgrade"]`

### Key Observations
1. No Stripe or payment system exists - upgrade buttons link to `/#preturi` anchor
2. Subscription tier/status is stored in profiles but no mechanism to set it (manual DB only)
3. Discord env vars missing from .env.local (Discord features will throw at runtime)
4. No rate limiting anywhere
5. No CSP header configured
6. No HSTS header
7. No lint script in package.json
8. `.env.local` contains real Supabase service role key (committed risk if pushed)
9. `app/upgrade/.page.tsx.swp` - vim swap file should be cleaned up
