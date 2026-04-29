#!/usr/bin/env python3
"""
Backfill risk_score_history with the past 365 days of V2 risk scores.

Strategy:
- Pull full historical series from bitcoin-data.com for each on-chain metric
  (mvrv, sopr, nupl, puell, rhodl, mayer, realized price, btc price). Each
  endpoint returns full history in ONE request, so the whole job runs with
  ~10 outbound HTTP calls — well under any rate limit.
- Pull Fear & Greed history from alternative.me (?limit=400).
- Pull VIX & DXY history from Yahoo Finance chart API (range=1y).
- For each day in the backfill window: build a component dict using whatever
  indicators are available for that date, then run the SAME scoring formulas
  as risk_score_v2.calculate_risk_score(). Derivatives are intentionally
  omitted — Binance has no historical funding/OI/L-S API past a few days,
  and excluding them simply re-weights the remaining indicators.
- Bulk INSERT with source='backfill' into risk_score_history (UPSERT on date).

Run once. Idempotent — safe to re-run; ON CONFLICT replaces.
"""

import json
import math
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

# Reuse the V2 scoring functions verbatim — that's the whole point of "real" backfill
from risk_score_v2 import (  # noqa: E402
    calc_mvrv_score,
    calc_nupl_score,
    calc_sopr_score,
    calc_puell_score,
    calc_realized_price_score,
    calc_rhodl_score,
    make_mayer_component,
    calc_fear_greed_score,
    calc_drawdown_score,
    calc_halving_score as _live_halving,
    calc_days_from_peak_score,
    calc_vix_score,
    calc_dxy_score,
    fetch_json,
    _throttle_btcdata,
    _extract_value,
)

ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"
WINDOW_DAYS = 365
PRICE_LOOKBACK_FOR_PI_CYCLE = 400  # need 350 trailing days for Pi Cycle MA350


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def fetch_metric_series(metric):
    """Returns dict: date_str -> float."""
    _throttle_btcdata()
    print(f"[backfill] fetching bitcoin-data.com/{metric} …")
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data:
        return {}
    out = {}
    for row in data:
        d = row.get("d") or row.get("date")
        v = _extract_value(row)
        if d and v is not None:
            out[d] = float(v)
    return out


def fetch_fear_greed_series(days=400):
    """alternative.me F&G with limit=days. Returns dict date_str -> {value, label}."""
    print(f"[backfill] fetching alternative.me F&G last {days} days …")
    data = fetch_json(f"https://api.alternative.me/fng/?limit={days}")
    if not data or "data" not in data:
        return {}
    out = {}
    for row in data["data"]:
        ts = int(row.get("timestamp", 0))
        if ts == 0:
            continue
        d_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        try:
            out[d_str] = {
                "value": int(row.get("value", 50)),
                "label": row.get("value_classification", "Neutral"),
            }
        except (TypeError, ValueError):
            continue
    return out


def fetch_yahoo_history(symbol, range_="1y"):
    """Yahoo chart endpoint. Returns dict date_str -> close."""
    print(f"[backfill] fetching Yahoo {symbol} ({range_}) …")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        f"?range={range_}&interval=1d"
    )
    data = fetch_json(url)
    if not data or "chart" not in data:
        return {}
    try:
        result = data["chart"]["result"][0]
        timestamps = result.get("timestamp", [])
        closes = result["indicators"]["quote"][0].get("close", [])
        out = {}
        for ts, c in zip(timestamps, closes):
            if c is None:
                continue
            d = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
            out[d] = float(c)
        return out
    except (KeyError, IndexError, TypeError):
        return {}


def halving_score_at(date_obj):
    """Same logic as calc_halving_score but for a historical date."""
    halving = datetime(2024, 4, 20, tzinfo=timezone.utc)
    next_halving = datetime(2028, 4, 20, tzinfo=timezone.utc)
    days_since = (date_obj - halving).days
    if days_since < 0:
        # Pre-halving 2024: use prior cycle (halving 2020-05-11)
        halving = datetime(2020, 5, 11, tzinfo=timezone.utc)
        next_halving = datetime(2024, 4, 20, tzinfo=timezone.utc)
        days_since = (date_obj - halving).days

    days_to_next = max(0, (next_halving - date_obj).days)
    if days_since < 200:
        phase, norm, signal = "Post-halving early", 0.4, "NEUTRU"
    elif days_since < 500:
        phase, norm, signal = "Rally zone", 0.25, "PRUDENT"
    elif days_since < 800:
        phase, norm, signal = "Corectie / Acumulare", 0.7, "CUMPARA"
    else:
        phase, norm, signal = "Late bear / Early recovery", 0.9, "CUMPARA"
    return {
        "days_since_halving": days_since,
        "days_to_next_halving": days_to_next,
        "norm": norm,
        "weight": 0.05,
        "phase": phase,
        "signal": signal,
    }


def compute_pi_cycle_at(price_hist_sorted, idx):
    """price_hist_sorted: list of (date, price) ascending. idx = day for which to compute."""
    if idx < 350:
        return None
    window_350 = price_hist_sorted[idx - 349 : idx + 1]
    window_111 = price_hist_sorted[idx - 110 : idx + 1]
    ma350 = sum(p for _, p in window_350) / 350
    ma111 = sum(p for _, p in window_111) / 111
    if ma350 == 0:
        return None
    ratio = ma111 / (ma350 * 2)
    return {"active": ratio >= 1.0, "ratio": round(ratio, 4)}


def compute_score_for_day(d_str, indicators, ath, ath_date, pi_cycle):
    """Run the V2 weighted aggregation for a single historical day. Returns dict or None."""
    components = {}

    def add(key, value):
        if value is not None:
            components[key] = value

    add("mvrv_zscore", calc_mvrv_score(indicators.get("mvrv")))
    add("nupl", calc_nupl_score(indicators.get("nupl")))
    add("sopr", calc_sopr_score(indicators.get("sopr")))
    add("puell_multiple", calc_puell_score(indicators.get("puell")))
    add("rhodl_ratio", calc_rhodl_score(indicators.get("rhodl")))
    add("mayer_multiple", make_mayer_component(indicators.get("mayer")))

    price = indicators.get("price")
    realized = indicators.get("realized_price")
    if price is not None and realized is not None:
        add("realized_price", calc_realized_price_score(price, realized))

    fg = indicators.get("fear_greed")
    if fg is not None:
        add("fear_greed", calc_fear_greed_score(fg))

    if price is not None and ath is not None:
        add("drawdown", calc_drawdown_score(price, ath))

    # halving + days_from_peak — date-only, deterministic
    date_obj = datetime.strptime(d_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    add("halving_cycle", halving_score_at(date_obj))
    if ath_date is not None:
        days = max(0, (date_obj - ath_date).days)
        if days < 100:
            norm, signal = 0.3, "PRUDENT"
        elif days < 250:
            norm, signal = 0.5, "NEUTRU"
        elif days < 450:
            norm, signal = 0.85, "CUMPARA"
        else:
            norm, signal = 0.7, "NEUTRU"
        components["days_from_peak"] = {
            "days_from_peak": days,
            "norm": norm,
            "weight": 0.04,
            "signal": signal,
        }

    vix = indicators.get("vix")
    dxy = indicators.get("dxy")
    add("vix", calc_vix_score(vix))
    add("dxy", calc_dxy_score(dxy))

    if not components:
        return None

    # Weighted aggregation (same as live)
    total_weight = 0.0
    weighted_sum = 0.0
    for comp in components.values():
        w = comp.get("weight", 0.05)
        n = comp.get("norm", 0.5)
        total_weight += w
        weighted_sum += n * w

    raw_score = (weighted_sum / total_weight) if total_weight > 0 else 0.5
    score = int(round(raw_score * 100))

    # Pi Cycle override
    if pi_cycle and pi_cycle.get("active"):
        score = min(score, 25)

    if score >= 65:
        level = "BUY"
    elif score <= 35:
        level = "SELL"
    else:
        level = "HOLD"

    return {
        "score": score,
        "level": level,
        "components": {k: v for k, v in components.items()},
        "btc_price": price,
    }


def insert_history_rows(env, rows):
    """Bulk upsert into risk_score_history."""
    url = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1/risk_score_history"
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            print(f"[backfill] inserted {len(rows)} rows (status {resp.status})")
            return True
    except urllib.error.HTTPError as e:
        print(f"[backfill] HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")
        return False


def main():
    env = load_env()
    if not env.get("SUPABASE_SERVICE_ROLE_KEY"):
        print("[backfill] missing SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=WINDOW_DAYS)
    print(f"[backfill] window: {start} → {today} ({WINDOW_DAYS} days)")

    # 1. Pull all series (one HTTP call per metric)
    btc_price = fetch_metric_series("btc-price")
    mvrv = fetch_metric_series("mvrv-zscore")
    nupl = fetch_metric_series("nupl")
    sopr = fetch_metric_series("sopr")
    puell = fetch_metric_series("puell-multiple")
    rhodl = fetch_metric_series("rhodl-ratio")
    mayer = fetch_metric_series("mayer-multiple")
    realized = fetch_metric_series("realized-price")
    fg_series = fetch_fear_greed_series(days=WINDOW_DAYS + 30)
    vix_series = fetch_yahoo_history("^VIX", "1y")
    dxy_series = fetch_yahoo_history("DX-Y.NYB", "1y")

    print("[backfill] sample sizes:")
    for name, s in [
        ("btc_price", btc_price), ("mvrv", mvrv), ("nupl", nupl),
        ("sopr", sopr), ("puell", puell), ("rhodl", rhodl),
        ("mayer", mayer), ("realized", realized),
        ("fg", fg_series), ("vix", vix_series), ("dxy", dxy_series),
    ]:
        print(f"  {name}: {len(s)}")

    if not btc_price:
        print("[backfill] FATAL: no BTC price history. Aborting.")
        sys.exit(1)

    # 2. Build sorted price history for ATH + Pi Cycle
    price_hist_sorted = sorted(btc_price.items())
    price_dict = dict(price_hist_sorted)

    rows_to_insert = []
    cursor = start
    while cursor <= today:
        d_str = cursor.strftime("%Y-%m-%d")
        cursor += timedelta(days=1)

        # ATH up to (and including) this date
        history_up_to = [(d, p) for d, p in price_hist_sorted if d <= d_str]
        if not history_up_to:
            continue
        ath_pair = max(history_up_to, key=lambda x: x[1])
        ath_val = ath_pair[1]
        try:
            ath_date_obj = datetime.strptime(ath_pair[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            ath_date_obj = None

        # Pi Cycle for this day
        idx = next((i for i, (d, _) in enumerate(price_hist_sorted) if d == d_str), None)
        pi = compute_pi_cycle_at(price_hist_sorted, idx) if idx is not None else None

        indicators = {
            "price": price_dict.get(d_str),
            "mvrv": mvrv.get(d_str),
            "nupl": nupl.get(d_str),
            "sopr": sopr.get(d_str),
            "puell": puell.get(d_str),
            "rhodl": rhodl.get(d_str),
            "mayer": mayer.get(d_str),
            "realized_price": realized.get(d_str),
            "fear_greed": fg_series.get(d_str),
            "vix": vix_series.get(d_str),
            "dxy": dxy_series.get(d_str),
        }

        result = compute_score_for_day(d_str, indicators, ath_val, ath_date_obj, pi)
        if not result:
            continue

        rows_to_insert.append({
            "date": d_str,
            "total_score": result["score"],
            "level": result["level"],
            "btc_price": result["btc_price"],
            "components": result["components"],
            "source": "backfill",
        })

    print(f"[backfill] computed {len(rows_to_insert)} rows")

    if not rows_to_insert:
        print("[backfill] no rows to insert")
        sys.exit(0)

    # 3. Bulk upsert in chunks of 100
    CHUNK = 100
    for i in range(0, len(rows_to_insert), CHUNK):
        batch = rows_to_insert[i : i + CHUNK]
        ok = insert_history_rows(env, batch)
        if not ok:
            print(f"[backfill] aborted at chunk {i}")
            sys.exit(1)

    print(f"[backfill] done. {len(rows_to_insert)} days seeded.")


if __name__ == "__main__":
    main()
