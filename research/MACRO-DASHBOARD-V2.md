# Macro Dashboard v2 (built local, no deploy)

Construit overnight 2026-04-30 → 2026-05-01.

## Status

- File modificat: `app/dashboard/macro/macro-client.tsx` (rescris complet, ~1000 linii)
- Build: `npm run build` verde, 10.9 KB total / 230 KB cu shared chunks
- Deploy: NU. Vezi local cu `npm run dev` apoi `/dashboard/macro`

## Ce s-a schimbat vs varianta veche

### Hero v2

Înainte: card cu "Risk-On" și 5 piloni colorați.
Acum: 
- Macro Score 0-100 (număr mare, derivat din average-ul scorurilor de layer scalat la 0-100)
- Bară gradient orizontală cu marker (poziție 0-100) și etichete "Restrictiv / Neutru / Favorabil"
- Narrative auto-generat în română: "Per ansamblu regim Risk-On. Cel mai relevant: rate restrictivă (-20.8), iar credit favorabilă (+22.1)."
- 5 piloni compacti la dreapta cu emoji + score (Lichiditate / Rate / Credit / Risk Assets / Dolar)
- Live dot color-aware (verde dacă score >= 60, roșu daca <= 40)

### Top Moves săptămâna (NOU)

Bandă cu 3 chip-uri arătând cele mai mari mișcări săptămâna (sortat după |delta_7d|):
- ex: "VIX · -8.4% · 16.2"
- Calculul se face client-side din timeseries, nu necesită date noi de la fetcher

### BTC vs Net Liquidity Chart (NOU, killer chart)

Chart-ul preferat al cripto-traderilor. ComposedChart Recharts cu twin Y-axis:
- BTC pe axa stângă (linie portocalie solidă)
- Net Liquidity pe axa dreaptă (linie verde dashed)
- 52 săptămâni
- Coeficient corelație ρ afișat în corner (calculat client-side)
- Tooltip cu valori formate ($76,456 BTC + $5.7T liq)

### Multi-timeframe Table (NOU, Bloomberg-style)

Tabel sortabil cu toate metricele:
- Coloane: Metric / Valoare / 1Z / 1S / 1L / 3L / YTD / 52W range bar
- Click pe header sortează (alternează asc/desc)
- Rândurile color-coded pe verde/roșu per delta
- Range bar cu marker (poziția curentă în range-ul 52 săptămâni)
- Pe mobile: scroll horizontal natural (overflow-x-auto)

### Metric Card v2

Înainte: valoare + sparkline minuscul + change_3m chip.
Acum:
- Valoare mare top
- Chip de interpretare top-right: "Favorabil pt risc" (verde) / "Nefavorabil pt risc" (roșu) / "Stabil" (slate)
- Grilă 4-cell cu deltas: 1S / 1L / 3L / 1A
- Sparkline mai înalt (h-14 vs h-10)
- 52W range bar dedesubt cu poziție
- Click → expandare la chart full-size cu axe complete
- Tooltip text fix sub fiecare card (explică ce e metricul în română)

### Calendar Inline (NOU)

Last section: top 6 evenimente din /api/calendar pentru următoarele 7 zile.
- Sortat după impact (high → medium → low) apoi cronologic
- Format: data + timp + countdown ("în 2z") + titlu RO + impact dot + btcImpact text
- Eroare graceful: "Niciun eveniment notabil"

### Em Dash Sweep

- 0 em dash-uri în macro-client.tsx și macro/page.tsx (verificat cu grep)
- Descrieri Cross-Asset rescrise fără em dash

## Calcule client-side adăugate

Toate sunt locale, nu necesită modificări la fetcher:
- `deltaOver(timeseries, days)` → % change peste N zile
- `deltaYTD(timeseries)` → % YTD
- `range52W(timeseries)` → {min, max, pct} unde pct e poziția curentă în range
- `topWeeklyMoves(timeseries, n)` → cele mai mari N mișcări săptămâna
- `liquidityScore(layers)` → 0-100 din average layer scores
- `generateNarrative(layers, regime)` → 1-2 propoziții auto
- `interpretationFor(key, weeklyDelta)` → label + culoare
- coeficient corelație BTC vs Net Liq (în chart)

## Rămase nerealizate (deliberat, mâine decizia)

- **Layer drill-down modal**: click pe pilon → expand showing constituent metrics + score contribution. M-am oprit aici pentru că adaugă complexitate; tabelul multi-timeframe deja arată constituenții.
- **Sparkline pe pilon de layer (în hero)**: ar arăta evoluția scorului pe 90 zile. Necesită istoric per layer, nu doar per metric. Dacă vrei, adaug când macro_fetcher începe să persiste layer-history.

## Ce trebuie verificat manual de tine dimineața

1. Pornește dev: `cd ~/elite_platform && npm run dev`
2. Login cu contul tău admin
3. /dashboard/macro
4. Verifică:
   - Hero arată corect, scor între 0-100
   - Bara gradient se mișcă logic (score mare = marker spre dreapta verde)
   - Narrative-ul are sens
   - Top mișcări săptămâna afișează chip-uri (dacă timeseries are minim 7 zile date)
   - Chart-ul BTC vs Net Liq se desenează (necesită ambele timeseries în date)
   - Tabel sortabil funcționează (click pe headers)
   - Carduri individuale se expandează la click
   - Calendar inline arată evenimente din /api/calendar
   - Mobile (375px): nimic nu iese în afară

5. Dacă e ok, faci `git add -A` și `git push origin main` să mergă pe Vercel. Eu nu am push-uit nimic.

## Dacă vrei rollback

`git checkout -- app/dashboard/macro/macro-client.tsx` (versiunea de pe ramură rămâne intactă în git).
