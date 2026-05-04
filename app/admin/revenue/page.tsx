import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { getRevenueDashboard } from "@/lib/admin/revenue-stats";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Revenue",
  description: "Venituri Elite, refund rate, top payers.",
  keywords: ["admin revenue"],
  path: "/admin/revenue",
  host: "admin",
  index: false,
});

const PLAN_LABELS: Record<string, string> = {
  "30_days": "30 zile",
  "90_days": "90 zile",
  "365_days": "365 zile",
  bot_monthly: "Bot lunar",
  bot_monthly_elite: "Bot + Elite",
  unknown: "Necunoscut",
};

const SOURCE_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stripe: "Stripe",
  other: "Altele",
};

function fmtMoney(n: number, currency = "USDT") {
  return `${n.toLocaleString("ro-RO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtMonth(monthKey: string) {
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" });
}

function deltaPct(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

export default async function AdminRevenuePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/revenue");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);
  const data = await getRevenueDashboard();

  const monthDelta = deltaPct(data.thisMonth.net, data.lastMonth.net);
  const maxBarValue = Math.max(...data.monthlySeries.map((m) => m.gross), 1);

  return (
    <>
      <Navbar
        mode="dashboard"
        isAdmin
        userIdentity={{ displayName: identity.displayName, initials: identity.initials }}
      />
      <main className="min-h-screen bg-surface-night pb-16 pt-24">
        <Container className="max-w-6xl">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Admin · Finance
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Revenue
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Venituri Elite, refund rate, sursă și plan.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Net all-time</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-emerald-400">
                {fmtMoney(data.totals.netAllTime)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                gross {fmtMoney(data.totals.grossAllTime)} · {data.totals.paymentCount} plăți
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Luna asta</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white">
                {fmtMoney(data.thisMonth.net)}
              </p>
              <p
                className={`mt-0.5 text-[10px] ${monthDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {monthDelta >= 0 ? "+" : ""}
                {monthDelta}% vs luna trecută · {data.thisMonth.count} plăți
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Luna trecută</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-slate-200">
                {fmtMoney(data.lastMonth.net)}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">{data.lastMonth.count} plăți</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Refund rate</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-amber-300">
                {(data.refundRate * 100).toFixed(1)}%
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {fmtMoney(data.totals.refundsAllTime)} · {data.totals.refundCount} refund-uri
              </p>
            </div>
          </div>

          <section className="glass-card mb-6 p-5 md:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Trend
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Ultimele 12 luni (gross)</h2>
            </div>
            <div className="flex items-end gap-1.5 overflow-x-auto">
              {data.monthlySeries.map((m) => {
                const heightPct = Math.max(3, (m.gross / maxBarValue) * 100);
                return (
                  <div key={m.monthKey} className="flex min-w-[44px] flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-emerald-500/30 transition-all hover:bg-emerald-500/60"
                      style={{ height: `${heightPct * 1.4}px` }}
                      title={`${fmtMonth(m.monthKey)}: ${fmtMoney(m.gross)} gross / ${fmtMoney(m.net)} net`}
                    />
                    <p className="font-data text-[10px] text-slate-400 tabular-nums">{Math.round(m.gross)}</p>
                    <p className="text-[9px] text-slate-600">{fmtMonth(m.monthKey)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Sursă
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Per metodă plată</h2>
              </div>
              <div className="space-y-2">
                {data.bySource.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">Nicio plată încă.</p>
                ) : (
                  data.bySource.map((s) => (
                    <div
                      key={s.source}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {SOURCE_LABELS[s.source] ?? s.source}
                        </p>
                        <p className="text-[10px] text-slate-500">{s.count} plăți</p>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold tabular-nums text-emerald-400">
                          {fmtMoney(s.net)}
                        </p>
                        {s.refunds > 0 ? (
                          <p className="text-[10px] text-red-400">−{fmtMoney(s.refunds)} refund</p>
                        ) : (
                          <p className="text-[10px] text-slate-600">gross {fmtMoney(s.gross)}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Plan
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Per durată abonament</h2>
              </div>
              <div className="space-y-2">
                {data.byPlan.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">Niciun plan încă.</p>
                ) : (
                  data.byPlan.map((p) => (
                    <div
                      key={p.plan}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {PLAN_LABELS[p.plan] ?? p.plan}
                        </p>
                        <p className="text-[10px] text-slate-500">{p.count} plăți</p>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold tabular-nums text-emerald-400">
                          {fmtMoney(p.net)}
                        </p>
                        <p className="text-[10px] text-slate-600">gross {fmtMoney(p.gross)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="glass-card mt-6 p-5 md:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Top
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Top 10 payers</h2>
            </div>
            {data.topPayers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Niciun payer încă.</p>
            ) : (
              <div className="space-y-2">
                {data.topPayers.map((u, idx) => {
                  const display = u.fullName || u.discordUsername || u.userId.slice(0, 8);
                  return (
                    <Link
                      key={u.userId}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
                      href={`/admin/members/${u.userId}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-data text-xs font-bold text-slate-500 tabular-nums">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{display}</p>
                          {u.discordUsername && u.fullName && (
                            <p className="text-[10px] text-slate-500">@{u.discordUsername}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold tabular-nums text-emerald-400">
                          {fmtMoney(u.totalNet)}
                        </p>
                        <p className="text-[10px] text-slate-600">{u.paymentCount} plăți</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
