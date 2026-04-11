import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWhaleData } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { WhaleTrackerClient } from "./whale-tracker-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Whale Tracker | Pozitionare Smart Money",
  description:
    "Urmareste pozitionarea smart money in timp real. Divergente, semnale si sentiment. Exclusiv Elite.",
  keywords: ["whale tracker", "smart money", "pozitionare crypto", "divergenta on-chain"],
  path: "/dashboard/whale-tracker",
  host: "app",
  index: false,
});

export const revalidate = 0;

export default async function WhaleTrackerPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/whale-tracker");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite" && profile?.role !== "admin") {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  if (profile?.role !== "admin") {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center md:p-12">
              <div className="mb-4 text-5xl">🚀</div>
              <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">Aceasta sectiune va fi disponibila in curand.</p>
              <a className="accent-button mt-6 inline-block" href="/dashboard">Inapoi la Dashboard</a>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const whaleData = await getWhaleData();

  if (!whaleData) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <div className="mb-8 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <span className="text-slate-700">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Whale Tracker</p>
            </div>
            <section className="panel p-8 text-center">
              <div className="text-5xl">--</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-3 text-slate-400">
                Datele whale tracker nu au putut fi incarcate. Incearca din nou mai tarziu.
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
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <div className="mb-6 rounded-xl border border-warning/20 bg-warning/5 px-5 py-3">
            <p className="text-sm text-yellow-400 font-medium">Beta — Date în curs de activare. Unele valori pot fi incomplete.</p>
          </div>
          <WhaleTrackerClient data={whaleData} />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
