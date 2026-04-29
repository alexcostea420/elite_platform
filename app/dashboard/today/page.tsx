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
import { getRiskScoreV2 } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { TodayClient, type TodaySnapshot } from "./today-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Astăzi | Armata de Traderi",
  description:
    "Digest zilnic Elite: Risk Score curent, sentiment whale, calendar economic, știri critice. Tot ce trebuie să știi azi într-un singur loc.",
  keywords: ["digest crypto", "today crypto", "elite dashboard", "armata de traderi"],
  path: "/dashboard/today",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function TodayPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/today");

  const { data: profile } = await supabase
    .from("profiles")
    .select(`full_name, ${ELITE_PROFILE_COLUMNS}`)
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const serviceSupabase = createServiceRoleSupabaseClient();
  const [risk, consensusRes, walletsCountRes] = await Promise.all([
    getRiskScoreV2(),
    serviceSupabase
      .from("whale_consensus")
      .select("asset,long_count,short_count,net_long_notional_usd,dominant_side,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50),
    serviceSupabase
      .from("whale_wallets")
      .select("address", { count: "exact", head: true }),
  ]);

  const consensus = consensusRes.data ?? [];
  const walletCount = walletsCountRes.count ?? 0;
  const totalLongUsd = consensus
    .filter((c) => c.dominant_side === "LONG")
    .reduce((sum, c) => sum + Math.abs(c.net_long_notional_usd ?? 0), 0);
  const totalShortUsd = consensus
    .filter((c) => c.dominant_side === "SHORT")
    .reduce((sum, c) => sum + Math.abs(c.net_long_notional_usd ?? 0), 0);
  const netSentiment = totalLongUsd - totalShortUsd;
  const sentimentLabel =
    walletCount === 0
      ? "Indisponibil"
      : netSentiment > totalShortUsd * 0.5
        ? "Bullish"
        : netSentiment < -totalLongUsd * 0.5
          ? "Bearish"
          : "Neutru";

  const topAssets = consensus
    .slice()
    .sort(
      (a, b) =>
        Math.abs(b.net_long_notional_usd ?? 0) - Math.abs(a.net_long_notional_usd ?? 0),
    )
    .slice(0, 3)
    .map((c) => ({
      asset: c.asset,
      net_notional_usd: c.net_long_notional_usd ?? 0,
      long_count: c.long_count ?? 0,
      short_count: c.short_count ?? 0,
      side: c.dominant_side ?? "FLAT",
    }));

  const whaleUpdated = consensus[0]?.updated_at ?? null;

  const snapshot: TodaySnapshot = {
    risk: risk
      ? {
          score: risk.score,
          decision: risk.decision,
          decision_text: risk.decision_text,
          conviction: risk.conviction,
          btc_price: risk.btc_price_live ?? risk.btc_price ?? 0,
          btc_24h_change: risk.btc_24h_change ?? null,
          pct_from_ath: risk.pct_from_ath,
          fear_greed_value: risk.fear_greed?.value ?? null,
          fear_greed_label: risk.fear_greed?.label ?? null,
          updated: risk.timestamp,
        }
      : null,
    whale:
      walletCount > 0 && consensus.length > 0
        ? {
            net_sentiment: netSentiment,
            sentiment_label: sentimentLabel,
            smart_long_usd: totalLongUsd,
            smart_short_usd: totalShortUsd,
            wallet_count: walletCount,
            top_assets: topAssets,
            updated: whaleUpdated ?? new Date().toISOString(),
          }
        : null,
  };

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="section-label mb-2">Digest Zilnic Elite</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Astăzi pe piață</h1>
          <p className="mt-2 text-sm text-slate-500">
            Tot ce trebuie să știi azi: Risk Score, sentiment whale, evenimente economice și știri critice. Citește 2 minute, decide cu cap rece.
          </p>
        </div>
        <TodayClient snapshot={snapshot} />
      </main>
      <Footer compact />
    </>
  );
}
