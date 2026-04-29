#!/usr/bin/env python3
"""
Backfill v2 — multi-source backfill for risk_score_history.

Bypass strategy for bitcoin-data.com's 8 req/h cap:
  - **CoinMetrics community API** (no API key, generous limit) gives BTC
    daily history from 2010 in ONE request: PriceUSD, CapMVRVCur,
    CapMrktCurUSD, SplyCur, IssTotUSD. From these we derive 5 indicators
    (MVRV-Z, NUPL, realized-price, Mayer, Puell). NUPL = 1 - 1/MVRV is a
    mathematical identity. Realized-price = realized_cap / supply where
    realized_cap = market_cap / mvrv. Mayer = price / 200DMA. Puell =
    today_issuance_USD / 365DMA(issuance_USD).
  - **Yahoo Finance** (no limit) for VIX, DXY history.
  - **alternative.me** (no key, generous limit) for Fear & Greed history.
  - **bitcoin-data.com** ONLY for SOPR + RHODL (2 of 8 hourly requests).

Run: python3 scripts/v2/backfill_v2.py [--years 8]
"""
import argparse
import json
import math
import statistics
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

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
    calc_days_from_peak_score,
    calc_vix_score,
    calc_dxy_score,
    fetch_json,
    _throttle_btcdata,
    _extract_value,
)

ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"


def log(msg):
    print(f"[backfill_v2] {msg}")


def load_env():
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


# ─────────────────────────────────────────────
# CoinMetrics community: 5 metrics in 1 call
# ─────────────────────────────────────────────

def fetch_coinmetrics(start_date):
    """Returns dict date_str -> {price, mvrv, market_cap, supply, issuance_usd}."""
    url = (
        "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics"
        "?assets=btc"
        "&metrics=PriceUSD,CapMVRVCur,CapMrktCurUSD,SplyCur,IssTotUSD"
        f"&start_time={start_date}T00:00:00Z"
        "&page_size=10000"
        "&pretty=false"
    )
    log(f"fetching CoinMetrics community: {start_date} → today …")
    out = {}
    next_url = url
    pages = 0
    while next_url:
        data = fetch_json(next_url)
        if not data or "data" not in data:
            break
        for row in data["data"]:
            d = row.get("time", "")[:10]
            if not d:
                continue
            try:
                out[d] = {
                    "price": float(row.get("PriceUSD") or 0) or None,
                    "mvrv": float(row.get("CapMVRVCur") or 0) or None,
                    "market_cap": float(row.get("CapMrktCurUSD") or 0) or None,
                    "supply": float(row.get("SplyCur") or 0) or None,
                    "issuance_usd": float(row.get("IssTotUSD") or 0) or None,
                }
            except (TypeError, ValueError):
                continue
        pages += 1
        # CoinMetrics paginates with next_page_url
        next_url = data.get("next_page_url")
    log(f"CoinMetrics: {len(out)} days across {pages} pages")
    return out


def fetch_btcdata_metric(metric):
    """One-shot bitcoin-data.com pull. Reserved for SOPR and RHODL."""
    _throttle_btcdata()
    log(f"fetching bitcoin-data.com/{metric} …")
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data or isinstance(data, dict) and "error" in data:
        log(f"  {metric}: error / rate-limited, skipping")
        return {}
    out = {}
    for row in data:
        d = row.get("d") or row.get("date")
        v = _extract_value(row)
        if d and v is not None:
            out[d] = float(v)
    log(f"  {metric}: {len(out)} days")
    return out


def fetch_fear_greed_series(days):
    log(f"fetching alternative.me F&G last {days} days …")
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
    log(f"  F&G: {len(out)} days")
    return out


def fetch_yahoo_history(symbol, range_):
    log(f"fetching Yahoo {symbol} ({range_}) …")
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
        log(f"  {symbol}: {len(out)} days")
        return out
    except (KeyError, IndexError, TypeError):
        return {}


# ─────────────────────────────────────────────
# Derived indicators
# ─────────────────────────────────────────────

def compute_mvrv_z(cm_by_date):
    """MVRV-Z = (market_cap - realized_cap) / std(market_cap, all-time).
    Uses expanding window through `date` so each day's z reflects history
    up to that day, not future leakage.
    """
    sorted_dates = sorted(cm_by_date.keys())
    market_caps = []
    realized_caps = []
    out = {}
    for d in sorted_dates:
        row = cm_by_date[d]
        mc = row.get("market_cap")
        mvrv = row.get("mvrv")
        if mc is None or mvrv is None or mvrv == 0:
            continue
        rc = mc / mvrv
        market_caps.append(mc)
        realized_caps.append(rc)
        # Use stddev of market caps so far (need at least 2 samples)
        if len(market_caps) < 30:
            continue
        try:
            sd = statistics.pstdev(market_caps)
            if sd == 0:
                continue
            z = (mc - rc) / sd
            out[d] = z
        except statistics.StatisticsError:
            continue
    return out


def compute_nupl(cm_by_date):
    """NUPL = 1 - 1/MVRV (identity)."""
    out = {}
    for d, row in cm_by_date.items():
        mvrv = row.get("mvrv")
        if mvrv is None or mvrv == 0:
            continue
        out[d] = 1 - 1 / mvrv
    return out


def compute_realized_price(cm_by_date):
    out = {}
    for d, row in cm_by_date.items():
        mc = row.get("market_cap")
        mvrv = row.get("mvrv")
        sup = row.get("supply")
        if mc is None or mvrv is None or sup is None or mvrv == 0 or sup == 0:
            continue
        out[d] = (mc / mvrv) / sup
    return out


def compute_mayer(price_series):
    """Mayer Multiple = price / 200DMA(price). Returns dict date -> float."""
    sorted_dates = sorted(price_series.keys())
    out = {}
    window = []
    for d in sorted_dates:
        p = price_series[d]
        if p is None:
            continue
        window.append(p)
        if len(window) > 200:
            window.pop(0)
        if len(window) >= 200:
            ma = sum(window) / 200
            if ma > 0:
                out[d] = p / ma
    return out


def compute_puell(issuance_by_date):
    """Puell = today_issuance_usd / 365DMA(issuance_usd)."""
    sorted_dates = sorted(issuance_by_date.keys())
    out = {}
    window = []
    for d in sorted_dates:
        iss = issuance_by_date[d]
        if iss is None:
            continue
        window.append(iss)
        if len(window) > 365:
            window.pop(0)
        if len(window) >= 365:
            ma = sum(window) / 365
            if ma > 0:
                out[d] = iss / ma
    return out


# ─────────────────────────────────────────────
# Score builder (reuses risk_score_v2 logic via norm aggregation)
# ─────────────────────────────────────────────

def halving_score_at(date_obj):
    halving = datetime(2024, 4, 20, tzinfo=timezone.utc)
    next_halving = datetime(2028, 4, 20, tzinfo=timezone.utc)
    days_since = (date_obj - halving).days
    if days_since < 0:
        # Iterate backward through known halvings
        for h, nh in [
            (datetime(2020, 5, 11, tzinfo=timezone.utc), datetime(2024, 4, 20, tzinfo=timezone.utc)),
            (datetime(2016, 7, 9, tzinfo=timezone.utc), datetime(2020, 5, 11, tzinfo=timezone.utc)),
            (datetime(2012, 11, 28, tzinfo=timezone.utc), datetime(2016, 7, 9, tzinfo=timezone.utc)),
        ]:
            ds = (date_obj - h).days
            if ds >= 0:
                halving = h
                next_halving = nh
                days_since = ds
                break
        else:
            days_since = 0
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


def aggregate_score(components):
    total_weight = 0.0
    weighted_sum = 0.0
    for comp in components.values():
        w = comp.get("weight", 0.05)
        n = comp.get("norm", 0.5)
        total_weight += w
        weighted_sum += n * w
    if total_weight <= 0:
        return 50
    return int(round(weighted_sum / total_weight * 100))


def level_for(score):
    if score >= 65:
        return "BUY"
    if score <= 35:
        return "SELL"
    return "HOLD"


def build_components(d_str, indicators, ath, ath_date, pi_cycle):
    components = {}

    def add(key, value):
        if value is not None:
            components[key] = value

    add("mvrv_zscore", calc_mvrv_score(indicators.get("mvrv_z")))
    add("nupl", calc_nupl_score(indicators.get("nupl")))
    if indicators.get("sopr") is not None:
        add("sopr", calc_sopr_score(indicators.get("sopr")))
    if indicators.get("puell") is not None:
        add("puell_multiple", calc_puell_score(indicators.get("puell")))
    if indicators.get("rhodl") is not None:
        add("rhodl_ratio", calc_rhodl_score(indicators.get("rhodl")))
    if indicators.get("mayer") is not None:
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

    add("vix", calc_vix_score(indicators.get("vix")))
    add("dxy", calc_dxy_score(indicators.get("dxy")))

    return components


def insert_rows(env, rows):
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
            return resp.status
    except urllib.error.HTTPError as e:
        log(f"upsert HTTP {e.code}: {e.read().decode(errors='replace')[:300]}")
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--years", type=int, default=8, help="how many years back to backfill")
    ap.add_argument("--no-sopr", action="store_true", help="skip bitcoin-data.com SOPR call")
    ap.add_argument("--no-rhodl", action="store_true", help="skip bitcoin-data.com RHODL call")
    args = ap.parse_args()

    env = load_env()
    if not env.get("SUPABASE_SERVICE_ROLE_KEY"):
        log("missing SUPABASE_SERVICE_ROLE_KEY")
        return 1

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=args.years * 365 + 30)
    log(f"window: {start} → {today} ({args.years} years)")

    cm = fetch_coinmetrics(start.isoformat())
    if not cm:
        log("FATAL: CoinMetrics returned no data")
        return 1

    # Build derived series
    price_series = {d: r.get("price") for d, r in cm.items() if r.get("price")}
    issuance_series = {d: r.get("issuance_usd") for d, r in cm.items() if r.get("issuance_usd")}

    mvrv_z = compute_mvrv_z(cm)
    nupl = compute_nupl(cm)
    realized_price = compute_realized_price(cm)
    mayer = compute_mayer(price_series)
    puell = compute_puell(issuance_series)

    log(f"derived: mvrv_z={len(mvrv_z)}, nupl={len(nupl)}, "
        f"realized_price={len(realized_price)}, mayer={len(mayer)}, puell={len(puell)}")

    # Optional bitcoin-data.com pulls (1-2 calls, well under 8/h)
    sopr = {} if args.no_sopr else fetch_btcdata_metric("sopr")
    rhodl = {} if args.no_rhodl else fetch_btcdata_metric("rhodl-ratio")

    fg = fetch_fear_greed_series(days=min(args.years * 365 + 30, 2000))
    yahoo_range = "max" if args.years > 5 else f"{args.years}y"
    vix = fetch_yahoo_history("^VIX", yahoo_range)
    dxy = fetch_yahoo_history("DX-Y.NYB", yahoo_range)

    # Walk the date range
    price_hist_sorted = sorted(price_series.items())
    rows = []
    cursor = start
    while cursor <= today:
        d_str = cursor.strftime("%Y-%m-%d")
        cursor += timedelta(days=1)

        history_up_to = [(d, p) for d, p in price_hist_sorted if d <= d_str]
        if not history_up_to:
            continue
        ath_pair = max(history_up_to, key=lambda x: x[1])
        ath_val = ath_pair[1]
        try:
            ath_date_obj = datetime.strptime(ath_pair[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            ath_date_obj = None

        idx = next((i for i, (d, _) in enumerate(price_hist_sorted) if d == d_str), None)
        pi = compute_pi_cycle_at(price_hist_sorted, idx) if idx is not None else None

        indicators = {
            "price": price_series.get(d_str),
            "mvrv_z": mvrv_z.get(d_str),
            "nupl": nupl.get(d_str),
            "realized_price": realized_price.get(d_str),
            "mayer": mayer.get(d_str),
            "puell": puell.get(d_str),
            "sopr": sopr.get(d_str),
            "rhodl": rhodl.get(d_str),
            "fear_greed": fg.get(d_str),
            "vix": vix.get(d_str),
            "dxy": dxy.get(d_str),
        }

        comps = build_components(d_str, indicators, ath_val, ath_date_obj, pi)
        if not comps:
            continue
        score = aggregate_score(comps)
        if pi and pi.get("active"):
            score = min(score, 25)
        rows.append({
            "date": d_str,
            "total_score": score,
            "level": level_for(score),
            "btc_price": indicators["price"],
            "components": comps,
            "source": "backfill_v2",
        })

    log(f"computed {len(rows)} rows")

    # Bulk upsert in chunks of 200
    CHUNK = 200
    total_ok = 0
    for i in range(0, len(rows), CHUNK):
        batch = rows[i : i + CHUNK]
        status = insert_rows(env, batch)
        if status is None:
            log(f"aborted at chunk {i}")
            return 1
        total_ok += len(batch)
        if (i // CHUNK) % 5 == 0:
            log(f"upserted {total_ok}/{len(rows)}…")

    log(f"done. {total_ok} days seeded.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
