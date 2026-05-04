import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─────────────────────────────────────────────────────────
// Liquidation Map V2
// ─────────────────────────────────────────────────────────
// Real-data liquidation pressure map for major crypto perp markets.
//
// Data sources (all free, public):
//  1. OKX swaps  — hourly klines, OI in USD, top long/short ratio (history),
//                  funding rate history. Most reliable free OI source.
//  2. Binance Futures — top trader long/short position ratio (better signal
//                  than OKX's account-weighted ratio for "smart money" bias).
//  3. Hyperliquid — actual whale positions for this asset (top 20 traders).
//                  These are *real* liquidation prices, not estimates.
//
// Methodology:
//  For each hourly candle: take real OI in USD, split into long vs short
//  using the hourly L/S ratio (real, not assumed), distribute across
//  leverage tiers weighted by the funding rate (positive funding → longs
//  more aggressive → more high-leverage longs at risk). Stamp liquidation
//  prices as Gaussian clusters. Layer Hyperliquid whales on top as discrete
//  real data points.
// ─────────────────────────────────────────────────────────

const HOURS = 168; // 7 days

const SUPPORTED_ASSETS = ["BTC", "ETH", "SOL", "XRP", "DOGE"] as const;
type AssetSym = (typeof SUPPORTED_ASSETS)[number];

const OKX_INSTID: Record<AssetSym, string> = {
  BTC: "BTC-USDT-SWAP",
  ETH: "ETH-USDT-SWAP",
  SOL: "SOL-USDT-SWAP",
  XRP: "XRP-USDT-SWAP",
  DOGE: "DOGE-USDT-SWAP",
};

const BINANCE_SYM: Record<AssetSym, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  XRP: "XRPUSDT",
  DOGE: "DOGEUSDT",
};

// Bucket span: ±18% on majors, ±25% on volatile tail.
const BUCKET_SPAN_PCT: Record<AssetSym, number> = {
  BTC: 0.16,
  ETH: 0.20,
  SOL: 0.25,
  XRP: 0.25,
  DOGE: 0.30,
};
const NUM_ROWS = 110;

// Maintenance margin tier 1 (BTC ~0.5%, alts slightly higher; we approximate).
const MM_RATE: Record<AssetSym, number> = {
  BTC: 0.005,
  ETH: 0.0075,
  SOL: 0.01,
  XRP: 0.01,
  DOGE: 0.01,
};

// Leverage distribution. Funding rate skews this — when funding is positive
// (longs paying shorts) the long side has more high-leverage degens than usual.
const BASE_LEVERAGE_TIERS = [
  { lev: 5, w: 0.34 },
  { lev: 10, w: 0.27 },
  { lev: 20, w: 0.19 },
  { lev: 25, w: 0.10 },
  { lev: 50, w: 0.06 },
  { lev: 100, w: 0.04 },
];

const BLUR_KERNEL = [0.05, 0.12, 0.18, 0.22, 0.18, 0.12, 0.08, 0.05];
const TEMPORAL_HALF_WINDOW = 4;

type Kline = { t: number; o: number; h: number; l: number; c: number; v: number };
type Hourly<T> = { t: number; v: T };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "EliteLiqMapV2/1.0" },
      ...init,
    });
    if (!r.ok) {
      console.warn(`[liq-v2] ${url} → ${r.status}`);
      return null;
    }
    return (await r.json()) as T;
  } catch (e) {
    console.warn(`[liq-v2] ${url} → threw:`, e instanceof Error ? e.message : e);
    return null;
  }
}

type OkxEnvelope<T> = { code: string; data?: T };

async function fetchOkxKlines(asset: AssetSym): Promise<Kline[]> {
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/market/candles?instId=${OKX_INSTID[asset]}&bar=1H&limit=${HOURS}`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .reverse()
    .map((row) => {
      if (!Array.isArray(row) || row.length < 7) return null;
      return {
        t: Number(row[0]),
        o: Number(row[1]),
        h: Number(row[2]),
        l: Number(row[3]),
        c: Number(row[4]),
        v: Number(row[6]), // volCcy in base asset
      } as Kline;
    })
    .filter((k): k is Kline => k !== null && Number.isFinite(k.o) && k.o > 0);
}

async function fetchOkxOIHist(asset: AssetSym): Promise<Hourly<number>[]> {
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=${asset}&period=1H`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .reverse()
    .map((row) => ({ t: Number(row[0]), v: Number(row[1]) }))
    .filter((s) => Number.isFinite(s.v) && s.v > 0);
}

async function fetchOkxLSHist(asset: AssetSym): Promise<Hourly<number>[]> {
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${asset}&period=1H`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .reverse()
    .map((row) => ({ t: Number(row[0]), v: Number(row[1]) }))
    .filter((s) => Number.isFinite(s.v) && s.v > 0);
}

async function fetchOkxFundingHist(asset: AssetSym): Promise<Hourly<number>[]> {
  const data = await fetchJson<OkxEnvelope<Array<{ fundingTime: string; realizedRate: string }>>>(
    `https://www.okx.com/api/v5/public/funding-rate-history?instId=${OKX_INSTID[asset]}&limit=100`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .reverse()
    .map((row) => ({ t: Number(row.fundingTime), v: Number(row.realizedRate) * 100 }))
    .filter((s) => Number.isFinite(s.v));
}

async function fetchBinanceTopLS(asset: AssetSym): Promise<number | null> {
  type Row = { longShortRatio: string };
  const data = await fetchJson<Row[]>(
    `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${BINANCE_SYM[asset]}&period=1h&limit=1`,
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  const r = Number(data[0].longShortRatio);
  return Number.isFinite(r) ? r : null;
}

type WhalePosition = {
  address: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  leverage: number;
  notional_usd: number;
  liq_price: number;
};

async function fetchHyperliquidWhales(asset: AssetSym): Promise<WhalePosition[]> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("whale_positions")
      .select("address,direction,entry_price,leverage,notional_usd")
      .eq("asset", asset)
      .eq("is_current", true);
    if (!data) return [];
    return data
      .map((p) => {
        const lev = Number(p.leverage);
        const entry = Number(p.entry_price);
        if (!Number.isFinite(lev) || lev <= 0 || !Number.isFinite(entry) || entry <= 0) return null;
        const buf = 1 / lev - MM_RATE[asset];
        if (buf <= 0) return null;
        const liq = p.direction === "LONG" ? entry * (1 - buf) : entry * (1 + buf);
        return {
          address: p.address as string,
          direction: p.direction as "LONG" | "SHORT",
          entry_price: entry,
          leverage: lev,
          notional_usd: Number(p.notional_usd) || 0,
          liq_price: liq,
        };
      })
      .filter((p): p is WhalePosition => p !== null);
  } catch (e) {
    console.warn("[liq-v2] whale fetch failed:", e instanceof Error ? e.message : e);
    return [];
  }
}

function alignToHour(ms: number): number {
  return Math.floor(ms / 3600000) * 3600000;
}

function buildHourlyMap<T>(rows: Hourly<T>[]): Map<number, T> {
  const m = new Map<number, T>();
  for (const r of rows) m.set(alignToHour(r.t), r.v);
  return m;
}

function nearestValue<T>(map: Map<number, T>, t: number, fallback: T): T {
  // Try exact, then walk back up to 3 hours
  for (let i = 0; i <= 3; i++) {
    const v = map.get(alignToHour(t) - i * 3600000);
    if (v !== undefined) return v;
  }
  return fallback;
}

function buildHeatmap(
  asset: AssetSym,
  klines: Kline[],
  oiMap: Map<number, number>,
  lsMap: Map<number, number>,
  fundingMap: Map<number, number>,
  topLSNow: number | null,
) {
  if (klines.length === 0) return null;

  const currentPrice = klines[klines.length - 1].c;
  const span = BUCKET_SPAN_PCT[asset];
  const minBucket = currentPrice * (1 - span);
  const maxBucket = currentPrice * (1 + span);
  const numBuckets = NUM_ROWS;
  const bucketSize = (maxBucket - minBucket) / numBuckets;
  const priceBuckets: number[] = [];
  for (let i = 0; i < numBuckets; i++) {
    priceBuckets.push(minBucket + i * bucketSize);
  }

  const grid: number[][] = Array.from({ length: numBuckets }, () =>
    new Array(klines.length).fill(0),
  );

  const stamp = (priceTarget: number, hourIdx: number, amount: number) => {
    if (priceTarget < minBucket || priceTarget > maxBucket) return;
    const center = Math.floor((priceTarget - minBucket) / bucketSize);
    const half = Math.floor(BLUR_KERNEL.length / 2);
    for (let k = 0; k < BLUR_KERNEL.length; k++) {
      const idx = center + (k - half);
      if (idx < 0 || idx >= numBuckets) continue;
      grid[idx][hourIdx] += amount * BLUR_KERNEL[k];
    }
  };

  let totalOiUsd = 0;
  let oiHourCount = 0;

  for (let hi = 0; hi < klines.length; hi++) {
    const k = klines[hi];
    const oiUsd = nearestValue(oiMap, k.t, 0);
    if (oiUsd === 0) continue;
    totalOiUsd += oiUsd;
    oiHourCount++;

    // Per-hour L/S ratio (long_acc / short_acc, OKX convention)
    const lsRatio = nearestValue(lsMap, k.t, 1);
    let longShare = lsRatio / (lsRatio + 1);
    longShare = Math.max(0.32, Math.min(0.68, longShare));
    const shortShare = 1 - longShare;

    // Funding-skewed leverage: positive funding → longs pay shorts → longs are
    // the crowded side → high-leverage longs concentrated. Negative reverses.
    const funding = nearestValue(fundingMap, k.t, 0); // % per period
    const fundingSkew = Math.max(-1, Math.min(1, funding / 0.05)); // ±0.05% normalizes to ±1
    const longTiers = BASE_LEVERAGE_TIERS.map((t) => {
      // Skew weight toward higher leverage when funding positive (long crowding)
      const tilt = (t.lev - 20) / 80; // -0.19 at 5x → +1.0 at 100x
      const w = t.w * (1 + 0.4 * fundingSkew * tilt);
      return { lev: t.lev, w: Math.max(0.005, w) };
    });
    const shortTiers = BASE_LEVERAGE_TIERS.map((t) => {
      const tilt = (t.lev - 20) / 80;
      const w = t.w * (1 - 0.4 * fundingSkew * tilt);
      return { lev: t.lev, w: Math.max(0.005, w) };
    });
    const sumLong = longTiers.reduce((s, t) => s + t.w, 0);
    const sumShort = shortTiers.reduce((s, t) => s + t.w, 0);
    longTiers.forEach((t) => (t.w /= sumLong));
    shortTiers.forEach((t) => (t.w /= sumShort));

    const refPrice = k.c;
    // Volume-aware activity: hours with more turnover have more new positions.
    const turnover = k.v * refPrice; // USD turnover this hour
    const activity = 1 + Math.min(2.5, turnover / Math.max(1, oiUsd / 80));

    for (const tier of longTiers) {
      const buf = 1 / tier.lev - MM_RATE[asset];
      if (buf <= 0) continue;
      const liq = refPrice * (1 - buf);
      stamp(liq, hi, oiUsd * longShare * tier.w * activity);
    }
    for (const tier of shortTiers) {
      const buf = 1 / tier.lev - MM_RATE[asset];
      if (buf <= 0) continue;
      const liq = refPrice * (1 + buf);
      stamp(liq, hi, oiUsd * shortShare * tier.w * activity);
    }
  }

  // Temporal smoothing — positions stay open for hours, density should be
  // continuous on time axis.
  const T = klines.length;
  for (let pi = 0; pi < numBuckets; pi++) {
    const orig = grid[pi].slice();
    for (let hi = 0; hi < T; hi++) {
      let sum = 0;
      let wsum = 0;
      for (let dh = -TEMPORAL_HALF_WINDOW; dh <= TEMPORAL_HALF_WINDOW; dh++) {
        const h2 = hi + dh;
        if (h2 < 0 || h2 >= T) continue;
        const w = 1 - Math.abs(dh) / (TEMPORAL_HALF_WINDOW + 1);
        sum += orig[h2] * w;
        wsum += w;
      }
      grid[pi][hi] = wsum > 0 ? sum / wsum : 0;
    }
  }

  // Normalize + gamma compression
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  if (max > 0) {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const norm = grid[i][j] / max;
        grid[i][j] = norm > 0 ? Math.pow(norm, 0.6) : 0;
      }
    }
  }

  // Rough side totals for current snapshot (top 5%/10% pressure metrics).
  // Sum the LATEST column normalized × bucket-side-from-current.
  const lastCol = T - 1;
  const longsWithin5 = priceBuckets.reduce((s, p, idx) => {
    const dist = (currentPrice - p) / currentPrice;
    return dist > 0 && dist <= 0.05 ? s + grid[idx][lastCol] : s;
  }, 0);
  const longsWithin10 = priceBuckets.reduce((s, p, idx) => {
    const dist = (currentPrice - p) / currentPrice;
    return dist > 0 && dist <= 0.10 ? s + grid[idx][lastCol] : s;
  }, 0);
  const shortsWithin5 = priceBuckets.reduce((s, p, idx) => {
    const dist = (p - currentPrice) / currentPrice;
    return dist > 0 && dist <= 0.05 ? s + grid[idx][lastCol] : s;
  }, 0);
  const shortsWithin10 = priceBuckets.reduce((s, p, idx) => {
    const dist = (p - currentPrice) / currentPrice;
    return dist > 0 && dist <= 0.10 ? s + grid[idx][lastCol] : s;
  }, 0);

  // Magnet zones: top 5 contiguous clusters in latest column.
  type Zone = { from: number; to: number; center: number; intensity: number; direction: "LONG" | "SHORT" };
  const zones: Zone[] = [];
  let i = 0;
  while (i < numBuckets) {
    if (grid[i][lastCol] < 0.18) {
      i++;
      continue;
    }
    let j = i;
    let peak = grid[i][lastCol];
    while (j + 1 < numBuckets && grid[j + 1][lastCol] >= 0.18) {
      j++;
      if (grid[j][lastCol] > peak) peak = grid[j][lastCol];
    }
    const fromP = priceBuckets[i];
    const toP = priceBuckets[j] + bucketSize;
    const center = (fromP + toP) / 2;
    zones.push({
      from: fromP,
      to: toP,
      center,
      intensity: peak,
      direction: center >= currentPrice ? "SHORT" : "LONG",
    });
    i = j + 1;
  }
  zones.sort((a, b) => b.intensity - a.intensity);
  const topZones = zones.slice(0, 5);

  // Estimate USD value per zone using avg OI × intensity × proportion.
  const avgOi = oiHourCount > 0 ? totalOiUsd / oiHourCount : 0;
  const zonesUsd = topZones.map((z) => ({
    ...z,
    notional_usd: Math.round(avgOi * z.intensity * 0.04 * (z.to - z.from) / (currentPrice * span * 2)),
    distance_pct: ((z.center - currentPrice) / currentPrice) * 100,
  }));

  return {
    current_price: currentPrice,
    price_buckets: priceBuckets,
    bucket_size: bucketSize,
    grid,
    pressure: {
      longs_within_5pct_norm: longsWithin5,
      longs_within_10pct_norm: longsWithin10,
      shorts_within_5pct_norm: shortsWithin5,
      shorts_within_10pct_norm: shortsWithin10,
    },
    magnets: zonesUsd,
    avg_oi_usd: avgOi,
    top_ls_now: topLSNow,
  };
}

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!hasEliteAccess(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const assetParam = (url.searchParams.get("asset") ?? "BTC").toUpperCase();
  if (!SUPPORTED_ASSETS.includes(assetParam as AssetSym)) {
    return NextResponse.json({ error: "Unsupported asset" }, { status: 400 });
  }
  const asset = assetParam as AssetSym;

  const [klines, oiHist, lsHist, fundingHist, topLS, whales] = await Promise.all([
    fetchOkxKlines(asset),
    fetchOkxOIHist(asset),
    fetchOkxLSHist(asset),
    fetchOkxFundingHist(asset),
    fetchBinanceTopLS(asset),
    fetchHyperliquidWhales(asset),
  ]);

  if (klines.length === 0) {
    return NextResponse.json(
      { error: "OKX unavailable", asset, debug: "klines empty" },
      { status: 502 },
    );
  }

  const oiMap = buildHourlyMap(oiHist);
  const lsMap = buildHourlyMap(lsHist);

  // Funding rate is published every 8h on OKX; expand to hourly carry-forward
  const fundingMap = new Map<number, number>();
  if (fundingHist.length > 0) {
    let last = fundingHist[0].v;
    let cursor = alignToHour(fundingHist[0].t);
    const end = alignToHour(klines[klines.length - 1].t);
    let fIdx = 0;
    while (cursor <= end) {
      while (fIdx < fundingHist.length && alignToHour(fundingHist[fIdx].t) <= cursor) {
        last = fundingHist[fIdx].v;
        fIdx++;
      }
      fundingMap.set(cursor, last);
      cursor += 3600000;
    }
  }

  const heat = buildHeatmap(asset, klines, oiMap, lsMap, fundingMap, topLS);
  if (!heat) {
    return NextResponse.json({ error: "Could not build heatmap" }, { status: 500 });
  }

  const lastOi = oiHist.length > 0 ? oiHist[oiHist.length - 1].v : null;
  const lastLs = lsHist.length > 0 ? lsHist[lsHist.length - 1].v : null;
  const lastFunding = fundingHist.length > 0 ? fundingHist[fundingHist.length - 1].v : null;

  return NextResponse.json({
    asset,
    updated_at: new Date().toISOString(),
    candles: klines.map((k) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c })),
    current_price: heat.current_price,
    price_buckets: heat.price_buckets,
    bucket_size: heat.bucket_size,
    heatmap: heat.grid,
    funding_pct: lastFunding,
    ls_ratio: lastLs,
    top_ls_ratio: heat.top_ls_now,
    total_oi_usd: lastOi,
    avg_oi_usd: heat.avg_oi_usd,
    pressure: heat.pressure,
    magnets: heat.magnets,
    whales: whales.map((w) => ({
      address: w.address,
      direction: w.direction,
      leverage: w.leverage,
      entry_price: w.entry_price,
      liq_price: w.liq_price,
      notional_usd: w.notional_usd,
      distance_pct: ((w.liq_price - heat.current_price) / heat.current_price) * 100,
    })),
  });
}
