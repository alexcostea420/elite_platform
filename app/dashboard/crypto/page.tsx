import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { CryptoClient } from "./crypto-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Crypto Screener | Zone Buy & Sell",
  description:
    "Top 20 criptomonede cu zone de cumpărare și vânzare, prețuri live. Exclusiv membrii Elite.",
  keywords: [
    "crypto screener",
    "buy sell zones crypto",
    "bitcoin targets",
    "altcoins",
  ],
  path: "/dashboard/crypto",
  host: "app",
});

export default async function CryptoPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/crypto");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

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
                Crypto Screener
              </p>
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Crypto <span className="gradient-text">Screener</span>
            </h1>
            <p className="mt-2 text-slate-400">
              Top 20 criptomonede cu zone de cumpărare și vânzare. Prețuri live de la CoinGecko.
            </p>
          </section>

          <CryptoClient />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
