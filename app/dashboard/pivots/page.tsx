import type { Metadata } from "next";
import { redirect } from "next/navigation";

import PivotsDashboard from "@/components/dashboard/pivots-dashboard";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ComingSoon } from "@/components/ui/coming-soon";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
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
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <ComingSoon
            icon="🔮"
            description="Dashboard-ul de Pivoți BTC va fi disponibil în curând. Lucrăm la el!"
          />
        </main>
        <Footer compact />
      </>
    );
  }

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="min-h-screen bg-surface-night pb-16 pt-20">
        <PivotsDashboard />
      </main>
      <Footer compact />
    </>
  );
}
