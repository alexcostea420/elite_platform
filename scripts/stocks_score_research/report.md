# Stocks Score Research Report

_Generated: 2026-05-04 11:50_

Universe: 16 tickers — TSLA, COIN, HOOD, MSTR, MARA, CRCL, GOOG, META, NVDA, AAPL, MSFT, AMZN, PYPL, SHOP, PLTR, ORCL
Period: 2021-01-01 to 2026-05-04
Snapshot frequency: quarterly (22 dates)
Total observations: 329

## METHODOLOGY CAVEAT

yfinance free API returns only ~6 quarters of fundamentals. Historical backtest before mid-2024 has very sparse data. Correlation numbers reflect this — most tickers have NO fundamental data for snapshots before 2024-Q3. Report focuses primarily on CURRENT snapshot + per-category sanity check.


## 1. Score-vs-Forward-Return Correlation

Spearman rank correlation between each candidate score and forward 3/6/12-month price return.
Positive = high-score stocks outperformed.

| Score | 3m corr (n) | 6m corr (n) | 12m corr (n) |
|---|---|---|---|
| score_quality | +0.02 (40) | -0.12 (40) | -0.14 (40) |
| score_value | -0.01 (40) | -0.14 (40) | -0.14 (40) |
| score_greenblatt | +0.10 (33) | +0.20 (33) | +0.22 (33) |
| score_armata_v1 | +0.05 (40) | -0.14 (40) | -0.15 (40) |

### By category (12m correlation)

| Category | quality | value | greenblatt | armata_v1 |
|---|---|---|---|---|
| crypto_proxy | -0.41 (n=12) | -0.54 (n=12) | -0.60 (n=5) | -0.56 (n=12) |
| enterprise | +nan (n=2) | +nan (n=2) | +nan (n=2) | +nan (n=2) |
| fintech | -0.21 (n=5) | +0.70 (n=5) | +0.70 (n=5) | +0.70 (n=5) |
| growth | +0.11 (n=10) | +0.35 (n=10) | +0.26 (n=10) | +0.18 (n=10) |
| mega_tech | -0.65 (n=11) | -0.65 (n=11) | -0.07 (n=11) | -0.59 (n=11) |

## 2. Top-vs-Bottom Hit Rate (12m forward)

For each snapshot date, sort tickers by score. Did the top half outperform the bottom half?
50% = no signal. >55% = useful. >60% = strong.

| Score | Hit rate | # snapshots |
|---|---|---|
| score_quality | 33% | 3 |
| score_value | 67% | 3 |
| score_greenblatt | 100% | 3 |
| score_armata_v1 | 33% | 3 |

## 3. Key Inflection Point Case Studies


### META trough $90 — would Quality+Value have flagged buy?
_No data for META @ 2022-09-30_


### META at $580 — was score still good?
_No data for META @ 2024-09-30_


### PYPL collapse from $200 to $90 — score warn?
_No data for PYPL @ 2022-03-31_


### PYPL bottomed at $50 — undervalued?
_No data for PYPL @ 2024-09-30_


### NVDA at $230 pre-AI boom — score useful?
_No data for NVDA @ 2023-03-31_


### MSTR after FTX, BTC at $16k — score?
_No data for MSTR @ 2022-12-31_


### MARA at $9 — quality?
_No data for MARA @ 2023-06-30_


### PLTR at $14 pre-run — score?
_No data for PLTR @ 2023-06-30_


### COIN at $60 — score?
_No data for COIN @ 2023-06-30_


### SHOP at $30 trough — score?
_No data for SHOP @ 2022-09-30_


### TSLA at $113 trough — score?
**TSLA @ 2023-01-01, price $108.10**

- Gross margin: — | FCF margin: — | ROE: —
- Revenue YoY: — | FCF yield: —
- P/FCF: — | EV/EBIT: — | Net debt/MCap: —
- Quality score: — | Value: — | Greenblatt: — | Armata v1: —
- **Forward 12m return: +129.8%**

### AAPL near ATH — score?
_No data for AAPL @ 2024-09-30_


## 4. Per-Ticker Latest Snapshot

_As of 2026-04-01_

| Ticker | Cat | Price | GMargin | FCFMargin | ROE | RevGrow | FCFYield | P/FCF | EV/EBIT | NetD/MC | Q | V | Gren | Armv1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AAPL | mega_tech | $253.50 | +47.3% | +28.3% | +133.5% | — | +3.3% | 30.2 | 26.7 | +1.2% | 91.1 | 71.8 | 62.5 | 86.6 |
| AMZN | mega_tech | $213.77 | +50.6% | -0.3% | +20.5% | — | -0.1% | — | 21.3 | +4.5% | 50.9 | 46.9 | 45.8 | 57.7 |
| COIN | crypto_proxy | $171.46 | +74.6% | — | +8.5% | — | — | — | 26.4 | -7.5% | 64.2 | 75.7 | 24.5 | 74.8 |
| CRCL | crypto_proxy | $90.26 | +8.7% | +17.7% | -2.1% | — | +2.2% | 45.9 | — | -6.7% | 24.5 | 46.3 | — | 46.1 |
| GOOG | mega_tech | $303.93 | +60.4% | +15.2% | +33.5% | — | +1.7% | 57.2 | 19.1 | +1.4% | 83.6 | 58.1 | 67.5 | 78.7 |
| HOOD | fintech | $68.90 | +82.3% | +64.4% | +20.4% | — | +4.8% | 20.9 | 33.0 | +13.5% | 89.3 | 73.5 | 25.8 | 81.3 |
| MARA | crypto_proxy | $8.96 | +80.3% | -133.4% | -37.8% | — | -35.6% | — | — | +91.1% | 33.3 | 0.0 | — | 16.7 |
| META | mega_tech | $575.05 | +81.9% | +22.4% | +29.0% | — | +3.3% | 30.3 | 16.8 | +4.3% | 90.5 | 80.2 | 65.7 | 87.5 |
| MSFT | mega_tech | $372.29 | +68.3% | +22.9% | +30.2% | — | +2.6% | 37.9 | 17.7 | +0.9% | 92.1 | 70.7 | 68.8 | 86.9 |
| MSTR | crypto_proxy | $123.72 | +68.7% | -4731.3% | -7.5% | — | -58.5% | — | — | +15.4% | 33.3 | 0.0 | — | 30.5 |
| NVDA | growth | $178.10 | +71.1% | +44.8% | +76.3% | — | +2.2% | 44.8 | 30.5 | +0.0% | 100.0 | 53.5 | 60.9 | 86.0 |
| ORCL | enterprise | $142.67 | +67.1% | -38.6% | +42.1% | — | -2.1% | — | 58.5 | +9.5% | 66.7 | 17.1 | 25.2 | 54.6 |
| PLTR | growth | $148.46 | +82.4% | +46.9% | +22.0% | — | +0.6% | 169.0 | 250.2 | -0.3% | 91.1 | 11.0 | 32.3 | 68.9 |
| PYPL | fintech | $44.87 | +46.6% | +16.8% | +25.8% | — | +9.2% | 10.8 | 9.2 | +3.2% | 73.2 | 100.0 | 73.2 | 85.3 |
| SHOP | growth | $117.06 | +48.1% | +17.4% | +9.1% | — | +1.3% | 76.1 | 80.3 | -0.9% | 56.2 | 26.9 | 27.2 | 56.2 |
| TSLA | growth | $346.65 | +19.1% | +7.2% | +4.6% | — | +0.5% | 186.0 | 225.2 | -0.1% | 23.6 | 10.6 | 11.1 | 35.0 |

## 5. Crypto-Proxy Special Analysis

For COIN/MSTR/MARA/CRCL, fundamentals correlate weakly with price. BTC is the dominant driver.

- **MSTR**: weekly return correlation with BTC = 0.69, beta to BTC = 1.10
- **MARA**: weekly return correlation with BTC = 0.60, beta to BTC = 1.39

## 6. Sanity Check — Do scores match well-known stories?

Latest Armata v1 ranking (high → low):

- **META** (mega_tech): Armv1=87.5 (Q=90.5, V=80.2)
- **MSFT** (mega_tech): Armv1=86.9 (Q=92.1, V=70.7)
- **AAPL** (mega_tech): Armv1=86.6 (Q=91.1, V=71.8)
- **NVDA** (growth): Armv1=86.0 (Q=100.0, V=53.5)
- **PYPL** (fintech): Armv1=85.3 (Q=73.2, V=100.0)
- **HOOD** (fintech): Armv1=81.3 (Q=89.3, V=73.5)
- **GOOG** (mega_tech): Armv1=78.7 (Q=83.6, V=58.1)
- **COIN** (crypto_proxy): Armv1=74.8 (Q=64.2, V=75.7)
- **PLTR** (growth): Armv1=68.9 (Q=91.1, V=11.0)
- **AMZN** (mega_tech): Armv1=57.7 (Q=50.9, V=46.9)
- **SHOP** (growth): Armv1=56.2 (Q=56.2, V=26.9)
- **ORCL** (enterprise): Armv1=54.6 (Q=66.7, V=17.1)
- **CRCL** (crypto_proxy): Armv1=46.1 (Q=24.5, V=46.3)
- **TSLA** (growth): Armv1=35.0 (Q=23.6, V=10.6)
- **MSTR** (crypto_proxy): Armv1=30.5 (Q=33.3, V=0.0)
- **MARA** (crypto_proxy): Armv1=16.7 (Q=33.3, V=0.0)

### Expected directional matches

- **META**: expected high → got Q=90.5, V=80.2, Armv1=87.5 (high quality + decent value (post-2022 recovery))
- **MSFT**: expected high → got Q=92.1, V=70.7, Armv1=86.9 (consistently top quality)
- **NVDA**: expected high quality, low value → got Q=100.0, V=53.5, Armv1=86.0 (top quality, expensive (high P/FCF))
- **PYPL**: expected high value → got Q=73.2, V=100.0, Armv1=85.3 (beaten-down value play (low P/E, high FCF yield))
- **HOOD**: expected high → got Q=89.3, V=73.5, Armv1=81.3 (fintech with growing margins post-2024)
- **MSTR**: expected low → got Q=33.3, V=0.0, Armv1=30.5 (BTC-driven, fundamentals don't apply)
- **MARA**: expected low → got Q=33.3, V=0.0, Armv1=16.7 (miner with negative FCF in bear, leverage)
- **PLTR**: expected high quality, very low value → got Q=91.1, V=11.0, Armv1=68.9 (expensive growth, P/E 200+)

## 7. Recommended Armata Score formula

Based on data + academic literature (Piotroski 2000, Greenblatt 2005, Novy-Marx 2013):

**For non-crypto tickers (12 of 16):**
- Quality 50%: gross_margin (1/3) + fcf_margin (1/3) + roe (1/3)
- Value 30%: fcf_yield (1/2) + ev_ebit_inverse (1/2)
- Balance 20%: 100 - net_debt_to_market_cap × 200, clamped 0-100

**For crypto-proxies (COIN, MSTR, MARA, CRCL):**
- Don't apply standard score (FCF margins distorted by BTC mark-to-market).
- Show 'BTC-driven' badge instead of score, or use BTC-relative beta.

**Color thresholds:**
- 80-100: SOLID (verde-emerald)
- 60-79: BUN (verde mai pal)
- 40-59: NEUTRU (galben)
- 20-39: SLAB (portocaliu)
- 0-19: PERICOL (roșu)

**UI usage:**
Display as small badge in stocks table (next to signal column). Click to expand breakdown showing 3 sub-scores + key metrics. Add '⚠️ BTC-driven' override badge for the 4 crypto tickers.
