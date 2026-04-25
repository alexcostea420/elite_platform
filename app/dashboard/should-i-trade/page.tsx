import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import IntradayDashboard from "@/components/dashboard/intraday-dashboard";
import { TimeGateLock } from "@/components/dashboard/time-gate-lock";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getIntradaySignal } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { getDaysUntilUnlock, hasPassedTimeGate } from "@/lib/utils/time-gate";

export const metadata: Metadata = buildPageMetadata({
  title: "Should I Trade? | Decizia Intraday",
  description:
    "Suport decizional intraday BTC: bias direcțional, RSI multi-TF, setup-uri long/short/squeeze, whale flow, niveluri pivot și VWAP. Actualizare la 60s.",
  keywords: ["should i trade", "intraday btc", "decizie trading crypto", "elite trading"],
  path: "/dashboard/should-i-trade",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function ShouldITradePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/should-i-trade");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, elite_since, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

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
              <TimeGateLock daysRemaining={daysRemaining} featureName="Should I Trade" />
            </Container>
          </main>
          <Footer compact />
        </>
      );
    }
  }

  const intraday = await getIntradaySignal();

  if (!intraday) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center">
              <div className="font-data text-5xl text-slate-600">--</div>
              <h2 className="mt-4 text-xl font-bold text-white">Date intraday indisponibile</h2>
              <p className="mt-2 text-sm text-slate-500">
                Semnalul intraday se actualizează la 5 minute. Încearcă din nou în câteva minute.
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
      <IntradayDashboard initialData={intraday} />
      <Footer compact />
    </>
  );
}
