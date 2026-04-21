import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PivotsDashboard from "@/components/dashboard/pivots-dashboard";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Pivoți BTC | Timing Research Dashboard",
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
    .select("full_name, subscription_tier, subscription_status, role")
    .eq("id", user.id)
    .maybeSingle();

  const isElite =
    profile?.role === "admin" ||
    (profile?.subscription_tier === "elite" && profile?.subscription_status === "active");

  if (!isElite) redirect("/upgrade?from=pivots");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

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
