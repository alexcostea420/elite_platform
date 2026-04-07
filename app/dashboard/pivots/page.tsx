import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import PivotsDashboard from "@/components/dashboard/pivots-dashboard";
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

  // Admin - render native Next.js dashboard (no Container wrapper - full-width)
  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-20">
        <PivotsDashboard />
      </main>
      <Footer compact />
    </>
  );
}
