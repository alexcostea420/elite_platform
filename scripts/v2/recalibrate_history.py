#!/usr/bin/env python3
"""
Recalibrate risk_score_history total_score using percentile-based normalization.

Why: the V2 thresholds were calibrated for 2017/2021 cycles where retail FOMO
drove MVRV to 7+ and NUPL above 0.75. The 2024-2025 cycle is institutional —
peaks come at MVRV ~2.5, NUPL ~0.55, Mayer ~1.2. With fixed thresholds the
score at $124k ATH is only 47 (HOLD) instead of <20 (SELL).

Solution: replace the per-indicator `norm` with the percentile rank of that
indicator's value within the trailing 365-day window. This auto-adapts to
whatever cycle we are in:
  - At trailing-max → percentile 1.0 → if invert=True (e.g. MVRV) → norm 0 → SELL
  - At trailing-min → percentile 0.0 → norm 1.0 → BUY

We reuse the existing `components.<key>.norm` direction encoding (already invert-
correct from the original scoring functions). For each row we re-rank its `norm`
within the trailing-365 distribution of `norm` values for that indicator, then
re-aggregate using the original weights.

Idempotent. Run after each backfill expansion.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from bisect import bisect_left
from pathlib import Path

ENV_FILE = Path(__file__).parent.parent.parent / ".env.local"
WINDOW_DAYS = 365  # trailing window for percentile calc

# Components that don't get re-ranked (fixed-rule, not data-driven)
FIXED_COMPONENTS = {"halving_cycle", "days_from_peak"}


def load_env():
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


def fetch_all_rows(env):
    url = (
        env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
        + "/rest/v1/risk_score_history"
        + "?select=date,total_score,components,btc_price&order=date.asc"
    )
    headers = {
        "apikey": env["SUPABASE_SERVICE_ROLE_KEY"],
        "Authorization": f"Bearer {env['SUPABASE_SERVICE_ROLE_KEY']}",
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def percentile_rank(value, sorted_arr):
    """Return percentile of value within sorted_arr (0..1). Ties: average."""
    if not sorted_arr:
        return 0.5
    idx_lo = bisect_left(sorted_arr, value)
    # Fraction of values <= value
    n = len(sorted_arr)
    if n == 1:
        return 0.5
    return idx_lo / (n - 1) if n > 1 else 0.5


def aggregate_score(components):
    """Weighted average of norms × 100. Same formula as live."""
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
    payload = json.dumps({
        "total_score": total_score,
        "level": level,
        "components": components,
    }).encode()
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

    # Pass 1: collect per-indicator norm timeline (date-ordered)
    keys_seen = set()
    norms_by_key = {}  # key -> list of (date, norm)
    for r in rows:
        comps = r.get("components") or {}
        for k, v in comps.items():
            if k in FIXED_COMPONENTS:
                continue
            n = v.get("norm")
            if n is None:
                continue
            keys_seen.add(k)
            norms_by_key.setdefault(k, []).append((r["date"], float(n)))

    print(f"[recalibrate] indicators in scope: {sorted(keys_seen)}")

    # Pass 2: for each row, recompute per-indicator norm as percentile within
    # trailing WINDOW_DAYS of values for that indicator, then re-aggregate.
    updates = []
    for i, r in enumerate(rows):
        date = r["date"]
        comps = json.loads(json.dumps(r.get("components") or {}))  # deep copy

        for k in list(comps.keys()):
            if k in FIXED_COMPONENTS:
                continue
            curr_norm = comps[k].get("norm")
            if curr_norm is None:
                continue

            # Build trailing window for this key
            timeline = norms_by_key.get(k, [])
            window = []
            for d, n in timeline:
                if d > date:
                    break
                window.append(n)
            window = window[-WINDOW_DAYS:]
            window_sorted = sorted(window)

            # Percentile rank of current value
            pct = percentile_rank(float(curr_norm), window_sorted)
            # New norm = percentile (preserves original direction encoding)
            comps[k]["norm"] = round(pct, 4)
            comps[k]["norm_method"] = "percentile_365d"

        new_score = aggregate_score(comps)
        new_level = level_for(new_score)
        old_score = r.get("total_score")
        if new_score != old_score or new_level != r.get("level"):
            updates.append((date, new_score, new_level, comps))

    print(f"[recalibrate] {len(updates)}/{len(rows)} rows changed")

    if not updates:
        print("[recalibrate] nothing to update.")
        return 0

    # Pass 3: PATCH each row
    n_ok = 0
    for date, score, level, comps in updates:
        try:
            update_row(env, date, score, level, comps)
            n_ok += 1
        except urllib.error.HTTPError as e:
            print(f"[recalibrate] {date}: HTTP {e.code} {e.read().decode()[:200]}")
        if n_ok % 50 == 0 and n_ok > 0:
            print(f"[recalibrate] updated {n_ok}/{len(updates)}…")

    print(f"[recalibrate] done. {n_ok}/{len(updates)} updated.")

    # Sanity sample
    print("\n[recalibrate] sample post-recalibration:")
    rows_after = fetch_all_rows(env)
    by_price = sorted(rows_after, key=lambda r: -(r.get("btc_price") or 0))[:5]
    print("  top BTC price → score:")
    for r in by_price:
        print(f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  score={r['total_score']:>3}  ({r['level']})")
    by_score_low = sorted(rows_after, key=lambda r: r.get("total_score", 50))[:5]
    print("  lowest scores:")
    for r in by_score_low:
        print(f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  score={r['total_score']:>3}  ({r['level']})")
    by_score_high = sorted(rows_after, key=lambda r: -(r.get("total_score", 50)))[:5]
    print("  highest scores:")
    for r in by_score_high:
        print(f"    {r['date']}  ${r.get('btc_price') or 0:>10,.0f}  score={r['total_score']:>3}  ({r['level']})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
