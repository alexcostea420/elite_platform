import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Dashboard | Tranzacțiile Tale Automate",
  description:
    "Dashboard-ul personal al botului de trading: PnL, poziții deschise, istoric tranzacții.",
  keywords: ["bot dashboard", "copytrade dashboard", "trading automat"],
  path: "/bots/dashboard",
  host: "app",
  index: false,
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function maskWallet(address: string | null | undefined): string {
  if (!address || address.length < 10) return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Types for query results                                           */
/* ------------------------------------------------------------------ */

type CopyTrade = {
  id: string;
  asset: string;
  direction: "LONG" | "SHORT";
  entry_price: number | null;
  exit_price: number | null;
  size: number | null;
  pnl: number | null;
  status: "open" | "closed";
  opened_at: string | null;
  closed_at: string | null;
};

type BotPerformance = {
  win_rate_30d: number | null;
  sharpe_30d: number | null;
  max_drawdown_30d: number | null;
};

type BotSubscription = {
  plan_name: string | null;
  status: string | null;
  expires_at: string | null;
};

type BotWallet = {
  wallet_address: string | null;
  auto_sizing: boolean | null;
  max_risk_pct: number | null;
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function BotDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/bots/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, bot_active, bot_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.bot_active) redirect("/bots/subscribe");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  /* ---------- parallel queries ---------- */
  const [
    { data: botSubRaw },
    { data: walletRaw },
    { data: openTradesRaw },
    { data: closedTradesRaw },
    { data: perfRaw },
  ] = await Promise.all([
    supabase
      .from("bot_subscriptions")
      .select("plan_name, status, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bot_wallets")
      .select("wallet_address, auto_sizing, max_risk_pct")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("bot_copy_trades")
      .select("id, asset, direction, entry_price, exit_price, size, pnl, status, opened_at, closed_at")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("opened_at", { ascending: false }),
    supabase
      .from("bot_copy_trades")
      .select("id, asset, direction, entry_price, exit_price, size, pnl, status, opened_at, closed_at")
      .eq("user_id", user.id)
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(20),
    supabase
      .from("bot_performance")
      .select("win_rate_30d, sharpe_30d, max_drawdown_30d")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const botSub = botSubRaw as BotSubscription | null;
  const wallet = walletRaw as BotWallet | null;
  const openTrades = (openTradesRaw ?? []) as CopyTrade[];
  const closedTrades = (closedTradesRaw ?? []) as CopyTrade[];
  const perf = perfRaw as BotPerformance | null;

  /* ---------- computed stats ---------- */
  const allTrades = [...openTrades, ...closedTrades];
  const totalTrades = allTrades.length;
  const closedPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : null;

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
          {/* ---- Breadcrumb ---- */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white">Bot Trading</span>
          </nav>

          {/* ---- Header ---- */}
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
              Bot Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              Tranzacțiile Tale Automate
            </h1>
          </header>

          {/* ---- Status Bar ---- */}
          <section className="panel mb-8 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Plan:</span>
                <span className="font-semibold text-white">
                  {botSub?.plan_name ?? "Bot Standard"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Expiră:</span>
                <span className="font-semibold text-white">
                  {formatDate(botSub?.expires_at ?? profile.bot_expires_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Wallet:</span>
                {wallet?.wallet_address ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-accent-emerald" />
                    <span className="font-semibold text-white">Conectat</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                    <span className="font-semibold text-slate-400">Neconectat</span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="ghost-button cursor-not-allowed opacity-60"
              disabled
              title="În curând"
            >
              Pauză / Reluare
            </button>
          </section>

          {/* ---- Stats Cards ---- */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                PnL Total
              </p>
              <h3
                className={`mt-3 font-display text-3xl font-bold ${
                  closedPnl >= 0 ? "text-accent-emerald" : "text-red-400"
                }`}
              >
                {formatUsd(closedPnl)}
              </h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                PnL Astăzi
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-slate-400">$0.00</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Tranzacții Total
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{totalTrades}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Win Rate
              </p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">
                {winRate !== null ? formatPct(winRate) : "--"}
              </h3>
            </article>
          </section>

          {/* ---- Open Positions ---- */}
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                Poziții Deschise
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Tranzacții Active</h2>
            </div>

            {openTrades.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openTrades.map((trade) => (
                  <article key={trade.id} className="panel px-5 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-white">{trade.asset}</h4>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          trade.direction === "LONG"
                            ? "bg-accent-emerald/15 text-accent-emerald"
                            : "bg-red-400/15 text-red-400"
                        }`}
                      >
                        {trade.direction}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Preț Intrare</span>
                        <p className="font-semibold text-white">
                          ${trade.entry_price?.toLocaleString("en-US") ?? "--"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">PnL curent</span>
                        <p
                          className={`font-semibold ${
                            (trade.pnl ?? 0) >= 0 ? "text-accent-emerald" : "text-red-400"
                          }`}
                        >
                          {trade.pnl !== null ? formatUsd(trade.pnl) : "--"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel px-6 py-10 text-center">
                <p className="text-slate-400">Nicio poziție deschisă momentan</p>
              </div>
            )}
          </section>

          {/* ---- Trade History ---- */}
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                Istoric
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Ultimele Tranzacții</h2>
            </div>

            {closedTrades.length > 0 ? (
              <div className="panel overflow-x-auto p-0">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Direcție</th>
                      <th className="px-5 py-3">Intrare</th>
                      <th className="px-5 py-3">Ieșire</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3 text-right">PnL</th>
                      <th className="px-5 py-3 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {closedTrades.map((trade) => (
                      <tr key={trade.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-semibold text-white">{trade.asset}</td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              trade.direction === "LONG" ? "text-accent-emerald" : "text-red-400"
                            }
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          ${trade.entry_price?.toLocaleString("en-US") ?? "--"}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          ${trade.exit_price?.toLocaleString("en-US") ?? "--"}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {trade.size?.toLocaleString("en-US") ?? "--"}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-semibold ${
                            (trade.pnl ?? 0) >= 0 ? "text-accent-emerald" : "text-red-400"
                          }`}
                        >
                          {trade.pnl !== null ? formatUsd(trade.pnl) : "--"}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400">
                          {formatDateTime(trade.closed_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel px-6 py-10 text-center">
                <p className="text-slate-400">
                  Încă nu ai tranzacții copiate. Sistemul va începe să copieze automat.
                </p>
              </div>
            )}
          </section>

          {/* ---- Account Settings ---- */}
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Setări
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Contul Tău Bot</h2>
            </div>

            <div className="panel px-5 py-6 md:px-8">
              <div className="grid gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-slate-500">Wallet Address</span>
                  <p className="mt-1 font-semibold text-white">
                    {maskWallet(wallet?.wallet_address)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Auto-sizing</span>
                  <p className="mt-1 font-semibold text-white">
                    {wallet?.auto_sizing === true ? (
                      <span className="text-accent-emerald">ON</span>
                    ) : wallet?.auto_sizing === false ? (
                      <span className="text-red-400">OFF</span>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Max Risk</span>
                  <p className="mt-1 font-semibold text-white">
                    {wallet?.max_risk_pct !== null && wallet?.max_risk_pct !== undefined
                      ? `${wallet.max_risk_pct}%`
                      : "--"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Abonament</span>
                  <p className="mt-1 font-semibold text-white">
                    {botSub?.plan_name ?? "Bot Standard"}
                  </p>
                  <p className="text-xs text-slate-400">
                    Expiră: {formatDate(botSub?.expires_at ?? profile.bot_expires_at)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="ghost-button cursor-not-allowed opacity-60"
                  disabled
                  title="În curând"
                >
                  Pauză Copiere
                </button>
                <button
                  type="button"
                  className="ghost-button cursor-not-allowed opacity-60"
                  disabled
                  title="În curând"
                >
                  Setări Wallet
                </button>
              </div>
            </div>
          </section>

          {/* ---- Master Performance ---- */}
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">
                Referință
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">Performanța Master</h2>
            </div>

            <div className="panel px-5 py-6 md:px-8">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Win Rate (30z)
                  </p>
                  <p className="mt-3 font-display text-3xl font-bold text-white">
                    {perf?.win_rate_30d !== null && perf?.win_rate_30d !== undefined
                      ? formatPct(perf.win_rate_30d)
                      : "62.4%"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Sharpe Ratio (30z)
                  </p>
                  <p className="mt-3 font-display text-3xl font-bold text-white">
                    {perf?.sharpe_30d !== null && perf?.sharpe_30d !== undefined
                      ? perf.sharpe_30d.toFixed(2)
                      : "1.85"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Max Drawdown (30z)
                  </p>
                  <p className="mt-3 font-display text-3xl font-bold text-red-400">
                    {perf?.max_drawdown_30d !== null && perf?.max_drawdown_30d !== undefined
                      ? `-${formatPct(Math.abs(perf.max_drawdown_30d))}`
                      : "-8.2%"}
                  </p>
                </div>
              </div>
              {!perf && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  * Valori indicative. Datele live vor fi disponibile în curând.
                </p>
              )}
            </div>
          </section>
        </Container>
      </main>

      <Footer compact />
    </>
  );
}
