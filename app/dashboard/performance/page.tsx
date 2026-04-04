import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDynamicLimits, getFleetStatus } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { BotLock } from "@/components/dashboard/bot-lock";

export const metadata: Metadata = buildPageMetadata({
  title: "Performanță Bot | Equity & Risk Controls",
  description:
    "Equity, drawdown-uri, risk controls și status strategii. Dashboard de performanță exclusiv pentru membrii Elite.",
  keywords: ["performanta bot trading", "equity curve crypto", "risk management", "elite trading"],
  path: "/dashboard/performance",
  host: "app",
  index: false,
});

export const revalidate = 300;

function formatUsd(num: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(num);
}

function getHealthColor(pct: number) {
  if (pct <= 5) return "text-green-400";
  if (pct <= 10) return "text-yellow-400";
  return "text-red-400";
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">
          {formatUsd(value)} / {formatUsd(max)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function PerformancePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/performance");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, bot_active, role")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isElite = profile?.subscription_tier === "elite";

  if (!profile?.bot_active) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-3">
                <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Performanță</p>
              </div>
            </section>
            <BotLock isElite={isElite} />
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="panel p-8 text-center md:p-12">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
              <p className="mt-4 max-w-lg mx-auto text-slate-400">
                Aceasta sectiune va fi disponibila in curand. Lucram la ea!
              </p>
              <Link className="accent-button mt-6 inline-block" href="/dashboard">
                Inapoi la Dashboard
              </Link>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const [limits, fleet] = await Promise.all([getDynamicLimits(), getFleetStatus()]);

  if (!limits) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="panel p-8 text-center">
              <div className="text-5xl">--</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-3 text-slate-400">Datele de performanță nu au putut fi încărcate.</p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const updatedAt = new Date(limits.updated_at);
  const longPct = limits.equity > 0 ? (limits.equity_long / limits.equity) * 100 : 0;
  const shortPct = limits.equity > 0 ? (limits.equity_short / limits.equity) * 100 : 0;
  const ddPct = limits.equity > 0 ? (limits.portfolio_dd / limits.equity) * 100 : 0;
  const circuitUsed = limits.equity > 0 ? ((limits.equity - limits.circuit_breaker) / limits.equity) * 100 : 0;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Performanță</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Performanță <span className="gradient-text">Bot</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Equity, expunere, drawdown-uri și controlul riscului — actualizat automat.
            </p>
          </section>

          {/* Main Metrics */}
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Equity Total</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{formatUsd(limits.equity)}</h3>
            </article>
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Daily P&L</p>
              <h3
                className={`mt-3 font-display text-3xl font-bold ${limits.daily_loss > 0 ? "text-red-400" : "text-green-400"}`}
              >
                {limits.daily_loss > 0 ? `-${formatUsd(limits.daily_loss)}` : formatUsd(0)}
              </h3>
            </article>
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Drawdown</p>
              <h3 className={`mt-3 font-display text-3xl font-bold ${getHealthColor(ddPct)}`}>{ddPct.toFixed(1)}%</h3>
              <p className="mt-1 text-xs text-slate-500">{formatUsd(limits.portfolio_dd)}</p>
            </article>
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Circuit Breaker</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{formatUsd(limits.circuit_breaker)}</h3>
              <p className="mt-1 text-xs text-slate-500">Stop loss cont</p>
            </article>
          </section>

          {/* Exposure + Risk */}
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <article className="panel p-6 md:p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Expunere</p>
              <h2 className="mb-5 text-2xl font-bold text-white">Long vs Short</h2>

              {/* Exposure bar */}
              <div className="mb-5 overflow-hidden rounded-full bg-white/10">
                <div className="flex h-4">
                  <div className="bg-green-400" style={{ width: `${longPct}%` }} />
                  <div className="bg-red-400" style={{ width: `${shortPct}%` }} />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="inline-block h-3 w-3 rounded-full bg-green-400" /> Long
                  </span>
                  <span className="font-bold text-green-400">
                    {formatUsd(limits.equity_long)} ({longPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="inline-block h-3 w-3 rounded-full bg-red-400" /> Short
                  </span>
                  <span className="font-bold text-red-400">
                    {formatUsd(limits.equity_short)} ({shortPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span className="text-slate-400">Master Account</span>
                  <span className="text-white">{formatUsd(limits.equity_master)}</span>
                </div>
              </div>
            </article>

            <article className="panel p-6 md:p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Risk Controls
              </p>
              <h2 className="mb-5 text-2xl font-bold text-white">Limite Active</h2>
              <div className="space-y-5">
                <ProgressBar
                  color="bg-red-400"
                  label="Portfolio Drawdown"
                  max={limits.equity}
                  value={limits.portfolio_dd}
                />
                <ProgressBar
                  color="bg-orange-400"
                  label="Per-Asset Drawdown"
                  max={limits.equity}
                  value={limits.per_asset_dd}
                />
                <ProgressBar
                  color="bg-yellow-400"
                  label="Daily Loss"
                  max={limits.equity * 0.1}
                  value={limits.daily_loss}
                />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sizing Cap</span>
                  <span className="text-white">{formatUsd(limits.sizing_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Floor</span>
                  <span className="text-white">{formatUsd(limits.risk_floor)}</span>
                </div>
              </div>
            </article>
          </section>

          {/* High Conviction + Recommendations */}
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            {limits.high_conviction.length > 0 && (
              <article className="panel p-6 md:p-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                  High Conviction
                </p>
                <h2 className="mb-4 text-2xl font-bold text-white">Strategii cu performanță ridicată</h2>
                <div className="flex flex-wrap gap-2">
                  {limits.high_conviction.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-400"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </article>
            )}
            {limits.recommended_disable.length > 0 && (
              <article className="panel p-6 md:p-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-red-400">Atenție</p>
                <h2 className="mb-4 text-2xl font-bold text-white">Recomandat dezactivare</h2>
                <div className="flex flex-wrap gap-2">
                  {limits.recommended_disable.map((name) => (
                    <span
                      key={name}
                      className="rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-400"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </article>
            )}
            {limits.high_conviction.length === 0 && limits.recommended_disable.length === 0 && (
              <article className="panel p-6 text-center md:col-span-2 md:p-8">
                <p className="text-slate-400">Nicio strategie high-conviction sau recomandată pentru dezactivare.</p>
              </article>
            )}
          </section>

          {/* Fleet Summary */}
          {fleet && (
            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Fleet</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {fleet.active_strategies.length} strategii active
                  </h2>
                </div>
                <Link className="ghost-button" href="/dashboard/signals">
                  Vezi toate semnalele
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {fleet.active_strategies.slice(0, 6).map((s) => (
                  <article key={s.name} className="panel flex items-center justify-between px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-white">{s.name}</h3>
                      <p className="text-xs text-slate-500">
                        {s.strategy} &middot; {s.timeframe}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${s.type === "ml" ? "bg-purple-400/10 text-purple-400" : "bg-blue-400/10 text-blue-400"}`}
                    >
                      {s.risk}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}

          <p className="mb-8 text-center text-xs text-slate-600">
            Ultima actualizare: {updatedAt.toLocaleString("ro-RO")} &middot; Datele sunt generate automat și nu
            constituie sfaturi de investiții.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
