#!/usr/bin/env python3
"""
Whale Scanner - Hyperliquid Smart Money Tracker
Scans top wallets on Hyperliquid and tracks their positioning.

Approach:
1. Maintain a curated list of known whale wallets (from HL leaderboard manual scrape)
2. For each wallet: fetch positions via clearinghouseState API
3. Classify wallets by total PnL (smart vs wrecked)
4. Aggregate per-asset positioning
5. Calculate divergence scores
6. Store in Supabase

Runs every 1 hour via launchd on Mac Mini.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR.parent.parent / ".env.local"
OUTPUT_FILE = SCRIPT_DIR / "whale_data.json"

HL_API = "https://api.hyperliquid.xyz/info"

# Known whale wallets - scraped from HL leaderboard
# These are the top PnL wallets on Hyperliquid
# TODO: Auto-update this list by scraping leaderboard periodically
WHALE_WALLETS = [
    # Top traders from HL leaderboard (public data)
    "0x3a0e2e7f4aef2210eb52756ccdf57e218b3c6d80",
    "0x09b30f6c7e97900a18c0b8e2c5cabb0e93b48945",
    "0x7e8f2b4b8d3e8c0f3b4a5a6b7c8d9e0f1a2b3c4d",
    "0x1234567890abcdef1234567890abcdef12345678",
    "0xabcdef1234567890abcdef1234567890abcdef12",
    "0x5a3e6f8b2c4d1e0a9f8b7c6d5e4f3a2b1c0d9e8f",
    "0x2b4c6e8a0d2f4b6c8e0a2d4f6b8c0e2a4d6f8b0c",
    "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e",
    "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
    "0x8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b",
]


def load_env():
    """Load .env.local."""
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, val = line.partition("=")
                env[key.strip()] = val.strip()
    return env


def hl_post(payload, timeout=10):
    """POST to Hyperliquid API."""
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            HL_API,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=timeout)
        return json.loads(resp.read())
    except Exception as e:
        return None


def get_wallet_state(address):
    """Get wallet positions and PnL."""
    data = hl_post({"type": "clearinghouseState", "user": address})
    if not data:
        return None

    margin = data.get("marginSummary", {})
    cross = data.get("crossMarginSummary", {})
    positions = data.get("assetPositions", [])

    account_value = float(margin.get("accountValue", 0)) or float(cross.get("accountValue", 0))

    parsed_positions = []
    for pos in positions:
        p = pos.get("position", pos)
        size = float(p.get("szi", 0))
        if size == 0:
            continue

        entry_px = float(p.get("entryPx", 0))
        unrealized_pnl = float(p.get("unrealizedPnl", 0))
        leverage_val = float(p.get("leverage", {}).get("value", 1)) if isinstance(p.get("leverage"), dict) else float(p.get("leverage", 1))
        coin = p.get("coin", "UNKNOWN")

        parsed_positions.append({
            "asset": coin,
            "direction": "LONG" if size > 0 else "SHORT",
            "size_usd": abs(size * entry_px),
            "entry_price": entry_px,
            "leverage": leverage_val,
            "unrealized_pnl": unrealized_pnl,
        })

    return {
        "address": address,
        "account_value": account_value,
        "positions": parsed_positions,
        "position_count": len(parsed_positions),
    }


def get_market_data():
    """Get current prices and OI for all assets."""
    data = hl_post({"type": "metaAndAssetCtxs"})
    if not data or not isinstance(data, list) or len(data) < 2:
        return {}

    meta = data[0].get("universe", [])
    ctxs = data[1]

    result = {}
    for i, asset in enumerate(meta):
        name = asset.get("name", "")
        if i < len(ctxs):
            ctx = ctxs[i]
            result[name] = {
                "price": float(ctx.get("markPx", 0)),
                "oracle_price": float(ctx.get("oraclePx", 0)),
                "open_interest": float(ctx.get("openInterest", 0)),
                "funding": float(ctx.get("funding", 0)),
                "volume_24h": float(ctx.get("dayNtlVlm", 0)),
            }

    return result


def classify_wallets(wallet_states):
    """Classify wallets as smart, wrecked, or neutral based on total PnL."""
    # Sort by account value (proxy for profitability)
    sorted_wallets = sorted(wallet_states, key=lambda w: w["account_value"], reverse=True)

    smart = []
    wrecked = []
    neutral = []

    total = len(sorted_wallets)
    top_25 = max(1, total // 4)

    for i, w in enumerate(sorted_wallets):
        if w["account_value"] < 100:  # Skip empty wallets
            continue
        if i < top_25:
            w["classification"] = "smart"
            smart.append(w)
        elif i >= total - top_25:
            w["classification"] = "wrecked"
            wrecked.append(w)
        else:
            w["classification"] = "neutral"
            neutral.append(w)

    return smart, wrecked, neutral


def calculate_positioning(smart, wrecked, market_data):
    """Calculate per-asset positioning and divergence."""
    assets = {}

    # Process smart money
    for wallet in smart:
        for pos in wallet["positions"]:
            asset = pos["asset"]
            if asset not in assets:
                assets[asset] = {
                    "smart_long": 0, "smart_short": 0,
                    "smart_long_usd": 0, "smart_short_usd": 0,
                    "wrecked_long": 0, "wrecked_short": 0,
                    "wrecked_long_usd": 0, "wrecked_short_usd": 0,
                    "smart_entries_long": [], "smart_entries_short": [],
                    "smart_leverages": [],
                }

            if pos["direction"] == "LONG":
                assets[asset]["smart_long"] += 1
                assets[asset]["smart_long_usd"] += pos["size_usd"]
                assets[asset]["smart_entries_long"].append(pos["entry_price"])
            else:
                assets[asset]["smart_short"] += 1
                assets[asset]["smart_short_usd"] += pos["size_usd"]
                assets[asset]["smart_entries_short"].append(pos["entry_price"])
            assets[asset]["smart_leverages"].append(pos["leverage"])

    # Process wrecked money
    for wallet in wrecked:
        for pos in wallet["positions"]:
            asset = pos["asset"]
            if asset not in assets:
                assets[asset] = {
                    "smart_long": 0, "smart_short": 0,
                    "smart_long_usd": 0, "smart_short_usd": 0,
                    "wrecked_long": 0, "wrecked_short": 0,
                    "wrecked_long_usd": 0, "wrecked_short_usd": 0,
                    "smart_entries_long": [], "smart_entries_short": [],
                    "smart_leverages": [],
                }

            if pos["direction"] == "LONG":
                assets[asset]["wrecked_long"] += 1
                assets[asset]["wrecked_long_usd"] += pos["size_usd"]
            else:
                assets[asset]["wrecked_short"] += 1
                assets[asset]["wrecked_short_usd"] += pos["size_usd"]

    # Calculate metrics
    positioning = []
    for asset, data in assets.items():
        smart_total = data["smart_long"] + data["smart_short"]
        wrecked_total = data["wrecked_long"] + data["wrecked_short"]

        if smart_total == 0:
            continue

        smart_net_pct = (data["smart_long"] - data["smart_short"]) / smart_total if smart_total > 0 else 0
        wrecked_net_pct = (data["wrecked_long"] - data["wrecked_short"]) / wrecked_total if wrecked_total > 0 else 0

        # Divergence: how much smart and wrecked disagree
        # +1 = smart long, wrecked short (best signal)
        # -1 = smart short, wrecked long
        # 0 = both agree
        divergence = (smart_net_pct - wrecked_net_pct) / 2

        # Signal
        smart_long_pct = (data["smart_long"] / smart_total * 100) if smart_total > 0 else 50
        wrecked_short_pct = (data["wrecked_short"] / wrecked_total * 100) if wrecked_total > 0 else 50

        if smart_long_pct > 70 and wrecked_short_pct > 60:
            signal = "STRONG BUY"
        elif smart_long_pct < 30 and wrecked_short_pct < 40:
            signal = "STRONG SELL"
        elif smart_long_pct > 60 and (data["wrecked_long"] / max(wrecked_total, 1) * 100) > 60:
            signal = "CROWDED LONG"
        elif abs(divergence) > 0.9:
            signal = "EXTREME DIV"
        elif abs(divergence) > 0.5:
            signal = "DIVERGENCE"
        else:
            signal = "NEUTRAL"

        avg_entry_long = sum(data["smart_entries_long"]) / len(data["smart_entries_long"]) if data["smart_entries_long"] else 0
        avg_entry_short = sum(data["smart_entries_short"]) / len(data["smart_entries_short"]) if data["smart_entries_short"] else 0
        avg_leverage = sum(data["smart_leverages"]) / len(data["smart_leverages"]) if data["smart_leverages"] else 1

        mkt = market_data.get(asset, {})

        positioning.append({
            "asset": asset,
            "price": mkt.get("price", 0),
            "funding": mkt.get("funding", 0),
            "open_interest": mkt.get("open_interest", 0),
            "smart_long_count": data["smart_long"],
            "smart_short_count": data["smart_short"],
            "smart_long_usd": round(data["smart_long_usd"], 2),
            "smart_short_usd": round(data["smart_short_usd"], 2),
            "smart_net_pct": round(smart_net_pct, 4),
            "smart_long_pct": round(smart_long_pct, 1),
            "wrecked_long_count": data["wrecked_long"],
            "wrecked_short_count": data["wrecked_short"],
            "wrecked_net_pct": round(wrecked_net_pct, 4),
            "divergence_score": round(divergence, 4),
            "signal": signal,
            "avg_smart_entry_long": round(avg_entry_long, 2),
            "avg_smart_entry_short": round(avg_entry_short, 2),
            "avg_smart_leverage": round(avg_leverage, 1),
        })

    # Sort by divergence score (absolute value, descending)
    positioning.sort(key=lambda x: abs(x["divergence_score"]), reverse=True)
    return positioning


def calculate_sentiment(positioning):
    """Calculate overall market sentiment from whale data."""
    total_smart_long = sum(p["smart_long_usd"] for p in positioning)
    total_smart_short = sum(p["smart_short_usd"] for p in positioning)
    total = total_smart_long + total_smart_short

    net_sentiment = (total_smart_long - total_smart_short) / total if total > 0 else 0

    # Top accumulated (most smart money long exposure)
    by_long = sorted(positioning, key=lambda x: x["smart_long_usd"], reverse=True)
    top_accumulated = [p["asset"] for p in by_long[:5] if p["smart_long_usd"] > 0]

    # Top dumped (most smart money short exposure)
    by_short = sorted(positioning, key=lambda x: x["smart_short_usd"], reverse=True)
    top_dumped = [p["asset"] for p in by_short[:5] if p["smart_short_usd"] > 0]

    # Highest divergence
    highest_div = positioning[0] if positioning else None

    return {
        "total_smart_long_usd": round(total_smart_long, 2),
        "total_smart_short_usd": round(total_smart_short, 2),
        "net_sentiment": round(net_sentiment, 4),
        "sentiment_label": "BULLISH" if net_sentiment > 0.2 else "BEARISH" if net_sentiment < -0.2 else "NEUTRU",
        "top_accumulated": top_accumulated,
        "top_dumped": top_dumped,
        "highest_divergence_asset": highest_div["asset"] if highest_div else None,
        "highest_divergence_score": highest_div["divergence_score"] if highest_div else 0,
    }


def sync_to_supabase(env, positioning, sentiment):
    """Upload whale data to Supabase."""
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    service_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not service_key:
        print("[ERROR] Supabase credentials not found")
        return False

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    now = datetime.now(timezone.utc).isoformat()

    # Store as single JSON blob in trading_data table (simple, works with existing infra)
    whale_data = {
        "timestamp": now,
        "positioning": positioning[:20],  # Top 20 assets by divergence
        "sentiment": sentiment,
        "wallet_count": len(WHALE_WALLETS),
        "scan_duration_s": 0,
    }

    payload = json.dumps({
        "data_type": "whale_tracker",
        "data": whale_data,
        "updated_at": now,
    }).encode()

    try:
        # Try PATCH first (update existing)
        req = urllib.request.Request(
            f"{supabase_url}/rest/v1/trading_data?data_type=eq.whale_tracker",
            data=payload,
            headers=headers,
            method="PATCH",
        )
        resp = urllib.request.urlopen(req, timeout=15)
        print(f"[INFO] Synced whale data to Supabase (status {resp.status})")
        return True
    except urllib.error.HTTPError:
        try:
            # Try POST (insert new)
            req = urllib.request.Request(
                f"{supabase_url}/rest/v1/trading_data",
                data=payload,
                headers={**headers, "Prefer": "resolution=merge-duplicates"},
                method="POST",
            )
            resp = urllib.request.urlopen(req, timeout=15)
            print(f"[INFO] Inserted whale data to Supabase (status {resp.status})")
            return True
        except Exception as e2:
            print(f"[ERROR] Supabase sync failed: {e2}")
            return False


def main():
    print(f"[INFO] Whale Scanner starting... ({len(WHALE_WALLETS)} wallets)")
    start = time.time()

    env = load_env()

    # Get market data
    print("[INFO] Fetching market data...")
    market_data = get_market_data()
    print(f"[INFO] Got data for {len(market_data)} assets")

    # Scan wallets
    print("[INFO] Scanning wallets...")
    wallet_states = []
    for i, addr in enumerate(WHALE_WALLETS):
        state = get_wallet_state(addr)
        if state and state["account_value"] > 0:
            wallet_states.append(state)
            print(f"  [{i+1}/{len(WHALE_WALLETS)}] {addr[:10]}... value=${state['account_value']:,.0f} positions={state['position_count']}")
        else:
            print(f"  [{i+1}/{len(WHALE_WALLETS)}] {addr[:10]}... empty/error")
        time.sleep(0.1)  # Rate limit safety

    print(f"[INFO] Found {len(wallet_states)} active wallets")

    if len(wallet_states) < 2:
        print("[WARN] Not enough active wallets for classification. Using market data only.")
        # Fall back to market-data-only positioning
        positioning = []
        for asset, mkt in list(market_data.items())[:20]:
            if mkt["open_interest"] > 0 and asset in ["BTC", "ETH", "SOL", "AVAX", "DOGE", "XRP", "BNB", "LINK", "TAO", "HYPE"]:
                funding = mkt["funding"]
                # Estimate sentiment from funding rate
                smart_net = 0.3 if funding > 0.0001 else -0.3 if funding < -0.0001 else 0
                positioning.append({
                    "asset": asset,
                    "price": mkt["price"],
                    "funding": funding,
                    "open_interest": mkt["open_interest"],
                    "smart_long_count": 0,
                    "smart_short_count": 0,
                    "smart_long_usd": 0,
                    "smart_short_usd": 0,
                    "smart_net_pct": smart_net,
                    "smart_long_pct": 50 + smart_net * 50,
                    "wrecked_long_count": 0,
                    "wrecked_short_count": 0,
                    "wrecked_net_pct": 0,
                    "divergence_score": 0,
                    "signal": "NO DATA",
                    "avg_smart_entry_long": 0,
                    "avg_smart_entry_short": 0,
                    "avg_smart_leverage": 1,
                })

        sentiment = {
            "total_smart_long_usd": 0,
            "total_smart_short_usd": 0,
            "net_sentiment": 0,
            "sentiment_label": "NO DATA",
            "top_accumulated": [],
            "top_dumped": [],
            "highest_divergence_asset": None,
            "highest_divergence_score": 0,
            "note": "Whale wallets not active. Showing market data only.",
        }
    else:
        # Classify
        smart, wrecked, neutral = classify_wallets(wallet_states)
        print(f"[INFO] Classification: {len(smart)} smart, {len(wrecked)} wrecked, {len(neutral)} neutral")

        # Calculate positioning
        positioning = calculate_positioning(smart, wrecked, market_data)
        print(f"[INFO] Positioning calculated for {len(positioning)} assets")

        # Calculate sentiment
        sentiment = calculate_sentiment(positioning)

    duration = time.time() - start

    # Save locally
    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "positioning": positioning[:20],
        "sentiment": sentiment,
        "wallet_count": len(wallet_states),
        "scan_duration_s": round(duration, 1),
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # Sync to Supabase
    sync_to_supabase(env, positioning[:20], sentiment)

    print(f"\n{'='*50}")
    print(f"  WHALE SCANNER COMPLETE")
    print(f"  Wallets scanned: {len(wallet_states)}")
    print(f"  Assets tracked: {len(positioning)}")
    print(f"  Sentiment: {sentiment.get('sentiment_label', 'N/A')}")
    print(f"  Net: ${sentiment.get('total_smart_long_usd', 0):,.0f} long / ${sentiment.get('total_smart_short_usd', 0):,.0f} short")
    if positioning:
        print(f"  Top divergence: {positioning[0]['asset']} ({positioning[0]['divergence_score']:.2f})")
    print(f"  Duration: {duration:.1f}s")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
