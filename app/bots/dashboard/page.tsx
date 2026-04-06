import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { pauseBotAction } from "@/app/bots/actions";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Dashboard | Tranzacțiile Tale Automate",
  description: "Dashboard-ul personal al botului de trading: PnL, poziții deschise, istoric tranzacții.",
  keywords: ["bot dashboard", "copytrade dashboard", "trading automat"],
  path: "/bots/dashboard",
  host: "app",
  index: false,
});

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: string | null) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

function maskWallet(addr: string | null) {
  if (!addr) return "--";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type BotDashboardPageProps = {
  searchParams?: { error?: string; message?: string };
};

export default async function BotDashboardPage({ searchParams }: BotDashboardPageProps) {
  // Bot is Coming Soon
  return (
    <>
      <Navbar mode="dashboard" />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="panel mx-auto max-w-2xl p-8 text-center md:p-12">
            <div className="mb-4 text-5xl">🤖</div>
            <h2 className="text-3xl font-bold text-white">Bot Dashboard</h2>
            <p className="mt-2 text-xl font-semibold text-accent-emerald">Coming Soon</p>
            <p className="mx-auto mt-4 max-w-lg text-slate-400">Dashboard-ul botului de trading este in dezvoltare.</p>
            <Link className="accent-button mt-6 inline-block" href="/dashboard">Inapoi la Dashboard</Link>
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );

}
