import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WalletConnectForm } from "@/components/bots/wallet-connect-form";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Abonare Bot Trading | Conectează Wallet",
  description: "Conectează-ți wallet-ul Hyperliquid și activează botul de trading automat.",
  keywords: ["abonare bot trading", "copytrade", "hyperliquid bot"],
  path: "/bots/subscribe",
  host: "app",
  index: false,
});

export default async function BotSubscribePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/bots/subscribe");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, bot_active")
    .eq("id", user.id)
    .maybeSingle();

  // Check if already has wallet connected
  const { data: wallet } = await supabase
    .from("bot_wallets")
    .select("hl_address, is_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isElite = profile?.subscription_tier === "elite";

  // If wallet already connected and verified, go to dashboard
  if (wallet?.is_verified && profile?.bot_active) {
    redirect("/bots/dashboard");
  }

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Bot Trading Automat
            </p>
            <h1 className="text-4xl font-bold text-white">
              Conectează <span className="gradient-text">Hyperliquid</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Introdu adresa wallet-ului și cheia API pentru a activa copierea automată a tranzacțiilor.
            </p>
          </section>

          {/* Wallet connect form (client component) */}
          <WalletConnectForm isElite={isElite} />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
