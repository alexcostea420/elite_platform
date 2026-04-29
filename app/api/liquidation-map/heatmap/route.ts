import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOURS = 168; // 7 days × 24h
const BUCKET_SPAN_PCT = 0.18; // build buckets across ±18% from current price (covers 5x liq levels)
const NUM_ROWS = 110; // vertical resolution

// Retail leverage distribution (rough, based on Hyperliquid + CEX surveys)
const LEVERAGE_TIERS: Array<{ lev: number; weight: number }> = [
  { lev: 5, weight: 0.32 },
  { lev: 10, weight: 0.26 },
  { lev: 20, weight: 0.18 },
  { lev: 25, weight: 0.10 },
  { lev: 50, weight: 0.08 },
  { lev: 75, weight: 0.04 },
  { lev: 100, weight: 0.02 },
];
const MM_RATE = 0.005; // ~0.5% maintenance margin (BTC tier 1)
// Symmetric kernel applied around each projected liq price (smooths peaks)
const BLUR_KERNEL = [0.05, 0.15, 0.6, 0.15, 0.05];

type Kline = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type OISnap = { t: number; oi_usd: number };

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "EliteLiqMap/1.0" },
    });
    if (!r.ok) {
      console.error(`[liquidation-map] ${url} → HTTP ${r.status}`);
      return null;
    }
    return (await r.json()) as T;
  } catch (e) {
    console.error(`[liquidation-map] ${url} → fetch threw:`, e instanceof Error ? e.message : e);
    return null;
  }
}

type OkxEnvelope<T> = { code: string; data?: T };

async function fetchKlines(): Promise<Kline[]> {
  // OKX market candles: [ts, o, h, l, c, vol(contracts), volCcy(BTC), volCcyQuote(USD), confirm]
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/market/candles?instId=BTC-USDT-SWAP&bar=1H&limit=${HOURS}`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  // OKX returns newest-first; reverse to oldest-first
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
        v: Number(row[6]), // volCcy = volume in BTC
      } as Kline;
    })
    .filter((k): k is Kline => k !== null && Number.isFinite(k.o));
}

async function fetchOI(_currentPrice: number): Promise<OISnap[]> {
  // OKX returns OI in USD already: [ts, oiUSD, volUSD]
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=BTC&period=1H`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows)) return [];
  return rows
    .slice()
    .reverse()
    .map((row) => ({
      t: Number(row[0]),
      oi_usd: Number(row[1]),
    }))
    .filter((s) => Number.isFinite(s.oi_usd) && s.oi_usd > 0);
}

async function fetchFundingNow(): Promise<{ funding_pct: number } | null> {
  const data = await fetchJson<OkxEnvelope<Array<{ fundingRate: string }>>>(
    `https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = Number(rows[0].fundingRate);
  return Number.isFinite(r) ? { funding_pct: r * 100 } : null;
}

async function fetchLSNow(): Promise<{ ls_ratio: number } | null> {
  // OKX long/short account ratio: data is [[ts, ratio], ...] where ratio = longAcc/shortAcc
  const data = await fetchJson<OkxEnvelope<string[][]>>(
    `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=BTC&period=1H`,
  );
  const rows = data?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const r = Number(rows[0][1]);
  return Number.isFinite(r) ? { ls_ratio: r } : null;
}

function buildHeatmap(klines: Kline[], oi: OISnap[], lsRatioNow: number | null) {
  if (klines.length === 0) {
    return null;
  }

  const currentPrice = klines[klines.length - 1].c;
  const minBucket = currentPrice * (1 - BUCKET_SPAN_PCT);
  const maxBucket = currentPrice * (1 + BUCKET_SPAN_PCT);
  const bucketSize = (maxBucket - minBucket) / NUM_ROWS;
  const numBuckets = NUM_ROWS;
  const priceBuckets: number[] = [];
  for (let i = 0; i < numBuckets; i++) {
    priceBuckets.push(Math.round(minBucket + i * bucketSize));
  }

  // Long share from LS ratio (ratio = longs / shorts). Clamp to a reasonable band.
  let longShare = 0.5;
  if (lsRatioNow != null && Number.isFinite(lsRatioNow) && lsRatioNow > 0) {
    longShare = lsRatioNow / (lsRatioNow + 1);
    longShare = Math.max(0.35, Math.min(0.65, longShare));
  }
  const shortShare = 1 - longShare;

  // Index OI by hour timestamp for join with klines
  const oiByHour = new Map<number, number>();
  for (const s of oi) {
    const hourKey = Math.floor(s.t / 3600000) * 3600000;
    oiByHour.set(hourKey, s.oi_usd);
  }

  // grid[priceIdx][hourIdx]
  const grid: number[][] = Array.from({ length: numBuckets }, () =>
    new Array(klines.length).fill(0),
  );

  // Helper: stamp weighted cluster around a target liq price using blur kernel
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

  for (let hi = 0; hi < klines.length; hi++) {
    const k = klines[hi];
    const hourKey = Math.floor(k.t / 3600000) * 3600000;
    const oiUsd = oiByHour.get(hourKey) ?? 0;
    if (oiUsd === 0) continue;

    // Use close as the "average opening price" for that hour
    const refPrice = k.c;

    for (const tier of LEVERAGE_TIERS) {
      // Liq distance with maintenance margin. effective = (1 - MM_RATE * lev) / lev ≈ 1/lev - MM_RATE
      const liqDist = 1 / tier.lev - MM_RATE;
      if (liqDist <= 0) continue;

      const longLiq = refPrice * (1 - liqDist);
      const shortLiq = refPrice * (1 + liqDist);

      // Activity: weight slightly by hourly volume to reflect new positions opened
      const activity = 1 + Math.min(2, k.v / Math.max(1, oiUsd / refPrice / 50));
      const baseAmount = oiUsd * tier.weight * activity;

      stamp(longLiq, hi, baseAmount * longShare);
      stamp(shortLiq, hi, baseAmount * shortShare);
    }
  }

  // Normalize per global max → 0..1, then apply gentle log compression so a few mega-clusters
  // don't wash out the rest.
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  if (max > 0) {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        const norm = grid[i][j] / max;
        grid[i][j] = norm > 0 ? Math.pow(norm, 0.55) : 0;
      }
    }
  }

  return {
    current_price: currentPrice,
    price_buckets: priceBuckets,
    bucket_size: bucketSize,
    grid,
  };
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Klines first — needed to get current price for OI USD conversion
  const [klines, funding, ls] = await Promise.all([
    fetchKlines(),
    fetchFundingNow(),
    fetchLSNow(),
  ]);

  if (klines.length === 0) {
    console.error("[liquidation-map] klines empty — OKX kline endpoint failed");
    return NextResponse.json(
      { error: "OKX unavailable (klines empty)", debug: "kline-fetch-failed" },
      { status: 502 },
    );
  }

  const currentPrice = klines[klines.length - 1].c;
  const oi = await fetchOI(currentPrice);

  const heatmap = buildHeatmap(klines, oi, ls?.ls_ratio ?? null);
  if (!heatmap) {
    return NextResponse.json({ error: "Could not build heatmap" }, { status: 500 });
  }

  const total_oi_usd = oi.length > 0 ? oi[oi.length - 1].oi_usd : null;

  return NextResponse.json({
    asset: "BTC",
    updated_at: new Date().toISOString(),
    hours: klines.map((k) => k.t),
    candles: klines.map((k) => ({ t: k.t, o: k.o, h: k.h, l: k.l, c: k.c })),
    current_price: heatmap.current_price,
    price_buckets: heatmap.price_buckets,
    bucket_size: heatmap.bucket_size,
    heatmap: heatmap.grid,
    funding_pct: funding?.funding_pct ?? null,
    ls_ratio: ls?.ls_ratio ?? null,
    total_oi_usd,
  });
}
