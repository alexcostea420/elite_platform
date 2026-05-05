# Alex's Brain — Improvements Research
*Date: 2026-05-03*
*Scope: similar-product benchmarking, proactive auto-posting playbook, economic-calendar alert spec*
*Status: research only — no code or config changes proposed for execution yet*

---

## 1. Executive Summary

Alex's Brain is solid as a reactive Q&A assistant grounded in METHODOLOGY.md, PIVOTS-GANN-ECLIPSES.md, and PLAYLIST.md, but it currently does zero proactive engagement, which is the single biggest gap relative to competing trading-community bots (Alpha.bot, Tradytics, MktRecap, twBot.gg). The highest-leverage additions are: a small set of low-frequency proactive posts anchored to BTC weekly closes, methodology drips, and macro events; plus an automated economic-calendar alert pipeline that reuses the existing `/api/calendar` Forex Factory feed and emits a "T-15 minute warning" plus a post-release interpretation in the bot's voice. Risks are real (spam, hallucinated post-release interpretations, identity leak on auto-posts) but manageable with strict rate limits, templated outputs, and a dedicated `#stiri-macro` channel separated from `#chat-general`.

---

## 2. Current State Assessment

### What's good
- **Voice and rules are dialed in.** SOUL.md is explicit: anti-FOMO, lot-size obsession, no financial advice, no infrastructure leaks. Per-channel behavior is defined for `#analize-elite`, `#trades-elite`, `#chat-general`.
- **Knowledge base is grounded.** METHODOLOGY.md is extracted from 49 transcripts and quotes Alex directly in Romanian + English. PLAYLIST.md gives a clean topic→YouTube mapping so the bot can always punt to a video instead of inventing an answer.
- **Security posture is strong.** Explicit social-engineering rebuttals, explicit "never reveal AI/bot/Claude" rule, explicit no-execute / no-config-modify rules.
- **Reactive scope is correct.** Mention-only (`requireMention: true`) avoids the most common bot anti-pattern of replying to every message.

### Gaps (vs. similar products)
1. **No proactive presence.** Members only get value when they remember to mention the bot. Most premium trading communities have at least a daily morning brief or end-of-day recap (Alpha.bot, MktRecap, Tradytics).
2. **No event-driven triggers.** No reaction to BTC weekly close, FOMC, CPI, or eclipse pivot windows — exactly the events Alex's own methodology cares about.
3. **No methodology drip / lesson rotation.** With 821 lines of METHODOLOGY.md and 51 videos in PLAYLIST.md, there's a deep well of educational content that members never see unless they ask.
4. **No structured journaling or trade-recap nudge.** Tradytics, Tradewink, and Afterprime all push journaling. Alex's audience is 95% beginners — journaling prompts would compound community discipline.
5. **No calendar integration despite the platform already pulling Forex Factory.** `/api/calendar/route.ts` already filters USD high/medium impact events with BTC interpretation strings — but the bot is blind to it.
6. **No memory-of-discussion across days.** Bot reads daily logs in `memory/` but doesn't surface "earlier this week we discussed X" — small but high-engagement feature.

---

## 3. Section 1 — Similar Products Research

Goal: borrow specific, narrow features. Not "AI summaries" — concrete behaviors.

| Product | What it does | Borrowable feature for Alex's Brain |
|---|---|---|
| **Alpha.bot** (25k+ Discords) | Scheduled posting of charts, heatmaps, and price recaps; price-alert subscriptions per user; paper-trader sim with `/buy`, `/sell`, `/stop` commands. | (a) **Scheduled BTC weekly-close post** every Sunday 23:00 UTC with the close price + EMA50W status (above/below). (b) **Paper-trade journaling** — `/jurnal entry BTC long 65k SL 62k TP 72k` so members log trades into a thread the bot can later reference. |
| **Tradytics autopost bots** | Auto-posts options flow, dark-pool prints, insider transactions throughout the day. Querying bots respond to `/flow TSLA` etc. | (a) **End-of-day "azi pe piață"** post: top 3 movers in the Top-100 + BTC dominance change + USDT.D move. Single embed, no commentary if no edge. (b) **Querying commands**: `/zone BTC` returns the current Fib buy/sell zones, `/rsi BTCUSDT` returns weekly RSI status — pulled from existing platform APIs. |
| **MktRecap** | AI-generated daily market recap delivered to Discord/Telegram; sentiment + breaking news. | **Friday weekly recap** in Romanian: BTC % week, BTC.D move, USDT.D move, the macro events that hit, plus 1-line takeaway grounded in methodology ("EMA50W still holds — acumulare nu s-a terminat"). Cap at 8 lines, no predictions. |
| **CoinTrendzBot** | `/chart`, `/price`, `/ta`, FED calendar feature, 7000+ tokens, sentiment commands. | (a) **`/chart BTC 1W`** that returns a TradingView snapshot link with EMA50 + RSI overlay (don't reinvent — just deeplink to TradingView). (b) **`/fed`** showing next FOMC date and current rate — already in the calendar API. |
| **twBot.gg** | NFP/FOMC/CPI reminders 15 min before; trade journal with AI insights. | **Direct precedent for the calendar alert spec in Section 5.** Their cadence (T-15 min only on high-impact USD) is exactly right — no reminders for Crude Inventories or German PMI. |
| **Unusual Whales Discord bot** | Real-time options flow, dark-pool, insider — high-signal, low-frequency embeds. | **One feature only**: their compact embed style (ticker + direction + premium + expiry, nothing else) is the right pattern for Alex's brain to mimic on whale-tracker alerts (we have the data already in `whale_consensus`). Don't build this in Phase 1, but it's the model. |
| **Afterprime Discord** (FX prop) | Live alpha channels, transparent trade-by-trade journals, beta-feature sneak peeks, weekly Q&A office hours. | **"Lecția săptămânii"** (lesson of the week) — a Sunday post that quotes one concept from METHODOLOGY.md (e.g., section 2.1 sell zones) + the video link. Forces methodology repetition, which is Alex's whole brand. |
| **Discord-Finviz Bot / news-keeper (open-source)** | Forex Factory + FRED data with Discord webhook posts at configurable lead times. | **Reference architecture**: pull Forex Factory JSON, store last-fetched IDs, schedule one-off webhook posts at `event_time - 15min` and `event_time + 2min`. We can replicate this in ~150 LOC of Python in `scripts/` running as a launchd daemon. |

### Gaps competitors cover that we should NOT copy
- **Signal-providing bots** (Tradewink, signal Discords): violates "educational only, no financial advice" — explicit SOUL.md rule.
- **Auto-trading / paper-trading on real exchanges**: violates "never execute commands, never interact with exchanges."
- **Tipping bots** (Tip.cc): not relevant to a closed paid community.
- **Engagement/levelling bots** (MEE6 XP, Arcane): contradicts "anti-FOMO, calm, conservative" — gamifying activity attracts noise, not discipline.

---

## 4. Section 2 — Auto-Posting Playbook

### Posting principles (must hold for every post)
1. **Cap: max 1 scheduled post per day in `#chat-general`, max 2 per day in a dedicated `#stiri-macro`.** Alex hates noise. If two cadences collide on the same day, drop the lower-priority one.
2. **No predictions.** Only zones, methodology references, and observable facts (price, EMA status, RSI bucket).
3. **No identity leak.** Posts go out as Alex's Brain, never reference automation, schedules, cron, or "I'll post again tomorrow."
4. **Methodology-anchored.** Every post must cite a methodology rule or a PLAYLIST.md video. No freeform commentary.
5. **Opt-out via channel.** Members can mute channels — auto-posts go to `#stiri-macro` and `#educatie`, never `#trades-elite` or `#analize-elite` (those stay reactive only).
6. **Romanian, with diacritics.** Same voice as reactive replies.

### Suggested cadence

| Day | Time (RO) | Channel | Post type | Priority |
|---|---|---|---|---|
| Mon | 09:00 | `#educatie` | "Săptămâna începe — plan, nu predicții" | must-have |
| Tue–Thu | — | — | (silent unless macro event) | — |
| Fri | 18:00 | `#chat-general` | "Recap săptămână" | must-have |
| Sun | 23:00 | `#educatie` | "Lecția săptămânii" + 1 video link | must-have |
| Daily | 08:00 | `#stiri-macro` | "Azi pe calendar" (only if events exist) | must-have |
| Event-driven | T-15min / T+2min | `#stiri-macro` | High-impact USD release alert | must-have |
| Event-driven | T-3 days, T-day | `#educatie` | Eclipse / pivot window reminder | nice-to-have |
| Event-driven | At BTC weekly close | `#educatie` | EMA50W status + close price | nice-to-have |
| Random ad-hoc | — | — | "Reminder: max 4 alts, 20-30% cash" | nice-to-have, max 1×/week |

### 12 concrete post ideas (drop-in templates)

> All templates are in Romanian with diacritics. Variables in `{curly}`. Bot fills them at send time.

#### A. Monday Morning Brief — `#educatie` (must-have)
```
Săptămâna începe. 📊
BTC închidere weekly: ${close_price} ({pct_change}% față de săptămâna trecută)
EMA 50 weekly: {above_or_below} → {acumulare_status}
Calendar high-impact USD săptămâna asta: {event_count} evenimente ({event_list})

Plan, nu predicții. Cine are entry-uri în zonă, le face pe lot size calculat.
Cine nu, așteaptă.
```

#### B. Friday Weekly Recap — `#chat-general` (must-have)
```
Recap săptămână 📊
- BTC: {pct_week}% ({close_price})
- BTC.D: {dominance_change}%
- USDT.D: {usdt_dominance_change}%
- Macro hit: {macro_events_summary}

Concluzie metodologie: {one_line_methodology_takeaway}
(Ex: "EMA 50 weekly încă ține → acumularea nu s-a terminat.")
```

#### C. Sunday "Lecția Săptămânii" — `#educatie` (must-have)
Rotates through METHODOLOGY.md sections in order. Bot picks section N where N = `(week_of_year % 12) + 1`, pulls the matching PLAYLIST.md video.
```
Lecția săptămânii: {section_title} 🎯

{2-3 line excerpt from METHODOLOGY.md, exact quote}

Alex a explicat asta în detaliu aici: {youtube_link}
```

#### D. Daily Calendar Brief — `#stiri-macro` (must-have, only if events)
```
Azi pe calendar 📅
- {time_ro}: {event_titleRo} ({impact_emoji}) — forecast {forecast}, anterior {previous}

Fără surprize, fără FOMO. Reduce risk înainte de release.
```
Skip post entirely if no high-impact USD events today.

#### E. T-15 Minute Macro Alert — `#stiri-macro` (must-have)
See full template in Section 5.

#### F. T+2 Minute Post-Release Interpretation — `#stiri-macro` (must-have)
See full template in Section 5.

#### G. BTC Weekly Close Watcher — `#educatie` (nice-to-have)
Triggers ~30 minutes after Sunday 00:00 UTC weekly close.
```
Închidere weekly BTC: ${close}

EMA 50 weekly: {above/below} ({distance}% distanță)
RSI weekly: {rsi_value} ({zone: oversold/neutral/overbought})

{conditional_methodology_line}
```
Conditional line examples (pick one based on data):
- If 2 closes above prior resistance: "2 close-uri weekly peste {level} = confirmare schimbare structură (cf. METHODOLOGY 1.4)."
- If below EMA50W: "Sub EMA 50 weekly = încă suntem în acumulare."
- If RSI > 70 weekly: "RSI weekly în zonă overbought — atenție la divergențe bearish (cf. METHODOLOGY 2.2)."

#### H. Eclipse / Pivot Window Reminder — `#educatie` (nice-to-have)
Triggers T-3 days before any eclipse from PIVOTS-GANN-ECLIPSES.md.
```
Atenție: eclipsă {type} pe {date}.

Conform metodologiei pivoților de timp:
- Fereastra de pivot major: 15 zile înainte și după
- Eclipsele totale > parțiale ca volatilitate

Ce înseamnă asta? Volatilitate crescută. NU e semnal de buy/sell în sine.
Corelăm cu structura tehnică.

Detalii: PIVOTS-GANN-ECLIPSES (în knowledge base-ul comunității).
```

#### I. Risk Management Reminder — random, `#chat-general` (nice-to-have, max 1/week)
Rotates between 4 templates. Bot picks one at random on a Wednesday at 14:00 if no other post that day.
```
Reminder săptămânal 🎯
Max 4 altcoins. 20–30% cash mereu. Max risc: $250/trade.
Spot înainte de futures. 30–90 zile pauză după profit.

Cine respectă regulile, supraviețuiește bull-ul ȘI bear-ul.
```

#### J. Lot Size PSA — random, `#chat-general` (nice-to-have, max 1/week)
```
Reminder: leverage-ul nu contează. Lot size-ul contează.

Dacă încă te uiți la 10x / 20x / 50x în loc de "cât în dolari risc",
uită-te aici: https://youtu.be/4tNSs6egoM0
```

#### K. Methodology Quote of the Day — could replace "Lecția Săptămânii" if too few drops (nice-to-have)
Pulls a single quoted line from METHODOLOGY.md (the bot already has the ~80 quoted "🇷🇴" lines indexed). One per week max.
```
"{quote_ro}"
— din metodologia Alex Costea
```

#### L. Community Question Prompt — `#chat-general` (nice-to-have, max 1 every 2 weeks)
```
Întrebare pentru comunitate 🤔
Dacă BTC închide weekly sub {EMA50W_level}, care e planul tău?
- A) DCA mai jos
- B) Iei profit din ce ai
- C) Stai cash și aștepți

Răspundeți + motivați. Nu există răspuns greșit dacă ai un plan.
```
Note: this one is borderline — risk that members read it as a poll signal. Test cautiously, or drop entirely.

### Posting volume estimate
- Monday brief: 1/week
- Friday recap: 1/week
- Sunday lecție: 1/week
- Daily calendar brief: 3–5/week (only on event days)
- T-15 / T+2 macro alerts: ~6–8/week (FOMC weeks: 4 alerts; CPI weeks: 4 alerts; quiet weeks: 0–2)
- BTC weekly close: 1/week
- Eclipse / pivot: ~2/year (rare)
- Risk / lot-size PSAs: 1–2/week
- Community questions: 0.5/week

**Total: 8–12 posts/week split across 2 channels (`#educatie`, `#stiri-macro`) + 1–2 in `#chat-general`. That's the right density — visible but not noisy.**

---

## 5. Section 3 — Economic Calendar Alerts Spec

### 5.1 Data source decision
**Reuse `/api/calendar` (Forex Factory weekly JSON via `nfs.faireconomy.media/ff_calendar_thisweek.json`).**

Reasons:
- Already deployed, already cached 1h, already filtered to USD high/medium impact, already has Romanian translations and BTC-impact strings hardcoded for the events that matter.
- ISO 8601 dates with timezone (`-04:00`) — easy to schedule lead-time reminders.
- Free, no API key, no rate limit issues observed.

The bot doesn't need to scrape directly. Two clean options:
- **Option A (preferred):** A new launchd daemon `scripts/discord_calendar_alerts.py` that hits `https://app.armatadetraderi.com/api/calendar` every 5 minutes, dedupes already-fired alerts via a small SQLite/JSON state file, and posts via Discord webhook.
- **Option B:** Add a Vercel cron `/api/cron/calendar-alerts` that does the same — but webhook delivery from Vercel cron is harder to tune for exact timing (the cron only fires every minute at best).

Option A is more reliable for sub-minute precision around T-15.

### 5.2 Event filter rules

**Tier 1 — fire T-15 + T+2 alerts (must-have)**
- USD `Federal Funds Rate`
- USD `FOMC Statement`
- USD `FOMC Press Conference`
- USD `FOMC Meeting Minutes`
- USD `CPI m/m`, `CPI y/y`, `Core CPI m/m`, `Core CPI y/y`
- USD `PCE Price Index m/m`, `Core PCE Price Index m/m`
- USD `Non-Farm Employment Change` (NFP)
- USD `PPI m/m`, `Core PPI m/m`
- USD `Advance GDP q/q`

**Tier 2 — fire T-15 alert only, no post-release (nice-to-have)**
- USD `Unemployment Rate`
- USD `Retail Sales m/m`, `Core Retail Sales m/m`
- USD `ISM Manufacturing PMI`, `ISM Services PMI`
- USD `Jackson Hole Symposium`

**Tier 3 — silent unless explicitly added (do not alert by default)**
- All medium-impact USD events (Crude Oil Inventories, Consumer Confidence, etc.) — too noisy. They appear in the daily brief (post D) but no T-15.
- All non-USD events (skip ECB, BoE, BoJ, China — for now). Optional Phase 3 add: ECB rate decisions only.

Filter logic in pseudocode:
```python
TIER_1 = {"Federal Funds Rate", "FOMC Statement", ...}
TIER_2 = {"Unemployment Rate", "Retail Sales m/m", ...}

def should_alert(event):
    if event.country != "USD": return None
    if event.impact != "High": return None
    if event.title in TIER_1: return ("T-15", "T+2")
    if event.title in TIER_2: return ("T-15",)
    return None
```

### 5.3 Channel placement

**Recommendation: dedicated `#stiri-macro` channel.**

Reasons:
- `#chat-general` should stay social — pushing 8 macro alerts/week into chat clutters it.
- Members who care about macro opt in by reading `#stiri-macro`. Members who don't, mute it.
- Keeps `#trades-elite` and `#analize-elite` purely reactive (Alex's analyses / member trades only).
- Daily-brief post D goes to `#stiri-macro` too, so the channel has self-contained narrative.

If Alex doesn't want a new channel, fallback: post in `#chat-general` but cap at Tier 1 only (~4 alerts/week).

### 5.4 Message templates (Romanian)

#### T-15 minutes — high-impact alert
```
⚠️ În 15 minute: {event_titleRo}

Forecast: {forecast}  |  Anterior: {previous}
Impact așteptat asupra BTC: {btcImpact}

Reduce risk-ul. Nu intra pe poziții noi acum.
Volatilitatea în primele 2-5 minute după publicare e maximă.
```

Example filled (FOMC):
```
⚠️ În 15 minute: Declarația FOMC

Forecast: -  |  Anterior: 4.50%
Impact așteptat asupra BTC: BTC negativ în 48h după 7 din 8 ședințe FOMC în 2025.

Reduce risk-ul. Nu intra pe poziții noi acum.
Volatilitatea în primele 2-5 minute după publicare e maximă.
```

#### T+2 minutes — post-release interpretation (Tier 1 only)
**Strict template — bot does NOT improvise.** Bot picks branch based on `actual vs forecast` comparison from the live Forex Factory feed (the `actual` field appears once published).

```
📊 Publicat: {event_titleRo}

Actual: {actual}  |  Forecast: {forecast}  |  Anterior: {previous}
{verdict_line}

Ce înseamnă pentru crypto:
{interpretation_line}

⚠️ Următoarele 2-5 minute = volatilitate maximă. NU FOMO în mișcare.
Așteaptă structura pe 4H. Verifică lot size înainte de orice entry.
```

`verdict_line` is one of (deterministic, no LLM):
- `actual > forecast`: "Peste așteptări 🔴"
- `actual < forecast`: "Sub așteptări 🟢"
- `actual == forecast`: "Pe așteptări ⚪"

`interpretation_line` is a hardcoded lookup table per event (extend BTC_IMPACT_DATA in route.ts with separate "above/below/at" branches). Examples:

| Event | actual > forecast | actual < forecast | actual == forecast |
|---|---|---|---|
| CPI m/m | Inflație peste așteptări → USD se întărește → headwind crypto. BTC istoric -3 până la -4% în 24h. | Inflație sub așteptări → Fed mai blând → tailwind crypto. BTC istoric +3 până la +6% în 24h. | Reacție mică, piața deja prețuit. |
| Federal Funds Rate | Rată mai mare decât așteptat → hawkish → BTC negativ. | Rată mai mică → dovish → BTC pozitiv pe termen scurt. | Tonul declarației contează mai mult decât rata. |
| NFP | Joburi peste așteptări → Fed nu taie → BTC negativ. | Joburi sub așteptări → Fed taie → BTC pozitiv. | Reacție minimă. |
| GDP | Economie puternică → mai puțină lichiditate → BTC negativ. | Economie slabă → Fed pompează → BTC pozitiv. | Neutru. |
| PCE / Core PCE | Inflație persistentă → BTC negativ. | Inflația scade → BTC pozitiv (indicator preferat al Fed). | Neutru. |

**Critical: never let an LLM write this line freely.** Hallucinated macro interpretations on a paid community = identity-leak risk + reputational risk. The lookup-table approach matches Alex's style ("date, nu opinii") and is defensible.

### 5.5 Frequency estimate

Typical month:
- 1× FOMC week → 4 alerts (statement T-15, statement T+2, presser T-15, presser T+2)
- 1× CPI release → 2 alerts (T-15, T+2)
- 1× Core PCE → 2 alerts
- 1× NFP → 2 alerts
- 1× PPI → 2 alerts
- 2× GDP/Retail Sales/PMI → ~4 alerts
- Daily brief: ~15-20 across the month

**Total: ~30-35 macro posts/month in `#stiri-macro` = ~1/day average.** That's the upper bound members will tolerate before muting. If Alex feels it's still too much, drop Tier 2 entirely and go Tier 1 only (~10-15/month).

---

## 6. Recommended Phased Rollout

### Phase 1 — Lowest risk, highest signal (week 1-2)
Goal: ship proactive presence without risking spam or hallucination.

1. **Create `#stiri-macro` channel** (Discord admin task, 5 min).
2. **Daily Calendar Brief (Post D).** Template-driven, pulls from `/api/calendar`, posts at 08:00 RO time. Skip days with no Tier-1 or Tier-2 events. Failure mode: if API is down, post nothing (silent fail).
3. **T-15 + T+2 macro alerts (Tier 1 only).** Hardcoded lookup table for interpretation, no LLM in the post-release branch. ~6-8 posts/week max.
4. **Sunday "Lecția Săptămânii."** Rotates through METHODOLOGY.md sections, picks matching PLAYLIST.md video. 1/week.

**Risk in Phase 1:** very low. Templates are fixed, no LLM in critical paths.

### Phase 2 — Engagement layer (week 3-4)
Goal: add the human-feeling weekly cadence.

5. **Monday Morning Brief (Post A)** in `#educatie`. Pulls BTC weekly close + EMA50W status + week's macro events. Uses LLM only to pick the conditional methodology line from a fixed list (5 options).
6. **Friday Weekly Recap (Post B)** in `#chat-general`. Same pattern — LLM picks 1 of N pre-written takeaway lines based on rule matches.
7. **BTC Weekly Close watcher (Post G)** in `#educatie`. Conditional methodology line from a fixed list.
8. **Risk Management + Lot Size PSAs (Post I, J).** Random rotation, 1-2/week max, only on Wed/Thu when nothing else is posted.

**Risk in Phase 2:** medium. LLM-assisted but constrained. Test for 2 weeks and have Alex review every post in a private channel before broadcasting.

### Phase 3 — Experimental (week 5+, only if Phases 1-2 prove out)
Goal: deeper personalization, higher-touch features. Drop any that don't land.

9. **Tier 2 calendar alerts** (T-15 only for ISM PMI, Retail Sales, Unemployment). Doubles macro post count — verify members aren't muting `#stiri-macro` first.
10. **Eclipse / Pivot Window reminders (Post H).** Rare but high-information. Pull dates from PIVOTS-GANN-ECLIPSES.md.
11. **`/zone BTC`, `/rsi BTC`, `/fed` slash commands** that read from existing platform APIs (`/api/crypto/rsi`, `/api/calendar`).
12. **`/jurnal` command** — light trade-journaling thread per user. Tradytics-style, but read-only (bot stores in a channel thread, doesn't write to a DB). Risk: scope creep.
13. **Community question prompts (Post L).** Test 1-2 and watch reactions. Drop if they pull in low-quality replies.

**Risk in Phase 3:** medium-high. Skip anything members don't engage with after 2-3 instances.

### What we explicitly do NOT build
- Signal channels (buy/sell calls). Hard violation.
- Auto-trading or paper trading on real exchanges. Hard violation.
- Telegram member-facing notifications. Per Alex's stated preference (`feedback_no_telegram_bot.md`).
- Per-user price alert subscriptions. Too noisy at 54 members; revisit at 200+.
- Sentiment scoring posted to Discord (we have this internally for countertrade — it stays admin-only).

---

## 7. Risks and Concerns

### High risk
1. **Hallucinated macro interpretations.** If a CPI print comes out at 0.4% vs 0.3% forecast and the bot writes a freeform paragraph about why BTC will dump, it's wrong half the time and looks unprofessional. **Mitigation: lookup-table interpretation only, no LLM in T+2 posts.**
2. **Identity leak via auto-posts.** A scheduled post that says "let me check the calendar for you" or has an "Edited by bot" footer breaks SOUL.md's never-reveal rule. **Mitigation: every template reviewed for AI-tells before deploy; no per-message metadata; webhooks impersonate Alex's Brain user only.**
3. **Spam fatigue → mass channel mute.** If `#stiri-macro` gets 5+ posts/day on a busy macro week, members mute, then we lose the channel entirely. **Mitigation: hard cap of 2 posts/day in `#stiri-macro`, batch low-priority events into the daily brief instead of separate posts.**

### Medium risk
4. **Outage during a macro event = silent failure no one notices.** If the cron daemon dies on FOMC day, nobody gets the T-15 alert and the channel feels broken. **Mitigation: launchd `KeepAlive=true`; daily heartbeat post to a private admin channel so Alex sees the bot is alive; Telegram alert to Alex if calendar API returns 5xx 3× in a row.**
5. **Forex Factory data stale or wrong.** ISO timestamp could shift due to DST or schedule change; a 2pm event listed as 1pm fires the alert at the wrong time. **Mitigation: log every fired alert; weekly admin review of last week's alerts vs actual release times for the first month.**
6. **Members ask "can I get this on Telegram?"** → opens the door to building a member-facing TG bot, which Alex rejected. **Mitigation: stock answer "Pentru notificări, urmărește canalul `#stiri-macro` pe Discord. Telegram nu e planificat momentan."**

### Low risk
7. **Lecția Săptămânii becomes repetitive.** With 12 sections cycled weekly, the same lesson hits every 12 weeks. **Mitigation: extend rotation to 24-30 sub-sections from METHODOLOGY.md + PIVOTS doc + LOT-SIZE doc; rotate quotes within sections.**
8. **Community Question prompts misread as signals.** "Care e planul dacă BTC închide sub X" sounds like a forecast. **Mitigation: keep this in Phase 3 only, A/B test once, drop if any member responds with "deci recomanzi A?"**
9. **Translation bugs in interpretation table.** A Romanian phrasing that reads as a financial recommendation by accident. **Mitigation: Alex reviews every template line before Phase 1 ship; revisit annually.**

### Operational
- **Where the daemon lives:** Mac Mini M4, alongside `arb_payment_monitor.py` and `discord_role_bot.py` as a launchd service. Same logging conventions, same `~/Library/Logs/` rotation.
- **Webhook URL storage:** in `.env` next to existing Discord bot token. Never in git.
- **State file:** `~/alexs-brain/data/posted_alerts.json` — set of `event_id` (date+title hash) marked as posted, prevents double-fires across daemon restarts.
- **Build time estimate:** Phase 1 = ~1 day of work (calendar daemon + 4 templates + channel creation). Phase 2 = ~2 days. Phase 3 = ~3-5 days depending on which features land.

---

## Sources

- [Top Crypto Discord Bots — Blockchain Ads](https://www.blockchain-ads.com/post/crypto-discord-bots)
- [Alpha.bot — Discord finance bot](https://www.alpha.bot/)
- [Alpha.bot Paper Trading](https://www.alpha.bot/features/paper-trading)
- [Tradytics Discord Bots](https://tradytics.com/discord-bots)
- [CoinTrendzBot — Crypto Market Bot](https://cointrendzbot.com/crypto-discord-bot)
- [CoinTrendzBot — FED Calendar feature](https://cointrendzbot.com/features/fedcalendar)
- [twBot.gg — Trading companion](https://twbot.gg/)
- [MktRecap — AI-powered market recaps](https://mktrecap.com)
- [Whalebot.io](https://whalebot.io/)
- [Unusual Whales Discord Bot](https://unusualwhales.com/discord-bot)
- [Afterprime Discord trading community](https://afterprime.com/discord/)
- [Tradewink — Discord Trading Bot Guide](https://www.tradewink.com/learn/discord-trading-bot-guide)
- [Economic Calendar Bot — top.gg](https://top.gg/bot/1083815375352901716)
- [Discord-Finviz-Bot — open-source ref](https://github.com/feveromo/discord-finviz-bot)
- [news-keeper — Economic Calendar Discord Bot (open source)](https://github.com/phoscoder/news-keeper)
- [JBlanked Calendar API docs](https://www.jblanked.com/news/api/docs/calendar/)
- [Forex Factory weekly JSON feed](https://nfs.faireconomy.media/ff_calendar_thisweek.json) — already used in `/api/calendar/route.ts`
