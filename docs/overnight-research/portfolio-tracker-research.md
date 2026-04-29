# Raport de cercetare — Portfolio Tracker pentru Armata de Traderi

**Data:** 2026-04-28
**Autor:** Claude (cercetare overnight)
**Destinatar:** Alex / Elite Platform
**Buget de timp:** ~25 min cercetare web + sinteză
**Scop:** A decide dacă merită construit un portfolio tracker pentru membri Elite și, dacă da, ce caracteristici să primeze în v1.

---

## TL;DR (executive summary)

Concluzia după cercetare: **Da, merită construit**, dar gândit ca o unealtă "educațională + comparativă", nu ca un competitor pentru CoinTracker/Koinly (care fac taxe) sau Zerion/DeBank (care fac on-chain sync). Toți marii jucători (CMC, CoinGecko, CoinStats) au portofolii slabe pe partea de **counterfactual/scenarii** — exact "ce-ar fi fost dacă". Aceasta este oportunitatea reală.

Recomandarea: **MVP în 2-3 săptămâni** cu intrare manuală, refresh zilnic de prețuri, top 200 crypto + S&P500 + ~20 acțiuni BVB, afișare USD/EUR și un singur "what-if" (un asset alternativ, aceeași dată). Tax reports, on-chain sync, real-time websockets — toate v2/v3.

Stack tehnic propus: tabele Supabase noi (`portfolios`, `holdings`, `transactions`, `price_cache`), cron 1×/zi pentru fetch prețuri istorice + zilnice de la CoinGecko Demo (30 cps, 10k/lună gratuit) și Yahoo Finance via yfinance. Curs USD→EUR via ECB sau exchangerate.host (gratuit). Total cost lunar suplimentar: 0 €.

Cea mai mare provocare nu este tehnică, ci de **UX**: un calculator "ce-ar fi fost" care nu sună a glumă pe Twitter, ci a unealtă educațională. Detaliat în secțiunea 7.

---

## 1. Peisajul competitiv — analiză jucător cu jucător

### 1.1 CoinMarketCap Portfolio
- **Preț:** Gratuit
- **Cum funcționează:** Adaugi tranzacții manual (ticker, cantitate, preț, dată) sau conectezi adresa wallet on-chain. Pull-uri de date de la CMC (catalogul lor de prețuri).
- **Bun:** Catalog uriaș de monede (~10k+), sincronizare cu wallet-uri on-chain pentru EVM, mobile app decent, recunoaștere de brand.
- **Slab:** "Balance-centric, market-data-first" — adică se uită doar la valoarea curentă, nu la performanța reală (PnL, IRR, drawdown). Nu calculează cost-basis serios. Nu are dividende, splituri, taxe. UI vechi, butoane mici, comportament inconsistent pe mobil.
- **Ce poate face Alex mai bine:** Performanță reală (PnL real, % time-weighted), narrativă în jurul cifrelor ("ai cumpărat la zona Buy semnalată în Crypto Dashboard pe X feb"), counterfactual.

### 1.2 CoinGecko Portfolio
- **Preț:** Gratuit (limită 10 monede pentru oaspeți, nelimitat dacă te înregistrezi)
- **Cum funcționează:** Manual entry. Suport pentru multiple portofolii și liste personalizate (chains, categorii). Sync mobil cu alerte și widget-uri.
- **Bun:** Catalog enorm (18k+ monede), sincronizare reală între web + mobile, partajare publică portofoliu, urmărit portofoliile altora (social).
- **Slab:** **Numai manual entry, fără cost-basis logic, fără tax**. Membrii cu mulți wallet-i obosesc rapid. Performanța nu e calculată corect dacă lot accounting nu e consistent. NFT/DeFi context limitat.
- **Ce poate face Alex mai bine:** Cost-basis curat per lot (FIFO sau average), counterfactual, integrare cu zonele Buy/Sell pe care Alex deja le calculează în Crypto Dashboard (sugestie: "ai cumpărat la zona Buy?").

### 1.3 CoinStats — de ce nu e suficient de bun
- **Preț:** Gratuit pentru bază; Premium $13.99/lună sau $99.99/an. Promoții agresive de 70% pe an.
- **Cum funcționează:** Conectează 300+ wallets/exchange-uri (Binance, Coinbase, MetaMask, Phantom etc.). Sync 5-10 min. Pie charts, line graphs, heatmaps.
- **Bun:** Cea mai largă acoperire on-chain + CEX, AI agent (recent), 100+ blockchains, alerte preț.
- **Slab (de ce zice Alex că "nu e suficient de bun"):**
  1. **Bug-uri persistente la API integrations** — Phantom (Solana), staked assets, NFT-uri afișate prost, useri raportează lipsa unor active care apar și dispar.
  2. **Plângeri de billing** — useri taxați $500 mai mult decât prețul afișat, customer service slab (vezi reviews).
  3. **Premium prea scump pentru ce oferă** ($99.99/an pentru featurese pe care CoinGecko le dă gratuit la 80% din cazuri).
  4. **Nu are crypto + stocks în aceeași vizualizare** (stocks sunt limitate sau lipsesc complet).
  5. **Nu are counterfactual** ("ce-ar fi fost dacă").
- **Ce poate face Alex mai bine:** Stabilitate (manual + 1-2 surse de preț, nu 300 conexiuni fragile), preț fair (inclus în €49/lună Elite), counterfactual, focus pe educație nu pe up-sell agresiv.

### 1.4 Delta by eToro
- **Preț:** Free (max 10 active, conexiuni nelimitate, 5 device-uri); Pro probabil ~$8-13/lună (Pro tracks 40 active, AI insights, "Why Is It Moving").
- **Cum funcționează:** Auto-sync cu broker stocks + crypto exchanges + wallet-uri. Suportă stocks, ETFs, crypto, NFT, mutual funds, bonds, forex, commodities, alternative.
- **Bun:** Singurul tracker mobile-first care chiar e bun la stocks + crypto în același loc. Insights de portofoliu (sector allocation, geo exposure, market cap distribution). UI premium.
- **Slab:** Pe limita de 10 active free e foarte restrictiv. Useri raportează că eToro a degradat experiența după achiziție (mai multe pop-up-uri eToro). Nu are counterfactual real.
- **Ce poate face Alex mai bine:** Counterfactual, integrare cu sentimentul community (Discord, semnale Alex), focus pe RO (EUR by default, BVB stocks).

### 1.5 Kubera
- **Preț:** Essentials $249/an, Black $2,499/an. Premium-only.
- **Cum funcționează:** "Balance sheet pentru cei care își gestionează singuri averea". Stocks + crypto + real estate + colecționabile + private equity. Sync cu 20,000+ bănci/brokeri prin Yodlee/Plaid + 20+ wallet-uri și exchange-uri crypto.
- **Bun:** Cel mai larg "wealth tracking" de pe piață. Forecasting, capital growth scenarios, Beneficiary mode (transfer de cont la moștenitori). UI premium.
- **Slab:** **Prea scump pentru target-ul lui Alex** ($249/an = ~€230). Nu are counterfactual "what if I had bought BTC instead". Pe partea de crypto e mai slab decât tool-urile dedicate.
- **Ce poate face Alex mai bine:** Preț (inclus în €49/lună), focus crypto+stocks (nu real estate), counterfactual.

### 1.6 Sharesight (stocks-focused)
- **Preț:** Free pentru 10 holdings; $19/$29/$49/lună pentru tier-uri Investor/Expert.
- **Cum funcționează:** Cel mai bun pentru stocks, ETFs, dividende. 700,000+ stocks/ETFs în 60 piețe globale, capital gains tax tracking.
- **Bun:** Premiat de Investopedia "Best Portfolio Tracker for DIY Investors 2025". Tracking dividende cu prognoze 3 ani, performanță cu currency fluctuations, broker integrations.
- **Slab:** **Crypto e slab** sau deloc (focus pe stocks). Nu e gândit pentru un community Discord.
- **Ce poate face Alex mai bine:** Crypto + stocks în același tracker, counterfactual, focus RO/EUR.

### 1.7 Rotki (open-source, privacy-first)
- **Preț:** Free self-hosted; Premium ~$11/lună pentru cloud + features avansate.
- **Cum funcționează:** Rulează local, datele criptate pe device-ul tău. Aggregare EVM/Bitcoin + CEX-uri majore. Decoding de tranzacții on-chain. Identifică airdrop-uri ratate.
- **Bun:** **Cea mai bună opțiune privacy-first pe piață**, AGPLv3, fără email pentru cont. Oferă PnL reports și tax reports.
- **Slab:** Self-hosted = friction mare pentru non-developeri (membrii lui Alex nu vor instala un binar). UI funcțional dar nu sexy.
- **Ce poate face Alex mai bine:** Hosted (Supabase), zero-friction signup (deja cont Elite), UI sexy (glass cards, animații).

### 1.8 Zerion / DeBank / Zapper (on-chain wallet trackers)
- **Preț:** Toate gratuite la bază.
- **Paradigm diferit:** Nu cer manual entry — îți conectezi (read-only) adresa de wallet și ele citesc balance + history on-chain.
- **Bun pe ce:**
  - **Zerion** — UI cel mai polished, NFT view bun, web + mobile.
  - **DeBank** — cel mai dens analytic, DeFi positions detaliate, social score, advanced users.
  - **Zapper** — DeFi-first, liquidity pools + yield farming.
- **Slab:** **Nu fac stocks deloc** (sunt 100% on-chain). Useri care țin pe Binance/Kraken nu sunt acoperiți complet (ex-CEX). Counterfactual nu există.
- **Ce poate face Alex mai bine:** Crypto + stocks combinate, counterfactual. **Nu te lupta cu ei pe on-chain sync** — e prea complex pentru v1, cere infra de noduri/RPC.

### 1.9 CoinTracker / Koinly (tax-focused)
- **Preț:** CoinTracker $59-$199/tax year; Koinly $49-$199/tax year (per an fiscal!).
- **Cum funcționează:** Sync cu 300-800 exchanges/wallets. Calculate cost-basis (FIFO/LIFO/HIFO/Per-Wallet), generate tax reports per jurisdicție.
- **Bun:** **Cel mai serios cost-basis logic**. Per-wallet tracking obligatoriu pentru US din 2025. Ledger complet de tranzacții, transfer detection, missing cost-basis flagging.
- **Slab:** **Game complet diferit** — taxe, nu performance. UI optimizat pentru CPA, nu pentru retail trader. Romania nu este suportată oficial pentru tax reports.
- **Ce poate face Alex mai bine:** **Nu te lupta cu ei pe tax**. Împrumută doar conceptul de "cost-basis curat" și ledger de tranzacții, nu generezi tax forms.

### 1.10 Alți relevanți
- **Yahoo Finance Portfolio** — gratuit, doar stocks, UI vechi, dar foarte stabil. Bun ca benchmark.
- **TradingView Portfolios** — gratuit la bază, integrat cu charting-ul TV, asset coverage uriaș, dar tracker-ul în sine e mai slab decât charting-ul.
- **Empower / Personal Capital** — gratuit, focus US, recession simulator + fee analyzer (rar la portofolii). Doar US accounts.
- **getquin** — competitor european (Germania), stocks + ETF + crypto, social feed, dividende. Free + Premium ~€5/lună. **Cel mai bun reference EU pentru Alex** (UI similar la ce ar vrea).
- **Snowball Analytics** — $7.99-$24.99/lună, dividende foarte serios, EU-friendly, broker connections via Yodlee/SnapTrade.
- **Capitally** — €80-€250/an, end-to-end encryption client-side, suportă liabilities/short positions/wine/IP. Niche dar bine făcut.
- **Portseido** — $5-15/lună, conectează direct la XTB (relevant RO), 10k useri.
- **Vylos** — competitor menționat în reference_competitor_trading.md, dashboard multi-asset, glass cards, Cmd+K, price flash. UI inspirație directă.

---

## 2. Feature "what-if" / counterfactual — deep dive

### 2.1 Cine îl are deja?

**Aproape nimeni dintre portfolio trackers** — și asta e oportunitatea. Ce există:

- **Calculatoare standalone** (bitbo.io, dqydj.com, dcabtc.com, whatifihodl.com, coincodex.com, bitcoinroi.com) — toate sunt single-purpose, "If I bought X on Y date, today value = Z". Nu sunt integrate într-un portofoliu.
- **Portfolio Visualizer** — backtesting clasic pe portofolii, dar nu "ce-ar fi fost dacă cumpăram BTC în loc de ETH la aceeași dată". E pentru fonduri și acțiuni mari.
- **Empower recession simulator** — arată cum ar fi performat portofoliul în recesiuni anterioare. Diferit, nu personalizat per tranzacție.
- **Kubera forecasting** — proiectie viitoare cu scenarii, nu retrospectiv.
- **BlackRock 360 Evaluator** — comparare side-by-side proposed vs current, B2B doar.
- **Quicken** — basic "hypothetical trade impact", dar pe alocare curentă, nu retrospectiv.

**Niciun portfolio tracker nu integrează "ce-ar fi fost dacă" la nivel de tranzacție individuală în portofoliul real.** Asta e diferențiatorul.

### 2.2 Cum ar funcționa tehnic

Pentru fiecare tranzacție din portofoliul utilizatorului (ex: "10 ETH @ $2160 pe 9 Feb"):

1. **Salvează** transaction: `{ticker: ETH, qty: 10, price_per_unit: 2160, date: 2026-02-09, side: BUY, fiat_amount: 21600}`.
2. **Endpoint backend** `/api/portfolio/whatif`:
   - Input: `transaction_id`, `alt_ticker` (ex: BTC).
   - Pas 1: Get prețul lui BTC pe 9 Feb 2026 (CoinGecko `/coins/bitcoin/history?date=09-02-2026` — date format DD-MM-YYYY!).
   - Pas 2: Calculează `alt_qty = 21600 / btc_price_on_date`.
   - Pas 3: Get prețul curent BTC (CoinGecko `/simple/price?ids=bitcoin&vs_currencies=usd`).
   - Pas 4: `alt_value_today = alt_qty * btc_price_today`.
   - Pas 5: Get valoarea curentă ETH original = `10 * eth_price_today`.
   - Return: `{original_value: X, alt_value: Y, delta_pct: ...}`.
3. **Cache** rezultatul în `price_cache` (date, ticker, price_usd) — astfel același "what-if" pentru alți useri e free.

### 2.3 Variabile suplimentare (v2+)

- **DCA vs lump sum**: "Dacă în loc de tranzacția unică pe 9 Feb, distribuiam același buget în 4 tranșe săptămânale, cât aș avea?"
- **Coș alt-asset**: "Dacă puneam 50% BTC + 50% ETH în loc de tot ETH, cât aș avea?"
- **Time-shift**: "Dacă cumpăram aceeași cantitate de ETH dar cu 30 zile mai devreme/târziu?"
- **Cohort comparison**: "Ce zice mediana membrilor Elite care au făcut tranzacții în aceeași săptămână?" (anonim, opt-in).
- **Benchmark fix**: "Cât ar fi crescut același capital într-un index S&P500 (SPY) sau în USDC stable?"

### 2.4 UX patterns sugerate

- **Card "What if" sub fiecare tranzacție**: "Dacă cumpărai BTC în loc de ETH, ai fi avut [+ X%]" cu un mic chart de comparație.
- **Picker simplu**: dropdown cu top 20 alt-assets + S&P500 + Gold + USDC (stable benchmark).
- **Slider pentru date-shift**: ±90 zile.
- **Salvare scenariu ca "lecție"**: "Această tranzacție mi-a costat X% față de alternativă." Astfel devine educațional, nu rușinos.
- **Mențiune importantă (legal)**: "Acesta este un calcul retrospectiv. Performanța trecută nu garantează rezultate viitoare." Romanian: "Performanțele trecute nu garantează rezultate viitoare."

### 2.5 Date necesare

- **Prețuri istorice zilnice** pentru fiecare asset suportat — fezabil din CoinGecko Demo (30 cps gratuit) și Yahoo Finance.
- **Granularitate**: zilnică (00:00 UTC) e suficientă pentru "what-if" pe perioade > 1 zi. CoinGecko endpoint `/coins/{id}/history?date=DD-MM-YYYY` returnează exact asta.
- **Acoperire**: top 200 crypto + S&P500 + ETF-uri populare (SPY, QQQ, VWCE, VUAA pentru EU) + ~20 acțiuni BVB.

---

## 3. Integrarea crypto + stocks — cum

### 3.1 De ce e greu

1. **Identificatori diferiți**: crypto folosește slug-uri (`bitcoin`, `ethereum`) sau symboluri (`BTC`); stocks folosesc tickers cu sufixe de exchange (`BVB.RO`, `AAPL`, `VWCE.DE`).
2. **API-uri diferite**: nu există un API gratuit care să le facă pe amândouă bine (Twelve Data e cea mai apropiată, dar 8 calls/min, 800/zi e foarte puțin).
3. **Granularitate diferită**: crypto e 24/7, stocks doar în orele de tranzacționare (cu gaps weekend + sărbători).
4. **Currency**: crypto e quote-d în USD; stocks pot fi în USD/EUR/RON/GBP. Conversie necesară.
5. **Splituri și dividende** la stocks; airdrops și hard forks la crypto.

### 3.2 Soluție: model unificat de "asset"

```
table: assets
- id (uuid)
- ticker (text)              -- BTC, ETH, AAPL, VWCE.DE, TLV.RO
- type (enum)                -- 'crypto' | 'stock' | 'etf'
- price_source (enum)        -- 'coingecko' | 'yahoo'
- source_id (text)           -- 'bitcoin' (CG slug) sau 'AAPL' (Yahoo)
- name (text)                -- "Bitcoin", "Apple Inc."
- currency_native (text)     -- USD, EUR, RON
- logo_url (text)            -- pentru UI
- is_active (boolean)
```

Backend știe să apeleze sursa corectă pentru fiecare asset. Front-end vede un singur model de asset.

### 3.3 Conversie monedă

Pentru utilizatori RO, valori în EUR + USD afișate. Conversie:
- **Sursă**: `exchangerate.host` (gratuit, fără cheie, EUR/USD/RON istoric și curent), sau ECB SDW (XML, dar oficial).
- **Caching**: 1× pe zi pentru cursul EUR/USD; nu trebuie real-time pentru un tracker.

### 3.4 Real-time vs end-of-day

**Recomandare clară: end-of-day (1× pe zi cron)**. Motive:
1. Membrii vor să își vadă portofoliul, nu să facă day trading în el.
2. Salvează ~99% din complexitate (no websockets, no rate-limit fights).
3. CMC/CG free portfolios sunt și ele 5-10 min refresh, nimeni nu se plânge.
4. Pe device-uri concrete, dacă userul deschide pagina, putem face un fetch on-demand pentru asset-urile lui (cap la 30/min).

### 3.5 Splituri, dividende, airdrops — ce să sărim în v1

- **Splituri stocks**: complicat, sărim. Yahoo le aplică automat în prețuri ajustate (`adjclose`). Folosim `adjclose`. Issue: dacă userul a cumpărat înainte de split, qty trebuie ajustat manual.
- **Dividende stocks**: NU calculăm în v1. Sharesight face asta excelent, ne lupta cu ei e pierdere.
- **Airdrops crypto**: feature manual ("Add airdrop transaction") în v2.
- **Hard forks**: sărim. Sub 1% din useri.
- **Staking rewards**: feature manual în v2 (recurring transaction).

---

## 4. Surse de date și API-uri (gratuit/ieftin)

### 4.1 CoinGecko Demo API ⭐ RECOMANDAT
- **Cost**: Gratuit cu cont demo (cheie API).
- **Rate limit**: 30 calls/min, **10,000 calls/lună** (atenție la cap-ul lunar!).
- **Endpoints relevante**:
  - `/coins/list` — catalogul complet (~18k monede).
  - `/coins/{id}/history?date=DD-MM-YYYY` — preț la o dată specifică (necesar pentru what-if).
  - `/coins/{id}/market_chart/range?from=X&to=Y` — chart istoric (pentru sparklines portofoliu).
  - `/simple/price?ids=...&vs_currencies=usd,eur` — preț curent batch (până la ~250 ID-uri/call).
- **Calcul rate limit**: 54 useri × 5 active medii = 270 prețuri de fetch-uit/zi. Cu batch de 250 ID-uri/call → ~2 calls/zi pentru toate prețurile curente. Pentru istoric (what-if), ~10-50 calls/zi în practică. Total: **<200 calls/zi**, sub limita gratuită cu mult spațiu.

### 4.2 Yahoo Finance via yfinance ⭐ RECOMANDAT pentru stocks
- **Cost**: Gratuit.
- **Limitări**:
  - **2025**: Data istorică pentru perioade lungi cere acum subscription Yahoo Finance Premium pentru unii useri (issue raportat). Pentru perioade scurte (1-2 ani) și prețuri curente, încă merge.
  - Web scraping unofficial — se poate sparge dacă Yahoo schimbă HTML-ul.
  - Cere user-agent realist, eventual proxy rotation.
- **Endpoints relevante** (via Python yfinance lib):
  - `Ticker("AAPL").history(period="2y")` — istoric.
  - `Ticker("AAPL").info` — preț curent + meta.
  - Suportă `BVB.RO`, `TLV.RO`, `SNN.RO` etc. pentru BVB.
- **Risk mitigation**: rulăm yfinance pe Mac Mini (cron 1×/zi), salvăm prețurile în Supabase `price_cache`. Front-end-ul Next.js NU apelează Yahoo direct.

### 4.3 Alpha Vantage (backup)
- **Cost**: Gratuit, dar **doar 25 cereri/zi**. Premium $49.99-$249.99/lună.
- **Verdict**: Prea restrictiv pe free tier pentru ce ne trebuie. Bun ca fallback dacă yfinance se sparge.

### 4.4 Twelve Data (unified)
- **Cost**: Gratuit 8 calls/min, 800/zi. Paid $29-$329/lună.
- **Avantaj**: Stocks + crypto + forex în același API. JSON unified.
- **Verdict**: 800/zi e ok dacă nu fetch-uim history în masă. Bun ca **plan B** dacă vrem să scăpăm de yfinance fragility.

### 4.5 Polygon.io
- **Cost**: Free tier 5 calls/min, US stocks only. Paid $29-$199/lună.
- **Verdict**: Foarte limitat free, dar US stocks sunt mai reliable de aici decât Yahoo.

### 4.6 BVB stocks
- **Sursă oficială BVB**: data vending plătit, nu pentru hobby projects.
- **Soluție practică**: **Yahoo Finance suportă BVB.RO** și majoritatea blue chips RO (TLV, BRD, SNP, SNG, SNN, FP, EL etc.) cu sufix `.RO`. Suficient pentru v1.
- **EODHD** ($19.99/lună) — backup pro dacă scalăm.

### 4.7 Curs EUR/USD/RON
- **exchangerate.host** — gratuit, fără cheie, istoric și curent. Recomandat.
- **ECB SDW** — oficial UE, XML, mai puțin developer-friendly.

### 4.8 Recap final pentru v1

| Sursă | Asset | Frecvență | Cost |
|---|---|---|---|
| CoinGecko Demo | Crypto top 200 | 1×/zi cron + on-demand | 0 € |
| Yahoo Finance (yfinance) | S&P500 + ETFs + BVB | 1×/zi cron | 0 € |
| exchangerate.host | EUR/USD curs | 1×/zi cron | 0 € |

Total infrastructure cost adițional: **0 €/lună**. Headroom până la ~500 useri activi.

---

## 5. MVP feature set recomandat (Elite v1, ship în 2-3 săptămâni)

### v1 — strict minim viabil (Sprint 1, ~2 săptămâni)

**Pagină**: `/dashboard/portfolio`

1. **CRUD tranzacții manuale**:
   - Form: `Asset (autocomplete cu top 200 crypto + 100 stocks pre-loaded), Qty, Price per unit, Currency (USD/EUR), Date, Side (BUY/SELL), Notes`.
   - Salvare în tabel `transactions`.
2. **Computed holdings** (per asset, agregat):
   - Avg cost basis (weighted average din tranzacții).
   - Total qty.
   - Current value (USD + EUR).
   - PnL absolut + procentual.
3. **Dashboard view**:
   - Total portfolio value (USD + EUR, switchable).
   - Pie chart alocare per asset (sectoare: Crypto / Stocks / ETF).
   - Holdings table sortabilă (ticker, qty, avg cost, current price, value, PnL).
   - Sparkline 30-day per holding (din `price_cache`).
4. **What-if simplu** (killer feature pentru v1):
   - Click pe o tranzacție → modal "What if instead I had bought ___?"
   - Picker: top 20 crypto + SPY + Gold + USDC.
   - Output: număr (delta % și valoare absolută).
5. **Refresh prețuri**: 1×/zi cron 00:30 UTC. Buton manual "Refresh now" cu rate-limit (1× la 5 min/user).
6. **Romanian UI** cu diacritice: "Portofoliul meu", "Adaugă tranzacție", "Performanță", "Dacă cumpăram în loc...".

### v1.5 — îmbunătățiri rapide (după launch, ~1 săptămână)

- Date-shift slider la what-if (±90 zile).
- DCA scenario: "Dacă distribuiam acelaşi capital în 4 cumpărări săptămânale".
- Export CSV.
- Basket what-if: "50% BTC + 50% ETH" în loc de un singur asset.

### v2 — extindere (~3-4 săptămâni)

- Multiple alt-scenarios pe ecranul "what-if" (compară 4 alternative simultan).
- Cohort comparison anonim ("media tranzacțiilor membrilor în aceeași săptămână").
- On-chain wallet sync (Etherscan + Solscan + adresa BTC) — read-only, fără semnare.
- Manual airdrop / staking transactions.
- Notificări: "Portofoliul tău a depășit ATH-ul" / "Drawdown >20%".
- Integrare cu zonele Buy/Sell din Crypto Dashboard ("ai cumpărat la zona Buy semnalată?").

### v3 — long-term (3+ luni)

- Tax export pentru România (formatul ANAF — necesită research separat).
- Bank/exchange API sync (Binance, Kraken, XTB) — fragil, suport ridicat.
- Social: share portofoliu public (anonim/pseudonim), follow alți membri.
- Mobile-first views polished.

---

## 6. Riscuri și ce să sărim

### 6.1 Nu ne luptăm pe terenul lor
- **NU competiționam cu CoinTracker/Koinly pe tax** — game complet diferit, customer profile diferit.
- **NU competiționam cu Zerion/DeBank pe on-chain sync v1** — necesită infra de noduri/RPC, parsing tranzacții EVM, gas tracking. Cost de dezvoltare disproporționat.
- **NU real-time websockets în v1** — daily refresh e OK, salvăm 70% din complexitatea front-end + back-end.

### 6.2 Limitări CoinGecko free
- 30 cps demo, 10k calls/lună. La ~100 useri activi cu media 5 active fiecare, cron-ul zilnic + interogări on-demand = ~250-500 calls/zi = ~7,500-15,000/lună.
- **Risc**: la 200+ useri activi, cap-ul lunar de 10k poate fi atins.
- **Mitigare**: `price_cache` table partajat — nu fetch același preț de 2 ori. Plan B: `Twelve Data` 800/zi sau upgrade CoinGecko Analyst $129/lună (la 200+ useri = ~€2.40/user, rentabil).

### 6.3 Yahoo Finance fragility
- yfinance nu e API oficial, se poate sparge oricând (Yahoo schimbă HTML).
- **Mitigare**: monitorizare cron (alert pe Telegram dacă fetch-ul eșuează), backup pe Twelve Data, fallback pe Alpha Vantage premium pentru top 50 stocks dacă scalăm.

### 6.4 Privacy (GDPR + UE)
- Membrii RO sunt sensibili la "datele mele financiare la cine ajung".
- **Mitigare**:
  - Datele stay în Supabase EU region (de verificat că proiectul actual e EU).
  - Mențiune explicită în privacy policy: "Tranzacțiile tale sunt vizibile doar ție și echipei Armata de Traderi. Nu le partajăm cu terți. Nu rulăm tracker analytics peste ele."
  - **NU** integrare cu Google Analytics pe pagina `/dashboard/portfolio` (poate eveniment generic dar fără numere/active).
  - Opt-in explicit pentru cohort comparison (v2).

### 6.5 UX trap — counterfactual ca distractor
**Cel mai mare risc psihologic**: featurese de "what if" pot deveni o sursă de regret/anxietate ("dacă cumpăram BTC în loc de ETH, aveam +50% acum"). Asta e bad UX pentru un community pe care Alex îl construiește pe disciplină.

**Mitigare**:
- Frame-uire ca **lecție**, nu ca regret: "Această decizie a costat X% vs alternativa. Ce poți învăța?"
- Default to comparison cu **stable benchmark** (USDC) sau **safe-haven** (Gold), nu cu the moonshot.
- Opțional, blocaj "Hide what-if" în setări pentru cei care nu vor să se uite.
- Disclaimer permanent jos: "Performanțele trecute nu garantează rezultate viitoare. Acest tool e educațional, nu sfat financiar."

---

## 7. UX inspirație — best-in-class

### 7.1 Holdings table — Sharesight & getquin
- **Sortare excelentă** pe orice coloană (ticker, value, PnL %, weight).
- **Coloane configurabile** (showing/hiding currency, dividend yield, sector).
- **Inline edit** pe quantity (click pe celulă, edit, save) fără modal.
- **Implementare la noi**: tabel cu `tabular-nums`, hover cu detail expand, sticky header.

### 7.2 Glass cards & price flash — Vylos (deja inspirație în CLAUDE.md)
- Cards cu `bg-card backdrop-blur` și `border-white/5`.
- Animație green/red flash la update preț (1s flash).
- **Implementare la noi**: deja avem `price-flash` și `glass-card` în globals.css. Doar consistență.

### 7.3 Pie chart breakdown by sector — Zerion
- Crypto vs Stocks vs Stables vs Cash, cu drill-down pe click.
- Sectoare crypto (L1, DeFi, Stablecoins) ca tag-uri colorate.
- **Implementare la noi**: Recharts (deja dependency), pie chart simplu cu legend.

### 7.4 What-if comparison card — proprie (nimeni nu o face bine)
**Design propus**:
```
┌────────────────────────────────────────────┐
│  Tranzacție: 10 ETH @ $2160 · 9 Feb 2026   │
│  Valoare azi: $24,500 (+13.4%)             │
│                                            │
│  [Compară cu: BTC ▼]                       │
│                                            │
│  ┌─ ETH (actual) ──┐  ┌─ BTC (what-if) ─┐ │
│  │  $24,500        │  │  $28,750        │ │
│  │  +13.4%         │  │  +33.1%         │ │
│  └─────────────────┘  └─────────────────┘ │
│                                            │
│  Diferența: -$4,250 (-19.7 pct)            │
│  → BTC ar fi avut performanță mai bună     │
│                                            │
│  [Salvează ca lecție]                      │
└────────────────────────────────────────────┘
```

### 7.5 Dividend calendar (chiar și fără să calculăm dividende în v1, layout-ul e bun) — Snowball
- Lunar grid showing payment dates colored.
- Pentru noi (v2+): "Calendar evenimente portofoliu" — entry-uri, semnale Alex pe activele tale, breaking news.

### 7.6 Cmd+K integrare
- Deja avem CommandSearch în Navbar. Adăugăm acțiuni:
  - "Adaugă tranzacție în portofoliu" → deschide modal.
  - "Vezi portofoliul meu" → navighează.
  - "What-if calculator" → modal direct.
- 2-3 ore de dev.

---

## 8. Recomandare finală

### 8.1 Build sau widget?
**Build.** Un widget CMC/CG embed:
- Nu poate face counterfactual (ăsta e missing peste tot).
- Nu poate face cost-basis curat (cost de feature).
- Nu poate fi integrat cu dashboardurile Crypto/Stocks/Risk Score deja existente.
- Nu poate fi în RO cu diacritice.
- Pierdem brand control complet.

Build-ul e fezabil în 2-3 săptămâni pentru MVP, riscul tehnic e mic (manual entry + cron + Recharts = stack cunoscut pentru proiectul ăsta).

### 8.2 Arhitectură — Supabase tables (propunere concretă)

```sql
-- Catalog de active suportate (pre-populat, refresh săptămânal)
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,                    -- BTC, ETH, AAPL, TLV.RO
  type text NOT NULL CHECK (type IN ('crypto','stock','etf')),
  price_source text NOT NULL,              -- 'coingecko' | 'yahoo'
  source_id text NOT NULL,                 -- 'bitcoin' (CG) | 'AAPL' (Yahoo)
  name text NOT NULL,
  currency_native text NOT NULL DEFAULT 'USD',
  logo_url text,
  is_active boolean DEFAULT true,
  UNIQUE(ticker, type)
);
CREATE INDEX idx_assets_ticker ON assets(ticker);

-- Cache prețuri (zilnic + curent)
CREATE TABLE price_cache (
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  date date NOT NULL,
  price_usd numeric(20,8) NOT NULL,
  PRIMARY KEY (asset_id, date)
);
CREATE INDEX idx_price_cache_date ON price_cache(date);

-- Curs valutar
CREATE TABLE fx_rates (
  date date NOT NULL,
  base text NOT NULL,                      -- 'EUR'
  quote text NOT NULL,                     -- 'USD'
  rate numeric(12,6) NOT NULL,
  PRIMARY KEY (date, base, quote)
);

-- Portofolii (un user poate avea mai multe; v1 forțează 1 default)
CREATE TABLE portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Portofoliul meu',
  base_currency text NOT NULL DEFAULT 'EUR',
  created_at timestamptz DEFAULT now()
);

-- Tranzacții (sursa de adevăr)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id),
  side text NOT NULL CHECK (side IN ('BUY','SELL')),
  qty numeric(20,8) NOT NULL,
  price_per_unit_usd numeric(20,8) NOT NULL,   -- normalizat la USD pentru calcule
  fiat_amount_usd numeric(20,2) NOT NULL,      -- qty * price_per_unit_usd
  txn_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_txn_portfolio ON transactions(portfolio_id, txn_date);

-- (Opțional v2) Snapshots zilnice de portofoliu pentru charts equity curve
CREATE TABLE portfolio_snapshots (
  portfolio_id uuid REFERENCES portfolios(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_value_usd numeric(20,2) NOT NULL,
  total_value_eur numeric(20,2) NOT NULL,
  PRIMARY KEY (portfolio_id, date)
);
```

**RLS**: user vede doar `portfolio_id` ale lui (`portfolios.user_id = auth.uid()`).
**Storage**: estimat 1KB/tranzacție. La 100 useri × 50 tranzacții = 5MB. Mult sub cap-ul de 500MB Supabase free.

### 8.3 Cron jobs (Mac Mini)
```
# 00:30 UTC zilnic - fetch prețuri current și istoric pentru ieri
30 0 * * *   /Users/server/scripts/portfolio_sync_prices.py

# Săptămânal Luni 03:00 - actualizează catalog assets (top 200 crypto + S&P500)
0 3 * * 1    /Users/server/scripts/portfolio_refresh_assets.py
```

### 8.4 Prioritate features (ranked, pentru sprint planning)

1. ⭐ **CRUD tranzacții + holdings table** — fundație, fără asta nu există nimic.
2. ⭐ **Pagina dashboard cu pie chart + total + sparklines** — primul "wow" la deschidere.
3. ⭐ **What-if simplu (1 alt-asset, aceeași dată)** — diferențiatorul față de competitori.
4. **Refresh prețuri cron + on-demand button** — fără asta, datele sunt stale.
5. **Holdings + transactions search/filter** — quality of life.
6. **What-if avansat (date-shift, DCA, basket)** — v1.5.
7. **Equity curve chart** — chart al evoluției totale în timp (cere snapshots).
8. **Romanian UI cu diacritice** — pentru toate string-urile (cross-cutting).
9. **Privacy policy update** — necesar pentru launch (mențiune explicită portofolii).

### 8.5 Timeline realist

**Săptămâna 1**: schema Supabase + migration + scripts cron de price sync + endpoint-uri API CRUD pentru transactions.
**Săptămâna 2**: pagină Next.js `/dashboard/portfolio` cu holdings table + pie chart + form add transaction.
**Săptămâna 3**: what-if modal + sparklines + polish + Romanian copywriting + privacy update.
**Buffer**: 3-4 zile pentru bugs și feedback intern (pe primii 5 useri Elite cu trial).

**Total: 3 săptămâni pentru MVP shippable**, presupunând că eu (Claude) implementez și Alex face QA + decizii produs.

### 8.6 Ce să NU facem în v1
- Tax exports.
- On-chain wallet sync.
- Real-time websockets.
- Mobile native app (responsive web e suficient).
- Social/share features.
- Notificări push.
- Dividende stocks.
- Multi-currency display avansat (RON/GBP/USD/EUR — v1 doar USD + EUR).

---

## 9. Risc rezidual și open questions pentru Alex

1. **Vrei să fie Elite-only sau și pentru Free tier?** Recomand Elite-only ca up-sell visible, cu un screenshot "ce ar putea avea" pe pagina Free.
2. **Lansare cu cât catalog?** Recomand top 200 crypto + S&P500 (~500 stocks) + 20 BVB blue chips + 30 ETF-uri populare EU = ~750 active. Add more on user request via form.
3. **Cum prezentăm what-if-ul fără să devină distractor?** Vezi 6.5 — frame ca lecție, default safe benchmark.
4. **Vrei integrare cu zonele Buy/Sell din Crypto Dashboard?** Recomand foarte mult în v1.5: "Ai cumpărat ETH la zona Buy semnalată pe 9 Feb? Da/Nu" — leagă portofoliul de utilitatea altor dashboards.

---

## Anexe

### A.1 Surse documentare cheie
- CoinGecko API docs: `https://docs.coingecko.com/reference/coins-id-history`
- yfinance GitHub: `https://github.com/ranaroussi/yfinance`
- exchangerate.host: `https://exchangerate.host`

### A.2 Competitori — sumar într-un tabel

| Tool | Crypto | Stocks | What-if | Cost-basis | Free tier | Preț paid |
|---|---|---|---|---|---|---|
| CoinMarketCap | ✓ | ✗ | ✗ | Slab | ✓ | — |
| CoinGecko | ✓ | ✗ | ✗ | ✗ | ✓ | — |
| CoinStats | ✓ | Limitat | ✗ | OK | ✓ | $99.99/an |
| Delta (eToro) | ✓ | ✓ | ✗ | OK | ✓ (10 active) | ~$10/lună |
| Kubera | ✓ | ✓ | Slab | OK | ✗ | $249/an |
| Sharesight | Slab | ✓✓ | ✗ | ✓ (taxe) | 10 holdings | $19-49/lună |
| Rotki | ✓ | ✗ | ✗ | ✓ | Self-hosted | $11/lună |
| Zerion/DeBank | ✓ on-chain | ✗ | ✗ | ✗ | ✓ | — |
| CoinTracker | ✓ | ✗ | ✗ | ✓✓ (taxe) | Limitat | $59-199/an |
| getquin | ✓ | ✓ | ✗ | OK | ✓ | ~€5/lună |
| **Armata v1 (propus)** | **Top 200** | **S&P + BVB** | **✓✓** | **OK** | **N/A** | **Inclus €49** |

### A.3 Opportunity matrix (subiectiv)

```
                Killer feature?
                    YES
                     │
         CoinTracker │  Armata v1 (what-if)
         (tax)       │
                     │
   Niche ────────────┼──────────── Mainstream
                     │
         Rotki       │  CMC / CoinGecko
         (privacy)   │  (scale)
                     │
                    NO
```

Armata v1 ține într-o poziție unde nimeni nu este: **what-if integrat în portofoliu**, mainstream UX, RO/EU first.

---

**Fin de raport.**

Prepared by Claude Opus 4.7 · Overnight research · 2026-04-28.
