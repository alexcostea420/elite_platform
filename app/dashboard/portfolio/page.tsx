import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PortfolioDashboard } from "@/components/portfolio/portfolio-dashboard";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Portofoliul Tău | Armata de Traderi",
  description:
    "Tracker portofoliu Elite: introdu tranzacțiile (crypto + acțiuni + BET), vezi P&L real și compară cu alternative — ce s-ar fi întâmplat dacă alegeai altceva.",
  keywords: ["portofoliu crypto", "portfolio tracker", "what if", "elite trading"],
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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28">
        <header className="mb-8">
          <div className="flex items-center gap-2">
            <p className="section-label">Tracker Privat</p>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Admin only · beta
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Portofoliul Tău</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Adaugă tranzacțiile reale (crypto + acțiuni US + BET). Calculez automat
            cost mediu, valoare curentă, P&amp;L. Și un &ldquo;What if&rdquo; — ce-ai fi avut acum
            dacă cumpărai altceva pe aceeași dată cu aceiași bani.
          </p>
        </header>

        <PortfolioDashboard />
      </main>
      <Footer compact />
    </>
  );
}
