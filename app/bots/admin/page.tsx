import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { activateBotSubscriptionAction } from "@/app/bots/actions";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin Bot Trading | Gestionare Abonamente",
  description: "Panou admin pentru gestionarea abonamentelor bot trading.",
  keywords: ["admin bot", "manage subscriptions"],
  path: "/bots/admin",
  host: "admin",
  index: false,
});

type AdminBotsPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

const statusLabels: Record<string, string> = {
  active: "Activ",
  pending: "În așteptare",
  expired: "Expirat",
  cancelled: "Anulat",
};

const statusColors: Record<string, string> = {
  active: "bg-crypto-green/10 text-crypto-green",
  pending: "bg-amber-500/10 text-amber-300",
  expired: "bg-red-500/10 text-red-300",
  cancelled: "bg-slate-500/10 text-slate-400",
};

export default async function AdminBotsPage({ searchParams }: AdminBotsPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/bots/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");
  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  // ── Admin queries (bypass RLS) ──────────────────────────────────
  const admin = createServiceRoleSupabaseClient();

  const [subsResult, copyTradesResult, perfResult] = await Promise.all([
    admin
      .from("bot_subscriptions")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false }),
    admin
      .from("bot_copy_trades")
      .select("id, status"),
    admin
      .from("bot_performance")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const subscriptions = (subsResult.data ?? []) as Record<string, unknown>[];
  const copyTrades = (copyTradesResult.data ?? []) as Record<string, unknown>[];
  const latestPerf = perfResult.data as Record<string, unknown> | null;

  // ── Derived metrics ─────────────────────────────────────────────
  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const pendingSubs = subscriptions.filter((s) => s.status === "pending");
  const cancelledSubs = subscriptions.filter((s) => s.status === "cancelled");

  const mrr = activeSubs.reduce((sum, s) => sum + (Number(s.price_usd) || 0), 0);

  const totalCopyTrades = copyTrades.length;
  const closedTrades = copyTrades.filter((t) => t.status === "closed").length;
  const failedTrades = copyTrades.filter((t) => t.status === "failed").length;
  const successRate =
    closedTrades + failedTrades > 0
      ? ((closedTrades / (closedTrades + failedTrades)) * 100).toFixed(1)
      : "--";

  const flashMessage = searchParams?.message;
  const flashError = searchParams?.error;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* ── Breadcrumb / Header ──────────────────────────────── */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Link href="/admin/payments" className="hover:text-white transition">
                Admin
              </Link>
              <span>/</span>
              <span className="text-purple-400">Bot Management</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Admin Bot Trading
            </p>
            <h1 className="text-4xl font-bold text-white">Gestionare Abonamente Bot</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Monitorizează abonamentele bot trading, activează manual și controlează copierea.
            </p>
          </section>

          {/* ── Stats Row ────────────────────────────────────────── */}
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Total Abonați
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">
                {activeSubs.length}
              </h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                MRR
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-accent-emerald">
                ${mrr.toFixed(2)}
              </h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Trades Copiate
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-purple-400">
                {totalCopyTrades}
              </h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Rata Succes
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">
                {successRate === "--" ? successRate : `${successRate}%`}
              </h3>
            </article>
          </section>

          {/* ── Flash Messages ───────────────────────────────────── */}
          {flashMessage ? (
            <div className="mb-6 rounded-xl border border-crypto-green/20 bg-crypto-green/10 px-5 py-3 text-sm text-crypto-green">
              {flashMessage}
            </div>
          ) : null}
          {flashError ? (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">
              {flashError}
            </div>
          ) : null}

          {/* ── Manual Activate Form ─────────────────────────────── */}
          <section className="mb-8">
            <div className="panel p-6">
              <h2 className="mb-1 text-lg font-bold text-white">Activare Manuală</h2>
              <p className="mb-5 text-sm text-slate-400">
                Activează un abonament bot pentru un utilizator existent.
              </p>
              <form action={activateBotSubscriptionAction} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[220px]">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald"
                  >
                    Email Utilizator
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  />
                </div>
                <div className="min-w-[180px]">
                  <label
                    htmlFor="plan"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald"
                  >
                    Plan
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    required
                    className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                  >
                    <option value="free_tier">Free Tier — $98</option>
                    <option value="elite_tier">Elite Tier — $45</option>
                  </select>
                </div>
                <button type="submit" className="accent-button whitespace-nowrap">
                  Activează Manual
                </button>
              </form>
            </div>
          </section>

          {/* ── Subscribers Table ────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Abonați Bot Trading
            </h2>
            {subscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-4 py-3">Utilizator</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Preț</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Începe</th>
                      <th className="px-4 py-3">Expiră</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const profiles = sub.profiles as Record<string, string> | null;
                      const status = sub.status as string;
                      return (
                        <tr
                          key={sub.id as string}
                          className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3 text-white">
                            {profiles?.full_name ?? "N/A"}
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {(sub.plan as string) ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-display text-white">
                            ${Number(sub.price_usd ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[status] ?? "bg-white/5 text-slate-300"}`}
                            >
                              {statusLabels[status] ?? status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {sub.starts_at
                              ? new Date(sub.starts_at as string).toLocaleDateString("ro-RO")
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {sub.expires_at
                              ? new Date(sub.expires_at as string).toLocaleDateString("ro-RO")
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel p-8 text-center">
                <div className="text-5xl">🤖</div>
                <h3 className="mt-4 text-2xl font-bold text-white">
                  Nu există abonamente bot
                </h3>
                <p className="mt-2 text-slate-400">
                  Folosește formularul de mai sus pentru a activa primul abonament.
                </p>
              </div>
            )}
          </section>

          {/* ── Emergency Controls ───────────────────────────────── */}
          <section className="mb-8">
            <div className="panel border-red-500/20 p-6">
              <h2 className="mb-1 text-lg font-bold text-red-300">Controale de Urgență</h2>
              <p className="mb-4 text-sm text-slate-400">
                Oprește copierea pentru toți abonații. Folosește doar în caz de urgență.
              </p>
              <button
                type="button"
                disabled
                className="rounded-xl bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-300 opacity-60 cursor-not-allowed transition"
              >
                Pauză Globală
              </button>
              <p className="mt-3 text-xs text-red-400/60">
                Oprește copierea pentru toți abonații — funcționalitate în dezvoltare.
              </p>
            </div>
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
