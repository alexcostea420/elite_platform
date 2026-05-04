#!/usr/bin/env python3
"""
Daily Armata Score updater for the 16 stocks tracked on /dashboard/stocks.

Pulls quarterly fundamentals + current price via yfinance, computes the
Armata Score (Quality 50% + Value 30% + Balance 20%), and upserts one row
per ticker into the stocks_fundamentals Supabase table.

Crypto-proxy tickers (COIN, MSTR, MARA, CRCL) are flagged is_btc_driven=true
and their score is left NULL — fundamentals are distorted by BTC mark-to-market.

Run: python3 scripts/stocks_score.py
Cron: once per day, e.g. 30 6 * * *
"""

from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.request
import warnings
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"
LOG_PREFIX = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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

CRYPTO_PROXY = {t for t, c in CATEGORIES.items() if c == "crypto_proxy"}


def log(msg: str) -> None:
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.strip().split("=", 1)
                env[k] = v
    return env


# ---- yfinance helpers -----------------------------------------------------

def safe_get(d: dict, key: str):
    v = d.get(key)
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return v


def ttm_sum(quarterly: dict, key: str) -> float | None:
    """Sum the latest 4 valid quarters for `key`. Skips NaN quarters."""
    if not quarterly:
        return None
    dates = sorted(quarterly.keys(), reverse=True)
    vals = []
    for d in dates:
        v = safe_get(quarterly[d], key)
        if v is not None:
            vals.append(float(v))
        if len(vals) >= 4:
            break
    if len(vals) < 4:
        return None
    return sum(vals)


def latest_balance(quarterly: dict, key: str) -> float | None:
    if not quarterly:
        return None
    for d in sorted(quarterly.keys(), reverse=True):
        v = safe_get(quarterly[d], key)
        if v is not None:
            return float(v)
    return None


def latest_filing_date(*quarterlies: dict) -> str | None:
    candidates = []
    for q in quarterlies:
        if q:
            candidates.extend(q.keys())
    if not candidates:
        return None
    return max(candidates)


def fetch_ticker(ticker: str) -> dict | None:
    """Pull current price + quarterly fundamentals for one ticker."""
    log(f"  fetching {ticker}...")
    try:
        t = yf.Ticker(ticker)

        info = t.info or {}
        price = (
            info.get("regularMarketPrice")
            or info.get("currentPrice")
            or info.get("previousClose")
        )
        if not price:
            log(f"    {ticker}: no price")
            return None

        def to_dict(df) -> dict:
            if df is None or df.empty:
                return {}
            return {str(c.date()): df[c].to_dict() for c in df.columns}

        income = to_dict(t.quarterly_income_stmt)
        balance = to_dict(t.quarterly_balance_sheet)
        cashflow = to_dict(t.quarterly_cashflow)

        return {
            "ticker": ticker,
            "price": float(price),
            "income": income,
            "balance": balance,
            "cashflow": cashflow,
        }
    except Exception as e:
        log(f"    {ticker} error: {e}")
        return None


# ---- Score computation ----------------------------------------------------

def compute_metrics(raw: dict) -> dict:
    inc = raw.get("income", {})
    bal = raw.get("balance", {})
    cf = raw.get("cashflow", {})
    price = raw["price"]

    revenue = ttm_sum(inc, "Total Revenue")
    gross_profit = ttm_sum(inc, "Gross Profit")
    net_income = ttm_sum(inc, "Net Income")
    ebit = ttm_sum(inc, "EBIT") or ttm_sum(inc, "Operating Income")
    op_cf = ttm_sum(cf, "Operating Cash Flow")
    capex = ttm_sum(cf, "Capital Expenditure")

    total_equity = (
        latest_balance(bal, "Stockholders Equity")
        or latest_balance(bal, "Common Stock Equity")
    )
    total_debt = latest_balance(bal, "Total Debt")
    cash = (
        latest_balance(bal, "Cash And Cash Equivalents")
        or latest_balance(bal, "Cash Cash Equivalents And Short Term Investments")
    )
    shares_out = (
        latest_balance(bal, "Share Issued")
        or latest_balance(bal, "Ordinary Shares Number")
    )

    fcf = (op_cf + capex) if (op_cf is not None and capex is not None) else None
    market_cap = (price * shares_out) if shares_out else None
    ev = (market_cap + (total_debt or 0) - (cash or 0)) if market_cap else None

    return {
        "ticker": raw["ticker"],
        "as_of": latest_filing_date(inc, bal, cf),
        "gross_margin": (gross_profit / revenue) if (gross_profit and revenue) else None,
        "fcf_margin": (fcf / revenue) if (fcf and revenue) else None,
        "roe": (net_income / total_equity) if (net_income and total_equity) else None,
        "fcf_yield": (fcf / market_cap) if (fcf and market_cap) else None,
        "p_fcf": (market_cap / fcf) if (market_cap and fcf and fcf > 0) else None,
        "ev_ebit": (ev / ebit) if (ev and ebit and ebit > 0) else None,
        "net_debt_to_market_cap": ((total_debt - (cash or 0)) / market_cap) if (total_debt and market_cap) else None,
        "revenue_ttm": revenue,
        "fcf_ttm": fcf,
        "market_cap": market_cap,
    }


def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def quality_subscore(m: dict) -> float | None:
    parts = []
    if m["gross_margin"] is not None:
        parts.append(clamp(m["gross_margin"] / 0.6))   # 60% gross = max
    if m["fcf_margin"] is not None:
        parts.append(clamp(m["fcf_margin"] / 0.3))     # 30% FCF margin = max
    if m["roe"] is not None:
        parts.append(clamp(m["roe"] / 0.3))            # 30% ROE = max
    if not parts:
        return None
    return 100 * sum(parts) / len(parts)


def value_subscore(m: dict) -> float | None:
    parts = []
    if m["fcf_yield"] is not None:
        parts.append(clamp(m["fcf_yield"] / 0.08))     # 8% FCF yield = max
    if m["ev_ebit"] is not None and m["ev_ebit"] > 0:
        parts.append(clamp(20 / m["ev_ebit"]))         # EV/EBIT 20 = neutral
    if not parts:
        return None
    return 100 * sum(parts) / len(parts)


def balance_subscore(m: dict) -> float:
    nd = m.get("net_debt_to_market_cap")
    if nd is None:
        return 100.0  # missing data → neutral-positive
    # 0 net debt → 100, +50% net debt → 0
    return max(0.0, min(100.0, 100 - nd * 200))


def armata_score(m: dict) -> tuple[float | None, float | None, float | None, float | None]:
    """Returns (score, q, v, b). Score is None if quality or value can't be computed."""
    q = quality_subscore(m)
    v = value_subscore(m)
    b = balance_subscore(m)
    if q is None or v is None:
        return None, q, v, b
    return 0.5 * q + 0.3 * v + 0.2 * b, q, v, b


# ---- Supabase upsert ------------------------------------------------------

def supabase_upsert(env: dict, rows: list[dict]) -> None:
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        log("ERROR: Supabase env vars missing")
        sys.exit(1)

    body = json.dumps(rows).encode()
    req = urllib.request.Request(
        f"{url}/rest/v1/stocks_fundamentals?on_conflict=ticker",
        data=body,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        log(f"  Supabase upsert error {e.code}: {e.read().decode()[:300]}")
        sys.exit(1)


def round_or_none(v, ndigits: int = 4):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    return round(float(v), ndigits)


# ---- Main -----------------------------------------------------------------

def main() -> None:
    log("=" * 60)
    log("Stocks score updater starting...")

    env = load_env()
    rows = []

    for ticker in TICKERS:
        raw = fetch_ticker(ticker)
        time.sleep(0.5)  # gentle rate limit
        if not raw:
            continue

        metrics = compute_metrics(raw)
        score, q, v, b = armata_score(metrics)
        is_btc_driven = ticker in CRYPTO_PROXY

        row = {
            "ticker": ticker,
            "category": CATEGORIES[ticker],
            "is_btc_driven": is_btc_driven,
            "score": round_or_none(None if is_btc_driven else score, 1),
            "score_quality": round_or_none(q, 1),
            "score_value": round_or_none(v, 1),
            "score_balance": round_or_none(b, 1),
            "gross_margin": round_or_none(metrics["gross_margin"]),
            "fcf_margin": round_or_none(metrics["fcf_margin"]),
            "roe": round_or_none(metrics["roe"]),
            "fcf_yield": round_or_none(metrics["fcf_yield"]),
            "p_fcf": round_or_none(metrics["p_fcf"], 2),
            "ev_ebit": round_or_none(metrics["ev_ebit"], 2),
            "net_debt_to_market_cap": round_or_none(metrics["net_debt_to_market_cap"]),
            "revenue_ttm": round_or_none(metrics["revenue_ttm"], 0),
            "fcf_ttm": round_or_none(metrics["fcf_ttm"], 0),
            "market_cap": round_or_none(metrics["market_cap"], 0),
            "as_of": metrics["as_of"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        score_label = "BTC-driven" if is_btc_driven else (f"{score:.1f}" if score is not None else "—")
        q_str = f"{q:.1f}" if q is not None else "—"
        v_str = f"{v:.1f}" if v is not None else "—"
        log(f"  {ticker}: score={score_label}  Q={q_str}  V={v_str}  B={b:.1f}")
        rows.append(row)

    if not rows:
        log("ERROR: No rows to write")
        sys.exit(1)

    log(f"Upserting {len(rows)} rows to Supabase...")
    supabase_upsert(env, rows)

    log("-" * 60)
    log("Summary (Armata Score):")
    sortable = [r for r in rows if r["score"] is not None]
    sortable.sort(key=lambda r: r["score"], reverse=True)
    for r in sortable:
        log(f"  {r['ticker']:6} {r['score']:5.1f}  ({r['category']})")
    btc_rows = [r for r in rows if r["is_btc_driven"]]
    if btc_rows:
        log(f"  BTC-driven (no score): {', '.join(r['ticker'] for r in btc_rows)}")
    log("Done.")


if __name__ == "__main__":
    main()
