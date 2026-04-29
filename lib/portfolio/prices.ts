/**
 * Price fetch + cache for the portfolio tracker.
 *
 * Strategy:
 *   - Current prices: 1h TTL in portfolio_price_cache (on_date = NULL).
 *   - Historical prices (specific date): persistent in cache (on_date = date).
 *   - Cache writes use service-role to bypass RLS — reads use anon.
 *   - BET (TVBETETF.RO) is fetched in RON, then converted to USD via the
 *     RON/USD rate fetched alongside.
 */

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

import { getAsset, type Asset } from "./assets";

const CURRENT_TTL_MS = 60 * 60 * 1000;
const CG_BASE = "https://api.coingecko.com/api/v3";
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

type CachedPrice = {
  price_usd: number;
  fetched_at: string;
  source: string;
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ddmmyyyy(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

async function readCache(assetKey: string, onDate: string | null): Promise<CachedPrice | null> {
  const supabase = createServiceRoleSupabaseClient();
  const query = supabase
    .from("portfolio_price_cache")
    .select("price_usd, fetched_at, source")
    .eq("asset_key", assetKey);
  const { data } = onDate
    ? await query.eq("on_date", onDate).maybeSingle()
    : await query.is("on_date", null).maybeSingle();
  if (!data) return null;
  return {
    price_usd: Number(data.price_usd),
    fetched_at: data.fetched_at,
    source: data.source,
  };
}

async function writeCache(
  assetKey: string,
  onDate: string | null,
  priceUsd: number,
  source: string,
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("portfolio_price_cache").upsert(
    {
      asset_key: assetKey,
      on_date: onDate,
      price_usd: priceUsd,
      source,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "asset_key,on_date" },
  );
}

// ---------------------------------------------------------------------------
// FX: RON -> USD (used only for BET index)
// ---------------------------------------------------------------------------

async function getRonUsdRate(): Promise<number | null> {
  const cached = await readCache("fx:RONUSD", null);
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CURRENT_TTL_MS) {
    return cached.price_usd;
  }
  try {
    const r = await fetch("https://api.exchangerate.host/latest?base=RON&symbols=USD", {
      cache: "no-store",
    });
    const j = await r.json();
    const rate = j?.rates?.USD;
    if (typeof rate !== "number" || !isFinite(rate) || rate <= 0) return cached?.price_usd ?? null;
    await writeCache("fx:RONUSD", null, rate, "exchangerate.host");
    return rate;
  } catch {
    return cached?.price_usd ?? null;
  }
}

async function getRonUsdRateOn(onDate: string): Promise<number | null> {
  const cached = await readCache("fx:RONUSD", onDate);
  if (cached) return cached.price_usd;
  try {
    const r = await fetch(`https://api.exchangerate.host/${onDate}?base=RON&symbols=USD`, {
      cache: "no-store",
    });
    const j = await r.json();
    const rate = j?.rates?.USD;
    if (typeof rate !== "number" || !isFinite(rate) || rate <= 0) return null;
    await writeCache("fx:RONUSD", onDate, rate, "exchangerate.host");
    return rate;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Current prices
// ---------------------------------------------------------------------------

async function fetchCryptoCurrentPriceUsd(coingeckoId: string): Promise<number | null> {
  try {
    const r = await fetch(
      `${CG_BASE}/simple/price?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=usd`,
      { cache: "no-store" },
    );
    const j = await r.json();
    const price = j?.[coingeckoId]?.usd;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchYahooCurrent(symbol: string): Promise<{ price: number; currency: string } | null> {
  try {
    const r = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(symbol)}?range=5d&interval=1d`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;
    const currency = result?.meta?.currency ?? "USD";
    if (typeof price !== "number" || !(price > 0)) return null;
    return { price, currency };
  } catch {
    return null;
  }
}

export async function getCurrentPriceUsd(assetKey: string): Promise<number | null> {
  const cached = await readCache(assetKey, null);
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CURRENT_TTL_MS) {
    return cached.price_usd;
  }

  const asset = getAsset(assetKey);
  if (!asset) return cached?.price_usd ?? null;

  let price: number | null = null;
  let source = "unknown";

  if (asset.type === "crypto" && asset.coingeckoId) {
    price = await fetchCryptoCurrentPriceUsd(asset.coingeckoId);
    source = "coingecko";
  } else if ((asset.type === "stock" || asset.type === "index") && asset.yahooSymbol) {
    const y = await fetchYahooCurrent(asset.yahooSymbol);
    if (y) {
      if (y.currency === "USD") {
        price = y.price;
        source = "yahoo";
      } else if (y.currency === "RON") {
        const fx = await getRonUsdRate();
        if (fx) {
          price = y.price * fx;
          source = "yahoo+fx";
        }
      }
    }
  }

  if (price != null && price > 0) {
    await writeCache(assetKey, null, price, source);
    return price;
  }
  return cached?.price_usd ?? null;
}

export async function getCurrentPricesUsd(
  assetKeys: string[],
): Promise<Record<string, number | null>> {
  const out: Record<string, number | null> = {};
  await Promise.all(
    assetKeys.map(async (k) => {
      out[k] = await getCurrentPriceUsd(k);
    }),
  );
  return out;
}

// ---------------------------------------------------------------------------
// Historical prices
// ---------------------------------------------------------------------------

async function fetchCryptoHistoricalUsd(
  coingeckoId: string,
  date: Date,
): Promise<number | null> {
  try {
    const r = await fetch(
      `${CG_BASE}/coins/${coingeckoId}/history?date=${ddmmyyyy(date)}&localization=false`,
      { cache: "no-store" },
    );
    const j = await r.json();
    const price = j?.market_data?.current_price?.usd;
    return typeof price === "number" && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function fetchYahooHistorical(
  symbol: string,
  date: Date,
): Promise<{ price: number; currency: string } | null> {
  try {
    const start = Math.floor(new Date(date.getTime() - 5 * 24 * 3600_000).getTime() / 1000);
    const end = Math.floor(new Date(date.getTime() + 5 * 24 * 3600_000).getTime() / 1000);
    const r = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(symbol)}?period1=${start}&period2=${end}&interval=1d`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    const ts: number[] = result?.timestamp ?? [];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const currency = result?.meta?.currency ?? "USD";
    const target = Math.floor(date.getTime() / 1000);

    let bestIdx = -1;
    let bestDiff = Infinity;
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c == null || !isFinite(c)) continue;
      const diff = Math.abs(ts[i] - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }

    if (bestIdx < 0) return null;
    const price = closes[bestIdx];
    if (price == null || !(price > 0)) return null;
    return { price, currency };
  } catch {
    return null;
  }
}

export async function getHistoricalPriceUsd(
  assetKey: string,
  isoDate: string,
): Promise<number | null> {
  const cached = await readCache(assetKey, isoDate);
  if (cached) return cached.price_usd;

  const asset = getAsset(assetKey);
  if (!asset) return null;

  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  let price: number | null = null;
  let source = "unknown";

  if (asset.type === "crypto" && asset.coingeckoId) {
    price = await fetchCryptoHistoricalUsd(asset.coingeckoId, date);
    source = "coingecko";
  } else if ((asset.type === "stock" || asset.type === "index") && asset.yahooSymbol) {
    const y = await fetchYahooHistorical(asset.yahooSymbol, date);
    if (y) {
      if (y.currency === "USD") {
        price = y.price;
        source = "yahoo";
      } else if (y.currency === "RON") {
        const fx = await getRonUsdRateOn(isoDate);
        if (fx) {
          price = y.price * fx;
          source = "yahoo+fx";
        }
      }
    }
  }

  if (price != null && price > 0) {
    await writeCache(assetKey, isoDate, price, source);
    return price;
  }
  return null;
}

export type AssetWithCurrentPrice = Asset & { currentPriceUsd: number | null };

export async function listAssetsWithPrices(
  assetKeys: string[],
): Promise<AssetWithCurrentPrice[]> {
  const prices = await getCurrentPricesUsd(assetKeys);
  return assetKeys
    .map((k) => {
      const a = getAsset(k);
      if (!a) return null;
      return { ...a, currentPriceUsd: prices[k] ?? null };
    })
    .filter((x): x is AssetWithCurrentPrice => x !== null);
}
