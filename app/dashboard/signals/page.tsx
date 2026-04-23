import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFleetStatus, type RegimeData, type Strategy } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { BotLock } from "@/components/dashboard/bot-lock";

export const metadata: Metadata = buildPageMetadata({
  title: "Semnale ML | Strategii Active Crypto",
  description:
    "Strategii ML active, validare out-of-sample, și regimuri de piață detectate automat. Exclusiv Elite.",
  keywords: ["semnale ml trading", "strategii crypto", "machine learning trading", "elite signals"],
  path: "/dashboard/signals",
  host: "app",
  index: false,
});

export const revalidate = 300;

function getTypeColor(type: string) {
  return type === "ml"
    ? "text-purple-400 bg-purple-400/10 border-purple-400/30"
    : "text-blue-400 bg-blue-400/10 border-blue-400/30";
}

function getValidationBadge(validation: string) {
  if (!validation) return { label: "Fără validare", color: "text-slate-500 bg-white/5 border-white/10" };
  if (validation.includes("FLAGGED")) return { label: "Monitorizat", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" };
  if (validation.includes("VALID")) return { label: "Validat", color: "text-green-400 bg-green-400/10 border-green-400/30" };
  return { label: "In review", color: "text-slate-400 bg-white/5 border-white/10" };
}

function getRegimeColor(regime: string) {
  switch (regime) {
    case "bull":
      return "text-green-400";
    case "bear":
      return "text-red-400";
    case "chop":
      return "text-yellow-400";
    default:
      return "text-slate-500";
  }
}

function getRegimeLabel(regime: string) {
  switch (regime) {
    case "bull":
      return "BULL";
    case "bear":
      return "BEAR";
    case "chop":
      return "CHOP";
    default:
      return "NECUNOSCUT";
  }
}

function parseValidation(validation: string) {
  const pf = validation.match(/PF=(\d+\.?\d*)/);
  const trades = validation.match(/(\d+)\s*trades/);
  const sharpe = validation.match(/Sharpe=(\d+\.?\d*)/);
  return {
    pf: pf ? parseFloat(pf[1]) : null,
    trades: trades ? parseInt(trades[1], 10) : null,
    sharpe: sharpe ? parseFloat(sharpe[1]) : null,
  };
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const badge = getValidationBadge(strategy.validation);
  const parsed = parseValidation(strategy.validation);

  return (
    <article className="panel p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold text-white">{strategy.name}</h3>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${getTypeColor(strategy.type)}`}>
          {strategy.type === "ml" ? "ML" : "Rule"}
        </span>
        <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${badge.color}`}>{badge.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Strategie</p>
          <p className="text-slate-300">{strategy.strategy}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Timeframe</p>
          <p className="text-white">{strategy.timeframe}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Risk/Trade</p>
          <p className="text-white">{strategy.risk}</p>
        </div>
        {parsed.pf !== null && (
          <div>
            <p className="text-xs text-slate-500">Profit Factor</p>
            <p className={parsed.pf >= 2 ? "font-semibold text-green-400" : "text-white"}>{parsed.pf.toFixed(2)}</p>
          </div>
        )}
      </div>
      {parsed.trades !== null && (
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Trades: {parsed.trades}</span>
          {parsed.sharpe !== null && <span>Sharpe: {parsed.sharpe.toFixed(2)}</span>}
        </div>
      )}
    </article>
  );
}

function RegimeCard({ asset, data }: { asset: string; data: RegimeData }) {
  return (
    <article className="panel px-5 py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{asset}</p>
      <h3 className={`mt-2 font-display text-2xl font-bold ${getRegimeColor(data.regime)}`}>
        {getRegimeLabel(data.regime)}
      </h3>
      {data.confidence > 0 && <p className="mt-1 text-xs text-slate-500">{(data.confidence * 100).toFixed(0)}% confidence</p>}
      {data.sizing_multiplier < 1 && (
        <p className="mt-1 text-xs text-yellow-400">Size: {(data.sizing_multiplier * 100).toFixed(0)}%</p>
      )}
    </article>
  );
}

export default async function SignalsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/signals");
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
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Semnale ML</p>
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
                Această secțiune va fi disponibilă în curând. Lucrăm la ea!
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

  const fleet = await getFleetStatus();

  if (!fleet) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="panel p-8 text-center">
              <div className="text-5xl">--</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-3 text-slate-400">Statusul flotei nu a putut fi încărcat.</p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const updatedAt = new Date(fleet.updated);
  const mlStrategies = fleet.active_strategies.filter((s) => s.type === "ml");
  const ruleStrategies = fleet.active_strategies.filter((s) => s.type !== "ml");
  const regimeEntries = Object.entries(fleet.regime);

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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Semnale ML</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Strategii <span className="gradient-text">Active</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              {fleet.active_strategies.length} strategii active, {mlStrategies.length} ML + {ruleStrategies.length}{" "}
              rule-based. Validare out-of-sample inclusă.
            </p>
          </section>

          {/* Stats */}
          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total Active</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-white">{fleet.active_strategies.length}</h3>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">ML Models</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-purple-400">{mlStrategies.length}</h3>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Rule-Based</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-blue-400">{ruleStrategies.length}</h3>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Dezactivate</p>
              <h3 className="mt-3 font-display text-3xl font-bold text-slate-500">
                {fleet.disabled_strategies.length}
              </h3>
            </article>
          </section>

          {/* Market Regimes */}
          {regimeEntries.length > 0 && (
            <section className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Regim de Piață
              </p>
              <h2 className="mb-5 text-2xl font-bold text-white">Detectare automată per asset</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {regimeEntries.map(([asset, data]) => (
                  <RegimeCard key={asset} asset={asset} data={data} />
                ))}
              </div>
            </section>
          )}

          {/* ML Strategies */}
          {mlStrategies.length > 0 && (
            <section className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Machine Learning
              </p>
              <h2 className="mb-5 text-2xl font-bold text-white">Strategii ML ({mlStrategies.length})</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {mlStrategies.map((s) => (
                  <StrategyCard key={s.name} strategy={s} />
                ))}
              </div>
            </section>
          )}

          {/* Rule-Based */}
          {ruleStrategies.length > 0 && (
            <section className="mb-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Rule-Based</p>
              <h2 className="mb-5 text-2xl font-bold text-white">Strategii Rule-Based ({ruleStrategies.length})</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {ruleStrategies.map((s) => (
                  <StrategyCard key={s.name} strategy={s} />
                ))}
              </div>
            </section>
          )}

          <p className="mb-8 text-center text-xs text-slate-600">
            Ultima actualizare: {updatedAt.toLocaleString("ro-RO")} &middot; Datele sunt generate automat de trading
            bot.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
