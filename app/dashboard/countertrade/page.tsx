import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CountertradeDashboard } from "@/components/dashboard/countertrade-dashboard";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Countertrade | YouTube Sentiment Analysis",
  description: "Analiza contrarian a sentimentului YouTuberilor crypto. Exclusiv Elite.",
  keywords: ["countertrade", "youtube sentiment", "contrarian analysis", "crypto sentiment"],
  path: "/dashboard/countertrade",
  host: "app",
  index: false,
});

export default async function CountertradePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/countertrade");

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
          <Container>
            <section className="panel p-8 text-center md:p-12">
              <div className="mb-4 text-5xl">🚀</div>
              <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">
                Analiza contrarian YouTube va fi disponibilă în curând.
              </p>
              <Link className="accent-button mt-6 inline-block" href="/dashboard">
                Înapoi la Dashboard
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
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <CountertradeDashboard />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
