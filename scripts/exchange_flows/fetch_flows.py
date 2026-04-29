#!/usr/bin/env python3
"""
Fetch BTC perp metrics from 5 exchanges → exchange_flows table.

For each exchange we collect for the last completed hour:
  - volume_usd: notional traded (USD)
  - oi_usd: current open interest (USD)
  - funding_pct: most recent funding rate
  - price_close: 1h close

Schedule: every 15 min. Writes upsert on (ts, asset, exchange).
Crontab line:
  */15 * * * * cd /Users/server/elite_platform && /Library/Developer/CommandLineTools/usr/bin/python3 scripts/exchange_flows/fetch_flows.py >> scripts/exchange_flows/logs/fetch_flows.log 2>&1
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(_HERE, "..", "whale_tracker")))
from config import SUPABASE_URL, SUPABASE_KEY  # noqa: E402

ASSET = "BTC"
TIMEOUT = 10


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "EliteFlows/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode())


def http_post_json(url, payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "EliteFlows/1.0"},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode())


# ────────────────── per-exchange fetchers ──────────────────

def fetch_binance():
    """fapi.binance.com — 1h kline + openInterest + premiumIndex."""
    klines = http_get(
        "https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=2"
    )
    # Use the last *closed* candle (index -2)
    k = klines[-2]
    ts_ms = int(k[0])
    close = float(k[4])
    quote_volume = float(k[7])  # quote asset volume = USDT notional

    oi_data = http_get("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT")
    oi_btc = float(oi_data["openInterest"])
    oi_usd = oi_btc * close

    funding_data = http_get("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT")
    funding_pct = float(funding_data["lastFundingRate"]) * 100

    return {
        "ts_ms": ts_ms, "exchange": "binance",
        "volume_usd": quote_volume, "oi_usd": oi_usd,
        "funding_pct": funding_pct, "price_close": close,
    }


def fetch_bybit():
    """api.bybit.com v5 linear — kline + open-interest + tickers."""
    kline_resp = http_get(
        "https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=60&limit=2"
    )
    rows = kline_resp["result"]["list"]
    # Bybit returns newest-first; row format: [start, open, high, low, close, volume, turnover]
    k = rows[1]  # index 1 = previous (closed) hour
    ts_ms = int(k[0])
    close = float(k[4])
    turnover = float(k[6])  # USDT notional

    oi_resp = http_get(
        "https://api.bybit.com/v5/market/open-interest?category=linear&symbol=BTCUSDT&intervalTime=1h&limit=1"
    )
    oi_list = oi_resp["result"]["list"]
    oi_contract = float(oi_list[0]["openInterest"]) if oi_list else 0
    # Linear BTCUSDT: 1 contract = 1 BTC
    oi_usd = oi_contract * close

    tick_resp = http_get(
        "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT"
    )
    tick = tick_resp["result"]["list"][0]
    funding_pct = float(tick.get("fundingRate", 0)) * 100

    return {
        "ts_ms": ts_ms, "exchange": "bybit",
        "volume_usd": turnover, "oi_usd": oi_usd,
        "funding_pct": funding_pct, "price_close": close,
    }


def fetch_okx():
    """www.okx.com v5 — candles + open-interest + funding-rate."""
    cand = http_get(
        "https://www.okx.com/api/v5/market/candles?instId=BTC-USDT-SWAP&bar=1H&limit=2"
    )
    # Newest-first; index 1 = previous closed hour
    # Row: [ts, o, h, l, c, vol(contracts), volCcy(BTC), volCcyQuote(USD), confirm]
    row = cand["data"][1]
    ts_ms = int(row[0])
    close = float(row[4])
    volume_usd = float(row[7])

    oi = http_get("https://www.okx.com/api/v5/public/open-interest?instId=BTC-USDT-SWAP")
    oi_row = oi["data"][0]
    oi_usd = float(oi_row.get("oiUsd", 0)) or float(oi_row.get("oiCcy", 0)) * close

    fr = http_get("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP")
    funding_pct = float(fr["data"][0]["fundingRate"]) * 100

    return {
        "ts_ms": ts_ms, "exchange": "okx",
        "volume_usd": volume_usd, "oi_usd": oi_usd,
        "funding_pct": funding_pct, "price_close": close,
    }


def fetch_bitget():
    """api.bitget.com v2 mix — candles + open-interest + current-fund-rate."""
    cand = http_get(
        "https://api.bitget.com/api/v2/mix/market/candles?symbol=BTCUSDT&productType=USDT-FUTURES&granularity=1H&limit=2"
    )
    # Oldest-first; row: [ts, o, h, l, c, vol(BTC), turnover(USDT)]
    rows = cand["data"]
    row = rows[-2]  # last closed
    ts_ms = int(row[0])
    close = float(row[4])
    turnover = float(row[6])

    oi = http_get(
        "https://api.bitget.com/api/v2/mix/market/open-interest?symbol=BTCUSDT&productType=USDT-FUTURES"
    )
    oi_amount = float(oi["data"]["openInterestList"][0]["size"])
    oi_usd = oi_amount * close

    fr = http_get(
        "https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=BTCUSDT&productType=USDT-FUTURES"
    )
    funding_pct = float(fr["data"][0]["fundingRate"]) * 100

    return {
        "ts_ms": ts_ms, "exchange": "bitget",
        "volume_usd": turnover, "oi_usd": oi_usd,
        "funding_pct": funding_pct, "price_close": close,
    }


def fetch_hyperliquid():
    """api.hyperliquid.xyz — metaAndAssetCtxs gives OI/funding/24h vol; no per-hour split."""
    data = http_post_json("https://api.hyperliquid.xyz/info", {"type": "metaAndAssetCtxs"})
    universe, ctxs = data[0]["universe"], data[1]
    btc_idx = next(i for i, u in enumerate(universe) if u["name"] == "BTC")
    ctx = ctxs[btc_idx]

    close = float(ctx["markPx"])
    oi_btc = float(ctx["openInterest"])
    oi_usd = oi_btc * close
    # dayNtlVlm = 24h notional. Approximate hourly = /24
    volume_usd = float(ctx["dayNtlVlm"]) / 24.0
    funding_pct = float(ctx["funding"]) * 100

    # HL funding is hourly (not 8h); use the previous hour bucket
    now_ms = int(time.time() * 1000)
    ts_ms = (now_ms // 3_600_000 - 1) * 3_600_000

    return {
        "ts_ms": ts_ms, "exchange": "hyperliquid",
        "volume_usd": volume_usd, "oi_usd": oi_usd,
        "funding_pct": funding_pct, "price_close": close,
    }


FETCHERS = [
    ("binance", fetch_binance),
    ("bybit", fetch_bybit),
    ("okx", fetch_okx),
    ("bitget", fetch_bitget),
    ("hyperliquid", fetch_hyperliquid),
]


# ────────────────── supabase upsert ──────────────────

def upsert_flows(rows):
    if not rows:
        return
    url = (
        f"{SUPABASE_URL}/rest/v1/exchange_flows"
        f"?on_conflict=ts,asset,exchange"
    )
    payload = json.dumps(rows).encode()
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            log(f"  upsert OK ({resp.status}) — {len(rows)} rows")
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        log(f"  upsert FAILED {e.code}: {body[:300]}")
    except Exception as e:
        log(f"  upsert error: {e}")


def to_iso(ts_ms):
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log("ERROR: missing Supabase credentials")
        return 1

    rows = []
    for name, fn in FETCHERS:
        try:
            r = fn()
            rows.append({
                "ts": to_iso(r["ts_ms"]),
                "asset": ASSET,
                "exchange": r["exchange"],
                "volume_usd": round(r["volume_usd"], 2),
                "oi_usd": round(r["oi_usd"], 2),
                "funding_pct": round(r["funding_pct"], 6),
                "price_close": round(r["price_close"], 2),
            })
            log(
                f"{name}: vol=${r['volume_usd']/1e6:.1f}M "
                f"oi=${r['oi_usd']/1e9:.2f}B fund={r['funding_pct']:+.4f}% "
                f"@ ${r['price_close']:,.0f}"
            )
        except Exception as e:
            log(f"{name}: FAILED {e}")
        time.sleep(0.2)

    upsert_flows(rows)
    log(f"done. wrote {len(rows)}/5 exchanges")
    return 0


if __name__ == "__main__":
    sys.exit(main())
