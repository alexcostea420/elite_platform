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
  title: "Bot Dashboard | Tranzactiile Tale Automate",
  description:
    "Dashboard-ul personal al botului de trading: PnL, pozitii deschise, istoric tranzactii.",
  keywords: ["bot dashboard", "copytrade dashboard", "trading automat"],
  path: "/bots/dashboard",
  host: "app",
  index: false,
});

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: string | null) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPnl(pnl: number) {
  const formatted = formatUsd(Math.abs(pnl));
  if (pnl >= 0) return `+${formatted}`;
  return `-${formatted}`;
}

type BotDashboardPageProps = {
  searchParams?: { error?: string; message?: string };
};

type Trade = {
  id: string;
  asset: string;
  direction: string;
  pnl: number | null;
  status: string;
  closed_at: string | null;
  created_at: string;
};

type Performance = {
  total_pnl: number;
  total_trades: number;
  win_rate: number;
};

type Subscription = {
  id: string;
  plan: string;
  price_usd: number;
  status: string;
  started_at: string | null;
  expires_at: string | null;
};

type Wallet = {
  exchange: string | null;
  max_risk_pct: number | null;
  paused: boolean | null;
  auto_sizing: boolean | null;
};

export default async function BotDashboardPage({
  searchParams,
}: BotDashboardPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/bots/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  // Fetch bot data
  let subscription: Subscription | null = null;
  let wallet: Wallet | null = null;
  let performance: Performance | null = null;
  let recentTrades: Trade[] = [];

  try {
    const [subResult, walletResult, perfResult, tradesResult] =
      await Promise.all([
        supabase
          .from("bot_subscriptions")
          .select("id, plan, price_usd, status, started_at, expires_at")
          .eq("user_id", user.id)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bot_wallets")
          .select("exchange, max_risk_pct, paused, auto_sizing")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("bot_performance")
          .select("total_pnl, total_trades, win_rate")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("bot_copy_trades")
          .select("id, asset, direction, pnl, status, closed_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    subscription = subResult.data as Subscription | null;
    wallet = walletResult.data as Wallet | null;
    performance = perfResult.data as Performance | null;
    recentTrades = (tradesResult.data as Trade[]) ?? [];
  } catch {
    // Tables may not exist yet
  }

  const hasSubscription = !!subscription;
  const isActive = subscription?.status === "active";
  const isPaused = wallet?.paused ?? false;

  const riskLabels: Record<string, string> = {
    "0.5": "Conservator (0.5%)",
    "1": "Moderat (1%)",
    "1.5": "Agresiv (1.5%)",
    "2": "Ultra (2%)",
  };

  const currentRisk = wallet?.max_risk_pct
    ? riskLabels[String(wallet.max_risk_pct)] ?? `${wallet.max_risk_pct}%`
    : "Moderat (1%)";

  return (
    <>
      <Navbar
        mode="dashboard"
        userIdentity={{
          displayName: identity.displayName,
          initials: identity.initials,
        }}
      />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Notifications */}
          {searchParams?.error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200">
              {searchParams.error}
            </div>
          )}
          {searchParams?.message && (
            <div className="mb-6 rounded-xl border border-accent-emerald/30 bg-accent-emerald/10 px-5 py-3 text-sm text-accent-emerald">
              {searchParams.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Bot Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                Trading Automat
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-4 py-1.5 text-sm font-semibold text-accent-emerald">
              <span>🏦</span> MEXC Exchange
            </div>
          </div>

          {!hasSubscription ? (
            /* No subscription state */
            <section className="panel mx-auto max-w-2xl p-8 text-center md:p-12">
              <div className="mb-4 text-5xl">🤖</div>
              <h2 className="text-2xl font-bold text-white">
                Nu ai un abonament activ
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-400">
                Conecteaza contul MEXC si activeaza botul de trading pentru a
                incepe sa copiezi tranzactiile automat.
              </p>
              <Link
                className="accent-button mt-6 inline-block px-8 py-3"
                href="/bots/subscribe"
              >
                Activeaza botul
              </Link>
            </section>
          ) : (
            <>
              {/* Status card */}
              <section className="mb-6 grid gap-4 md:grid-cols-2">
                <article className="panel p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Status Bot
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            !isActive
                              ? "bg-yellow-400"
                              : isPaused
                                ? "bg-yellow-400"
                                : "bg-green-400"
                          }`}
                        />
                        <span className="text-lg font-bold text-white">
                          {!isActive
                            ? "In asteptare"
                            : isPaused
                              ? "Pauza"
                              : "Activ"}
                        </span>
                      </div>
                      {!isActive && (
                        <p className="mt-1 text-xs text-yellow-300">
                          Abonamentul asteapta activare de catre admin
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <form action={pauseBotAction}>
                        <button
                          type="submit"
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            isPaused
                              ? "border border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20"
                              : "border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
                          }`}
                        >
                          {isPaused ? "Reactiveaza" : "Pune pe pauza"}
                        </button>
                      </form>
                    )}
                  </div>
                </article>

                <article className="panel p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Abonament
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">
                      {subscription!.plan === "elite_tier"
                        ? "Elite"
                        : "Standard"}
                    </span>
                    <span className="text-sm text-slate-400">
                      {formatUsd(subscription!.price_usd)}/luna
                    </span>
                  </div>
                  {subscription!.expires_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      Expira: {formatDate(subscription!.expires_at)}
                    </p>
                  )}
                </article>
              </section>

              {/* Stats */}
              <section className="mb-6 grid gap-4 md:grid-cols-3">
                <article className="panel p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    PnL Total
                  </p>
                  <h3 className="mt-3 text-2xl font-bold">
                    {performance ? (
                      <span
                        className={
                          performance.total_pnl >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {formatPnl(performance.total_pnl)}
                      </span>
                    ) : (
                      <span className="text-slate-500">Se calculeaza...</span>
                    )}
                  </h3>
                </article>

                <article className="panel p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Tranzactii
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    {performance ? (
                      performance.total_trades
                    ) : (
                      <span className="text-slate-500">Se calculeaza...</span>
                    )}
                  </h3>
                </article>

                <article className="panel p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Win Rate
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-white">
                    {performance ? (
                      `${performance.win_rate.toFixed(1)}%`
                    ) : (
                      <span className="text-slate-500">Se calculeaza...</span>
                    )}
                  </h3>
                </article>
              </section>

              {/* Recent trades */}
              <section className="panel mb-6 overflow-hidden p-0">
                <div className="border-b border-white/10 px-6 py-4">
                  <h3 className="font-bold text-white">Tranzactii recente</h3>
                </div>
                {recentTrades.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">Asset</th>
                          <th className="px-6 py-3">Directie</th>
                          <th className="px-6 py-3">PnL</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrades.map((trade) => (
                          <tr
                            key={trade.id}
                            className="border-b border-white/5"
                          >
                            <td className="px-6 py-3 font-semibold text-white">
                              {trade.asset}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  trade.direction === "LONG"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {trade.direction}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {trade.pnl !== null ? (
                                <span
                                  className={
                                    trade.pnl >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {formatPnl(trade.pnl)}
                                </span>
                              ) : (
                                <span className="text-slate-500">--</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`text-xs ${
                                  trade.status === "closed"
                                    ? "text-slate-400"
                                    : "text-accent-emerald"
                                }`}
                              >
                                {trade.status === "closed"
                                  ? "Inchis"
                                  : trade.status === "open"
                                    ? "Deschis"
                                    : trade.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-500">
                              {formatDate(trade.closed_at ?? trade.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-center">
                    <p className="text-slate-500">Nicio tranzactie inca</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Tranzactiile vor aparea aici dupa ce botul incepe sa
                      opereze.
                    </p>
                  </div>
                )}
              </section>

              {/* Account settings */}
              <section className="panel p-6">
                <h3 className="mb-4 font-bold text-white">Setari cont</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Exchange
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {wallet?.exchange ?? "MEXC"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Nivel de Risc
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {currentRisk}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Auto-Sizing
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {wallet?.auto_sizing !== false ? "Activ" : "Dezactivat"}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Back to main dashboard */}
          <div className="mt-8 text-center">
            <Link className="ghost-button" href="/dashboard">
              Inapoi la Dashboard
            </Link>
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
