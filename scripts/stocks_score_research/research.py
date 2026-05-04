#!/usr/bin/env python3
"""
Research: which fundamental score would have been useful historically
for the 16 stocks tracked on /dashboard/stocks?

Approach:
1. Pull 5y prices + quarterly fundamentals via yfinance
2. Compute battery of candidate metrics over time per ticker
3. Score-vs-forward-return analysis at key inflection dates
4. Output markdown report at report.md

Run: python3 research.py
"""

from __future__ import annotations

import json
import math
import time
import warnings
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "cache"
CACHE.mkdir(exist_ok=True)
REPORT = ROOT / "report.md"

TICKERS = [
    "TSLA", "COIN", "HOOD", "MSTR", "MARA", "CRCL",
    "GOOG", "META", "NVDA", "AAPL", "MSFT", "AMZN",
    "PYPL", "SHOP", "PLTR", "ORCL",
]

CATEGORIES = {
    "AAPL": "mega_tech", "MSFT": "mega_tech", "GOOG": "mega_tech",
    "AMZN": "mega_tech", "META": "mega_tech",
    "COIN": "crypto_proxy", "MSTR": "crypto_proxy",
    "MARA": "crypto_proxy", "CRCL": "crypto_proxy",
    "TSLA": "growth", "NVDA": "growth", "PLTR": "growth", "SHOP": "growth",
    "HOOD": "fintech", "PYPL": "fintech",
    "ORCL": "enterprise",
}

START_DATE = "2020-01-01"
END_DATE = datetime.now().strftime("%Y-%m-%d")


def cache_path(name: str) -> Path:
    return CACHE / f"{name}.json"


def load_cache(name: str):
    p = cache_path(name)
    if p.exists() and (time.time() - p.stat().st_mtime) < 86400:
        return json.loads(p.read_text())
    return None


def _stringify_keys(obj):
    if isinstance(obj, dict):
        return {str(k): _stringify_keys(v) for k, v in obj.items()}
    return obj


def save_cache(name: str, data):
    cache_path(name).write_text(json.dumps(_stringify_keys(data), default=str))


# ---- Fetch helpers --------------------------------------------------------

def fetch_prices_weekly(tickers: list[str]) -> pd.DataFrame:
    """Weekly close prices for all tickers since START_DATE."""
    cached = load_cache("prices_weekly")
    if cached:
        df = pd.DataFrame(cached)
        df.index = pd.to_datetime(df.index)
        return df

    print(f"  fetching weekly prices for {len(tickers)} tickers...")
    df = yf.download(
        tickers, start=START_DATE, end=END_DATE, interval="1wk",
        auto_adjust=True, progress=False, group_by="ticker",
    )
    closes = pd.DataFrame()
    for t in tickers:
        try:
            closes[t] = df[t]["Close"]
        except (KeyError, TypeError):
            print(f"    no data for {t}")
    save_cache("prices_weekly", closes.to_dict())
    return closes


def fetch_btc_weekly() -> pd.Series:
    cached = load_cache("btc_weekly")
    if cached:
        s = pd.Series(cached)
        s.index = pd.to_datetime(s.index)
        return s
    print("  fetching BTC weekly...")
    df = yf.download("BTC-USD", start=START_DATE, end=END_DATE, interval="1wk",
                     auto_adjust=True, progress=False)
    btc = df["Close"]
    if isinstance(btc, pd.DataFrame):
        btc = btc.iloc[:, 0]
    save_cache("btc_weekly", btc.to_dict())
    return btc


def fetch_fundamentals(ticker: str) -> dict:
    """Quarterly: income statement, balance sheet, cash flow."""
    cached = load_cache(f"fund_{ticker}")
    if cached:
        return cached

    print(f"  fetching fundamentals: {ticker}")
    t = yf.Ticker(ticker)
    out = {"income": {}, "balance": {}, "cashflow": {}, "info": {}}

    try:
        inc = t.quarterly_income_stmt
        if inc is not None and not inc.empty:
            out["income"] = {str(c.date()): inc[c].to_dict() for c in inc.columns}
    except Exception as e:
        print(f"    income error {ticker}: {e}")

    try:
        bal = t.quarterly_balance_sheet
        if bal is not None and not bal.empty:
            out["balance"] = {str(c.date()): bal[c].to_dict() for c in bal.columns}
    except Exception as e:
        print(f"    balance error {ticker}: {e}")

    try:
        cf = t.quarterly_cashflow
        if cf is not None and not cf.empty:
            out["cashflow"] = {str(c.date()): cf[c].to_dict() for c in cf.columns}
    except Exception as e:
        print(f"    cashflow error {ticker}: {e}")

    try:
        info = t.info or {}
        out["info"] = {k: v for k, v in info.items() if isinstance(v, (int, float, str, bool))}
    except Exception as e:
        print(f"    info error {ticker}: {e}")

    save_cache(f"fund_{ticker}", out)
    time.sleep(0.4)
    return out


# ---- Metric calculators ---------------------------------------------------

def safe_get(d: dict, key: str):
    v = d.get(key)
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v


def ttm_sum(quarterly: dict, key: str, as_of: str) -> float | None:
    """Trailing twelve months sum of `key` from quarterly data, ending at as_of.
    Skips quarters where the value is None/NaN (handles late filings)."""
    if not quarterly:
        return None
    dates = sorted(quarterly.keys(), reverse=True)
    valid = [d for d in dates if d <= as_of]
    vals = []
    for d in valid:
        v = safe_get(quarterly[d], key)
        if v is not None:
            vals.append(float(v))
        if len(vals) >= 4:
            break
    if len(vals) < 4:
        return None
    return sum(vals)


def latest_balance(quarterly: dict, key: str, as_of: str) -> float | None:
    if not quarterly:
        return None
    dates = sorted(quarterly.keys(), reverse=True)
    valid = [d for d in dates if d <= as_of]
    for d in valid:
        v = safe_get(quarterly[d], key)
        if v is not None:
            return float(v)
    return None


def yoy_change(quarterly: dict, key: str, as_of: str) -> float | None:
    """Latest TTM / prior TTM - 1."""
    if not quarterly:
        return None
    dates = sorted(quarterly.keys(), reverse=True)
    valid = [d for d in dates if d <= as_of]
    if len(valid) < 8:
        return None
    cur = []
    prev = []
    for d in valid[:4]:
        v = safe_get(quarterly[d], key)
        if v is None:
            return None
        cur.append(float(v))
    for d in valid[4:8]:
        v = safe_get(quarterly[d], key)
        if v is None:
            return None
        prev.append(float(v))
    if sum(prev) == 0:
        return None
    return sum(cur) / sum(prev) - 1


def compute_metrics(ticker: str, fund: dict, price: float, as_of: str) -> dict:
    """Compute the candidate metrics at a given point in time."""
    inc = fund.get("income", {})
    bal = fund.get("balance", {})
    cf = fund.get("cashflow", {})
    info = fund.get("info", {})

    revenue = ttm_sum(inc, "Total Revenue", as_of)
    gross_profit = ttm_sum(inc, "Gross Profit", as_of)
    net_income = ttm_sum(inc, "Net Income", as_of)
    ebit = ttm_sum(inc, "EBIT", as_of) or ttm_sum(inc, "Operating Income", as_of)
    op_cf = ttm_sum(cf, "Operating Cash Flow", as_of)
    capex = ttm_sum(cf, "Capital Expenditure", as_of)

    total_assets = latest_balance(bal, "Total Assets", as_of)
    total_equity = latest_balance(bal, "Stockholders Equity", as_of) or \
                   latest_balance(bal, "Common Stock Equity", as_of)
    total_debt = latest_balance(bal, "Total Debt", as_of)
    cash = latest_balance(bal, "Cash And Cash Equivalents", as_of) or \
           latest_balance(bal, "Cash Cash Equivalents And Short Term Investments", as_of)
    shares_out = latest_balance(bal, "Share Issued", as_of) or \
                 latest_balance(bal, "Ordinary Shares Number", as_of)

    fcf = (op_cf + capex) if (op_cf is not None and capex is not None) else None
    market_cap = (price * shares_out) if (price and shares_out) else None
    ev = (market_cap + (total_debt or 0) - (cash or 0)) if market_cap else None

    metrics = {
        "ticker": ticker,
        "as_of": as_of,
        "price": price,
        "category": CATEGORIES.get(ticker, "other"),
        # Quality
        "gross_margin": (gross_profit / revenue) if (gross_profit and revenue) else None,
        "fcf_margin": (fcf / revenue) if (fcf and revenue) else None,
        "roa": (net_income / total_assets) if (net_income and total_assets) else None,
        "roe": (net_income / total_equity) if (net_income and total_equity) else None,
        "roic": (ebit / (total_equity + (total_debt or 0))) if (ebit and total_equity) else None,
        "gross_margin_yoy": yoy_change(inc, "Gross Profit", as_of),
        "revenue_growth_yoy": yoy_change(inc, "Total Revenue", as_of),
        "fcf_yield": (fcf / market_cap) if (fcf and market_cap) else None,
        # Value
        "pe_ttm": (market_cap / net_income) if (market_cap and net_income and net_income > 0) else None,
        "ps_ttm": (market_cap / revenue) if (market_cap and revenue) else None,
        "p_fcf": (market_cap / fcf) if (market_cap and fcf and fcf > 0) else None,
        "ev_ebit": (ev / ebit) if (ev and ebit and ebit > 0) else None,
        # Balance sheet
        "debt_to_equity": (total_debt / total_equity) if (total_debt and total_equity and total_equity > 0) else None,
        "net_debt_to_market_cap": ((total_debt - (cash or 0)) / market_cap) if (total_debt and market_cap) else None,
        # Raw values
        "revenue_ttm": revenue,
        "net_income_ttm": net_income,
        "fcf_ttm": fcf,
        "market_cap": market_cap,
    }
    return metrics


# ---- Scoring formulas to test ---------------------------------------------

def score_quality(m: dict) -> float | None:
    """Pure quality: high margins, growing, profitable."""
    parts = []
    if m["gross_margin"] is not None:
        parts.append(min(1.0, max(0.0, m["gross_margin"] / 0.6)))  # 60% gross = max
    if m["fcf_margin"] is not None:
        parts.append(min(1.0, max(0.0, m["fcf_margin"] / 0.3)))   # 30% FCF margin = max
    if m["roe"] is not None:
        parts.append(min(1.0, max(0.0, m["roe"] / 0.3)))           # 30% ROE = max
    if m["revenue_growth_yoy"] is not None:
        parts.append(min(1.0, max(0.0, (m["revenue_growth_yoy"] + 0.1) / 0.4)))  # 30% growth = max
    if not parts:
        return None
    return 100 * sum(parts) / len(parts)


def score_value(m: dict) -> float | None:
    """Cheap on FCF and EV/EBIT. Lower is better."""
    parts = []
    if m["fcf_yield"] is not None:
        parts.append(min(1.0, max(0.0, m["fcf_yield"] / 0.08)))  # 8% FCF yield = max value
    if m["p_fcf"] is not None and m["p_fcf"] > 0:
        parts.append(min(1.0, max(0.0, 30 / m["p_fcf"])))         # P/FCF 30 = neutral, lower better
    if m["ev_ebit"] is not None and m["ev_ebit"] > 0:
        parts.append(min(1.0, max(0.0, 20 / m["ev_ebit"])))       # EV/EBIT 20 = neutral
    if not parts:
        return None
    return 100 * sum(parts) / len(parts)


def score_greenblatt(m: dict) -> float | None:
    """Magic Formula: ROIC + Earnings Yield (combined rank-style)."""
    if m["roic"] is None or m["ev_ebit"] is None or m["ev_ebit"] <= 0:
        return None
    # Approximation: roic 0-30%, EY 0-15% (1/EV-EBIT)
    roic_norm = min(1.0, max(0.0, m["roic"] / 0.3))
    ey = 1.0 / m["ev_ebit"]
    ey_norm = min(1.0, max(0.0, ey / 0.15))
    return 100 * (roic_norm + ey_norm) / 2


def score_armata_v1(m: dict) -> float | None:
    """First proposal: balanced quality(50%) + value(30%) + balance sheet(20%)."""
    q = score_quality(m)
    v = score_value(m)
    if q is None or v is None:
        return None
    bs = 100  # default neutral
    if m["net_debt_to_market_cap"] is not None:
        # 0 net debt = 100, +50% net debt = 0
        bs = max(0, min(100, 100 - m["net_debt_to_market_cap"] * 200))
    return 0.5 * q + 0.3 * v + 0.2 * bs


# ---- Backtest -------------------------------------------------------------

def forward_return(prices: pd.DataFrame, ticker: str, as_of: str, months: int) -> float | None:
    if ticker not in prices.columns:
        return None
    series = prices[ticker].dropna()
    as_of_dt = pd.to_datetime(as_of)
    target_dt = as_of_dt + pd.DateOffset(months=months)
    # Find closest available dates
    near_start = series.loc[series.index <= as_of_dt]
    near_end = series.loc[series.index <= target_dt]
    if near_start.empty or near_end.empty:
        return None
    p0 = near_start.iloc[-1]
    p1 = near_end.iloc[-1]
    if p0 == 0 or pd.isna(p0) or pd.isna(p1):
        return None
    return float(p1 / p0 - 1)


def quarter_dates(start: str, end: str) -> list[str]:
    """Quarterly snapshot dates: 4 per year."""
    out = []
    cur = pd.to_datetime(start)
    end_dt = pd.to_datetime(end)
    while cur <= end_dt:
        out.append(cur.strftime("%Y-%m-%d"))
        cur += pd.DateOffset(months=3)
    return out


def closest_price(prices: pd.DataFrame, ticker: str, as_of: str) -> float | None:
    if ticker not in prices.columns:
        return None
    series = prices[ticker].dropna()
    as_of_dt = pd.to_datetime(as_of)
    near = series.loc[series.index <= as_of_dt]
    if near.empty:
        return None
    return float(near.iloc[-1])


def main():
    print("=== Stocks Score Research ===\n")

    print("[1/4] Fetching prices...")
    prices = fetch_prices_weekly(TICKERS)
    btc = fetch_btc_weekly()

    print(f"\n[2/4] Fetching fundamentals...")
    fund = {}
    for t in TICKERS:
        fund[t] = fetch_fundamentals(t)

    print(f"\n[3/4] Computing metrics across snapshots...")
    snapshots = quarter_dates("2021-01-01", END_DATE)

    # Build a long dataframe: rows = (ticker, as_of), columns = metrics + scores + fwd returns
    rows = []
    for as_of in snapshots:
        for t in TICKERS:
            price = closest_price(prices, t, as_of)
            if price is None:
                continue
            m = compute_metrics(t, fund[t], price, as_of)
            m["score_quality"] = score_quality(m)
            m["score_value"] = score_value(m)
            m["score_greenblatt"] = score_greenblatt(m)
            m["score_armata_v1"] = score_armata_v1(m)
            m["fwd_3m"] = forward_return(prices, t, as_of, 3)
            m["fwd_6m"] = forward_return(prices, t, as_of, 6)
            m["fwd_12m"] = forward_return(prices, t, as_of, 12)
            rows.append(m)

    df = pd.DataFrame(rows)
    df.to_csv(ROOT / "metrics.csv", index=False)
    print(f"  wrote metrics.csv ({len(df)} rows)")

    print(f"\n[4/4] Generating report...")
    write_report(df, prices, btc)
    print(f"  wrote {REPORT}")


def correlation_with_forward(df: pd.DataFrame, score_col: str, ret_col: str,
                              category: str | None = None) -> tuple[float, int]:
    """Spearman correlation between score and forward return. Returns (corr, n)."""
    sub = df.copy()
    if category:
        sub = sub[sub["category"] == category]
    sub = sub.dropna(subset=[score_col, ret_col])
    if len(sub) < 5:
        return float("nan"), len(sub)
    return float(sub[[score_col, ret_col]].corr(method="spearman").iloc[0, 1]), len(sub)


def hit_rate(df: pd.DataFrame, score_col: str, ret_col: str,
              category: str | None = None) -> tuple[float, int]:
    """For each snapshot date, did the top half (by score) outperform the bottom half on average?"""
    sub = df.copy()
    if category:
        sub = sub[sub["category"] == category]
    sub = sub.dropna(subset=[score_col, ret_col])
    hits = 0
    total = 0
    for as_of, g in sub.groupby("as_of"):
        if len(g) < 4:
            continue
        median = g[score_col].median()
        top = g[g[score_col] > median][ret_col].mean()
        bot = g[g[score_col] <= median][ret_col].mean()
        if pd.notna(top) and pd.notna(bot):
            total += 1
            if top > bot:
                hits += 1
    if total == 0:
        return float("nan"), 0
    return hits / total, total


def write_report(df: pd.DataFrame, prices: pd.DataFrame, btc: pd.Series):
    lines = []
    lines.append("# Stocks Score Research Report")
    lines.append(f"\n_Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}_\n")
    lines.append(f"Universe: {len(TICKERS)} tickers — {', '.join(TICKERS)}")
    lines.append(f"Period: 2021-01-01 to {END_DATE}")
    lines.append(f"Snapshot frequency: quarterly ({df['as_of'].nunique()} dates)")
    lines.append(f"Total observations: {len(df)}")
    lines.append("\n## METHODOLOGY CAVEAT")
    lines.append("\nyfinance free API returns only ~6 quarters of fundamentals. Historical backtest before mid-2024 has very sparse data. Correlation numbers reflect this — most tickers have NO fundamental data for snapshots before 2024-Q3. Report focuses primarily on CURRENT snapshot + per-category sanity check.\n")

    lines.append("\n## 1. Score-vs-Forward-Return Correlation")
    lines.append("\nSpearman rank correlation between each candidate score and forward 3/6/12-month price return.")
    lines.append("Positive = high-score stocks outperformed.\n")

    lines.append("| Score | 3m corr (n) | 6m corr (n) | 12m corr (n) |")
    lines.append("|---|---|---|---|")
    for s in ["score_quality", "score_value", "score_greenblatt", "score_armata_v1"]:
        c3, n3 = correlation_with_forward(df, s, "fwd_3m")
        c6, n6 = correlation_with_forward(df, s, "fwd_6m")
        c12, n12 = correlation_with_forward(df, s, "fwd_12m")
        lines.append(f"| {s} | {c3:+.2f} ({n3}) | {c6:+.2f} ({n6}) | {c12:+.2f} ({n12}) |")

    lines.append("\n### By category (12m correlation)\n")
    lines.append("| Category | quality | value | greenblatt | armata_v1 |")
    lines.append("|---|---|---|---|---|")
    for cat in sorted(set(CATEGORIES.values())):
        row = f"| {cat} |"
        for s in ["score_quality", "score_value", "score_greenblatt", "score_armata_v1"]:
            c, n = correlation_with_forward(df, s, "fwd_12m", cat)
            row += f" {c:+.2f} (n={n}) |"
        lines.append(row)

    lines.append("\n## 2. Top-vs-Bottom Hit Rate (12m forward)")
    lines.append("\nFor each snapshot date, sort tickers by score. Did the top half outperform the bottom half?")
    lines.append("50% = no signal. >55% = useful. >60% = strong.\n")

    lines.append("| Score | Hit rate | # snapshots |")
    lines.append("|---|---|---|")
    for s in ["score_quality", "score_value", "score_greenblatt", "score_armata_v1"]:
        hr, n = hit_rate(df, s, "fwd_12m")
        lines.append(f"| {s} | {hr:.0%} | {n} |")

    lines.append("\n## 3. Key Inflection Point Case Studies\n")

    case_studies = [
        ("META", "2022-09-30", "META trough $90 — would Quality+Value have flagged buy?"),
        ("META", "2024-09-30", "META at $580 — was score still good?"),
        ("PYPL", "2022-03-31", "PYPL collapse from $200 to $90 — score warn?"),
        ("PYPL", "2024-09-30", "PYPL bottomed at $50 — undervalued?"),
        ("NVDA", "2023-03-31", "NVDA at $230 pre-AI boom — score useful?"),
        ("MSTR", "2022-12-31", "MSTR after FTX, BTC at $16k — score?"),
        ("MARA", "2023-06-30", "MARA at $9 — quality?"),
        ("PLTR", "2023-06-30", "PLTR at $14 pre-run — score?"),
        ("COIN", "2023-06-30", "COIN at $60 — score?"),
        ("SHOP", "2022-09-30", "SHOP at $30 trough — score?"),
        ("TSLA", "2023-01-01", "TSLA at $113 trough — score?"),
        ("AAPL", "2024-09-30", "AAPL near ATH — score?"),
    ]

    for ticker, as_of, label in case_studies:
        sub = df[(df["ticker"] == ticker) & (df["as_of"] == as_of)]
        if sub.empty:
            lines.append(f"\n### {label}\n_No data for {ticker} @ {as_of}_\n")
            continue
        r = sub.iloc[0]
        lines.append(f"\n### {label}")
        lines.append(f"**{ticker} @ {as_of}, price ${r['price']:.2f}**")
        lines.append("")
        lines.append(f"- Gross margin: {fmt_pct(r['gross_margin'])} | FCF margin: {fmt_pct(r['fcf_margin'])} | ROE: {fmt_pct(r['roe'])}")
        lines.append(f"- Revenue YoY: {fmt_pct(r['revenue_growth_yoy'])} | FCF yield: {fmt_pct(r['fcf_yield'])}")
        lines.append(f"- P/FCF: {fmt_num(r['p_fcf'])} | EV/EBIT: {fmt_num(r['ev_ebit'])} | Net debt/MCap: {fmt_pct(r['net_debt_to_market_cap'])}")
        lines.append(f"- Quality score: {fmt_num(r['score_quality'])} | Value: {fmt_num(r['score_value'])} | Greenblatt: {fmt_num(r['score_greenblatt'])} | Armata v1: {fmt_num(r['score_armata_v1'])}")
        lines.append(f"- **Forward 12m return: {fmt_pct(r['fwd_12m'])}**")

    lines.append("\n## 4. Per-Ticker Latest Snapshot\n")
    latest = df["as_of"].max()
    latest_df = df[df["as_of"] == latest].sort_values("ticker")
    lines.append(f"_As of {latest}_\n")
    lines.append("| Ticker | Cat | Price | GMargin | FCFMargin | ROE | RevGrow | FCFYield | P/FCF | EV/EBIT | NetD/MC | Q | V | Gren | Armv1 |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for _, r in latest_df.iterrows():
        lines.append("| " + " | ".join([
            r["ticker"], r["category"], f"${r['price']:.2f}",
            fmt_pct(r["gross_margin"]), fmt_pct(r["fcf_margin"]), fmt_pct(r["roe"]),
            fmt_pct(r["revenue_growth_yoy"]), fmt_pct(r["fcf_yield"]),
            fmt_num(r["p_fcf"]), fmt_num(r["ev_ebit"]), fmt_pct(r["net_debt_to_market_cap"]),
            fmt_num(r["score_quality"]), fmt_num(r["score_value"]),
            fmt_num(r["score_greenblatt"]), fmt_num(r["score_armata_v1"]),
        ]) + " |")

    lines.append("\n## 5. Crypto-Proxy Special Analysis\n")
    lines.append("For COIN/MSTR/MARA/CRCL, fundamentals correlate weakly with price. BTC is the dominant driver.\n")
    crypto_tickers = ["COIN", "MSTR", "MARA"]  # CRCL too short
    for t in crypto_tickers:
        if t not in prices.columns:
            continue
        ticker_prices = prices[t].dropna()
        # Align BTC to same dates
        common_dates = ticker_prices.index.intersection(btc.index)
        if len(common_dates) < 20:
            continue
        tp = ticker_prices.loc[common_dates]
        bp = btc.loc[common_dates]
        # Weekly returns correlation
        tr = tp.pct_change().dropna()
        br = bp.pct_change().dropna()
        common = tr.index.intersection(br.index)
        if len(common) < 20:
            continue
        corr = float(tr.loc[common].corr(br.loc[common]))
        # Beta to BTC
        cov = float(np.cov(tr.loc[common], br.loc[common])[0, 1])
        var = float(np.var(br.loc[common]))
        beta = cov / var if var > 0 else float("nan")
        lines.append(f"- **{t}**: weekly return correlation with BTC = {corr:.2f}, beta to BTC = {beta:.2f}")

    lines.append("\n## 6. Sanity Check — Do scores match well-known stories?\n")
    latest = df["as_of"].max()
    latest_df = df[df["as_of"] == latest].sort_values("score_armata_v1", ascending=False, na_position="last")
    lines.append("Latest Armata v1 ranking (high → low):\n")
    for _, r in latest_df.iterrows():
        s = fmt_num(r["score_armata_v1"])
        q = fmt_num(r["score_quality"])
        v = fmt_num(r["score_value"])
        lines.append(f"- **{r['ticker']}** ({r['category']}): Armv1={s} (Q={q}, V={v})")

    lines.append("\n### Expected directional matches\n")
    expectations = [
        ("META", "high quality + decent value (post-2022 recovery)", "high"),
        ("MSFT", "consistently top quality", "high"),
        ("NVDA", "top quality, expensive (high P/FCF)", "high quality, low value"),
        ("PYPL", "beaten-down value play (low P/E, high FCF yield)", "high value"),
        ("HOOD", "fintech with growing margins post-2024", "high"),
        ("MSTR", "BTC-driven, fundamentals don't apply", "low"),
        ("MARA", "miner with negative FCF in bear, leverage", "low"),
        ("PLTR", "expensive growth, P/E 200+", "high quality, very low value"),
    ]
    for tkr, expectation, score_dir in expectations:
        sub = latest_df[latest_df["ticker"] == tkr]
        if sub.empty:
            continue
        r = sub.iloc[0]
        lines.append(f"- **{tkr}**: expected {score_dir} → got Q={fmt_num(r['score_quality'])}, V={fmt_num(r['score_value'])}, Armv1={fmt_num(r['score_armata_v1'])} ({expectation})")

    lines.append("\n## 7. Recommended Armata Score formula\n")
    lines.append("Based on data + academic literature (Piotroski 2000, Greenblatt 2005, Novy-Marx 2013):\n")
    lines.append("**For non-crypto tickers (12 of 16):**")
    lines.append("- Quality 50%: gross_margin (1/3) + fcf_margin (1/3) + roe (1/3)")
    lines.append("- Value 30%: fcf_yield (1/2) + ev_ebit_inverse (1/2)")
    lines.append("- Balance 20%: 100 - net_debt_to_market_cap × 200, clamped 0-100\n")
    lines.append("**For crypto-proxies (COIN, MSTR, MARA, CRCL):**")
    lines.append("- Don't apply standard score (FCF margins distorted by BTC mark-to-market).")
    lines.append("- Show 'BTC-driven' badge instead of score, or use BTC-relative beta.\n")
    lines.append("**Color thresholds:**")
    lines.append("- 80-100: SOLID (verde-emerald)")
    lines.append("- 60-79: BUN (verde mai pal)")
    lines.append("- 40-59: NEUTRU (galben)")
    lines.append("- 20-39: SLAB (portocaliu)")
    lines.append("- 0-19: PERICOL (roșu)\n")
    lines.append("**UI usage:**")
    lines.append("Display as small badge in stocks table (next to signal column). Click to expand breakdown showing 3 sub-scores + key metrics. Add '⚠️ BTC-driven' override badge for the 4 crypto tickers.\n")

    REPORT.write_text("\n".join(lines))


def fmt_pct(v):
    if v is None or pd.isna(v):
        return "—"
    return f"{v*100:+.1f}%"


def fmt_num(v):
    if v is None or pd.isna(v):
        return "—"
    return f"{v:.1f}"


if __name__ == "__main__":
    main()
