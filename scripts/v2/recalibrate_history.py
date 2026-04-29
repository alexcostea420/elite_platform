#!/usr/bin/env python3
"""
Recalibrate risk_score_history total_score using percentile-rank of RAW values
with hardcoded direction encoding.

Why this version: the previous attempt percentile-ranked the per-indicator `norm`
field — but those norms had already been clamped to 0/1 by fixed-threshold
formulas in risk_score_v2.py. Re-ranking saturated values produced wrong
extremes (e.g. 2020-10-22 at $13k showing score=6 SELL because multiple norms
were already pinned at 0).

Fix: re-derive the norm from the RAW indicator value itself, using:
  norm = 1 - percentile_rank(raw, expanding window)        if direction = "sell-on-high"
  norm =     percentile_rank(raw, expanding window)        if direction = "buy-on-high"

`expanding` = all history up to that date (cycle-aware, no false SELLs early).

Indicators we know:
  high raw = SELL signal:
    nupl, mvrv_zscore, mayer_multiple, puell_multiple,
    fear_greed, sopr, drawdown (negative, near 0 = at ATH)
  high raw = BUY signal:
    vix (stress = opportunity)
  monotonic / skip:
    realized_price (always increasing — meaningless solo)
    dxy (macro, skip from on-chain logic)
  fixed-rule, untouched:
    halving_cycle, days_from_peak

Idempotent. Run after each backfill expansion.
"""
import json
import sys
import urllib.error
import urllib.request
from bisect import bisect_left
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"
MIN_WINDOW = 90  # min data points before percentile is meaningful

DIRECTION = {
    # high raw = SELL → norm = 1 - pct
    "nupl": "sell_on_high",
    "mvrv_zscore": "sell_on_high",
    "mayer_multiple": "sell_on_high",
    "puell_multiple": "sell_on_high",
    "fear_greed": "sell_on_high",
    "sopr": "sell_on_high",
    "drawdown": "sell_on_high",   # 0 = at ATH = SELL, -0.8 = deep dd = BUY
    # high raw = BUY → norm = pct
    "vix": "buy_on_high",          # high VIX = stress = opportunity
    # leave untouched (monotonic, macro, or fixed-rule)
    "realized_price": None,
    "dxy": None,
    "halving_cycle": None,
    "days_from_peak": None,
}


def load_env():
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


def fetch_all_rows(env):
    base = (
        env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
        + "/rest/v1/risk_score_history"
        + "?select=date,total_score,level,components,btc_price&order=date.asc"
    )
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    }
    out = []
    PAGE = 1000
    offset = 0
    while True:
        req = urllib.request.Request(
            base,
            headers={**headers, "Range-Unit": "items", "Range": f"{offset}-{offset+PAGE-1}"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            chunk = json.loads(resp.read())
        out.extend(chunk)
        if len(chunk) < PAGE:
            break
        offset += PAGE
    return out


def percentile_rank(value, sorted_arr):
    if not sorted_arr:
        return 0.5
    n = len(sorted_arr)
    if n == 1:
        return 0.5
    idx_lo = bisect_left(sorted_arr, value)
    return idx_lo / (n - 1)


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


def update_row(env, date, total_score, level, components):
    url = (
        env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
        + f"/rest/v1/risk_score_history?date=eq.{date}"
    )
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    payload = json.dumps(
        {"total_score": total_score, "level": level, "components": components}
    ).encode()
    req = urllib.request.Request(url, data=payload, headers=headers, method="PATCH")
    with urllib.request.urlopen(req, timeout=15):
        pass


def main():
    env = load_env()
    print("[recalibrate] fetching rows…")
    rows = fetch_all_rows(env)
    print(f"[recalibrate] got {len(rows)} rows")

    if not rows:
        print("[recalibrate] no rows. Run backfill first.")
        return 1

    # Pass 1: build per-indicator RAW timeline (date-ordered)
    raws_by_key = {}  # key -> list of (date, raw)
    keys_seen = set()
    for r in rows:
        comps = r.get("components") or {}
        for k, v in comps.items():
            raw = v.get("raw")
            if raw is None:
                continue
            try:
                raw_f = float(raw)
            except (TypeError, ValueError):
                continue
            keys_seen.add(k)
            raws_by_key.setdefault(k, []).append((r["date"], raw_f))

    print(f"[recalibrate] indicators with raw values: {sorted(keys_seen)}")
    print(f"[recalibrate] direction map covers: {sorted(k for k in DIRECTION if DIRECTION[k])}")

    # Pass 2: re-rank
    updates = []
    for r in rows:
        date = r["date"]
        comps = json.loads(json.dumps(r.get("components") or {}))  # deep copy

        for k in list(comps.keys()):
            direction = DIRECTION.get(k)
            if direction is None:
                # Untouched: fixed-rule, monotonic, or unmapped
                continue
            raw = comps[k].get("raw")
            if raw is None:
                continue
            try:
                raw_f = float(raw)
            except (TypeError, ValueError):
                continue

            # Expanding window: all raw values for this indicator up to (and incl) date
            timeline = raws_by_key.get(k, [])
            window = [n for d, n in timeline if d <= date]

            if len(window) < MIN_WINDOW:
                comps[k]["norm_method"] = "original_insufficient_history"
                continue

            window_sorted = sorted(window)
            pct = percentile_rank(raw_f, window_sorted)
            if direction == "sell_on_high":
                new_norm = 1.0 - pct
            else:  # buy_on_high
                new_norm = pct
            comps[k]["norm"] = round(new_norm, 4)
            comps[k]["norm_method"] = f"raw_pct_expanding_{direction}"

        new_score = aggregate_score(comps)
        new_level = level_for(new_score)
        old_score = r.get("total_score")
        if new_score != old_score or new_level != r.get("level"):
            updates.append((date, new_score, new_level, comps))

    print(f"[recalibrate] {len(updates)}/{len(rows)} rows changed")

    if not updates:
        print("[recalibrate] nothing to update.")
        return 0

    n_ok = 0
    for date, score, level, comps in updates:
        try:
            update_row(env, date, score, level, comps)
            n_ok += 1
        except urllib.error.HTTPError as e:
            print(f"[recalibrate] {date}: HTTP {e.code} {e.read().decode()[:200]}")
        if n_ok % 100 == 0 and n_ok > 0:
            print(f"[recalibrate] updated {n_ok}/{len(updates)}…")

    print(f"[recalibrate] done. {n_ok}/{len(updates)} updated.")

    # Sanity sample
    print("\n[recalibrate] sample post-recalibration:")
    rows_after = fetch_all_rows(env)

    by_price = sorted(rows_after, key=lambda r: -(r.get("btc_price") or 0))[:5]
    print("  top BTC price → score:")
    for r in by_price:
        print(
            f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  "
            f"score={r['total_score']:>3}  ({r.get('level', '?')})"
        )

    by_score_low = sorted(
        rows_after,
        key=lambda r: r.get("total_score") if r.get("total_score") is not None else 50,
    )[:5]
    print("  lowest scores:")
    for r in by_score_low:
        print(
            f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  "
            f"score={r['total_score']:>3}  ({r.get('level', '?')})"
        )

    by_score_high = sorted(
        rows_after,
        key=lambda r: -(r.get("total_score") if r.get("total_score") is not None else 50),
    )[:5]
    print("  highest scores:")
    for r in by_score_high:
        print(
            f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  "
            f"score={r['total_score']:>3}  ({r.get('level', '?')})"
        )

    # Spot-check: dates known to be cycle inflection points
    print("\n  spot-checks (cycle inflections):")
    spots = ["2018-12-15", "2020-03-13", "2020-10-22", "2021-04-14", "2021-11-09",
             "2022-11-21", "2023-10-15", "2025-10-05", "2026-04-29"]
    by_date = {r["date"]: r for r in rows_after}
    for d in spots:
        r = by_date.get(d)
        if r:
            print(
                f"    {d}  ${r.get('btc_price') or 0:>10,.0f}  "
                f"score={r['total_score']:>3}  ({r.get('level', '?')})"
            )

    return 0


if __name__ == "__main__":
    sys.exit(main())
