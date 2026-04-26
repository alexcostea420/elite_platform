import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { PortfolioClient, type Holding } from "./portfolio-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Portofoliul Tău | Armata de Traderi",
  description:
    "Tracker portofoliu Elite: introdu pozițiile tale (crypto, acțiuni, cash) și vezi P&L live, expunere totală și performanță.",
  keywords: ["portofoliu crypto", "portfolio tracker", "tracker poziții", "elite trading"],
  path: "/dashboard/portfolio",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function PortfolioPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/portfolio");

  const { data: profile } = await supabase
    .from("profiles")
    .select(`full_name, ${ELITE_PROFILE_COLUMNS}`)
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const { data: holdings } = await supabase
    .from("portfolio_holdings")
    .select("id, asset_type, ticker, quantity, entry_price, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="section-label mb-2">Tracker Privat</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Portofoliul Tău</h1>
          <p className="mt-2 text-sm text-slate-500">
            Introdu pozițiile tale și vezi P&L live, expunere totală și performanță. Datele sunt private — doar tu le vezi.
          </p>
        </div>
        <PortfolioClient initialHoldings={(holdings ?? []) as Holding[]} />
      </main>
      <Footer compact />
    </>
  );
}
