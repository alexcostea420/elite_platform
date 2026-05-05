# Admin Systems Plan — 7 Sisteme

**Data:** 2026-05-04
**Context:** Alex la 54 Elite, target 100 Elite end of 2026, PFA deschis 29 apr.
**Mandat:** Plan detaliat pentru 7 sisteme de management/analytics/support.

---

## Stadiul actual (audit reușit înainte de plan)

**Ce există DEJA pe partea de admin** (`/admin/*`):
- `/admin/dashboard` — overview cu profiles + payments
- `/admin/funnel` — signup → trial → paid conversion (lunar, vechime ~mai)
- `/admin/retention` — buckets de expiry (7/14/30 zile) + cohort grid pe `elite_since`
- `/admin/members` + `/admin/members/[id]` — listare + detaliu membru
- `/admin/payments` — payments list + admin actions
- `/admin/invites` — invite CRUD
- `/admin/videos` — video CRUD

**Ce există în DB pentru analytics:**
- `video_progress` — tabel CREAT dar GOL (0 rows), schema neutilizată
- `payments` — toate plățile crypto/Stripe (NU Patreon: Patreon scrie direct în profiles)
- `subscriptions` — istoric abonamente
- `webhook_events` — dedup hashes pentru Patreon webhook

**Ce NU există:**
- Audit log admin (cine a făcut ce)
- Resend webhook integration (open/click tracking)
- Inbox unificat
- Tag/segment infrastructure pe profiles
- Churn risk score
- Refund tracking pe payments

**DB capacity:** 45 MB / 500 MB free tier (455 MB headroom). 28 MB sunt whale tables (heavy time series).

---

## Concluzia upfront

Din cele 7, **3 sunt parțial construite deja** (Revenue dashboard, Video tracking infra, Funnel/Retention). Restul de 4 sunt clean adds.

**Total effort fresh:** ~13-17 zile lucrate.
**Cu reuse din existing:** ~9-12 zile.

**Recomandare onestă** (la 54 Elite): construiește acum doar Phase 1 (3 sisteme, ~3 zile). Restul pe măsură ce ai nevoie validată. Detaliu mai jos.

---

## SISTEM 1 — Support Inbox Unificat

**Sursele de input:**
- Email: `contact@armatadetraderi.com` → Cloudflare Email Routing → Gmail (azi)
- Discord DM: bot-ul Elite-Payments primește DM (azi nu ascultă)
- Telegram: Alex are bot personal, NU pentru membri (per memory: "No Telegram Bot for Members")
- Patreon: pe site-ul Patreon (out-of-band)

**Arhitectură propusă:**

```
Tabel nou: support_threads
  id UUID PK
  source TEXT (email|discord)         -- Telegram drop, Patreon out-of-band
  external_thread_id TEXT             -- Message-ID/References pt email, channel_id pt Discord
  user_id UUID NULL FK profiles
  external_email TEXT NULL
  external_discord_id TEXT NULL
  subject TEXT
  status TEXT (open|in_progress|resolved|spam)
  priority TEXT (low|normal|high) DEFAULT 'normal'
  assignee_id UUID NULL FK profiles
  last_message_at TIMESTAMPTZ
  created_at TIMESTAMPTZ

Tabel nou: support_messages
  id UUID PK
  thread_id UUID FK support_threads
  direction TEXT (inbound|outbound)
  from_external TEXT NULL              -- email or discord username
  body TEXT
  attachments_jsonb JSONB
  sent_at TIMESTAMPTZ
  metadata_jsonb JSONB                 -- raw envelope
```

**Path-uri inbound:**
- **Email** — Cloudflare Email Workers (worker care POST la `/api/inbox/email`). Validare HMAC + parse MIME. Threading pe `Message-ID` sau `References`.
- **Discord** — extinde `discord_role_bot.py` cu event listener pe `MESSAGE_CREATE` în DM-uri (necesită gateway connect, NU doar REST). Sau worker separat. POST la `/api/inbox/discord`.

**UI:** `/admin/inbox/page.tsx`
- Listă thread-uri cu unread count, sortate după `last_message_at`
- Detaliu thread cu mesaje cronologic, reply box (sender se alege automat din source)
- Filtre: status, source, assignee, search
- Asignare manuală + status change

**Effort:** 3-5 zile.
- 0.5z migration
- 1z Discord listener (gateway connection NOU, +overhead)
- 1z Cloudflare Email Worker + parser
- 1z UI listă + detaliu thread
- 0.5z reply outbound (existing `sendDiscordDm` + Resend)

**Riscuri:**
- Discord gateway connection adaugă complexitate la bot (azi e REST-only). Pică = pierzi DM.
- MIME parsing pentru email e plin de edge cases (HTML vs text, attachments, replies cu `>`).
- RLS: doar admini pot citi tot. Membrii NU au acces la inbox.
- Costuri Cloudflare Email Workers: <2.000 emails/zi free.

**Verdict scale 54 Elite:** OVERKILL. La 5-10 ticket-uri/lună (estimat) tu citești manual din Gmail + Discord notifications. Real value începe la 100+ Elite când nu mai ții minte conversațiile.

---

## SISTEM 2 — Audit Log Admin

**Arhitectură:**

```
Tabel nou: admin_audit_log
  id UUID PK
  admin_user_id UUID FK profiles
  action_type TEXT (refund|tier_edit|invite_approve|invite_revoke|video_publish|payment_confirm|profile_role_change|...)
  target_type TEXT (profile|payment|invite|video|subscription)
  target_id TEXT
  before_jsonb JSONB
  after_jsonb JSONB
  reason TEXT NULL
  ip_address INET NULL
  created_at TIMESTAMPTZ DEFAULT now()

CREATE INDEX ON admin_audit_log (admin_user_id, created_at DESC);
CREATE INDEX ON admin_audit_log (target_type, target_id, created_at DESC);
```

**Implementare:**
- Helper `logAdminAction({ adminId, action, targetType, targetId, before, after, reason, request })` în `lib/admin/audit.ts`
- Wrap fiecare admin server action / API route care mutează:
  - `app/admin/payments/admin-payment-actions.tsx`
  - `app/admin/invites/actions.ts`
  - `app/admin/videos/actions.ts`
  - `app/admin/members/[id]/page.tsx` (tier/expiry edit)
  - `app/api/admin/*/route.ts`

- UI: `/admin/audit/page.tsx` — listă filtrabilă (admin, target_type, action, dată)

**Effort:** 1 zi. Risk minim (additive).

**Reuse:** poți folosi `webhook_events` ca model (există deja).

**Verdict scale 54 Elite:** UTIL. Tu ești solo admin acum dar uiți ce ai făcut săptămâna trecută. Veterani te întreabă "de ce am pierdut accesul" — audit te scapă de presupuneri. **Recommend Phase 1.**

---

## SISTEM 3 — Email Campaign Analytics

**Stadiul actual:** `resend.emails.send()` se apelează în `app/api/cron/send-emails/route.ts` dar răspunsul (`{data: {id}, error}`) e DISCARDAT. Nu se salvează `message_id`.

**Arhitectură:**

```
Migration:
  ALTER TABLE email_drip_queue ADD COLUMN resend_message_id TEXT;
  CREATE INDEX ON email_drip_queue (resend_message_id);

Tabel nou: email_events
  id UUID PK
  message_id TEXT (FK informal la email_drip_queue.resend_message_id)
  user_id UUID NULL FK profiles
  template TEXT
  event_type TEXT (delivered|opened|clicked|bounced|complained|unsubscribed)
  occurred_at TIMESTAMPTZ
  metadata_jsonb JSONB                 -- click_url, bounce_reason, etc
  created_at TIMESTAMPTZ DEFAULT now()

CREATE INDEX ON email_events (template, event_type, occurred_at);
CREATE INDEX ON email_events (user_id, occurred_at DESC);
```

**Implementare:**
- `app/api/cron/send-emails/route.ts` linia 105: capture `const { data } = await resend.emails.send(...)` + persist `data.id` în `email_drip_queue.resend_message_id`
- `app/api/webhooks/resend/route.ts` NEW — verifică Svix signature (Resend webhooks sunt Svix), parse event, INSERT în `email_events`
- Configurare Resend dashboard: webhook URL `https://app.armatadetraderi.com/api/webhooks/resend`, evenimente: delivered/opened/clicked/bounced/complained
- UI `/admin/email-analytics/page.tsx`:
  - Per template: sent / delivered / opened / clicked / bounced (count + %)
  - Top performing CTA links per template
  - Bounce list (cleanup)

**Effort:** 1.5 zile.
- 0.5z migration + capture message_id în send code
- 0.5z webhook endpoint cu Svix signature verify
- 0.5z UI dashboard cu Recharts

**Riscuri:**
- Free tier Resend webhooks au rate limit (acceptabil pt scale-ul tău)
- Tabelul `email_events` poate crește repede (5 events/email × 200 emails/zi = 1.000 rows/zi = ~30k/lună = ~5 MB/an la rândul mediu 150 bytes). NEGLIJABIL.
- Open tracking via tracking pixel — unele clienți email blochează (rate vor fi underreported). Click tracking via redirect e mai sigur.

**Verdict scale 54 Elite:** UTIL ACUM. Trimiți drips orb. La trial-ul de 7 zile e clutch să știi care din 4 emails convertește. **Recommend Phase 2.**

---

## SISTEM 4 — Revenue Dashboard

**Stadiul actual:** 60% construit deja.
- `/admin/funnel` calculează signup → trial → paid lunar
- `/admin/retention` are cohort grid pe `elite_since` lunar
- `/admin/dashboard` are payments aggregate

**Ce LIPSEȘTE:**
- MRR/ARR explicit (cu Patreon inclus — vezi mai jos)
- LTV calculat (avg lifespan × avg monthly revenue)
- Churn rate explicit (% expired în ultima lună fără reînnoire în 7 zile)
- Time-series chart (MRR pe ultimele 6 luni)

**Problema Patreon — important:**
Patreon NU scrie în `payments`. Scrie direct în `profiles.subscription_*`. Asta înseamnă că revenue calculat din `payments` UNDERREPORT-uri grav (lipsesc ~67 patroni Patreon × ~30 EUR/lună = ~2.000 EUR/lună invizibil).

**Două opțiuni:**

**Opțiune A** (recomandat): calculează revenue din `profiles` + `subscriptions`, nu din `payments`.
- Active Elite × estimated price per tier (Patreon vs crypto vs Stripe).
- Pentru estimare: dacă `is_veteran=true` → 33 EUR/lună, altfel 49 EUR/lună (pe Patreon e $11 vs $44 dar EUR-uri-le sunt similare). Aproximativ.
- Dezavantaj: e o estimare, nu cash exact.

**Opțiune B:** scrie shadow rows în `payments` din webhook-ul Patreon.
- Avantaj: cash precis, audit trail.
- Dezavantaj: complică webhook + necesită reconciliere când Patreon refund-ează.

**Recomand A** — la scale-ul tău precizia ±10% e ok, MRR trend e ce contează.

**Implementare:**
- New file `lib/admin/revenue-stats.ts` cu funcții:
  - `getMRR()` — sum active subs × tier price
  - `getNewMRRThisMonth()`
  - `getChurnedMRRThisMonth()`
  - `getLTV()` — avg(elite_since → expired_at) × avg monthly revenue
  - `getMRRTimeSeries(months=12)` — istoric lunar
- UI `/admin/revenue/page.tsx` cu:
  - Stat tiles: MRR, ARR, LTV, churn %
  - Recharts line chart: MRR last 12 months
  - Recharts bar chart: New vs Churn lunar
  - Tabel mini: top contributors (by amount, anonymized sau cu name dacă e admin)

**Effort:** 1.5 zile.

**Verdict scale 54 Elite:** UTIL. Ai nevoie să vezi growth ca obiectiv 2026. **Recommend Phase 1.**

---

## SISTEM 5 — Segmentare Profiles

**Arhitectură:**

```
Migration:
  ALTER TABLE profiles ADD COLUMN tags TEXT[] DEFAULT '{}';
  CREATE INDEX ON profiles USING gin (tags);
```

**Tag-uri auto** (cron orar):
- `veteran` — `is_veteran=true`
- `expiring_7d` — expires între now și now+7d
- `expiring_30d` — expires între now+7d și now+30d
- `recent_renew` — expires-now > 60d
- `trial_no_paid` — `trial_used_at NOT NULL` și nicio plată confirmată
- `trial_expired_no_renew` — trial used, expired, no payment, > 7 zile de când a expirat
- `lapsed` — fost Elite, expirat > 30 zile, niciun payment recent
- `whale` — paid > 200 EUR în ultimele 90 zile (high-value)
- `discord_disconnected` — `discord_user_id IS NULL` deși plătit
- `engaged` — `>5` video views în ultimele 7 zile (necesită video tracking — vezi #6)

**Tag-uri manuale:** admin pune din UI (`vip`, `coaching_lead`, `feedback_giver`, etc.)

**Implementare:**
- Cron `cron-tag-profiles` (orar) — recalculează auto tags
- UI `/admin/segments/page.tsx` — listă tag-uri cu count, click pe tag → listă membri
- Integrare drip campaigns: filtru pe `tags` în `email_drip_queue` insert (ex: trimite "expiring_7d" doar la cei cu tag-ul respectiv)

**Effort:** 2 zile (1z auto tags + cron, 1z UI).

**Riscuri:**
- Tag-urile bazate pe engagement necesită #6 (video tracking).
- Race conditions la cron — folosește single transaction per profile.

**Verdict scale 54 Elite:** UTIL parțial. Tag-urile statice (`veteran`, `expiring_7d`, `lapsed`) sunt valoroase oricând. Engagement tags depind de #6. **Recommend Phase 2 (static only)**, Phase 3 (engagement tags after tracking).

---

## SISTEM 6 — Churn Risk Score

**Stadiul actual:** Schema `video_progress` EXISTĂ dar nimeni nu scrie în ea (0 rows). Need wire-up.

**Date necesare:**
- `auth.users.last_sign_in_at` ✓ (există)
- video views — `video_progress` (gol, dar schema gata)
- page visits — NU există tracking

**Wire-up video tracking:**
- `app/dashboard/videos/video-library-client.tsx` — adaugă `onPlay` handler care POST-uiește la `/api/video-track` cu video_id
- Migration: verifică/adjustează schema `video_progress` (probabil are user_id, video_id, watched_at)
- Dedup: dacă același user vede același video de 2 ori în 1h, contează o singură vedere

**Score formula** (cron daily):

```
days_since_login = (now - auth.users.last_sign_in_at) în zile
videos_30d = count from video_progress în ultimele 30 zile
days_to_expiry = (subscription_expires_at - now) în zile

risk = 0
if days_to_expiry < 14 and videos_30d == 0: risk += 40
if days_to_expiry < 7: risk += 20
if days_since_login > 14: risk += 20
if days_since_login > 30: risk += 20
if videos_30d == 0 and is_member > 30 days: risk += 20

churn_risk_score = min(risk, 100)
```

**Migration:**
```
ALTER TABLE profiles ADD COLUMN churn_risk_score INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN churn_risk_calculated_at TIMESTAMPTZ;
```

**UI:** `/admin/churn-risk/page.tsx` — sortare după score desc, cu acțiuni rapide (trimite email retenție, asignează coaching).

**Effort:** 3 zile.
- 0.5z video tracking wire-up + dedup
- 1z scoring cron
- 0.5z UI
- 1z testare + tuning thresholds

**Riscuri:**
- La N=54 score-ul e zgomotos (statistical noise dominant). Util real la N=200+.
- Necesită minimum 30 zile de tracking înainte să fie predictiv.

**Verdict scale 54 Elite:** AMÂNĂ. Începe cu wire-up video tracking acum (foundation), score abia după 60 zile de date. **Recommend Phase 3 (foundation Phase 2).**

---

## SISTEM 7 — Refund Tracker

**Arhitectură:**

```
Migration:
  ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ;
  ALTER TABLE payments ADD COLUMN refund_amount NUMERIC(10,3);
  ALTER TABLE payments ADD COLUMN refund_reason TEXT;
  ALTER TABLE payments ADD COLUMN refund_admin_id UUID REFERENCES profiles(id);
  ALTER TABLE payments ADD COLUMN refund_tx_hash TEXT;          -- pt crypto refund
  ALTER TABLE payments ADD COLUMN refund_method TEXT;            -- crypto|stripe|bank|patreon
```

**Implementare:**
- `app/admin/payments/admin-payment-actions.tsx` — buton "Refund" pe fiecare plată confirmată
- Form: amount, reason, method, tx_hash (dacă crypto)
- Action: update payment + log în audit (#2) + opțional revoke subscription dacă recent
- UI separat `/admin/refunds/page.tsx` — listă refunds cu sumă totală pe lună

**Effort:** 0.5 zile.

**Riscuri:** None. Strict additive.

**Verdict scale 54 Elite:** UTIL. Cere doar 4 ore. **Recommend Phase 1.**

---

## Plan fazat

### Phase 1 — Foundation + Quick Wins (~3 zile)

Construiește pentru că au immediate value + sunt foundational pentru restul.

| # | Sistem | Effort | Reason |
|---|---|---|---|
| 2 | Audit Log | 1z | Foundation pt #7 + util de unul singur |
| 4 | Revenue Dashboard | 1.5z | 60% reuse din retention/funnel + visibility growth |
| 7 | Refund Tracker | 0.5z | Tiny, utilizează #2 |

**Total Phase 1: ~3 zile lucrate.**

**Output:** știi cine a făcut ce, vezi MRR/LTV/churn explicit, ai unde tracka refunds.

### Phase 2 — Marketing & Tracking Infra (~3 zile)

| # | Sistem | Effort | Reason |
|---|---|---|---|
| 3 | Email Analytics | 1.5z | Optimizare drip + open rate trial conversion |
| 5a | Segmentare (static tags only) | 1z | Targeting drip campaigns |
| 6a | Video tracking wire-up | 0.5z | Foundation pt churn score, util și solo (vezi ce video-uri se uită) |

**Total Phase 2: ~3 zile lucrate.**

**Output:** știi care emails convertesc, poți targeta `expiring_7d` cu mesaj specific, începi colecta video views.

### Phase 3 — Intelligence (~3 zile)

| # | Sistem | Effort | Reason |
|---|---|---|---|
| 5b | Segmentare engagement tags | 0.5z | După 30+ zile de video tracking |
| 6b | Churn risk score | 2z | Date suficiente pt score predictiv |

**Total Phase 3: ~3 zile lucrate.**

**Output:** modele predictive care merită investiția pentru retenție 80+ Elite.

### Phase 4 — Scale Ops (~5 zile)

| # | Sistem | Effort | Reason |
|---|---|---|---|
| 1 | Support Inbox Unificat | 5z | Real value abia la 100+ Elite |

**Total Phase 4: ~5 zile lucrate.**

**Output:** centralizat email + Discord DM. Anchor pentru creștere la 200+.

---

## Total cumulativ

| Faza | Zile | Cumulativ |
|---|---|---|
| 1 | 3 | 3 |
| 2 | 3 | 6 |
| 3 | 3 | 9 |
| 4 | 5 | 14 |

**~14 zile lucrate total** dacă se face tot. **3 zile** dacă faci doar Phase 1.

---

## Recomandare onestă

La 54 Elite, **fă doar Phase 1 acum**. Argumente:

1. La 54 Elite, intuiția lui Alex bate orice analytics — încă cunoaște fiecare membru. Tools-uri scale impact când nu mai poți memora.
2. Phase 1 e 3 zile, Phase 2-4 e încă 11 zile. Acele 11 zile mai bine investite în content (video-uri, indicatori, marketing) care aduc Elite #55-100.
3. Phase 2-4 cresc valoare exponențial cu N. La N=54 returnu-ul e mediocre, la N=200 e clutch.
4. Phase 1 (Audit + Revenue + Refund) ai value imediat indiferent de scale.

**Counter-argument** (să faci tot acum): dacă ai 2 săptămâni libere și vrei să nu te trezești tehnologic în urmă la N=100, fă-le pe toate acum — cu warning că #1, #5b, #6 nu vor avea ROI vizibil până în Q3.

---

## Decision points pentru Alex

1. **Scope**: Phase 1 only (3 zile) SAU all 4 phases (14 zile)?
2. **MRR Patreon**: Opțiune A (estimate din profiles) sau Opțiune B (shadow rows în payments)?
3. **Inbox** (dacă faci #1): doar Email + Discord, sau adaugi și Patreon messages?
4. **Engagement tracking**: doar video views (Phase 2 minim) sau și page visits (mai invasiv, mai date)?
5. **DB free tier 500MB**: dacă ajungi peste, upgrade la Pro ($25/lună). E mult headroom acum (45MB/500MB).

---

## Riscuri cross-system

- **Pre-PFA timeline**: PFA-ul e deschis 29 apr (6 zile în urmă). Nu blochează nimic din planul ăsta.
- **Stripe live keys** (planificat după PFA): când vin, refund tracker (#7) trebuie integrat cu Stripe refunds API. Adaugă 0.5z.
- **Discord bot complexity** (#1): trecerea de la REST-only la gateway-connection adaugă risk de bot disconnect. Necesită monitoring + auto-reconnect.
- **Resend free tier limits** (#3): 100 emails/zi free; tu trimiți deja drip + welcome + reminders. Dacă te apropii de limit, plan Pro $20/lună.
- **Free tier Supabase 500MB**: 45MB used. Tu ai 455MB headroom. Phase 1+2+3 adaugă <50MB total. Phase 4 (inbox cu attachments) poate adăuga GB rapid — atunci upgrade Pro sau move attachments la R2.

---

## Aprobare

Cer Alex:
1. Phase 1 only (3 zile) sau all phases (14 zile)?
2. Ordine recomandată în Phase 1: #2 Audit → #7 Refund → #4 Revenue. Confirmă?
3. Pentru #4 Revenue: opțiune A (estimate) sau B (Patreon shadow în payments)?
