import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import RiskScoreDashboard from "@/components/dashboard/risk-score-dashboard";
import { TimeGateLock } from "@/components/dashboard/time-gate-lock";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMacroDashboard, getRiskScore, getRiskScoreV2 } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { getDaysUntilUnlock, hasPassedTimeGate } from "@/lib/utils/time-gate";

export const metadata: Metadata = buildPageMetadata({
  title: "Risk Score BTC | Analiza Riscului Crypto",
  description:
    "Scorul de risc BTC calculat din 14 indicatori on-chain, tehnici si macro. Exclusiv pentru membrii Elite.",
  keywords: ["risk score btc", "analiza risc crypto", "indicatori on-chain", "elite trading"],
  path: "/dashboard/risk-score",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function RiskScorePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/risk-score");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, elite_since, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isAdmin = profile?.role === "admin";

  // Time-gate (admins skip)
  if (!isAdmin) {
    const unlocked = hasPassedTimeGate(profile?.elite_since ?? null);
    if (!unlocked) {
      const daysRemaining = getDaysUntilUnlock(profile?.elite_since ?? null);
      return (
        <>
          <Navbar mode="dashboard" userIdentity={identity} />
          <main className="pb-16 pt-24 md:pt-28">
            <Container>
              <TimeGateLock daysRemaining={daysRemaining} featureName="Risk Score" />
            </Container>
          </main>
          <Footer compact />
        </>
      );
    }
  }

  // Try V2 first, fallback to V1
  const riskScore = (await getRiskScoreV2()) ?? (await getRiskScore());

  // Merge in macro values from macro_dashboard (V2 risk score script doesn't fetch them)
  if (riskScore) {
    const macroData = await getMacroDashboard();
    if (macroData?.metrics) {
      const m = macroData.metrics;
      riskScore.macro = {
        vix: m.vix?.value ?? riskScore.macro?.vix ?? 0,
        dxy: m.dxy?.value ?? riskScore.macro?.dxy ?? 0,
        us10y: m.nominal_yield_10y?.value ?? riskScore.macro?.us10y ?? 0,
        m2: m.m2?.value ?? riskScore.macro?.m2 ?? 0,
        unemployment: m.unemployment?.value ?? riskScore.macro?.unemployment ?? 0,
        fed_funds_rate: m.fed_funds_rate?.value ?? riskScore.macro?.fed_funds_rate ?? 0,
      };
    }
  }

  if (!riskScore) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center">
              <div className="font-data text-5xl">--</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-3 text-slate-400">
                Scorul de risc nu a putut fi încărcat. Încearcă din nou mai târziu.
              </p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <RiskScoreDashboard riskScore={riskScore} />
      <Footer compact />
    </>
  );
}
