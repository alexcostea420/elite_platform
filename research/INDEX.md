# Pro-Up Research, Index pentru Alex

Generat overnight 2026-04-30 → 2026-05-01.

Toate research-urile sunt în `research/`. Fiecare fișier are structură identică: per pagină → ce e slab, idei pro-up cu link-uri externe (Linear, Stripe, Vylos, TradingView, etc).

## Documente

| Fișier | Pagini acoperite | Linii |
|---|---|---|
| `pro-up-marketing.md` | landing, /upgrade, /track-record, /sesiuni, legal, /blog | 167 |
| `pro-up-dashboard-core.md` | /dashboard, /videos, /library, /today, /resurse, /portfolio, /performance, /signals, /trial-feedback | 251 |
| `pro-up-data-dashboards.md` | /stocks, /crypto, /news, /calendar, /risk-score, /indicators, /should-i-trade | 190 |
| `pro-up-tools-aux.md` | /tools/whale-tracker, /tools/calculator, /tools/journal, /tools/liquidation-map, /bots, /ask-alex, /pivots, /countertrade, /login, /signup, 404, /error | 331 |
| `pro-up-global-ui.md` | navbar, footer, command-k, globals.css, buttons, hero, stats, pricing-cards, testimonials, FAQ, trial-popup, blur-guard, loading-states, empty-states, modals, forms | 550 |
| `MACRO-DASHBOARD-V2.md` | Macro dashboard reconstruit (cod local, nu deploy) | acest doc |

## Cele mai mari găuri pe site (top 10, în ordinea impactului)

1. **Emoji ca icon-system** peste tot. Single biggest tell că e "AI generated". Înlocuire cu Lucide icons + iconuri proprii pe brand.
2. **Numere fake pe landing**: Risk Score "83", Stocks "$360.59", Pivots "3/9" sunt hardcoded când datele live deja există în cod. Înlocuire imediată.
3. **`gradient-text` pe orice h1** + `tracking-[0.3em]` uppercase pe orice eyebrow. Identic pe 30+ pagini = nu mai e accent, e wallpaper.
4. **Carduri kpi tip "stat tile" identice** pe 7 pagini, mereu centrate. Stripe/Posthog le aliniază left + adaugă context (delta + sparkline).
5. **Diacritice lipsă pe /track-record** și pe /bots (regulă încălcată în 30+ string-uri).
6. **Em dash-uri** încă prezente în `/sesiuni`, intraday components, alte locuri (search global rămas de făcut).
7. **Loading states** = 22 fișiere `loading.tsx` aproape identice. Nu reflectă forma conținutului. Posthog/Linear stilul: skeleton tailored la layout.
8. **Pricing page (/upgrade)** lipsă: monthly/annual toggle, monthly-equivalent prices, comparison table, FAQ inline, "popular" badge animat.
9. **Track-record fără diagrame**: e doar timeline text. Stripe Atlas / Public.com / Polymarket fac equity curve + risk-of-ruin + trade list cu filtru.
10. **Coming Soon templates fade**: 5 pagini identice (`should-i-trade` is now actually live, dar `/pivots`, `/countertrade`, `/bots/*`). Trebuie un singur `<ComingSoon>` cu waitlist + sneak peek + founder updates.

## Trei valuri propuse pentru atac

**Val 1 (impact max, 1-2 zile):** scoate emoji-as-icon, înlocuiește numerele fake din landing, sweep diacritice + em dash-uri, fă un singur `<ComingSoon>` reutilizabil, scoate `gradient-text` din unde nu e nevoie.

**Val 2 (vizibilitate trader, 2-3 zile):** Stocks zone-ladder (înlocuiește B1/B2/S1/S2), News event clustering (Memeorandum-style), Calendar cu flag-uri + sparkline ultim 12 prints, Risk Score reduce la o singură vizualizare hero (azi sunt 4 stiluri diferite), Macro dashboard v2 (deja construit local).

**Val 3 (polish + retenție, 3-5 zile):** Videos cu watch progress + player propriu, Journal cu calendar P&L în hero (Tradezella), Whale Tracker cu KPI strip + tape feed (Arkham/Hyperdash), Pricing cu monthly/annual toggle, /track-record cu equity curve + filter trades.

## Reguli respectate de research

- Nicio recomandare cu cifre fake performance / Sharpe / LIVE badges
- Nicio recomandare de Telegram bot pentru membri
- Toate textele propuse: română cu diacritice, fără em dash
- Mobile-first 375px presupus
- Emerald (#10B981) pe crypto-night păstrat ca brand

## Ce am construit deja LOCAL (zero deploy, zero git push)

- `app/dashboard/macro/macro-client.tsx` complet rescris:
  - Macro Score 0-100 + bară orizontală favorabil/restrictiv + 5 piloni mini
  - Narrative auto-generat 1 propoziție bazat pe top 2 layers
  - Top mișcări săptămâna (3 chip-uri ordonate după magnitude)
  - Chart mare BTC overlay Net Liquidity 52 săptămâni cu corelație ρ
  - Tabel multi-timeframe sortabil pe orice coloană (1Z / 1S / 1L / 3L / YTD + 52W range bar)
  - Per-card: 4 deltas (1S/1L/3L/1A), sparkline mai mare, 52W range bar, chip de interpretare "Favorabil/Nefavorabil pt risc", tooltip explicativ, expansion la click
  - Fear & Greed gauge păstrat
  - Calendar economic 7 zile inline (din /api/calendar existent)
  - Em dash sweep pe pagină: zero rămase

Build local trece: `npm run build` verde, 10.9 KB pentru pagină. Nu am pushed, nu am deployat. Dimineața arunci o privire pe `localhost:3000/dashboard/macro` și zici dacă e ok.

Pornește cu `npm run dev` în `~/elite_platform`. Login cu contul tău admin → Dashboard → Macro.
