#!/usr/bin/env python3
"""
Risk Score V2 - Bitcoin Investment Risk Assessment
Independent script that calculates a comprehensive risk score for BTC.

Sources (all free, no API keys needed):
- bitcoin-data.com: MVRV Z-Score, SOPR, NUPL, Puell Multiple, Realized Price
- alternative.me: Fear & Greed Index
- CoinGecko: BTC price, market cap, dominance
- FRED (via proxy): Fed Funds Rate, M2, CPI, DXY

Indicators used by hedge funds and professional traders:
1. MVRV Z-Score - Market Value vs Realized Value
2. SOPR - Spent Output Profit Ratio
3. NUPL - Net Unrealized Profit/Loss
4. Puell Multiple - Miner profitability
5. Realized Price vs Market Price
6. Fear & Greed Index
7. Pi Cycle Top (111DMA vs 350DMAx2)
8. Mayer Multiple (Price / 200DMA)
9. RSI Weekly
10. Halving Cycle Position
11. Drawdown from ATH
12. Supply on Exchanges (est. from derivatives)

Output: JSON file at scripts/v2/risk_score_v2.json
"""

import json
import math
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "risk_score_v2.json"

# ──────────────────────────────────────────
# Data fetchers
# ──────────────────────────────────────────

def fetch_json(url, timeout=15):
    """Fetch JSON from URL."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "RiskScoreV2/1.0"})
        resp = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(resp.read())
    except Exception as e:
        print(f"[WARN] Failed to fetch {url}: {e}")
        return None


def get_btc_price():
    """Get BTC price, market cap, 24h change from CoinGecko."""
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
    """Get global crypto market data from CoinGecko."""
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
    """Get Fear & Greed Index from alternative.me."""
    data = fetch_json("https://api.alternative.me/fng/?limit=1")
    if not data or "data" not in data or not data["data"]:
        return None
    fg = data["data"][0]
    return {
        "value": int(fg.get("value", 50)),
        "label": fg.get("value_classification", "Unknown"),
    }


def get_onchain_latest(metric):
    """Get latest value from bitcoin-data.com."""
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data or len(data) == 0:
        return None
    return data[-1]


def get_onchain_history(metric, days=365):
    """Get historical values from bitcoin-data.com."""
    data = fetch_json(f"https://bitcoin-data.com/v1/{metric}")
    if not data:
        return []
    # Return last N days
    return data[-days:] if len(data) > days else data


# ──────────────────────────────────────────
# Indicator calculations
# ──────────────────────────────────────────

# Bitcoin ATH and Halving dates
BTC_ATH = 126208.5
BTC_ATH_DATE = datetime(2025, 10, 6, tzinfo=timezone.utc)
HALVING_DATE = datetime(2024, 4, 20, tzinfo=timezone.utc)
NEXT_HALVING_EST = datetime(2028, 4, 20, tzinfo=timezone.utc)


def normalize(value, low, high, invert=False):
    """Normalize value to 0-1 range. Higher = more bullish (better to buy)."""
    if high == low:
        return 0.5
    norm = max(0, min(1, (value - low) / (high - low)))
    return 1 - norm if invert else norm


def calc_mvrv_score(mvrv_z):
    """MVRV Z-Score: < 0 = extreme buy, > 7 = extreme sell."""
    if mvrv_z is None:
        return None
    z = float(mvrv_z)
    # Invert: low MVRV = good to buy (high score)
    return {
        "raw": round(z, 3),
        "norm": round(normalize(z, -0.5, 7, invert=True), 3),
        "weight": 0.12,
        "signal": "CUMPARA" if z < 1 else "VINDE" if z > 5 else "NEUTRU",
        "explanation": f"Z-Score la {z:.2f}. Sub 1 = zona de acumulare. Peste 5 = piata supraincalzita.",
    }


def calc_sopr_score(sopr_val):
    """SOPR: < 1 = holders selling at loss (capitulation), > 1 = profit taking."""
    if sopr_val is None:
        return None
    s = float(sopr_val)
    return {
        "raw": round(s, 4),
        "norm": round(normalize(s, 0.9, 1.05, invert=True), 3),
        "weight": 0.08,
        "signal": "CUMPARA" if s < 0.98 else "VINDE" if s > 1.05 else "NEUTRU",
        "explanation": f"SOPR la {s:.4f}. Sub 1 = holderii vand in pierdere (capitulare). Peste 1.05 = profit taking.",
    }


def calc_nupl_score(nupl_val):
    """NUPL: < 0 = capitulation, 0-0.25 = hope, 0.25-0.5 = optimism, > 0.75 = euphoria."""
    if nupl_val is None:
        return None
    n = float(nupl_val)
    phases = {
        (-1, 0): "Capitulare",
        (0, 0.25): "Speranta",
        (0.25, 0.5): "Optimism",
        (0.5, 0.75): "Incredere",
        (0.75, 1): "Euforie",
    }
    phase = "Necunoscut"
    for (lo, hi), name in phases.items():
        if lo <= n < hi:
            phase = name
            break
    return {
        "raw": round(n, 4),
        "norm": round(normalize(n, -0.2, 0.75, invert=True), 3),
        "weight": 0.10,
        "signal": "CUMPARA" if n < 0.15 else "VINDE" if n > 0.7 else "NEUTRU",
        "phase": phase,
        "explanation": f"NUPL la {n:.3f} - faza: {phase}. Sub 0 = capitulare (cel mai bun moment de cumparare istoric).",
    }


def calc_puell_score(puell_val):
    """Puell Multiple: < 0.5 = miners capitulating, > 4 = miners dumping."""
    if puell_val is None:
        return None
    p = float(puell_val)
    return {
        "raw": round(p, 3),
        "norm": round(normalize(p, 0.3, 4, invert=True), 3),
        "weight": 0.06,
        "signal": "CUMPARA" if p < 0.5 else "VINDE" if p > 4 else "NEUTRU",
        "explanation": f"Puell la {p:.3f}. Sub 0.5 = minerii sunt in pierdere (bottom de ciclu). Peste 4 = top de ciclu.",
    }


def calc_fear_greed_score(fg):
    """Fear & Greed: 0-25 = extreme fear (buy), 75-100 = extreme greed (sell)."""
    if fg is None:
        return None
    v = fg["value"]
    return {
        "raw": v,
        "norm": round(normalize(v, 0, 100, invert=True), 3),
        "weight": 0.06,
        "signal": "CUMPARA" if v < 20 else "VINDE" if v > 80 else "NEUTRU",
        "label": fg["label"],
        "explanation": f"Indicele la {v} ({fg['label']}). Frica extrema = oportunitate contrarian de cumparare.",
    }


def calc_drawdown_score(price, ath=BTC_ATH):
    """Drawdown from ATH: bigger drawdown = better buy opportunity."""
    if price is None:
        return None
    dd = ((price - ath) / ath) * 100
    return {
        "raw": round(dd, 2),
        "norm": round(normalize(abs(dd), 0, 80), 3),  # bigger drawdown = higher score
        "weight": 0.08,
        "signal": "CUMPARA" if dd < -50 else "VINDE" if dd > -10 else "NEUTRU",
        "explanation": f"BTC la {dd:.1f}% de la ATH (${ath:,.0f}). Drawdown-uri mari = oportunitati istorice.",
    }


def calc_halving_score():
    """Halving cycle position."""
    now = datetime.now(timezone.utc)
    days_since = (now - HALVING_DATE).days
    days_to_next = (NEXT_HALVING_EST - now).days

    # Historical: bottom ~370 days after peak, peak ~494 days after halving
    # Best buying: 200-400 days after peak, or 550-900 days after halving
    if days_since < 200:
        phase = "Post-halving early"
        norm = 0.3
    elif days_since < 500:
        phase = "Rally zone"
        norm = 0.2  # risky - near top
    elif days_since < 800:
        phase = "Corectie / Acumulare"
        norm = 0.7  # good buying
    else:
        phase = "Late bear / Early recovery"
        norm = 0.9  # best buying

    return {
        "days_since_halving": days_since,
        "days_to_next_halving": max(0, days_to_next),
        "norm": norm,
        "weight": 0.08,
        "phase": phase,
        "signal": "CUMPARA" if norm > 0.6 else "VINDE" if norm < 0.3 else "NEUTRU",
        "explanation": f"{days_since} zile de la halving. Faza: {phase}. Urmatorul halving in ~{days_to_next} zile.",
    }


def calc_realized_price_score(price, realized_price):
    """Price vs Realized Price: below realized = extreme buy."""
    if price is None or realized_price is None:
        return None
    rp = float(realized_price)
    ratio = price / rp if rp > 0 else 1
    return {
        "raw": round(rp, 0),
        "ratio": round(ratio, 3),
        "norm": round(normalize(ratio, 0.8, 3.5, invert=True), 3),
        "weight": 0.10,
        "signal": "CUMPARA" if ratio < 1.2 else "VINDE" if ratio > 3 else "NEUTRU",
        "explanation": f"Pret actual / Pret realizat = {ratio:.2f}x. Sub 1 = sub costul mediu al retelei (extrem de rar).",
    }


def calc_days_from_peak_score():
    """Days from ATH - historical bottom timing."""
    now = datetime.now(timezone.utc)
    days = (now - BTC_ATH_DATE).days

    # Historical: bottoms at 365-400 days from peak
    # 2017 peak -> 2018 bottom: ~365 days
    # 2021 peak -> 2022 bottom: ~365 days
    if days < 180:
        norm = 0.3  # too early
    elif days < 300:
        norm = 0.6  # approaching bottom window
    elif days < 450:
        norm = 0.9  # in the bottom window
    else:
        norm = 0.7  # possibly past bottom

    return {
        "days_from_peak": days,
        "norm": norm,
        "weight": 0.08,
        "signal": "CUMPARA" if norm > 0.6 else "NEUTRU",
        "explanation": f"{days} zile de la ATH. Istoric: bottom-ul vine la ~365 zile dupa peak.",
    }


# ──────────────────────────────────────────
# Macro data
# ──────────────────────────────────────────

def get_derivatives_data():
    """Get derivatives data from Binance Futures API (free, no key)."""
    deriv = {
        "funding_rate": 0, "funding_pct": 0,
        "oi_value": 0, "oi_delta_pct": 0,
        "ls_ratio": 1, "long_pct": 50, "short_pct": 50,
        "taker_buy_vol": 0, "taker_sell_vol": 0, "taker_ratio": 1,
        "basis_pct": 0, "spot_price": 0, "futures_price": 0,
    }

    try:
        # Funding rate
        fr = fetch_json("https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1")
        if fr and len(fr) > 0:
            rate = float(fr[0].get("fundingRate", 0))
            deriv["funding_rate"] = rate
            deriv["funding_pct"] = round(rate * 100, 6)
            deriv["futures_price"] = float(fr[0].get("markPrice", 0))
    except:
        pass

    try:
        # Open interest
        oi = fetch_json("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT")
        if oi:
            oi_btc = float(oi.get("openInterest", 0))
            price = deriv["futures_price"] or 70000
            deriv["oi_value"] = round(oi_btc * price, 2)
    except:
        pass

    try:
        # Long/Short ratio
        ls = fetch_json("https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1")
        if ls and len(ls) > 0:
            long_pct = float(ls[0].get("longAccount", 0.5))
            short_pct = float(ls[0].get("shortAccount", 0.5))
            ratio = float(ls[0].get("longShortRatio", 1))
            deriv["long_pct"] = round(long_pct * 100, 2)
            deriv["short_pct"] = round(short_pct * 100, 2)
            deriv["ls_ratio"] = round(ratio, 4)
    except:
        pass

    try:
        # Taker buy/sell
        ts = fetch_json("https://fapi.binance.com/futures/data/takerlongshortRatio?symbol=BTCUSDT&period=1h&limit=1")
        if ts and len(ts) > 0:
            buy_vol = float(ts[0].get("buyVol", 0))
            sell_vol = float(ts[0].get("sellVol", 0))
            deriv["taker_buy_vol"] = round(buy_vol, 2)
            deriv["taker_sell_vol"] = round(sell_vol, 2)
            deriv["taker_ratio"] = round(buy_vol / sell_vol, 4) if sell_vol > 0 else 1
    except:
        pass

    try:
        # Spot price for basis calculation
        spot = fetch_json("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
        if spot:
            spot_price = float(spot.get("price", 0))
            deriv["spot_price"] = spot_price
            if spot_price > 0 and deriv["futures_price"] > 0:
                deriv["basis_pct"] = round(((deriv["futures_price"] - spot_price) / spot_price) * 100, 4)
    except:
        pass

    return deriv


# ──────────────────────────────────────────
# Main score calculation
# ──────────────────────────────────────────

def calculate_risk_score():
    """Calculate comprehensive BTC risk score."""
    print("[INFO] Risk Score V2 - Starting calculation...")

    # Fetch all data
    btc = get_btc_price()
    if not btc:
        print("[ERROR] Could not fetch BTC price")
        return None

    price = btc["price"]
    print(f"[INFO] BTC Price: ${price:,.2f}")

    global_data = get_global_crypto()
    fg = get_fear_greed()

    # Derivatives from Binance
    print("[INFO] Fetching derivatives data from Binance...")
    derivatives = get_derivatives_data()
    print(f"[INFO] Derivatives: Funding={derivatives['funding_pct']:.4f}%, L/S={derivatives['ls_ratio']:.2f}, OI=${derivatives['oi_value']/1e9:.2f}B")

    # On-chain data
    mvrv_data = get_onchain_latest("mvrv-zscore")
    sopr_data = get_onchain_latest("sopr")
    nupl_data = get_onchain_latest("nupl")
    puell_data = get_onchain_latest("puell-multiple")
    realized_data = get_onchain_latest("realized-price")

    # Calculate individual scores
    components = {}

    if mvrv_data:
        components["mvrv_zscore"] = calc_mvrv_score(mvrv_data.get("mvrvZscore"))

    if sopr_data:
        components["sopr"] = calc_sopr_score(sopr_data.get("sopr"))

    if nupl_data:
        components["nupl"] = calc_nupl_score(nupl_data.get("nupl"))

    if puell_data:
        components["puell_multiple"] = calc_puell_score(puell_data.get("puellMultiple"))

    if fg:
        components["fear_greed"] = calc_fear_greed_score(fg)

    components["drawdown"] = calc_drawdown_score(price)
    components["halving_cycle"] = calc_halving_score()
    components["days_from_peak"] = calc_days_from_peak_score()

    if realized_data:
        rp = realized_data.get("realizedPrice")
        if rp:
            components["realized_price"] = calc_realized_price_score(price, rp)

    # Calculate weighted score (0-100, higher = safer to buy)
    total_weight = 0
    weighted_sum = 0
    buy_signals = 0
    sell_signals = 0
    neutral_signals = 0

    for key, comp in components.items():
        if comp is None:
            continue
        w = comp.get("weight", 0.05)
        n = comp.get("norm", 0.5)
        total_weight += w
        weighted_sum += n * w

        sig = comp.get("signal", "NEUTRU")
        if sig == "CUMPARA":
            buy_signals += 1
        elif sig == "VINDE":
            sell_signals += 1
        else:
            neutral_signals += 1

    score = int(round((weighted_sum / total_weight) * 100)) if total_weight > 0 else 50

    # Decision
    if score >= 65:
        decision = "CUMPARA"
        decision_text = "Conditiile sunt favorabile pentru acumulare pe termen lung."
        conviction = "HIGH" if score >= 75 else "MEDIUM"
    elif score <= 35:
        decision = "VINDE"
        decision_text = "Piata e supraincalzita. Reducerea expunerii recomandata."
        conviction = "HIGH" if score <= 25 else "MEDIUM"
    else:
        decision = "ASTEAPTA"
        decision_text = "Conditii mixte. Acumulare DCA cu prudenta."
        conviction = "LOW"

    # Map decision to V1 format for dashboard compatibility
    v1_decision = "BUY" if decision == "CUMPARA" else "SELL" if decision == "VINDE" else "HOLD"

    # Build output (V1 compatible + V2 extras)
    now = datetime.now(timezone.utc)
    result = {
        "version": "2.0",
        "timestamp": now.isoformat(),
        "score": score,
        "decision": v1_decision,
        "decision_text": decision_text,
        "conviction": conviction,
        "conviction_detail": f"{buy_signals} cumpara / {sell_signals} vinde / {neutral_signals} neutru",
        "overrides": [],

        "btc_price": price,
        "btc_price_live": price,
        "btc_ath": BTC_ATH,
        "pct_from_ath": round(((price - BTC_ATH) / BTC_ATH) * 100, 2),
        "internal_score": round(weighted_sum / total_weight, 4) if total_weight > 0 else 0.5,
        "btc_market_cap": btc.get("market_cap", 0),
        "btc_24h_change": round(btc.get("change_24h", 0), 2),

        "fear_greed": fg or {"value": 50, "label": "Neutral"},

        "coingecko": global_data or {
            "total_mcap": 0, "btc_dominance": 0, "eth_dominance": 0, "mcap_change_24h": 0,
        },

        # Derivatives from Binance (real data)
        "derivatives": derivatives,
        "macro": {
            "vix": 0, "dxy": 0, "us10y": 0, "m2": 0, "unemployment": 0, "fed_funds_rate": 0,
        },
        "indicators": {},

        "components": components,

        "analysis": generate_analysis(score, decision, conviction, price, components, fg),
    }

    print(f"[INFO] Score: {score}/100 | Decision: {decision} | Conviction: {conviction}")
    return result


def generate_analysis(score, decision, conviction, price, components, fg):
    """Generate Romanian analysis text."""
    lines = []
    lines.append(f"SCOR RISC: {score}/100. Decizie: {decision} (Conviction: {conviction}).")
    lines.append("")

    # Key findings
    if "mvrv_zscore" in components and components["mvrv_zscore"]:
        c = components["mvrv_zscore"]
        lines.append(f"MVRV Z-Score: {c['raw']}. {c['explanation']}")

    if "nupl" in components and components["nupl"]:
        c = components["nupl"]
        lines.append(f"NUPL: {c['raw']} ({c['phase']}). {c['explanation']}")

    if "sopr" in components and components["sopr"]:
        c = components["sopr"]
        lines.append(f"SOPR: {c['raw']}. {c['explanation']}")

    if fg:
        lines.append(f"Fear & Greed: {fg['value']} ({fg['label']}). Frica extrema = oportunitate contrarian.")

    dd = components.get("drawdown")
    if dd:
        lines.append(f"Drawdown: {dd['raw']}% de la ATH. {dd['explanation']}")

    hc = components.get("halving_cycle")
    if hc:
        lines.append(f"Ciclul Halving: {hc['explanation']}")

    dp = components.get("days_from_peak")
    if dp:
        lines.append(f"Zile de la peak: {dp['explanation']}")

    rp = components.get("realized_price")
    if rp:
        lines.append(f"Pret realizat: ${rp['raw']:,.0f}. {rp['explanation']}")

    lines.append("")
    lines.append("Aceasta analiza este generata automat si nu constituie sfaturi de investitii.")

    return "\n".join(lines)


# ──────────────────────────────────────────
# Main
# ──────────────────────────────────────────

def main():
    result = calculate_risk_score()
    if result is None:
        print("[ERROR] Failed to calculate risk score")
        sys.exit(1)

    # Save to file
    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"[INFO] Saved to {OUTPUT_FILE}")

    # Also print summary
    print(f"\n{'='*50}")
    print(f"  RISK SCORE V2: {result['score']}/100")
    print(f"  Decision: {result['decision']} ({result['conviction']})")
    print(f"  BTC: ${result['btc_price']:,.2f} ({result['pct_from_ath']:.1f}% from ATH)")
    print(f"  Fear & Greed: {result['fear_greed']['value']} ({result['fear_greed']['label']})")
    print(f"  Components: {result['conviction_detail']}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
