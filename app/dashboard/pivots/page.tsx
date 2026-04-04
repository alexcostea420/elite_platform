import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Pivoti BTC | Timing Research Dashboard",
  description: "Dashboard de research Bitcoin bazat pe timing: eclipse, Fibonacci, Gann, cicluri. Elite only.",
  keywords: ["pivoti btc", "bitcoin timing", "eclipse crypto", "fibonacci time", "gann cycles"],
  path: "/dashboard/pivots",
  host: "app",
  index: false,
});

export default async function PivotsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/pivots");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="panel p-8 text-center md:p-12">
              <div className="mb-4 text-5xl">🚀</div>
              <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">
                Dashboard-ul de Pivoti BTC va fi disponibil in curand. Lucram la el!
              </p>
              <Link className="accent-button mt-6 inline-block" href="/dashboard">
                Inapoi la Dashboard
              </Link>
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
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="mb-4 flex items-center gap-3">
            <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
            <span className="text-slate-600">/</span>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Pivoti BTC</p>
          </div>
          <a
            href="/pivots/dashboard.html"
            target="_blank"
            rel="noreferrer"
            className="accent-button inline-flex items-center gap-2"
          >
            Deschide Dashboard Pivoti
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
            </svg>
          </a>
          <p className="mt-3 text-sm text-slate-500">Se deschide intr-un tab nou cu dashboard-ul complet.</p>
        </div>
        <iframe
          src="/pivots/dashboard.html"
          className="h-[calc(100vh-12rem)] w-full border-0"
          title="Elite Pivots Dashboard"
          sandbox="allow-scripts allow-same-origin"
        />
      </main>
    </>
  );
}
