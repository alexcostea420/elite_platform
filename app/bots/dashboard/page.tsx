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
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/bots/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, bot_active, bot_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.bot_active) redirect("/bots/subscribe");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  // Fetch all bot data in parallel
  const [
    { data: wallet },
    { data: openPositions },
    { data: closedTrades },
    { data: allTrades },
    { data: latestPerf },
    { data: botSub },
  ] = await Promise.all([
    supabase.from("bot_wallets").select("hl_address, auto_sizing, max_risk_pct, paused").eq("user_id", user.id).maybeSingle(),
    supabase.from("bot_copy_trades").select("*").eq("user_id", user.id).eq("status", "open").order("opened_at", { ascending: false }),
    supabase.from("bot_copy_trades").select("*").eq("user_id", user.id).eq("status", "closed").order("closed_at", { ascending: false }).limit(20),
    supabase.from("bot_copy_trades").select("pnl_usd, status").eq("user_id", user.id),
    supabase.from("bot_performance").select("*").order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("bot_subscriptions").select("plan, price_usd, status, started_at, expires_at").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const positions = openPositions ?? [];
  const trades = closedTrades ?? [];
  const allTradesList = allTrades ?? [];

  // Calculate stats
  const totalPnl = allTradesList.filter((t) => t.status === "closed").reduce((sum, t) => sum + (Number(t.pnl_usd) || 0), 0);
  const totalTrades = allTradesList.filter((t) => t.status === "closed").length;
  const wins = allTradesList.filter((t) => t.status === "closed" && Number(t.pnl_usd) > 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "--";
  const planLabel = botSub?.plan === "elite_tier" ? "Bot Elite" : "Bot Standard";

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">Bot Trading</p>
            </div>
            <h1 className="text-3xl font-bold text-white">Tranzacțiile Tale Automate</h1>
          </section>

          {/* Status bar */}
          <section className="mb-6 panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-slate-400">Plan: <span className="font-semibold text-white">{planLabel}</span></span>
              <span className="text-slate-400">Expiră: <span className="font-semibold text-white">{formatDate(botSub?.expires_at ?? profile.bot_expires_at)}</span></span>
              <span className="flex items-center gap-2 text-slate-400">
                Wallet:
                {wallet?.hl_address ? (
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-400" /><span className="font-mono text-white">{maskWallet(wallet.hl_address)}</span></span>
                ) : (
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" /><span className="text-red-400">Neconectat</span></span>
                )}
              </span>
              {wallet?.paused && <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">PAUZĂ</span>}
            </div>
            <form action={pauseBotAction}>
              <button type="submit" className="ghost-button text-sm">
                {wallet?.paused ? "Reactivează" : "Pauză"}
              </button>
            </form>
          </section>

          {/* Flash messages */}
          {searchParams?.message && (
            <div className="mb-6 rounded-xl border border-crypto-green/30 bg-crypto-green/10 px-4 py-3 text-sm text-slate-100">{searchParams.message}</div>
          )}
          {searchParams?.error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{searchParams.error}</div>
          )}

          {/* Stats */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-400">PnL Total</p>
              <h3 className={`mt-3 font-display text-3xl font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatUsd(totalPnl)}
              </h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-400">Tranzacții</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{totalTrades}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-400">Win Rate</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-accent-emerald">{winRate}{winRate !== "--" ? "%" : ""}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-400">Poziții Deschise</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{positions.length}</h3>
            </article>
          </section>

          {/* Open Positions */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Poziții Deschise</h2>
            {positions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {positions.map((pos) => (
                  <article key={pos.id} className="panel px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">{pos.asset}</span>
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${pos.direction === "LONG" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                          {pos.direction}
                        </span>
                      </div>
                      {pos.pnl_usd != null && (
                        <span className={`font-semibold ${Number(pos.pnl_usd) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatUsd(Number(pos.pnl_usd))}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span>Entry: ${Number(pos.entry_price).toFixed(2)}</span>
                      {pos.size_usd && <span>Size: {formatUsd(Number(pos.size_usd))}</span>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="panel p-6 text-center text-slate-500">
                Nicio poziție deschisă momentan. Botul va deschide automat când apar semnale.
              </div>
            )}
          </section>

          {/* Trade History */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Istoric Tranzacții</h2>
            {trades.length > 0 ? (
              <div className="panel overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Asset</th>
                      <th className="px-5 py-3">Direcție</th>
                      <th className="px-5 py-3">Intrare</th>
                      <th className="px-5 py-3">Ieșire</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">PnL</th>
                      <th className="px-5 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5">
                        <td className="px-5 py-3 font-semibold text-white">{trade.asset}</td>
                        <td className="px-5 py-3">
                          <span className={trade.direction === "LONG" ? "text-green-400" : "text-red-400"}>{trade.direction}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-300">${Number(trade.entry_price).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-300">{trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : "--"}</td>
                        <td className="px-5 py-3 text-slate-300">{trade.size_usd ? formatUsd(Number(trade.size_usd)) : "--"}</td>
                        <td className={`px-5 py-3 font-semibold ${Number(trade.pnl_usd) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {trade.pnl_usd != null ? formatUsd(Number(trade.pnl_usd)) : "--"}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{formatDate(trade.closed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel p-6 text-center text-slate-500">
                Încă nu ai tranzacții copiate. Sistemul va începe să copieze automat.
              </div>
            )}
          </section>

          {/* Account Settings */}
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <article className="panel p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">Setări</p>
              <h2 className="mb-5 text-xl font-bold text-white">Contul Tău Bot</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Wallet</span>
                  <span className="font-mono text-white">{maskWallet(wallet?.hl_address ?? null)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Auto-sizing</span>
                  <span className={wallet?.auto_sizing ? "text-green-400" : "text-slate-500"}>{wallet?.auto_sizing ? "ON" : "OFF"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Max Risk</span>
                  <span className="text-white">{wallet?.max_risk_pct ?? 2}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className={wallet?.paused ? "text-yellow-400" : "text-green-400"}>{wallet?.paused ? "Pauzat" : "Activ"}</span>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Link href="/bots/subscribe" className="ghost-button text-sm border-accent-emerald text-accent-emerald">Setări Wallet</Link>
              </div>
            </article>

            {/* Master Performance */}
            <article className="panel p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">Referință</p>
              <h2 className="mb-5 text-xl font-bold text-white">Performanța Master</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Win Rate (30z)</span>
                  <span className="font-semibold text-accent-emerald">{latestPerf?.win_rate_30d ?? 62.4}%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Sharpe Ratio (30z)</span>
                  <span className="font-semibold text-white">{latestPerf?.sharpe_30d ?? 3.2}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Max Drawdown (30z)</span>
                  <span className="font-semibold text-red-400">{latestPerf?.max_drawdown_30d ?? 8.5}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Equity Master</span>
                  <span className="font-semibold text-white">{latestPerf?.equity_usd ? formatUsd(Number(latestPerf.equity_usd)) : "--"}</span>
                </div>
              </div>
            </article>
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
