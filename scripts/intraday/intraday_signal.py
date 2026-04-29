#!/usr/bin/env python3
"""
Intraday Signal v1.0 — BTC short-term decision support.

Output: scripts/intraday/intraday_signal.json (also synced to Supabase)
Cron: every 5 minutes (*/5 * * * *)
Frontend refresh: 60s (reads same JSON, no extra API calls)

Sources (all free, no API keys):
- Binance fapi: klines (15m/1h/4h/1d), funding, OI, L/S ratio, taker
- Binance api: spot ticker + klines fallback
- Risk Score V2 cache: macro context (one input among many)
- Whale data cache: 6h fills aggregate

Design:
- Pure-stdlib HTTP (urllib) + numpy/pandas for indicators
- Graceful fallback: if a source fails, that component scores neutral
- Direction bias = weighted vote from technicals + crowd + whales + macro
- Score 0-100: 0 = strong short bias, 50 = no edge, 100 = strong long bias
- Verdict thresholds: <35 short / 35-65 no-edge / >65 long

Disclaimer: educational decision support, not investment advice.
"""

import json
import math
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "intraday_signal.json"
PROJECT_ROOT = SCRIPT_DIR.parent.parent
RISK_SCORE_FILE = PROJECT_ROOT / "scripts" / "v2" / "risk_score_v2.json"
ENV_FILE = PROJECT_ROOT / ".env.local"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    return env


def fetch_supabase(env, path):
    url_base = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url_base or not key:
        return None
    try:
        req = urllib.request.Request(
            f"{url_base}/rest/v1/{path}",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[WARN] supabase fetch failed {path}: {e}", file=sys.stderr)
        return None


def whale_flow_btc_supabase(env):
    """Pulls BTC whale exposure from Hyperliquid tracker (whale_positions + whale_fills).

    Returns dict with long_usd / short_usd / net_usd / fill_count / signal,
    or None if no data. Uses current open positions + last 6h fills.
    """
    positions = fetch_supabase(env, "whale_positions?asset=eq.BTC&is_current=eq.true&select=direction,notional_usd,leverage")
    if positions is None:
        return None
    long_usd = sum(float(p.get("notional_usd") or 0) for p in positions if p.get("direction") == "LONG")
    short_usd = sum(float(p.get("notional_usd") or 0) for p in positions if p.get("direction") == "SHORT")
    long_count = sum(1 for p in positions if p.get("direction") == "LONG")
    short_count = sum(1 for p in positions if p.get("direction") == "SHORT")
    if long_count == 0 and short_count == 0:
        return None

    # Fills last 6h for activity count
    six_h_ago = (datetime.now(timezone.utc) - timedelta(hours=6)).strftime("%Y-%m-%dT%H:%M:%SZ")
    fills = fetch_supabase(env, f"whale_fills?asset=eq.BTC&filled_at=gte.{six_h_ago}&select=direction,action_type")
    fill_count = len(fills) if fills else 0

    net_usd = long_usd - short_usd
    total_usd = long_usd + short_usd
    smart_long_pct = (long_usd / total_usd * 100) if total_usd > 0 else 50
    if smart_long_pct >= 65:
        signal = "BULLISH"
    elif smart_long_pct <= 35:
        signal = "BEARISH"
    else:
        signal = "NEUTRAL"

    return {
        "long_usd": long_usd,
        "short_usd": short_usd,
        "net_usd": net_usd,
        "fill_count": fill_count,
        "smart_long_pct": round(smart_long_pct, 1),
        "signal": signal,
    }


# ──────────────────────────────────────────
# HTTP helpers
# ──────────────────────────────────────────

def fetch_json(url, timeout=15):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "IntradaySignal/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"[WARN] fetch failed {url}: {e}", file=sys.stderr)
        return None


# ──────────────────────────────────────────
# Binance data fetchers
# ──────────────────────────────────────────

def fetch_klines(interval, limit=200, futures=True):
    """Fetch BTCUSDT klines. Returns DataFrame or None."""
    base = "https://fapi.binance.com/fapi/v1" if futures else "https://api.binance.com/api/v3"
    url = f"{base}/klines?symbol=BTCUSDT&interval={interval}&limit={limit}"
    raw = fetch_json(url)
    if not raw or not isinstance(raw, list):
        return None
    df = pd.DataFrame(raw, columns=[
        "open_time", "open", "high", "low", "close", "volume",
        "close_time", "quote_vol", "trades", "taker_buy_vol", "taker_buy_quote", "ignore",
    ])
    for c in ["open", "high", "low", "close", "volume", "quote_vol", "taker_buy_vol", "taker_buy_quote"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["open_time"] = pd.to_datetime(df["open_time"], unit="ms", utc=True)
    df["close_time"] = pd.to_datetime(df["close_time"], unit="ms", utc=True)
    return df


def fetch_funding_history(limit=24):
    """Last N funding rates (8h each = 8 days for limit=24)."""
    url = f"https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit={limit}"
    raw = fetch_json(url)
    if not raw or not isinstance(raw, list):
        return []
    return [{"time": int(x["fundingTime"]), "rate": float(x["fundingRate"])} for x in raw]


def fetch_open_interest_history():
    """Last 24h of OI snapshots (1h interval)."""
    url = "https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=24"
    raw = fetch_json(url)
    if not raw or not isinstance(raw, list):
        return []
    return [{"time": int(x["timestamp"]), "oi": float(x["sumOpenInterestValue"])} for x in raw]


def fetch_top_trader_ratio():
    """Top trader long/short account ratio (smart money proxy)."""
    url = "https://fapi.binance.com/futures/data/topLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=2"
    raw = fetch_json(url)
    if not raw or len(raw) < 1:
        return None
    last = raw[-1]
    return {
        "long_pct": float(last["longAccount"]) * 100,
        "short_pct": float(last["shortAccount"]) * 100,
        "ratio": float(last["longShortRatio"]),
    }


def fetch_global_ls_ratio():
    """Global long/short account ratio (retail proxy)."""
    url = "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=2"
    raw = fetch_json(url)
    if not raw or len(raw) < 1:
        return None
    last = raw[-1]
    return {
        "long_pct": float(last["longAccount"]) * 100,
        "short_pct": float(last["shortAccount"]) * 100,
        "ratio": float(last["longShortRatio"]),
    }


def fetch_taker_ratio():
    """Taker buy/sell ratio (aggressive flow direction)."""
    url = "https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=5m&limit=12"
    raw = fetch_json(url)
    if not raw or not isinstance(raw, list):
        return None
    buys = sum(float(x["buyVol"]) for x in raw)
    sells = sum(float(x["sellVol"]) for x in raw)
    if sells == 0:
        return None
    return {
        "buy_vol": buys,
        "sell_vol": sells,
        "ratio": buys / sells,
    }


def fetch_spot_price():
    raw = fetch_json("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT")
    if not raw:
        return None
    return {
        "price": float(raw["lastPrice"]),
        "change_pct": float(raw["priceChangePercent"]),
        "volume": float(raw["volume"]),
        "quote_volume": float(raw["quoteVolume"]),
        "high_24h": float(raw["highPrice"]),
        "low_24h": float(raw["lowPrice"]),
    }


# ──────────────────────────────────────────
# Indicators (pure numpy)
# ──────────────────────────────────────────

def rsi(closes, period=14):
    """Standard 14-period RSI."""
    if len(closes) < period + 1:
        return None
    deltas = np.diff(closes)
    seed = deltas[:period]
    up = seed[seed > 0].sum() / period if period > 0 else 0
    down = -seed[seed < 0].sum() / period if period > 0 else 0
    if down == 0:
        return 100.0
    rs = up / down
    rsi_val = 100 - (100 / (1 + rs))
    for delta in deltas[period:]:
        if delta > 0:
            up = (up * (period - 1) + delta) / period
            down = (down * (period - 1)) / period
        else:
            up = (up * (period - 1)) / period
            down = (down * (period - 1) - delta) / period
        if down == 0:
            rsi_val = 100.0
        else:
            rs = up / down
            rsi_val = 100 - (100 / (1 + rs))
    return float(rsi_val)


def ema(values, period):
    if len(values) < period:
        return None
    arr = np.asarray(values, dtype=float)
    alpha = 2 / (period + 1)
    ema_val = arr[:period].mean()
    for v in arr[period:]:
        ema_val = alpha * v + (1 - alpha) * ema_val
    return float(ema_val)


def macd(closes, fast=12, slow=26, signal=9):
    if len(closes) < slow + signal:
        return None
    arr = np.asarray(closes, dtype=float)
    # full EMA series for crossover signal
    def ema_series(values, period):
        alpha = 2 / (period + 1)
        out = np.zeros_like(values)
        out[0] = values[0]
        for i in range(1, len(values)):
            out[i] = alpha * values[i] + (1 - alpha) * out[i - 1]
        return out
    fast_ema = ema_series(arr, fast)
    slow_ema = ema_series(arr, slow)
    macd_line = fast_ema - slow_ema
    sig_line = ema_series(macd_line, signal)
    hist = macd_line - sig_line
    return {
        "macd": float(macd_line[-1]),
        "signal": float(sig_line[-1]),
        "hist": float(hist[-1]),
        "hist_prev": float(hist[-2]),
    }


def atr(df, period=14):
    if len(df) < period + 1:
        return None
    high = df["high"].values
    low = df["low"].values
    close = df["close"].values
    tr = np.maximum(high[1:] - low[1:],
                    np.maximum(np.abs(high[1:] - close[:-1]),
                               np.abs(low[1:] - close[:-1])))
    if len(tr) < period:
        return None
    return float(np.mean(tr[-period:]))


def bollinger_width(closes, period=20, std=2):
    if len(closes) < period:
        return None
    arr = np.asarray(closes[-period:], dtype=float)
    sma = arr.mean()
    sd = arr.std(ddof=0)
    upper = sma + std * sd
    lower = sma - std * sd
    width = (upper - lower) / sma * 100  # percent
    return {
        "upper": float(upper),
        "lower": float(lower),
        "sma": float(sma),
        "width_pct": float(width),
    }


def vwap_anchored(df_1h):
    """VWAP anchored to start of current UTC day from 1h klines."""
    if df_1h is None or len(df_1h) == 0:
        return None
    today_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    df = df_1h[df_1h["open_time"] >= pd.Timestamp(today_utc)]
    if len(df) == 0:
        return None
    typical = (df["high"] + df["low"] + df["close"]) / 3
    vol = df["volume"]
    if vol.sum() == 0:
        return None
    return float((typical * vol).sum() / vol.sum())


def pivot_points(df_1d):
    """Classic floor pivots from yesterday's OHLC."""
    if df_1d is None or len(df_1d) < 2:
        return None
    y = df_1d.iloc[-2]  # yesterday
    high, low, close = float(y["high"]), float(y["low"]), float(y["close"])
    p = (high + low + close) / 3
    r1 = 2 * p - low
    s1 = 2 * p - high
    r2 = p + (high - low)
    s2 = p - (high - low)
    return {
        "pivot": float(p),
        "r1": float(r1), "r2": float(r2),
        "s1": float(s1), "s2": float(s2),
        "y_high": high, "y_low": low, "y_close": close,
    }


# ──────────────────────────────────────────
# Cached file loaders
# ──────────────────────────────────────────

def load_json_safe(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] could not read {path}: {e}", file=sys.stderr)
        return None


def whale_flow_6h(whale_data):
    """Extract BTC whale positioning from whale_data.json (v2 scanner output).
    Returns dict with long_usd / short_usd / net_usd / fill_count.
    Uses snapshot (current consensus), not 6h fills (we don't track those yet here).
    """
    if not whale_data:
        return None
    positioning = whale_data.get("positioning") or []
    btc = next((p for p in positioning if p.get("asset") == "BTC"), None)
    if not btc:
        return None
    long_usd = float(btc.get("smart_long_usd") or 0)
    short_usd = float(btc.get("smart_short_usd") or 0)
    long_count = int(btc.get("smart_long_count") or 0)
    short_count = int(btc.get("smart_short_count") or 0)
    if long_count == 0 and short_count == 0:
        return None
    return {
        "long_usd": long_usd,
        "short_usd": short_usd,
        "net_usd": long_usd - short_usd,
        "fill_count": long_count + short_count,
        "smart_long_pct": float(btc.get("smart_long_pct") or 50),
        "signal": btc.get("signal") or "NEUTRAL",
    }


# ──────────────────────────────────────────
# Score components (each returns -1..+1, neg = bearish, pos = bullish)
# ──────────────────────────────────────────

def score_rsi_multi_tf(rsi_15m, rsi_1h, rsi_4h, rsi_1d):
    """
    Weighted RSI bias.
    - Extreme OB (>75) → bearish (mean reversion)
    - Extreme OS (<25) → bullish (mean reversion)
    - 50-65 trending up → mild bullish
    - 35-50 trending down → mild bearish
    """
    weights = {"15m": 0.15, "1h": 0.35, "4h": 0.30, "1d": 0.20}
    vals = {"15m": rsi_15m, "1h": rsi_1h, "4h": rsi_4h, "1d": rsi_1d}
    total = 0.0
    used_w = 0.0
    for tf, v in vals.items():
        if v is None:
            continue
        w = weights[tf]
        if v >= 75:
            sub = -0.7  # overbought, mean reversion bias
        elif v <= 25:
            sub = 0.7
        elif v >= 60:
            sub = (v - 60) / 15 * -0.3  # mild bearish above 60
        elif v <= 40:
            sub = (40 - v) / 15 * 0.3   # mild bullish below 40
        else:
            sub = 0.0
        total += w * sub
        used_w += w
    return total / used_w if used_w > 0 else 0.0


def score_macd(macd_data):
    if not macd_data:
        return 0.0
    hist = macd_data["hist"]
    hist_prev = macd_data["hist_prev"]
    direction = 1 if hist > hist_prev else -1 if hist < hist_prev else 0
    base = 1 if hist > 0 else -1 if hist < 0 else 0
    # base sign weighted 0.6, momentum 0.4
    return base * 0.6 + direction * 0.4 if base or direction else 0.0


def score_price_vs_vwap(price, vwap):
    if vwap is None or price is None:
        return 0.0
    diff_pct = (price - vwap) / vwap * 100
    # ±0.5% = ±0.5 score
    return max(-1.0, min(1.0, diff_pct))


def score_price_vs_pivots(price, pivots):
    if not pivots or price is None:
        return 0.0
    p = pivots["pivot"]
    r1, s1 = pivots["r1"], pivots["s1"]
    if price > r1:
        return 0.6  # above R1 = bullish breakout
    if price < s1:
        return -0.6
    # within range, normalize to [-0.4, 0.4]
    return max(-0.4, min(0.4, (price - p) / max(r1 - p, p - s1) * 0.4))


def score_funding(funding_pct):
    """
    Extreme positive funding → contrarian bearish (long squeeze risk).
    Extreme negative funding → contrarian bullish (short squeeze fuel).
    """
    if funding_pct is None:
        return 0.0
    # funding_pct is per-8h in percent units (e.g. 0.01 = 0.01%/8h)
    if funding_pct > 0.05:
        return -0.7
    if funding_pct < -0.03:
        return 0.6
    if funding_pct > 0.02:
        return -0.3
    if funding_pct < -0.01:
        return 0.3
    return 0.0


def score_oi_delta(oi_history, price_change_pct):
    """
    OI rising + price up = trend confirmation (bullish)
    OI rising + price flat/down = positioning, vol incoming
    OI falling = unwinding
    """
    if not oi_history or len(oi_history) < 12:
        return 0.0
    recent = oi_history[-1]["oi"]
    prior = oi_history[-12]["oi"]
    if prior == 0:
        return 0.0
    delta_pct = (recent - prior) / prior * 100
    if delta_pct > 5 and price_change_pct > 0.5:
        return 0.5
    if delta_pct > 5 and price_change_pct < -0.5:
        return -0.5
    if delta_pct < -5:
        return -0.2
    return 0.0


def score_ls_ratio(global_ls, top_trader_ls):
    """
    Retail vs smart money divergence.
    Smart money long + retail short = bullish.
    Smart money short + retail long = bearish.
    """
    if not global_ls or not top_trader_ls:
        return 0.0
    retail_long = global_ls["long_pct"]
    smart_long = top_trader_ls["long_pct"]
    diff = smart_long - retail_long
    # diff > 5pp → smart more bullish than retail
    return max(-1.0, min(1.0, diff / 20))


def score_taker(taker_ratio):
    if not taker_ratio:
        return 0.0
    r = taker_ratio["ratio"]
    if r > 1.15:
        return 0.4
    if r < 0.87:
        return -0.4
    if r > 1.05:
        return 0.2
    if r < 0.95:
        return -0.2
    return 0.0


def score_whale_flow(flow):
    if not flow or flow["fill_count"] == 0:
        return 0.0
    net = flow["net_usd"]
    total = flow["long_usd"] + flow["short_usd"]
    if total == 0:
        return 0.0
    # net/total in [-1, 1] but scale down to ±0.6 max
    return max(-0.6, min(0.6, net / total))


def score_macro(risk_v2):
    """One score from V2. Maps V2 score (0-100) to [-1, +1]."""
    if not risk_v2:
        return 0.0
    s = risk_v2.get("score", 50)
    # >70 = bullish backdrop (low risk = good for swing longs)
    # <30 = bearish backdrop (high risk = caution)
    return max(-1.0, min(1.0, (s - 50) / 30))


# ──────────────────────────────────────────
# Setup checklists
# ──────────────────────────────────────────

def long_setup(state):
    conditions = [
        ("Macro suportă (Risk Score > 50)", state.get("risk_v2_score", 50) > 50),
        ("RSI 1h sub 65 (nu overbought)", state.get("rsi_1h") is not None and state["rsi_1h"] < 65),
        ("Preț peste VWAP zilnic", state.get("price") is not None and state.get("vwap") is not None and state["price"] > state["vwap"]),
        ("Funding nu e extrem long", state.get("funding_pct") is not None and state["funding_pct"] < 0.04),
        ("Whale flow 6h NET pozitiv sau neutru", state.get("whale_net_usd", 0) >= 0),
    ]
    met = sum(1 for _, ok in conditions if ok)
    return {"conditions": [{"text": t, "met": bool(ok)} for t, ok in conditions], "met": met, "total": len(conditions)}


def short_setup(state):
    conditions = [
        ("Macro fragil (Risk Score < 50)", state.get("risk_v2_score", 50) < 50),
        ("RSI 1h peste 60 (overbought)", state.get("rsi_1h") is not None and state["rsi_1h"] > 60),
        ("Preț sub VWAP zilnic", state.get("price") is not None and state.get("vwap") is not None and state["price"] < state["vwap"]),
        ("Funding extrem long (long squeeze setup)", state.get("funding_pct") is not None and state["funding_pct"] > 0.04),
        ("Whale flow 6h NET negativ", state.get("whale_net_usd", 0) < 0),
    ]
    met = sum(1 for _, ok in conditions if ok)
    return {"conditions": [{"text": t, "met": bool(ok)} for t, ok in conditions], "met": met, "total": len(conditions)}


def squeeze_setup(state):
    bb_w = state.get("bb_width_pct")
    funding = state.get("funding_pct")
    oi_change = state.get("oi_delta_pct", 0)
    conditions = [
        ("Bollinger Bands strânse (BB width < 2%)", bb_w is not None and bb_w < 2.0),
        ("Funding extrem (>0.04% sau <-0.03%)", funding is not None and (funding > 0.04 or funding < -0.03)),
        ("OI în creștere (>3% în 12h)", oi_change > 3),
    ]
    met = sum(1 for _, ok in conditions if ok)
    return {"conditions": [{"text": t, "met": bool(ok)} for t, ok in conditions], "met": met, "total": len(conditions)}


# ──────────────────────────────────────────
# Volatility regime + alerts
# ──────────────────────────────────────────

def volatility_regime(atr_1h, price):
    if atr_1h is None or price is None or price == 0:
        return {"label": "necunoscut", "atr_pct": None, "level": "unknown"}
    atr_pct = atr_1h / price * 100
    if atr_pct > 1.2:
        return {"label": "ridicată", "atr_pct": atr_pct, "level": "high"}
    if atr_pct > 0.6:
        return {"label": "normală", "atr_pct": atr_pct, "level": "normal"}
    return {"label": "scăzută", "atr_pct": atr_pct, "level": "low"}


def session_info(now_utc):
    """Identify active session + minutes to next."""
    h = now_utc.hour
    minute = now_utc.minute
    sessions = [
        ("Asia", 0, 8),
        ("EU", 7, 16),
        ("US", 13, 21),
    ]
    active = [name for name, start, end in sessions if start <= h < end]
    label = " + ".join(active) if active else "off-hours"
    # Compute minutes to next session start
    next_starts = []
    for name, start, end in sessions:
        delta_h = (start - h) % 24
        if delta_h == 0 and minute > 0:
            delta_h = 24
        next_starts.append((delta_h * 60 - minute, name))
    next_starts.sort()
    next_min, next_name = next_starts[0]
    return {
        "active": label,
        "next": next_name,
        "minutes_to_next": next_min,
    }


def build_alerts(state, vol_regime, session, funding_pct):
    alerts = []
    if vol_regime["level"] == "high":
        alerts.append({"text": f"Volatilitate ridicată (ATR {vol_regime['atr_pct']:.2f}%) — stop loss strâns", "severity": "amber"})
    if funding_pct is not None and funding_pct > 0.05:
        alerts.append({"text": "Funding extrem long — risc de long squeeze", "severity": "red"})
    elif funding_pct is not None and funding_pct < -0.03:
        alerts.append({"text": "Funding negativ — combustibil pentru short squeeze", "severity": "amber"})
    if state.get("bb_width_pct") is not None and state["bb_width_pct"] < 1.5:
        alerts.append({"text": "Bollinger Bands strânse — mișcare iminentă (direcție necunoscută)", "severity": "amber"})
    if session["minutes_to_next"] <= 30 and session["minutes_to_next"] > 0:
        alerts.append({"text": f"Deschidere {session['next']} în {session['minutes_to_next']}min — volatilitate crescută probabilă", "severity": "amber"})
    rsi_1h = state.get("rsi_1h")
    if rsi_1h is not None:
        if rsi_1h > 75:
            alerts.append({"text": f"RSI 1h overbought ({rsi_1h:.0f}) — atenție la pullback", "severity": "amber"})
        elif rsi_1h < 25:
            alerts.append({"text": f"RSI 1h oversold ({rsi_1h:.0f}) — bounce posibil", "severity": "green"})
    return alerts


# ──────────────────────────────────────────
# Main pipeline
# ──────────────────────────────────────────

def main():
    print(f"[INFO] Intraday Signal v1.0 — {datetime.now(timezone.utc).isoformat()}")

    # 1. Fetch all market data
    df_15m = fetch_klines("15m", limit=100)
    time.sleep(0.3)
    df_1h = fetch_klines("1h", limit=200)
    time.sleep(0.3)
    df_4h = fetch_klines("4h", limit=100)
    time.sleep(0.3)
    df_1d = fetch_klines("1d", limit=30)
    time.sleep(0.3)
    funding_hist = fetch_funding_history(24)
    time.sleep(0.3)
    oi_hist = fetch_open_interest_history()
    time.sleep(0.3)
    top_ls = fetch_top_trader_ratio()
    time.sleep(0.3)
    global_ls = fetch_global_ls_ratio()
    time.sleep(0.3)
    taker = fetch_taker_ratio()
    time.sleep(0.3)
    spot = fetch_spot_price()

    risk_v2 = load_json_safe(RISK_SCORE_FILE)
    env = load_env()

    # 2. Compute indicators
    rsi_15m = rsi(df_15m["close"].values) if df_15m is not None else None
    rsi_1h_val = rsi(df_1h["close"].values) if df_1h is not None else None
    rsi_4h = rsi(df_4h["close"].values) if df_4h is not None else None
    rsi_1d = rsi(df_1d["close"].values) if df_1d is not None and len(df_1d) >= 15 else None

    macd_1h = macd(df_1h["close"].values.tolist()) if df_1h is not None else None
    atr_1h = atr(df_1h, period=14) if df_1h is not None else None
    bb_1h = bollinger_width(df_1h["close"].values.tolist()) if df_1h is not None else None
    vwap = vwap_anchored(df_1h)
    pivots = pivot_points(df_1d)

    price = spot["price"] if spot else (float(df_1h["close"].iloc[-1]) if df_1h is not None else None)
    change_24h = spot["change_pct"] if spot else 0.0

    funding_now = funding_hist[-1]["rate"] * 100 if funding_hist else None
    oi_delta_pct = 0.0
    if oi_hist and len(oi_hist) >= 12:
        oi_delta_pct = (oi_hist[-1]["oi"] - oi_hist[-12]["oi"]) / oi_hist[-12]["oi"] * 100

    whale_flow = whale_flow_btc_supabase(env)

    # 3. Build component scores
    state = {
        "price": price,
        "vwap": vwap,
        "rsi_15m": rsi_15m,
        "rsi_1h": rsi_1h_val,
        "rsi_4h": rsi_4h,
        "rsi_1d": rsi_1d,
        "bb_width_pct": bb_1h["width_pct"] if bb_1h else None,
        "funding_pct": funding_now,
        "oi_delta_pct": oi_delta_pct,
        "whale_net_usd": whale_flow["net_usd"] if whale_flow else 0,
        "risk_v2_score": risk_v2.get("score", 50) if risk_v2 else 50,
    }

    components = {
        "rsi_multi_tf":   {"raw": score_rsi_multi_tf(rsi_15m, rsi_1h_val, rsi_4h, rsi_1d), "weight": 0.18},
        "macd_1h":        {"raw": score_macd(macd_1h), "weight": 0.10},
        "vwap":           {"raw": score_price_vs_vwap(price, vwap), "weight": 0.10},
        "pivots":         {"raw": score_price_vs_pivots(price, pivots), "weight": 0.07},
        "funding":        {"raw": score_funding(funding_now), "weight": 0.12},
        "oi_delta":       {"raw": score_oi_delta(oi_hist, change_24h), "weight": 0.07},
        "ls_divergence":  {"raw": score_ls_ratio(global_ls, top_ls), "weight": 0.08},
        "taker":          {"raw": score_taker(taker), "weight": 0.08},
        "whale_flow":     {"raw": score_whale_flow(whale_flow), "weight": 0.10},
        "macro_context":  {"raw": score_macro(risk_v2), "weight": 0.10},
    }

    # 4. Aggregate to 0-100 score (50 = neutru)
    total_score = 0.0
    total_weight = 0.0
    for name, c in components.items():
        if c["raw"] is None:
            continue
        total_score += c["raw"] * c["weight"]
        total_weight += c["weight"]

    if total_weight == 0:
        score_0_100 = 50
    else:
        normalized = total_score / total_weight  # in [-1, +1]
        score_0_100 = round(50 + normalized * 50)
        score_0_100 = max(0, min(100, score_0_100))

    # 5. Direction bias verdict
    if score_0_100 >= 65:
        bias = "LONG"
        bias_text = "Condiții favorabile pentru long intraday"
    elif score_0_100 <= 35:
        bias = "SHORT"
        bias_text = "Condiții favorabile pentru short intraday"
    else:
        bias = "NEUTRU"
        bias_text = "Fără edge clar — așteaptă setup mai curat"

    # Conviction from agreement of components
    signs = [1 if c["raw"] > 0.1 else -1 if c["raw"] < -0.1 else 0
             for c in components.values() if c["raw"] is not None]
    if not signs:
        conviction = "LOW"
    else:
        majority = max(signs.count(1), signs.count(-1))
        agreement = majority / len(signs)
        if agreement >= 0.7 and abs(score_0_100 - 50) >= 20:
            conviction = "HIGH"
        elif agreement >= 0.55 and abs(score_0_100 - 50) >= 12:
            conviction = "MEDIUM"
        else:
            conviction = "LOW"

    # 6. Setups
    setups = {
        "long": long_setup(state),
        "short": short_setup(state),
        "squeeze": squeeze_setup(state),
    }

    # 7. Volatility + session + alerts
    vol = volatility_regime(atr_1h, price)
    sess = session_info(datetime.now(timezone.utc))
    alerts = build_alerts(state, vol, sess, funding_now)

    # 8. Build output
    output = {
        "version": "1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "btc_price": price,
        "btc_change_24h": change_24h,
        "btc_high_24h": spot["high_24h"] if spot else None,
        "btc_low_24h": spot["low_24h"] if spot else None,
        "btc_volume_24h_usd": spot["quote_volume"] if spot else None,
        "score": score_0_100,
        "bias": bias,
        "bias_text": bias_text,
        "conviction": conviction,
        "components": {
            name: {
                "raw": round(c["raw"], 3) if c["raw"] is not None else None,
                "weight": c["weight"],
                "contribution": round(c["raw"] * c["weight"], 3) if c["raw"] is not None else None,
            } for name, c in components.items()
        },
        "indicators": {
            "rsi_15m": round(rsi_15m, 1) if rsi_15m else None,
            "rsi_1h": round(rsi_1h_val, 1) if rsi_1h_val else None,
            "rsi_4h": round(rsi_4h, 1) if rsi_4h else None,
            "rsi_1d": round(rsi_1d, 1) if rsi_1d else None,
            "macd_1h": macd_1h,
            "atr_1h": atr_1h,
            "bb_1h": bb_1h,
            "vwap": vwap,
            "pivots": pivots,
        },
        "crowd": {
            "funding_pct": funding_now,
            "funding_8h_avg": round(np.mean([f["rate"] for f in funding_hist[-3:]]) * 100, 5) if funding_hist else None,
            "oi_value_usd": oi_hist[-1]["oi"] if oi_hist else None,
            "oi_delta_pct_12h": round(oi_delta_pct, 2),
            "global_ls": global_ls,
            "top_trader_ls": top_ls,
            "taker_ratio": taker,
        },
        "whale_flow_6h": whale_flow,
        "macro_context": {
            "risk_v2_score": risk_v2.get("score") if risk_v2 else None,
            "risk_v2_decision": risk_v2.get("decision") if risk_v2 else None,
            "risk_v2_conviction": risk_v2.get("conviction") if risk_v2 else None,
        },
        "volatility": vol,
        "session": sess,
        "setups": setups,
        "alerts": alerts,
    }

    OUTPUT_FILE.write_text(json.dumps(output, indent=2, default=str))
    print(f"[INFO] Score: {score_0_100}/100  Bias: {bias}  Conviction: {conviction}")
    print(f"[INFO] Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
