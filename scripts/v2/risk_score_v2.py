#!/usr/bin/env python3
"""
Risk Score V2.1 - BTC Investment Risk Assessment (refactored 2026-04-25)

What changed vs V2.0:
- Industry-standard thresholds (Glassnode, Look Into Bitcoin, Coin Metrics)
- ATH computed from price history (no more hardcoded value)
- New components: RHODL Ratio, Mayer Multiple
- Pi Cycle Top binary OVERRIDE (3/3 hit rate on BTC cycle tops)
- Real macro: VIX & DXY from Stooq (no more zero placeholders)
- Weighted conviction (uses component weights, not raw counts)
- Soft flags for early-warning signals
- Throttle for bitcoin-data.com (free tier rate limit)

Sources (all free, no API keys):
- bitcoin-data.com (BGeometrics): on-chain metrics + price history
- alternative.me: Fear & Greed Index
- CoinGecko: BTC price, market cap, dominance
- Yahoo Finance: VIX, DXY (chart API, no key)
- Binance Futures API: derivatives

Output: scripts/v2/risk_score_v2.json
"""

import csv
import io
import json
import math
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "risk_score_v2.json"


def load_previous_output():
    """Load last successful run from disk for graceful fallback."""
    if not OUTPUT_FILE.exists():
        return None
    try:
        with open(OUTPUT_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Could not load previous output: {e}")
        return None


def previous_raw(prev, key):
    """Get raw value of a component from previous JSON, or None."""
    if not prev:
        return None
    comp = prev.get("components", {}).get(key)
    if not comp:
        return None
    return comp.get("raw")

# ──────────────────────────────────────────
# HTTP helpers
# ──────────────────────────────────────────

def fetch_json(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RiskScoreV2/2.1"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[WARN] JSON fetch failed {url}: {e}")
        return None


def fetch_text(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RiskScoreV2/2.1"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"[WARN] Text fetch failed {url}: {e}")
        return None


# ──────────────────────────────────────────
# bitcoin-data.com — generic getters with throttle
# (free tier ~5 req/min; we add 12s spacing to be safe)
# ──────────────────────────────────────────

_LAST_BTCDATA_CALL = 0.0
_BTCDATA_MIN_INTERVAL = 12.0  # seconds


def _throttle_btcdata():
    global _LAST_BTCDATA_CALL
    now = time.time()
    elapsed = now - _LAST_BTCDATA_CALL
    if elapsed < _BTCDATA_MIN_INTERVAL:
        time.sleep(_BTCDATA_MIN_INTERVAL - elapsed)
    _LAST_BTCDATA_CALL = time.time()


def _extract_value(row):
    """Pick the first numeric value from a row that's not a date/timestamp."""
    if not row:
        return None
    for k, v in row.items():
        if k in ("d", "date", "unixTs", "theDay"):
            continue
        if v is None:
            continue
        try:
            return float(v)
        except (TypeError, ValueError):
            continue
    return None


def get_metric_latest(metric):
    """Latest value of any bitcoin-data.com /v1/{metric} endpoint."""
    _throttle_btcdata()
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data or len(data) == 0:
        return None
    return _extract_value(data[-1])


def get_metric_series(metric, days=400):
    """Last N (date_str, value) tuples. Empty list if unavailable."""
    _throttle_btcdata()
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data:
        return []
    out = []
    for row in data:
        d = row.get("d") or row.get("date")
        v = _extract_value(row)
        if d and v is not None:
            out.append((d, v))
    return out[-days:]


# ──────────────────────────────────────────
# Yahoo Finance — VIX, DXY (no API key)
# ──────────────────────────────────────────

def get_yahoo_latest(symbol):
    """Latest regularMarketPrice from Yahoo Finance chart API. Returns float or None."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=5d&interval=1d"
    data = fetch_json(url)
    try:
        results = data["chart"]["result"]
        if not results:
            return None
        meta = results[0].get("meta", {})
        price = meta.get("regularMarketPrice")
        return float(price) if price is not None else None
    except (KeyError, TypeError, ValueError) as e:
        print(f"[WARN] Yahoo parse failed {symbol}: {e}")
        return None


# ──────────────────────────────────────────
# CoinGecko + alternative.me
# ──────────────────────────────────────────

def get_btc_price():
    data = fetch_json(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        "&include_market_cap=true&include_24hr_change=true&include_24hr_vol=true"
    )
    if not data or "bitcoin" not in data:
        return None
    btc = data["bitcoin"]
    return {
        "price": btc.get("usd", 0),
        "market_cap": btc.get("usd_market_cap", 0),
        "change_24h": btc.get("usd_24h_change", 0),
        "volume_24h": btc.get("usd_24h_vol", 0),
    }


def get_global_crypto():
    data = fetch_json("https://api.coingecko.com/api/v3/global")
    if not data or "data" not in data:
        return None
    g = data["data"]
    return {
        "total_mcap": g.get("total_market_cap", {}).get("usd", 0),
        "btc_dominance": g.get("market_cap_percentage", {}).get("btc", 0),
        "eth_dominance": g.get("market_cap_percentage", {}).get("eth", 0),
        "mcap_change_24h": g.get("market_cap_change_percentage_24h_usd", 0),
    }


def get_fear_greed():
    data = fetch_json("https://api.alternative.me/fng/?limit=1")
    if not data or "data" not in data or not data["data"]:
        return None
    fg = data["data"][0]
    return {
        "value": int(fg.get("value", 50)),
        "label": fg.get("value_classification", "Unknown"),
    }


# ──────────────────────────────────────────
# ATH from price history (NO HARDCODE)
# ──────────────────────────────────────────

def compute_ath(price_series, current_price=None):
    """ATH = max of price history (incl. current price). Returns (ath, ath_date_iso)."""
    if not price_series:
        return (current_price, None) if current_price else (None, None)
    max_pair = max(price_series, key=lambda x: x[1])
    ath_date_str, ath_val = max_pair
    if current_price is not None and current_price > ath_val:
        ath_val = current_price
        ath_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        ath_dt = datetime.strptime(ath_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        ath_dt = None
    return ath_val, ath_dt


# ──────────────────────────────────────────
# Pi Cycle Top — compute from price history
# 111-DMA crosses 350-DMA × 2 → cycle top
# ──────────────────────────────────────────

def compute_pi_cycle_state(price_series):
    if len(price_series) < 350:
        return None
    prices = [p for _, p in price_series]
    ma111 = sum(prices[-111:]) / 111
    ma350 = sum(prices[-350:]) / 350
    ma350x2 = ma350 * 2
    if ma350x2 == 0:
        return None
    ratio = ma111 / ma350x2
    return {
        "active": ratio >= 1.0,
        "ratio": round(ratio, 4),
        "ma111": round(ma111, 2),
        "ma350x2": round(ma350x2, 2),
    }


# ──────────────────────────────────────────
# Normalization
# ──────────────────────────────────────────

def normalize(value, low, high, invert=False):
    """0-1. By default, high value = high score."""
    if high == low:
        return 0.5
    norm = max(0.0, min(1.0, (value - low) / (high - low)))
    return 1 - norm if invert else norm


# ──────────────────────────────────────────
# Indicator scoring (industry-standard thresholds)
# ──────────────────────────────────────────

def calc_mvrv_score(z):
    """MVRV Z-Score — Glassnode/LookIntoBitcoin standard.
    Bottom: ≤ 0 (deep value, ✓), < 1 (acumulare zone)
    Top:    ≥ 7 (cycle top, ✓), ≥ 5 (overheated)
    """
    if z is None:
        return None
    z = float(z)
    if z <= 0:
        signal = "CUMPARA✓"
    elif z < 1:
        signal = "CUMPARA"
    elif z >= 7:
        signal = "VINDE✓"
    elif z >= 5:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(z, 3),
        "norm": round(normalize(z, -1, 8, invert=True), 3),
        "weight": 0.14,
        "signal": signal,
        "explanation": "Z-Score la {:.2f}. ≤0 = deep value (✓). ≥7 = cycle top (✓). Praguri Glassnode standard.".format(z),
    }


def calc_nupl_score(n):
    """NUPL phases: Capitulare (<0, ✓) → Speranta (0-0.25) → Optimism (0.25-0.5) → Incredere (0.5-0.75) → Euforie (>0.75, ✓)"""
    if n is None:
        return None
    n = float(n)
    phases = [
        ((-1, 0), "Capitulare", "CUMPARA✓"),
        ((0, 0.25), "Speranta", "CUMPARA"),
        ((0.25, 0.5), "Optimism", "NEUTRU"),
        ((0.5, 0.75), "Incredere", "PRUDENT"),
        ((0.75, 1.5), "Euforie", "VINDE✓"),
    ]
    phase = "Necunoscut"
    signal = "NEUTRU"
    for (lo, hi), name, sig in phases:
        if lo <= n < hi:
            phase, signal = name, sig
            break
    return {
        "raw": round(n, 4),
        "norm": round(normalize(n, -0.3, 0.85, invert=True), 3),
        "weight": 0.12,
        "signal": signal,
        "phase": phase,
        "explanation": "NUPL la {:.3f} - faza: {}. <0 = capitulare (✓), >0.75 = euforie (✓).".format(n, phase),
    }


def calc_sopr_score(s):
    """SOPR: <1 = capitulation, >1.05 = profit taking."""
    if s is None:
        return None
    s = float(s)
    if s < 0.95:
        signal = "CUMPARA✓"
    elif s < 1:
        signal = "CUMPARA"
    elif s > 1.06:
        signal = "VINDE"
    elif s > 1.04:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(s, 4),
        "norm": round(normalize(s, 0.92, 1.08, invert=True), 3),
        "weight": 0.06,
        "signal": signal,
        "explanation": "SOPR la {:.4f}. <1 = capitulare (holderii vand in pierdere). >1.05 = profit-taking.".format(s),
    }


def calc_puell_score(p):
    """Puell Multiple: <0.5 = miner capitulation (✓), >4 = miner top (✓)."""
    if p is None:
        return None
    p = float(p)
    if p < 0.5:
        signal = "CUMPARA✓"
    elif p < 0.8:
        signal = "CUMPARA"
    elif p > 4:
        signal = "VINDE✓"
    elif p > 2.5:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(p, 3),
        "norm": round(normalize(p, 0.3, 4.5, invert=True), 3),
        "weight": 0.07,
        "signal": signal,
        "explanation": "Puell la {:.3f}. <0.5 = miner capitulation (✓). >4 = miner top (✓).".format(p),
    }


def calc_realized_price_score(price, rp):
    if price is None or rp is None or rp <= 0:
        return None
    rp = float(rp)
    ratio = price / rp
    if ratio < 1:
        signal = "CUMPARA✓"
    elif ratio < 1.4:
        signal = "CUMPARA"
    elif ratio > 3.5:
        signal = "VINDE✓"
    elif ratio > 2.5:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(rp, 0),
        "ratio": round(ratio, 3),
        "norm": round(normalize(ratio, 0.8, 4, invert=True), 3),
        "weight": 0.09,
        "signal": signal,
        "explanation": "Pret actual / Pret realizat = {:.2f}x. <1x = sub costul mediu (extrem rar, doar la bottom-uri istorice).".format(ratio),
    }


def calc_rhodl_score(r):
    """RHODL Ratio. 5/5 hit rate pe topurile BTC istoric (Look Into Bitcoin)."""
    if r is None:
        return None
    r = float(r)
    if r < 500:
        signal = "CUMPARA✓"
    elif r < 1500:
        signal = "CUMPARA"
    elif r > 100000:
        signal = "VINDE✓"
    elif r > 50000:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    log_r = math.log10(max(r, 1))
    norm = round(normalize(log_r, 2, 5.5, invert=True), 3)
    return {
        "raw": round(r, 1),
        "norm": norm,
        "weight": 0.10,
        "signal": signal,
        "explanation": "RHODL la {:.0f}. <1500 = zona de bottom. >50,000 = cycle top istoric (5/5 hit rate).".format(r),
    }


def _mayer_signal(mm):
    if mm < 0.8:
        return "CUMPARA✓"
    if mm < 1:
        return "CUMPARA"
    if mm > 2.4:
        return "VINDE✓"
    if mm > 1.8:
        return "PRUDENT"
    return "NEUTRU"


def make_mayer_component(mayer_multiple):
    if mayer_multiple is None:
        return None
    mm = float(mayer_multiple)
    return {
        "raw": round(mm, 3),
        "norm": round(normalize(mm, 0.5, 2.6, invert=True), 3),
        "weight": 0.08,
        "signal": _mayer_signal(mm),
        "explanation": "Mayer Multiple {:.2f} (pret/200DMA). <0.8 = istoric bottom. >2.4 = cycle top (rar).".format(mm),
    }


def calc_fear_greed_score(fg):
    if fg is None:
        return None
    v = fg["value"]
    if v < 15:
        signal = "CUMPARA✓"
    elif v < 25:
        signal = "CUMPARA"
    elif v > 85:
        signal = "VINDE✓"
    elif v > 75:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": v,
        "norm": round(normalize(v, 0, 100, invert=True), 3),
        "weight": 0.06,
        "signal": signal,
        "label": fg["label"],
        "explanation": "Indicele la {} ({}). <15 = panica extrema (✓). >85 = lacomie extrema (✓).".format(v, fg["label"]),
    }


def calc_drawdown_score(price, ath):
    if price is None or ath is None or ath <= 0:
        return None
    dd = ((price - ath) / ath) * 100
    if dd < -75:
        signal = "CUMPARA✓"
    elif dd < -50:
        signal = "CUMPARA"
    elif dd >= -2:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(dd, 2),
        "norm": round(normalize(abs(dd), 0, 80), 3),
        "weight": 0.06,
        "signal": signal,
        "explanation": "BTC la {:.1f}% de la ATH (${:,.0f}). <-75% = bottom istoric.".format(dd, ath),
    }


def calc_halving_score():
    now = datetime.now(timezone.utc)
    halving = datetime(2024, 4, 20, tzinfo=timezone.utc)
    next_halving = datetime(2028, 4, 20, tzinfo=timezone.utc)
    days_since = (now - halving).days
    days_to_next = max(0, (next_halving - now).days)

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
        "explanation": "{} zile de la halving. Faza: {}. Urmatorul halving in ~{} zile.".format(days_since, phase, days_to_next),
    }


def calc_days_from_peak_score(ath_date):
    if ath_date is None:
        return None
    now = datetime.now(timezone.utc)
    days = max(0, (now - ath_date).days)
    if days < 100:
        norm, signal = 0.3, "PRUDENT"
    elif days < 250:
        norm, signal = 0.5, "NEUTRU"
    elif days < 450:
        norm, signal = 0.85, "CUMPARA"
    else:
        norm, signal = 0.7, "NEUTRU"
    return {
        "days_from_peak": days,
        "norm": norm,
        "weight": 0.04,
        "signal": signal,
        "explanation": "{} zile de la ATH. Istoric: bottom-urile la 365-450 zile post-peak.".format(days),
    }


def calc_vix_score(vix):
    if vix is None:
        return None
    v = float(vix)
    if v > 40:
        signal = "CUMPARA✓"
    elif v > 30:
        signal = "CUMPARA"
    elif v < 13:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(v, 2),
        "norm": round(normalize(v, 12, 45), 3),
        "weight": 0.04,
        "signal": signal,
        "explanation": "VIX la {:.1f}. >30 = stres pe piete (oportunitate contrarian). <13 = complacency.".format(v),
    }


def calc_dxy_score(dxy):
    if dxy is None:
        return None
    d = float(dxy)
    if d < 95:
        signal = "CUMPARA"
    elif d > 108:
        signal = "PRUDENT"
    else:
        signal = "NEUTRU"
    return {
        "raw": round(d, 2),
        "norm": round(normalize(d, 90, 110, invert=True), 3),
        "weight": 0.06,
        "signal": signal,
        "explanation": "DXY la {:.2f}. <100 = dolar slab (favorabil crypto). >105 = dolar puternic.".format(d),
    }


# ──────────────────────────────────────────
# Derivatives (Binance, unchanged)
# ──────────────────────────────────────────

def get_derivatives_data():
    """Derivatives sentiment on the largest timeframe Binance fapi exposes (1d).
    All ratios/funding are 7-day rolling averages so noise from a single 1h
    print doesn't drive the score. Latest snapshot is kept under *_now keys
    for the UI to show side-by-side.
    """
    deriv = {
        "timeframe": "1d (7-day avg)",
        "funding_rate": 0, "funding_pct": 0, "funding_pct_now": 0,
        "oi_value": 0, "oi_delta_pct_7d": 0,
        "ls_ratio": 1, "ls_ratio_now": 1,
        "long_pct": 50, "short_pct": 50,
        "taker_buy_vol": 0, "taker_sell_vol": 0,
        "taker_ratio": 1, "taker_ratio_now": 1,
        "basis_pct": 0, "spot_price": 0, "futures_price": 0,
    }
    # Funding: 21 × 8h slots ≈ 7 days. Latest is "now", mean is the signal.
    try:
        fr = fetch_json("https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=21")
        if fr:
            rates = [float(r.get("fundingRate", 0)) for r in fr]
            latest = rates[-1]
            avg = sum(rates) / len(rates)
            deriv["funding_rate"] = avg
            deriv["funding_pct"] = round(avg * 100, 6)
            deriv["funding_pct_now"] = round(latest * 100, 6)
            deriv["futures_price"] = float(fr[-1].get("markPrice", 0))
    except Exception:
        pass
    # OI: current value + 7-day change from openInterestHist (period=1d).
    try:
        oi = fetch_json("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT")
        if oi:
            oi_btc = float(oi.get("openInterest", 0))
            price = deriv["futures_price"] or 70000
            deriv["oi_value"] = round(oi_btc * price, 2)
        oi_hist = fetch_json(
            "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1d&limit=8"
        )
        if oi_hist and len(oi_hist) >= 2:
            curr = float(oi_hist[-1].get("sumOpenInterestValue", 0))
            week_ago = float(oi_hist[0].get("sumOpenInterestValue", 0))
            if week_ago > 0:
                deriv["oi_delta_pct_7d"] = round((curr - week_ago) / week_ago * 100, 2)
    except Exception:
        pass
    # L/S: period=1d, limit=7 → mean of last 7 daily ratios.
    try:
        ls = fetch_json(
            "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1d&limit=7"
        )
        if ls:
            ratios = [float(r.get("longShortRatio", 1)) for r in ls]
            longs = [float(r.get("longAccount", 0.5)) for r in ls]
            shorts = [float(r.get("shortAccount", 0.5)) for r in ls]
            deriv["ls_ratio"] = round(sum(ratios) / len(ratios), 4)
            deriv["ls_ratio_now"] = round(ratios[-1], 4)
            # Display latest split (it's a snapshot, not really averageable)
            deriv["long_pct"] = round(longs[-1] * 100, 2)
            deriv["short_pct"] = round(shorts[-1] * 100, 2)
    except Exception:
        pass
    # Taker: period=1d, limit=7.
    try:
        ts = fetch_json(
            "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1d&limit=7"
        )
        if ts:
            ratios = []
            for r in ts:
                bv = float(r.get("buyVol", 0))
                sv = float(r.get("sellVol", 0))
                if sv > 0:
                    ratios.append(bv / sv)
            if ratios:
                deriv["taker_ratio"] = round(sum(ratios) / len(ratios), 4)
                deriv["taker_ratio_now"] = round(ratios[-1], 4)
            # Latest day's totals
            deriv["taker_buy_vol"] = round(float(ts[-1].get("buyVol", 0)), 2)
            deriv["taker_sell_vol"] = round(float(ts[-1].get("sellVol", 0)), 2)
    except Exception:
        pass
    # Basis: spot vs futures, snapshot.
    try:
        spot = fetch_json("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
        if spot:
            deriv["spot_price"] = float(spot.get("price", 0))
            if deriv["spot_price"] > 0 and deriv["futures_price"] > 0:
                deriv["basis_pct"] = round(
                    ((deriv["futures_price"] - deriv["spot_price"]) / deriv["spot_price"]) * 100,
                    4,
                )
    except Exception:
        pass
    return deriv


# ──────────────────────────────────────────
# Main score calculation
# ──────────────────────────────────────────

def calculate_risk_score():
    print("[INFO] Risk Score V2.1 - calculation start")

    # Load previous output for graceful fallback when APIs fail
    prev = load_previous_output()
    fallback_used = []

    def with_fallback(key, fresh_value, prev_key=None):
        """Use fresh value if available, else fall back to previous JSON."""
        if fresh_value is not None:
            return fresh_value
        fallback = previous_raw(prev, prev_key or key)
        if fallback is not None:
            fallback_used.append(prev_key or key)
            return fallback
        return None

    btc = get_btc_price()
    if not btc:
        print("[ERROR] Could not fetch BTC price")
        return None
    price = btc["price"]
    print(f"[INFO] BTC: ${price:,.2f}")

    global_data = get_global_crypto()
    fg = get_fear_greed()

    print("[INFO] Fetching derivatives from Binance...")
    derivatives = get_derivatives_data()
    print(f"[INFO] Derivatives: Funding={derivatives['funding_pct']:.4f}%, L/S={derivatives['ls_ratio']:.2f}, OI=${derivatives['oi_value']/1e9:.2f}B")

    # On-chain (throttled to bitcoin-data.com), fall back to previous JSON if rate-limited
    print("[INFO] Fetching on-chain metrics (throttled)...")
    mvrv_z = with_fallback("mvrv_zscore", get_metric_latest("mvrv-zscore"))
    sopr_v = with_fallback("sopr", get_metric_latest("sopr"))
    nupl_v = with_fallback("nupl", get_metric_latest("nupl"))
    puell_v = with_fallback("puell_multiple", get_metric_latest("puell-multiple"))
    realized = with_fallback("realized_price", get_metric_latest("realized-price"))
    rhodl_v = with_fallback("rhodl_ratio", get_metric_latest("rhodl-ratio"))
    mayer_v_endpoint = get_metric_latest("mayer-multiple")

    print("[INFO] Fetching BTC price history (for ATH + Pi Cycle + Mayer fallback)...")
    price_history = get_metric_series("btc-price", days=400)

    # ATH: prefer fresh price history, else previous JSON
    ath, ath_date = compute_ath(price_history, current_price=price)
    if (not ath or not price_history) and prev:
        # No fresh history — use previous ATH (do NOT fall back to current price = false drawdown)
        prev_ath = prev.get("btc_ath")
        prev_ath_date_str = prev.get("btc_ath_date")
        if prev_ath:
            ath = max(float(prev_ath), price)  # only update if real new ATH
            fallback_used.append("btc_ath")
            if prev_ath_date_str:
                try:
                    ath_date = datetime.strptime(prev_ath_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                except (ValueError, TypeError):
                    pass
    # ath_date fallback: derive from previous JSON's days_from_peak component
    if ath_date is None and prev:
        prev_days = prev.get("components", {}).get("days_from_peak", {}).get("days_from_peak")
        prev_ts = prev.get("timestamp")
        if prev_days is not None and prev_ts:
            try:
                prev_dt = datetime.fromisoformat(prev_ts.replace("Z", "+00:00"))
                ath_date = prev_dt - timedelta(days=int(prev_days))
                fallback_used.append("ath_date")
            except (ValueError, TypeError):
                pass

    if ath:
        print(f"[INFO] ATH: ${ath:,.2f} on {ath_date.strftime('%Y-%m-%d') if ath_date else 'unknown'}")

    # Pi Cycle Top — only if we have fresh price history (no fallback, fresh data required)
    pi_cycle = compute_pi_cycle_state(price_history) if price_history else None
    if pi_cycle:
        print(f"[INFO] Pi Cycle: ratio={pi_cycle['ratio']} active={pi_cycle['active']}")

    # Mayer Multiple: endpoint → compute from history → previous JSON
    mayer_mm = None
    if mayer_v_endpoint is not None:
        mayer_mm = float(mayer_v_endpoint)
    elif price_history and len(price_history) >= 200:
        ma200 = sum(p for _, p in price_history[-200:]) / 200
        if ma200 > 0:
            mayer_mm = price / ma200
    else:
        prev_mayer = previous_raw(prev, "mayer_multiple")
        if prev_mayer is not None:
            mayer_mm = float(prev_mayer)
            fallback_used.append("mayer_multiple")

    # Macro from Yahoo Finance
    print("[INFO] Fetching VIX & DXY from Yahoo Finance...")
    vix = get_yahoo_latest("^VIX")
    dxy = get_yahoo_latest("DX-Y.NYB")
    if vix is not None:
        print(f"[INFO] VIX: {vix:.2f}")
    if dxy is not None:
        print(f"[INFO] DXY: {dxy:.2f}")

    # Build components
    components = {}

    def add(key, value):
        if value is not None:
            components[key] = value

    add("mvrv_zscore", calc_mvrv_score(mvrv_z))
    add("nupl", calc_nupl_score(nupl_v))
    add("rhodl_ratio", calc_rhodl_score(rhodl_v))
    add("realized_price", calc_realized_price_score(price, realized))
    add("mayer_multiple", make_mayer_component(mayer_mm))
    add("puell_multiple", calc_puell_score(puell_v))
    add("sopr", calc_sopr_score(sopr_v))
    add("fear_greed", calc_fear_greed_score(fg))
    add("drawdown", calc_drawdown_score(price, ath))
    add("halving_cycle", calc_halving_score())
    add("days_from_peak", calc_days_from_peak_score(ath_date))
    add("vix", calc_vix_score(vix))
    add("dxy", calc_dxy_score(dxy))

    # Aggregate (weighted)
    total_weight = 0.0
    weighted_sum = 0.0
    weighted_buy = 0.0
    weighted_sell = 0.0
    weighted_neutral = 0.0
    buy_count = 0
    sell_count = 0
    neutral_count = 0

    for comp in components.values():
        if comp is None:
            continue
        w = comp.get("weight", 0.05)
        n = comp.get("norm", 0.5)
        total_weight += w
        weighted_sum += n * w
        sig = comp.get("signal", "NEUTRU")
        if "CUMPARA" in sig:
            weighted_buy += w
            buy_count += 1
        elif "VINDE" in sig:
            weighted_sell += w
            sell_count += 1
        else:
            weighted_neutral += w
            neutral_count += 1

    raw_score = (weighted_sum / total_weight) if total_weight > 0 else 0.5
    score = int(round(raw_score * 100))

    # Pi Cycle Top binary OVERRIDE: 3/3 hit rate on BTC tops → forced SELL
    overrides = []
    if pi_cycle and pi_cycle["active"]:
        overrides.append("Pi Cycle Top ACTIV — semnal istoric de top de ciclu (3/3 hit rate). Override: SELL.")
        score = min(score, 25)

    # Decision
    if score >= 65:
        decision = "BUY"
        decision_text = "Conditiile sunt favorabile pentru acumulare pe termen lung."
        conviction = "HIGH" if score >= 75 and weighted_buy > weighted_sell + 0.15 else "MEDIUM"
    elif score <= 35:
        decision = "SELL"
        decision_text = "Piata e supraincalzita. Reducerea expunerii recomandata."
        conviction = "HIGH" if score <= 25 and weighted_sell > weighted_buy + 0.15 else "MEDIUM"
    else:
        decision = "HOLD"
        decision_text = "Conditii mixte. Acumulare DCA cu prudenta."
        conviction = "LOW"

    # Soft flags
    flags = []
    mv = components.get("mvrv_zscore")
    if mv and mv["raw"] >= 5:
        flags.append(f"MVRV Z-Score ridicat ({mv['raw']:.2f}) — istoric, > 5 a precedat top-uri.")
    nu = components.get("nupl")
    if nu and nu["raw"] >= 0.65:
        flags.append(f"NUPL ridicat ({nu['raw']:.2f}) — euforia se construieste.")
    if derivatives.get("funding_pct", 0) > 0.05:
        flags.append(f"Funding rate ridicat ({derivatives['funding_pct']:.4f}%) — longs aglomerati.")
    if derivatives.get("funding_pct", 0) < -0.02:
        flags.append(f"Funding rate negativ ({derivatives['funding_pct']:.4f}%) — shorts aglomerati (potential bounce).")
    if pi_cycle and not pi_cycle["active"] and pi_cycle["ratio"] > 0.85:
        flags.append(f"Pi Cycle aproape de cross ({pi_cycle['ratio']*100:.1f}% din pragul de top).")

    pct_from_ath = round(((price - ath) / ath) * 100, 2) if ath else 0

    # Macro section: only real values, missing ones omitted (no fake zeros)
    macro_section = {}
    if vix is not None:
        macro_section["vix"] = round(float(vix), 2)
    if dxy is not None:
        macro_section["dxy"] = round(float(dxy), 2)

    now = datetime.now(timezone.utc)
    result = {
        "version": "2.1",
        "timestamp": now.isoformat(),
        "score": score,
        "decision": decision,
        "decision_text": decision_text,
        "conviction": conviction,
        "conviction_detail": "{} cumpara / {} vinde / {} neutru (ponderat: buy {:.0%}, sell {:.0%})".format(
            buy_count, sell_count, neutral_count, weighted_buy, weighted_sell,
        ),
        "overrides": overrides,
        "flags": flags,
        "fallback_used": fallback_used,

        "btc_price": price,
        "btc_price_live": price,
        "btc_ath": round(ath, 2) if ath else None,
        "btc_ath_date": ath_date.strftime("%Y-%m-%d") if ath_date else None,
        "pct_from_ath": pct_from_ath,
        "internal_score": round(raw_score, 4),
        "btc_market_cap": btc.get("market_cap", 0),
        "btc_24h_change": round(btc.get("change_24h", 0), 2),

        "fear_greed": fg or {"value": 50, "label": "Neutral"},
        "coingecko": global_data or {
            "total_mcap": 0, "btc_dominance": 0, "eth_dominance": 0, "mcap_change_24h": 0,
        },

        "derivatives": derivatives,
        "macro": macro_section,
        "pi_cycle": pi_cycle,
        "indicators": {},
        "components": components,

        "analysis": generate_analysis(score, decision, conviction, price, components, fg, ath, pi_cycle),
    }

    print(f"[INFO] Score: {score}/100 | Decision: {decision} | Conviction: {conviction}")
    print(f"[INFO] Components active: {list(components.keys())}")
    return result


def generate_analysis(score, decision, conviction, price, components, fg, ath, pi_cycle):
    lines = [f"SCOR RISC: {score}/100. Decizie: {decision} (Conviction: {conviction}).", ""]
    if pi_cycle and pi_cycle["active"]:
        lines.append("⚠️ PI CYCLE TOP ACTIV — semnal istoric de top de ciclu (3/3 hit rate). Override: SELL.")
        lines.append("")

    label_order = [
        ("mvrv_zscore", "MVRV Z-Score"),
        ("nupl", "NUPL"),
        ("rhodl_ratio", "RHODL Ratio"),
        ("sopr", "SOPR"),
        ("puell_multiple", "Puell Multiple"),
        ("realized_price", "Realized Price"),
        ("mayer_multiple", "Mayer Multiple"),
    ]
    for key, label in label_order:
        c = components.get(key)
        if c:
            phase_suffix = f" ({c['phase']})" if "phase" in c else ""
            lines.append(f"{label}{phase_suffix}: {c['raw']}. {c['explanation']}")

    if fg:
        lines.append(f"Fear & Greed: {fg['value']} ({fg['label']}).")
    dd = components.get("drawdown")
    if dd:
        lines.append(f"Drawdown: {dd['raw']}% de la ATH (${ath:,.0f}).")
    hc = components.get("halving_cycle")
    if hc:
        lines.append(f"Halving: {hc['explanation']}")
    vix_c = components.get("vix")
    if vix_c:
        lines.append(f"VIX: {vix_c['raw']}. {vix_c['explanation']}")
    dxy_c = components.get("dxy")
    if dxy_c:
        lines.append(f"DXY: {dxy_c['raw']}. {dxy_c['explanation']}")

    lines.extend(["", "Aceasta analiza este generata automat si nu constituie sfaturi de investitii."])
    return "\n".join(lines)


def main():
    result = calculate_risk_score()
    if result is None:
        print("[ERROR] Failed to calculate risk score")
        sys.exit(1)

    # Guard: don't overwrite previous output if new run is severely degraded
    # (prevents losing real data when both fresh APIs and previous JSON are unavailable).
    new_n = len(result.get("components") or {})
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r") as f:
                prev_n = len(json.load(f).get("components") or {})
        except Exception:
            prev_n = 0
        if new_n < 6 and new_n < prev_n - 2:
            print(f"[WARN] New run has only {new_n} components vs previous {prev_n}. Keeping previous output.")
            sys.exit(2)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"[INFO] Saved to {OUTPUT_FILE}")

    print(f"\n{'='*55}")
    print(f"  RISK SCORE V2.1: {result['score']}/100")
    print(f"  Decision: {result['decision']} ({result['conviction']})")
    ath = result.get('btc_ath') or 0
    print(f"  BTC: ${result['btc_price']:,.2f} ({result['pct_from_ath']:.1f}% from ATH = ${ath:,.0f})")
    print(f"  F&G: {result['fear_greed']['value']} ({result['fear_greed']['label']})")
    print(f"  Components ({len(result['components'])}): {result['conviction_detail']}")
    if result.get("overrides"):
        for o in result["overrides"]:
            print(f"  ⚠️ OVERRIDE: {o}")
    if result.get("flags"):
        print(f"  Flags ({len(result['flags'])}):")
        for f in result["flags"]:
            print(f"    - {f}")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()
