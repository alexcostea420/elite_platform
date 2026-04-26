import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRiskScoreV2, getWhaleData } from "@/lib/trading-data";
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

  const [risk, whale] = await Promise.all([getRiskScoreV2(), getWhaleData()]);

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
    whale: whale
      ? {
          net_sentiment: whale.sentiment?.net_sentiment ?? 0,
          sentiment_label: whale.sentiment?.sentiment_label ?? "—",
          smart_long_usd: whale.sentiment?.total_smart_long_usd ?? 0,
          smart_short_usd: whale.sentiment?.total_smart_short_usd ?? 0,
          wallet_count: whale.wallet_count,
          top_assets: (whale.positioning ?? []).slice(0, 3).map((p) => ({
            asset: p.asset,
            price: p.price,
            smart_net_pct: p.smart_net_pct,
            signal: p.signal,
          })),
          updated: whale.timestamp,
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
