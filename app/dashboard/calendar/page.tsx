import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { CalendarClient } from "./calendar-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Calendar Economic | Armata de Traderi",
  description: "Evenimente economice importante și impactul lor pe BTC. Fed, CPI, NFP, PIB.",
  keywords: ["calendar economic", "fed meeting", "cpi", "nfp", "impact btc"],
  path: "/dashboard/calendar",
  host: "app",
});

export default async function CalendarPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/calendar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Calendar Economic
            </p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Evenimente săptămâna asta
            </h1>
            <p className="mt-2 text-slate-400">
              Evenimente economice importante din SUA și impactul lor istoric pe BTC.
            </p>
          </div>
          <CalendarClient />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
