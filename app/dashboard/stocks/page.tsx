import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { StocksClient } from "./stocks-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Stocks Tracker | Zone Buy & Sell",
  description:
    "Portofoliu stocks cu zone de Buy și Sell, prețuri live, semnale. Exclusiv membrii Elite.",
  keywords: [
    "stocks tracker",
    "buy sell zones",
    "targets elite",
    "portofoliu acțiuni",
  ],
  path: "/dashboard/stocks",
  host: "app",
});

export default async function StocksPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/stocks");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <Link
                className="text-sm text-slate-500 hover:text-accent-emerald"
                href="/dashboard"
              >
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Stocks
              </p>
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Portofoliu <span className="gradient-text">Stocks</span>
            </h1>
            <p className="mt-2 text-slate-400">
              16 acțiuni tech și crypto cu zone de cumpărare și vânzare. Prețuri live de la Finviz.
            </p>
          </section>

          <StocksClient />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
