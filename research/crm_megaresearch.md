# CRM Megaresearch — Armata de Traderi

**Audience:** Alex Costea (founder, app.armatadetraderi.com)
**Scope:** Decide between off-the-shelf CRM, n8n glue, or extending the existing `/admin` panel.
**Date:** 2026-05-04
**TL;DR:** Build a thin custom admin extension on top of Supabase. Skip CRMs. Add Stripe + Resend MCPs. Skip n8n unless inbound support tickets explode.

---

## 1. Ce ai tu nevoie de fapt (the actual jobs)

A "CRM" is the wrong frame. CRMs (Salesforce, HubSpot, Pipedrive) are built around a **sales pipeline** — leads → qualified → opportunity → closed/won. You don't have a sales team. You have a **subscription product with self-serve checkout**. The jobs Alex actually needs done are:

| Job | Real name in industry | What it looks like |
|---|---|---|
| "Cine e acest membru și ce s-a întâmplat cu el?" | **Customer 360** | One page per user: payments, Patreon pledges, Discord roles, email opens, trial usage |
| "Cine pleacă luna asta?" | **Retention / churn dashboard** | Members expiring in 7/14/30 days, last-login, renewal rate by cohort |
| "Did this Patreon recurring payment extend platform days?" | **Payment timeline / event log** | Chronological feed: webhook event → DB write → effect on `subscription_expires_at` |
| "Trial → paying conversion" | **Funnel analytics** | Daily trials started, % converted within 7 days, drop-off reasons |
| "Trimite email celor 12 expirați săptămâna asta" | **Audience segmentation + broadcast** | Filter members → send Resend template |
| "Veteran vs normal pricing tracking" | **Tier reporting** | Split MRR by `is_veteran`, plan_duration |
| "Inbox" pentru întrebări | **Support inbox** | Already solved by Discord + Telegram; doesn't need a tool |

**Verdict pe categorie:**

- **Sales CRM (HubSpot, Pipedrive, Attio):** Wrong fit. You don't qualify leads — they pay or don't.
- **Customer Success Platform (Vitally, Catalyst):** Closer, but $500+/mo, designed for B2B SaaS with CSMs.
- **Subscription analytics (ChartMogul, Baremetrics):** Useful for MRR/churn graphs, but $100+/mo and Stripe-only (your Patreon + USDT won't sync).
- **Custom admin panel:** **Best fit.** 90% din date sunt deja în Supabase. Costul marginal e ~2 săptămâni de dev.

---

## 2. Compararea opțiunilor (ranked)

| Opțiune | Cost/lună | Setup | Lock-in | RO UI | Verdict |
|---|---|---|---|---|---|
| **Custom /admin extension** | €0 | 2 săpt. | Zero | Da | **#1 Recomandat** |
| **Notion + Supabase sync script** | €0 | 1 săpt. | Mic | Da | #2 (if you delay custom build) |
| **HubSpot Free → Starter** | €0 → €20 | 3 zile | Mare | Parțial | Skip |
| **Attio** | €34 | 2 zile | Mediu | Engleză | Skip (overkill, EN-only UI) |
| **Folk** | €20 | 1 zi | Mic | Engleză | Skip |
| **Pipedrive** | €14 | 1 zi | Mediu | RO disponibil | Skip (sales-pipeline shaped) |
| **n8n Cloud** | €20 | 4-6 ore | Mic (self-hostable) | N/A (backend) | Optional glue |
| **ChartMogul / Baremetrics** | €100+ | 2 zile | Mare | Engleză | Skip until 200+ members |

### 2.1 HubSpot Free / Starter (€0 → €20)

**Pros:** Free tier generos (1M contacts), email tracking, deal pipeline, formularistică.
**Cons:**
- Synchronization nightmare — webhook-urile Patreon + Stripe + USDT trebuie să push-uieze fiecare la HubSpot. Tu deja faci asta în Supabase. Dual write = drift garantat.
- Nu înțelege "subscription_expires_at" nativ — tre' să-l mapezi pe un custom property.
- UI engleză (poți traduce labels, dar workflow-urile rămân EN).
- Lock-in: dacă pleci, exportul e CSV fără relații.

**Verdict:** No. Re-doing your data layer in their schema doesn't pay off at 54 members.

### 2.2 Pipedrive (€14)

Sales-pipeline shaped (Lead → Qualified → Won → Lost). Inutil când userii vin singuri din Patreon webhook. Skip.

### 2.3 Attio (€34)

Modern, API-first, frumos. Foarte bun pentru B2B sales teams cu mulți leads inbound. Pentru tine = un dashboard scump care duplică ce e în Supabase. Skip.

### 2.4 Folk (€20)

Foarte light, bun pentru agenții. Same problem ca Attio — n-are concept de subscription, n-are tier veteran/normal nativ. Skip.

### 2.5 Notion + manual sync (€0)

Realist pentru **MVP de 2 zile**. Script Python care pull-uiește săptămânal `profiles + payments + subscriptions` și împinge într-un Notion database. Tu filtrezi în Notion: "Expiring this week", "Veterans", etc.

**Pros:** Zero dev, deja folosești Notion probabil.
**Cons:** One-way sync (citești, nu acționezi). Ratezi customer 360 view (timeline). Nu poți trigger emails de aici.

**Verdict:** Bun ca **stop-gap** între acum și custom build. Not the destination.

### 2.6 n8n (self-hosted gratuit / €20 cloud)

Workflow automation tool (Zapier alternative). Cazuri de use **realiste pentru tine**:

- Telegram message in support channel → create row in Supabase `support_tickets` table.
- Patreon webhook fails → retry + alert pe Telegram.
- Daily job: query Supabase pentru "expiring in 3 days" → trimite Resend email + Discord DM.

**Pros:** Self-hostable (Docker pe Mac Mini-ul tău), no lock-in, JSON-based workflows versionabile.
**Cons:** Tu deja faci 90% din asta în cron + Next.js API routes. Maintenance overhead pentru nouă piesă în stack.

**Verdict:** **Hold off.** Re-evaluează când ai 150+ members SAU când support inbox devine real.

### 2.7 Custom /admin extension (recomandat)

Tu ai deja:
- `/admin/dashboard` — MRR estimate, expiring soon, total elite, recent signups (am citit, e funcțional dar basic).
- `/admin/payments` — payment list + actions.
- `/admin/invites` — invite link management.
- `/admin/videos` — video CMS.

Lipsesc:
- `/admin/members` — căutabil, filtrabil, sortabil (table view ca în Vylos).
- `/admin/members/[id]` — customer 360 timeline (the killer feature).
- `/admin/retention` — cohort + churn graph.
- `/admin/funnel` — trial → paid conversion.
- `/admin/broadcast` — segment + send Resend template.

**Pros:**
- Zero cost extra.
- Folosește exact aceleași `profiles + payments + subscriptions + email_drip_queue` din Supabase, fără sync.
- RO nativ, design system deja calat (`glass-card`, emerald accent, General Sans).
- Mobile-first (375px) — Alex poate verifica de pe telefon.
- Acționabil: butoane "Extend 30 days", "Resend invite", "Force Discord role sync" direct din UI.

**Cons:**
- 2-3 săptămâni de dev.
- Tu (sau Claude Code) ești on-the-hook pentru bugs.

---

## 3. Arhitectură recomandată (be opinionated)

### 3.1 Routes de adăugat

```
/admin/members              → table view (search, filter, sort, export CSV)
/admin/members/[id]         → customer 360: timeline + actions
/admin/retention            → expiring funnel, churn cohort, win-back queue
/admin/funnel               → trial conversion, signup→paid time
/admin/broadcast            → segment builder + Resend template picker
/admin/events               → raw webhook event log (debug "did Patreon extend?")
```

### 3.2 Tabele noi în Supabase (1 migration)

```sql
-- Single source of truth for every cross-channel event
create table customer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text,                          -- fallback când n-avem user_id (Patreon orphan)
  source text not null,                -- 'patreon' | 'stripe' | 'arbitrum' | 'discord' | 'platform' | 'resend'
  event_type text not null,            -- 'pledge_create' | 'payment_received' | 'role_assigned' | 'email_opened' | 'trial_started'
  payload jsonb not null,
  effect text,                         -- 'extended_30d' | 'activated_elite' | 'no_op'
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on customer_events(user_id, occurred_at desc);
create index on customer_events(email, occurred_at desc);
create index on customer_events(source, event_type);
```

Then **every** webhook handler (`api/webhooks/patreon`, `api/webhooks/stripe`, `arb_payment_monitor.py`, `discord_role_bot.py`) writes one row here in addition to its current side effects. The `effect` column answers Alex's exact question: "did this Patreon recurring payment extend platform days?" — yes, look at the `effect` column.

### 3.3 Customer 360 page structure

```
┌─ Header: avatar, name, email, Discord ID, tier badge, expires_at
├─ Quick actions: [Extend 30d] [Resend invite] [Sync Discord role] [Refund]
├─ Tabs:
│   ├─ Timeline (default)  → all customer_events chronologically
│   ├─ Payments             → table from `payments`
│   ├─ Subscriptions        → table from `subscriptions`
│   ├─ Emails               → from `email_drip_queue` + Resend API for opens/clicks
│   └─ Notes                → free text on `profiles.admin_notes` (add column)
```

### 3.4 Cross-channel identity resolution

Problema reală: Patreon email ≠ platform email uneori. Discord username ≠ Discord ID uneori. Soluție:

```sql
-- Add to profiles
alter table profiles add column patreon_email text;
alter table profiles add column patreon_member_id text;
alter table profiles add column primary_email_verified boolean default false;
create index on profiles(patreon_email);
```

Webhook-urile fac `findByEmailOrPatreonEmail()` — already started in `api/webhooks/patreon/route.ts`, just needs the index + linking UI in `/admin/members/[id]`.

### 3.5 n8n — verdict pentru tine

**Skip pentru acum.** Cron-urile tale + Resend templates + Discord bot acoperă 100% din ce ar face n8n. Re-evaluează când:
- Ai 150+ members (manual support devine bottleneck).
- Vrei un ticket system inbound fără să cumperi Intercom.
- Apar 3+ noi integrații (afiliate program, podcast hosting, etc.) și nu vrei să scrii Python pentru fiecare.

---

## 4. MCPs noi care chiar ajută

Alex a întrebat explicit. Honest verdict:

| MCP | Există? | Move-the-needle? | De ce |
|---|---|---|---|
| **Stripe MCP** | Da, [@stripe/mcp](https://github.com/stripe/agent-toolkit) | **Da, după 29 apr** | Pot să răspund "Cât a plătit X în mai?" sau "Refund payment_intent_xyz" direct din chat fără să deschizi dashboard Stripe. |
| **Resend MCP** | Există community ones | **Da** | Query email engagement (opens/clicks) pentru un user. Trimite broadcast ad-hoc fără UI. |
| **Supabase MCP** | Deja instalat (`mcp__plugin_supabase_supabase__*`) | Already winning | Toate query-urile direct. |
| **Discord MCP** | Deja instalat (`plugin:discord`) | Already winning | DM members, mass-tag in role drops, fetch history. |
| **Telegram MCP** | Deja instalat (`plugin:telegram`) | Already winning | Notificări admin. |
| **Patreon MCP** | **Nu există** | Negative | Skip. Tu ai deja `patreon_sync.py` la 6h + webhook. Adăugarea unui MCP ar duplica. |
| **Vercel MCP** | Deja instalat (`plugin:vercel`) | Sometimes | Verifici deploys post-push (regula `feedback_verify_after_push`). |
| **Plausible MCP** | Inexistent oficial, există Plausible API | **Da, opțional** | Quick "câte vizite la /upgrade săptămâna asta?" din chat. Poți build un thin wrapper. |
| **Cloudflare MCP** | Există ([@cloudflare/mcp-server](https://github.com/cloudflare/mcp-server-cloudflare)) | Niche | Pentru R2 video uploads + DNS. Folositor dar nu urgent. |

**Top 2 de adăugat acum:** Stripe MCP (când sare PFA) + Resend MCP. Ambele unlock real workflows pe care le faci manual azi.

---

## 5. Phased rollout (12 săptămâni)

### Săpt. 1-2 — Customer 360 (foundation)
- Migration: `customer_events` table + `profiles.patreon_email`/`patreon_member_id`/`admin_notes`.
- Backfill `customer_events` din `payments`, `email_drip_queue`, Patreon sync history.
- Build `/admin/members` (table cu search + filter pe tier/status/expiring).
- Build `/admin/members/[id]` cu Timeline tab funcțional.
- **Win:** Alex poate răspunde la "ce s-a întâmplat cu user X" în 5 secunde.

### Săpt. 3-4 — Retention dashboard
- `/admin/retention`: expiring 7/14/30 days, churn rate lunar, win-back queue (expirați în ultimele 60 zile, n-au revenit).
- Auto-Telegram alert: "5 members expire în 48h, niciunul n-a primit reminder."
- Add quick action: "Send renewal reminder" buton (calls Resend template).
- **Win:** Churn devine vizibil înainte să se întâmple.

### Săpt. 5-6 — Funnel analytics
- `/admin/funnel`: signups daily, trials started, trial→paid % la 7/14/30 days.
- Cohort table: ianuarie cohort retention luna 1/2/3/6.
- Identifică: ce pricing tier convertește cel mai bine? veterani vs normali stay-rate?
- **Win:** Decizii pe pricing/copy bazate pe date, nu pe vibes.

### Săpt. 7-8 — Broadcast + segmentation
- `/admin/broadcast`: filter builder ("tier=elite AND expires_in<14 AND last_login>30d") → preview list → send Resend template.
- Stripe MCP integration (presupunând PFA live).
- **Win:** Win-back campaigns pornesc în 2 minute, nu 2 ore.

### Săpt. 9-10 — Resend MCP + email engagement
- Pull opens/clicks per user în Customer 360 Timeline.
- Identify email-fatigue users (opened 0/last 5).
- **Win:** Stop spamming people who don't read.

### Săpt. 11-12 — Polish + opțional integrații
- CSV export pe `/admin/members` (pentru contabilitate PFA).
- Optional: n8n if support volume justifies.
- Optional: Plausible MCP wrapper.

---

## 6. Ce să NU faci (avoid scope creep)

| Feature | De ce skip |
|---|---|
| **Live chat widget** (Intercom/Crisp) | Discord + Telegram acoperă. Adăugarea unui canal nou = mai mult de monitorizat, nu mai puțin. |
| **Marketing automation builder** (drag-drop sequences) | Resend templates + cron `send-emails` rezolvă. Builders sunt pentru marketers, tu ești un singur dev. |
| **Sales pipeline / deal stages** | Nu ai sales team. Userii fie plătesc fie nu. |
| **Knowledge base / help center** | Discord pinned messages + FAQ pe site sunt suficiente. |
| **In-app surveys / NPS tooling** | Folosește un canal Discord pentru feedback când ai nevoie. |
| **Public roadmap voting (Canny)** | 54 membri — întreabă-i pe Discord direct. |
| **Multi-admin permissions** | Ești singurul admin. YAGNI. |
| **GDPR consent management platform** | Tu deja ai pagini legale, nu vinzi ad-targeting data. |
| **Lead scoring** | Nu ai leads, ai signups care plătesc imediat sau nu. |

---

## 7. Decizia finală (executive)

1. **Build custom** pe `/admin`, nu cumpăra CRM.
2. **Adaugă Stripe MCP + Resend MCP** când lansezi PFA.
3. **Skip n8n** până la 150+ members sau când support volum cere asta.
4. **Phased 12 weeks** — primul win (Customer 360) e săpt. 2.
5. **Migration nouă:** `customer_events` table — single source of truth pentru "ce s-a întâmplat cu acest user".

Total cost: €0/lună extra. Total dev effort: ~40-60 ore spread peste 12 săpt., compatibil cu solopreneur tempo.

---

## Anexe

### A. Tables atinse de noul sistem
`profiles`, `payments`, `subscriptions`, `email_drip_queue`, `discord_drip_queue`, `platform_config`, `webhook_events` (existing pentru dedup), **`customer_events` (nou)**.

### B. Files de modificat
- `app/api/webhooks/patreon/route.ts` — write to `customer_events`
- `app/api/webhooks/stripe/route.ts` — write to `customer_events`
- `scripts/arb_payment_monitor.py` — write to `customer_events`
- `scripts/discord_role_bot.py` — write to `customer_events` on role change
- `scripts/patreon_sync.py` — write to `customer_events`
- `app/admin/dashboard/page.tsx` — already exists, extend with links to new pages
- New: `app/admin/members/page.tsx`, `app/admin/members/[id]/page.tsx`, `app/admin/retention/page.tsx`, `app/admin/funnel/page.tsx`, `app/admin/broadcast/page.tsx`, `app/admin/events/page.tsx`

### C. Risks
- **RLS:** New tables trebuie să aibă RLS strict — admin only, nu leak în client.
- **Privacy:** `customer_events.payload` nu trebuie să stocheze raw card data sau Patreon access tokens. Sanitize la write.
- **Backfill:** Patreon webhook history pe ultimele 12 luni nu e disponibilă fără re-fetch din Patreon API. Ok să începi from-now.
