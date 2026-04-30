import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ExchangeFlowsPanel } from "@/components/dashboard/exchange-flows-panel";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMacroDashboard } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { MacroClient } from "./macro-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Macro Dashboard | Analiza Macro si Lichiditate",
  description:
    "Dashboard macro complet: lichiditate globala, rate, credit, calendar economic, regim macro. Date live din FRED, Yahoo, CoinGecko.",
  keywords: ["macro dashboard", "lichiditate", "m2", "dxy", "fed", "calendar economic", "btc macro"],
  path: "/dashboard/macro",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function MacroPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/macro");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const macroData = await getMacroDashboard();

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="min-h-screen bg-surface-night pb-16 pt-24 md:pt-28">
        <Container className="max-w-7xl">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Dashboard · Macro Intelligence
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Macro Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Lichiditate, rate, credit, cross-asset și calendar economic. Actualizat la fiecare 4 ore.
            </p>
          </header>
          <MacroClient initialData={macroData} />
          <div className="mt-8">
            <ExchangeFlowsPanel />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
