import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOURS = 168; // 7 days × 24h
const BUCKET_SPAN_PCT = 0.12; // build buckets across ±12% from current price

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
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function fetchKlines(): Promise<Kline[]> {
  const data = await fetchJson<unknown[]>(
    `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=${HOURS}`,
  );
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => {
      if (!Array.isArray(row) || row.length < 7) return null;
      return {
        t: Number(row[0]),
        o: Number(row[1]),
        h: Number(row[2]),
        l: Number(row[3]),
        c: Number(row[4]),
        v: Number(row[5]),
      } as Kline;
    })
    .filter((k): k is Kline => k !== null && Number.isFinite(k.o));
}

async function fetchOI(): Promise<OISnap[]> {
  const data = await fetchJson<Array<{ timestamp: number; sumOpenInterestValue: string }>>(
    `https://fapi.binance.com/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=${HOURS}`,
  );
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => ({
      t: Number(row.timestamp),
      oi_usd: Number(row.sumOpenInterestValue),
    }))
    .filter((s) => Number.isFinite(s.oi_usd) && s.oi_usd > 0);
}

async function fetchFundingNow(): Promise<{ funding_pct: number } | null> {
  const data = await fetchJson<Array<{ fundingRate: string }>>(
    `https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`,
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  const r = Number(data[0].fundingRate);
  return Number.isFinite(r) ? { funding_pct: r * 100 } : null;
}

async function fetchLSNow(): Promise<{ ls_ratio: number } | null> {
  const data = await fetchJson<Array<{ longShortRatio: string }>>(
    `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1`,
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  const r = Number(data[0].longShortRatio);
  return Number.isFinite(r) ? { ls_ratio: r } : null;
}

function buildHeatmap(klines: Kline[], oi: OISnap[]) {
  if (klines.length === 0) {
    return null;
  }

  const currentPrice = klines[klines.length - 1].c;
  const minBucket = currentPrice * (1 - BUCKET_SPAN_PCT);
  const maxBucket = currentPrice * (1 + BUCKET_SPAN_PCT);
  const bucketSize = Math.max(50, Math.round((maxBucket - minBucket) / 80 / 50) * 50); // ~80 rows, snap to $50
  const numBuckets = Math.ceil((maxBucket - minBucket) / bucketSize);
  const priceBuckets: number[] = [];
  for (let i = 0; i < numBuckets; i++) {
    priceBuckets.push(Math.round(minBucket + i * bucketSize));
  }

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

  for (let hi = 0; hi < klines.length; hi++) {
    const k = klines[hi];
    const hourKey = Math.floor(k.t / 3600000) * 3600000;
    const oiUsd = oiByHour.get(hourKey) ?? 0;
    if (oiUsd === 0) continue;

    const lo = Math.max(minBucket, Math.min(k.l, k.h));
    const hi_ = Math.min(maxBucket, Math.max(k.l, k.h));
    if (hi_ <= lo) continue;

    const startIdx = Math.max(0, Math.floor((lo - minBucket) / bucketSize));
    const endIdx = Math.min(numBuckets - 1, Math.floor((hi_ - minBucket) / bucketSize));
    const bucketCount = endIdx - startIdx + 1;
    if (bucketCount <= 0) continue;

    // Volume-weighted: spread OI across the candle's price range, weighted by hourly volume
    const weight = oiUsd * Math.min(1, k.v / 1000); // dampen huge volumes
    const perBucket = weight / bucketCount;

    for (let pi = startIdx; pi <= endIdx; pi++) {
      grid[pi][hi] += perBucket;
    }
  }

  // Normalize per global max → 0..1
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  if (max > 0) {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        grid[i][j] = grid[i][j] / max;
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

  const [klines, oi, funding, ls] = await Promise.all([
    fetchKlines(),
    fetchOI(),
    fetchFundingNow(),
    fetchLSNow(),
  ]);

  if (klines.length === 0) {
    return NextResponse.json({ error: "Binance unavailable" }, { status: 502 });
  }

  const heatmap = buildHeatmap(klines, oi);
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
