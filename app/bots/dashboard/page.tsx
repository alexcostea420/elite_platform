import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Bot Dashboard | Performanta Trading Bot",
  description: "Monitorizeza performanta botului de trading: equity, pozitii deschise, PnL.",
  keywords: ["bot trading", "copytrade dashboard", "MEXC bot"],
  path: "/bots/dashboard",
  host: "app",
  index: false,
});

export default async function BotDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bots/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bot_active")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const { data: botSub } = await supabase
    .from("bot_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: wallet } = await supabase
    .from("bot_wallets")
    .select("hl_address, max_risk_pct, paused, is_verified, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: trades } = await supabase
    .from("bot_copy_trades")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!wallet && !botSub) redirect("/bots/subscribe");

  const now = new Date();
  const isExpired = botSub?.expires_at && new Date(botSub.expires_at) < now;
  const daysLeft = botSub?.expires_at
    ? Math.max(0, Math.ceil((new Date(botSub.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <div className="mb-8 animate-fade-in-up stagger-1">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">Dashboard</Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Bot Trading</p>
            </div>
            <h1 className="text-3xl font-bold text-white">Bot Dashboard</h1>
          </div>

          {/* Subscription Status */}
          <section className={`mb-8 animate-fade-in-up stagger-2 rounded-2xl border px-6 py-5 ${isExpired ? "border-red-500/20 bg-red-500/5" : "border-accent-emerald/20 bg-accent-emerald/5"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${isExpired ? "bg-red-500/20 text-red-400" : "bg-accent-emerald/20 text-accent-emerald"}`}>
                    {isExpired ? "Expirat" : "Activ"}
                  </span>
                  <span className="text-sm text-slate-400">{"MEXC"}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-white">
                  {isExpired ? "Subscriptia bot a expirat" : `${daysLeft} zile ramase`}
                </p>
                <p className="text-sm text-slate-400">
                  {isExpired
                    ? "Reaboneaza-te pentru a continua copytrade-ul"
                    : `Expira pe ${new Date(botSub?.expires_at ?? "").toLocaleDateString("ro-RO")}`}
                </p>
              </div>
              {isExpired && (
                <Link className="rounded-xl bg-accent-emerald px-5 py-2.5 text-sm font-semibold text-crypto-dark hover:bg-accent-soft" href="/upgrade">
                  Reaboneaza-te
                </Link>
              )}
            </div>
          </section>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 animate-fade-in-up stagger-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status Bot</p>
              <p className={`mt-2 text-2xl font-bold ${wallet?.paused ? "text-amber-400" : profile?.bot_active ? "text-green-400" : "text-slate-500"}`}>
                {wallet?.paused ? "Paused" : profile?.bot_active ? "Activ" : "Inactiv"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Exchange</p>
              <p className="mt-2 text-2xl font-bold text-white">{"MEXC"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Trades</p>
              <p className="mt-2 text-2xl font-bold text-white">{trades?.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk Level</p>
              <p className="mt-2 text-2xl font-bold text-white">{wallet?.max_risk_pct ?? 1}%</p>
            </div>
          </div>

          {/* Recent Trades */}
          <section className="animate-fade-in-up stagger-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-bold text-white">Trade-uri Recente</h2>
            {trades && trades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">Asset</th>
                      <th className="pb-3 pr-4">Side</th>
                      <th className="pb-3 pr-4">Pret</th>
                      <th className="pb-3 pr-4">PnL</th>
                      <th className="pb-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade: Record<string, unknown>, i: number) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4 font-medium text-white">{String(trade.asset ?? "-")}</td>
                        <td className="py-3 pr-4">
                          <span className={trade.side === "long" ? "text-green-400" : "text-red-400"}>
                            {String(trade.side ?? "-")}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">${String(trade.entry_price ?? "-")}</td>
                        <td className="py-3 pr-4">
                          <span className={Number(trade.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-400"}>
                            ${Number(trade.pnl ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">
                          {trade.created_at ? new Date(String(trade.created_at)).toLocaleDateString("ro-RO") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl bg-white/5 px-6 py-8 text-center">
                <p className="text-slate-400">Niciun trade inca.</p>
                <p className="mt-1 text-sm text-slate-600">Botul va incepe sa copieze trade-urile automat dupa verificarea API.</p>
              </div>
            )}
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
