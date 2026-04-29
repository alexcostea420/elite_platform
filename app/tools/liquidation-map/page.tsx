import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { LiquidationMapClient, type AssetLiqData, type LiqLevel } from "./liquidation-map-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Liquidation Map | Smart Money Hyperliquid | Armata de Traderi",
  description:
    "Vezi unde sunt nivelele de lichidare ale celor mai profitabile portofele de pe Hyperliquid. Estimează zonele de presiune.",
  keywords: ["liquidation map", "hyperliquid liquidations", "smart money liq levels", "whale liquidation"],
  path: "/tools/liquidation-map",
  host: "app",
  index: false,
});

export const revalidate = 0;

type WhalePositionRow = {
  address: string;
  asset: string;
  direction: "LONG" | "SHORT";
  size: number;
  entry_price: number;
  leverage: number;
  margin_used: number;
  notional_usd: number;
  snapshot_at: string;
};

async function fetchHyperliquidMids(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error(`Hyperliquid mids fetch failed: ${res.status}`);
      return {};
    }
    const data = (await res.json()) as Record<string, string>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(data)) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch (error) {
    console.error("Hyperliquid mids fetch error:", error);
    return {};
  }
}

/**
 * Estimated liquidation price (isolated-margin approximation).
 * Hyperliquid uses tiered maintenance margin; we use a simplified bound:
 *   LONG  liq ≈ entry × (1 − 1/leverage)
 *   SHORT liq ≈ entry × (1 + 1/leverage)
 * In reality liq triggers slightly earlier (maintenance margin), so
 * actual liq price is ~0.5–2% closer to spot than this estimate.
 */
function estimateLiqPrice(entry: number, leverage: number, direction: "LONG" | "SHORT"): number {
  if (!Number.isFinite(entry) || !Number.isFinite(leverage) || leverage <= 0) return 0;
  const buffer = 1 / leverage;
  return direction === "LONG" ? entry * (1 - buffer) : entry * (1 + buffer);
}

export default async function LiquidationMapPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/tools/liquidation-map");

  const { data: profile } = await supabase
    .from("profiles")
    .select(`full_name, ${ELITE_PROFILE_COLUMNS}`)
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade?from=liquidation-map");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const serviceSupabase = createServiceRoleSupabaseClient();
  const [positionsRes, mids] = await Promise.all([
    serviceSupabase
      .from("whale_positions")
      .select("address,asset,direction,size,entry_price,leverage,margin_used,notional_usd,snapshot_at")
      .eq("is_current", true),
    fetchHyperliquidMids(),
  ]);

  const positions = (positionsRes.data ?? []) as WhalePositionRow[];

  const byAsset = new Map<string, WhalePositionRow[]>();
  for (const p of positions) {
    if (!byAsset.has(p.asset)) byAsset.set(p.asset, []);
    byAsset.get(p.asset)!.push(p);
  }

  const assets: AssetLiqData[] = [];
  for (const [asset, rows] of byAsset.entries()) {
    const currentPrice = mids[asset] ?? 0;
    const totalLongNotional = rows
      .filter((r) => r.direction === "LONG")
      .reduce((s, r) => s + (r.notional_usd ?? 0), 0);
    const totalShortNotional = rows
      .filter((r) => r.direction === "SHORT")
      .reduce((s, r) => s + (r.notional_usd ?? 0), 0);

    const levels: LiqLevel[] = rows
      .map((r) => {
        const liqPrice = estimateLiqPrice(r.entry_price, r.leverage, r.direction);
        const distancePct = currentPrice > 0 ? ((liqPrice - currentPrice) / currentPrice) * 100 : 0;
        return {
          address: r.address,
          direction: r.direction,
          size: r.size,
          entry_price: r.entry_price,
          leverage: r.leverage,
          notional_usd: r.notional_usd,
          liq_price: liqPrice,
          distance_pct: distancePct,
        };
      })
      .filter((l) => l.liq_price > 0);

    assets.push({
      asset,
      current_price: currentPrice,
      total_long_notional: totalLongNotional,
      total_short_notional: totalShortNotional,
      levels: levels.sort((a, b) => Math.abs(a.distance_pct) - Math.abs(b.distance_pct)),
    });
  }

  // Sort assets by total exposure
  assets.sort(
    (a, b) =>
      b.total_long_notional + b.total_short_notional - (a.total_long_notional + a.total_short_notional),
  );

  const updatedAt = positions[0]?.snapshot_at ?? new Date().toISOString();

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="section-label mb-2">Smart Money · Hyperliquid</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Liquidation Map</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Unde s-ar lichida pozițiile celor mai profitabile 20 de portofele de pe Hyperliquid. Estimat din entry × (1 ± 1/leverage). Aglomerările apropiate de preț sunt zone de presiune unde poți vedea cascade.
          </p>
        </div>
        <LiquidationMapClient assets={assets} updatedAt={updatedAt} />
      </main>
      <Footer compact />
    </>
  );
}
