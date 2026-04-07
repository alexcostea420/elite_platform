import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRiskScore } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { RiskGauge } from "@/components/dashboard/risk-gauge";
import { TimeGateLock } from "@/components/dashboard/time-gate-lock";
import { getDaysUntilUnlock, hasPassedTimeGate } from "@/lib/utils/time-gate";

export const metadata: Metadata = buildPageMetadata({
  title: "Risk Score BTC | Analiza Riscului Crypto",
  description:
    "Scorul de risc BTC calculat din 14 indicatori on-chain, tehnici și macro. Exclusiv pentru membrii Elite.",
  keywords: ["risk score btc", "analiza risc crypto", "indicatori on-chain", "elite trading"],
  path: "/dashboard/risk-score",
  host: "app",
  index: false,
});

export const revalidate = 0; // always fresh data

const componentLabels: Record<string, string> = {
  pi_cycle_top: "Pi Cycle Top",
  mvrv: "MVRV Z-Score",
  mayer_multiple: "Mayer Multiple",
  halving_cycle: "Halving Cycle",
  macd_weekly: "MACD Weekly",
  rsi_weekly: "RSI Weekly",
  stoch_rsi_weekly: "Stoch RSI Weekly",
  fear_greed: "Fear & Greed",
  funding_rate: "Funding Rate",
  ma50w_bear: "MA50 Weekly Bear",
  sopr: "SOPR",
  puell_multiple: "Puell Multiple",
  vix: "VIX",
  fomc_proximity: "FOMC Proximity",
};

function getScoreColor(score: number) {
  if (score <= 25) return "text-red-400";
  if (score <= 40) return "text-orange-400";
  if (score <= 60) return "text-yellow-400";
  if (score <= 75) return "text-emerald-400";
  return "text-green-400";
}

function getScoreLabel(score: number) {
  if (score <= 20) return "Risc Extrem";
  if (score <= 35) return "Risc Ridicat";
  if (score <= 50) return "Risc Moderat";
  if (score <= 65) return "Neutru";
  if (score <= 80) return "Favorabil";
  return "Foarte Favorabil";
}

function getDecisionColor(decision: string) {
  if (decision === "BUY") return "text-green-400 border-green-400/30 bg-green-400/10";
  if (decision === "SELL") return "text-red-400 border-red-400/30 bg-red-400/10";
  return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function formatPercent(num: number) {
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function NormBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  const barColor =
    pct >= 70 ? "bg-green-400" : pct >= 40 ? "bg-yellow-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-sm text-slate-300">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
    </div>
  );
}

export default async function RiskScorePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/risk-score");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, elite_since, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== "elite") {
    redirect("/upgrade");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const unlocked = hasPassedTimeGate(profile?.elite_since ?? null);
  const daysRemaining = getDaysUntilUnlock(profile?.elite_since ?? null);

  if (!unlocked) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <TimeGateLock daysRemaining={daysRemaining} featureName="Risk Score" />
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const riskScore = await getRiskScore();

  if (!riskScore) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="panel p-8 text-center">
              <div className="text-5xl">--</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-3 text-slate-400">
                Scorul de risc nu a putut fi încărcat. Încearcă din nou mai târziu.
              </p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const updatedAt = new Date(riskScore.timestamp);
  const components = Object.entries(riskScore.components);

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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Risk Score</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Scor de Risc <span className="gradient-text">BTC</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Calculat din {components.length} indicatori on-chain, tehnici și macro. Actualizat automat la fiecare
              analiză.
            </p>
          </section>

          {/* Score Gauge + Decision */}
          <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* Gauge */}
            <article className="panel flex flex-col items-center justify-center px-6 py-8">
              <RiskGauge score={riskScore.score} />
              <div className="mt-4 flex justify-center">
                <span className={`rounded-full border px-6 py-2.5 text-lg font-bold ${getDecisionColor(riskScore.decision)}`}>
                  {riskScore.decision}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Conviction: <span className="font-semibold text-white">{riskScore.conviction}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{riskScore.conviction_detail}</p>
            </article>

            {/* Key stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <article className="panel px-5 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BTC Pret</p>
                <h3 className="mt-2 text-2xl font-bold text-white">${formatNumber(riskScore.btc_price_live)}</h3>
                <p className="mt-1 text-sm text-red-400">{formatPercent(riskScore.pct_from_ath)} de la ATH</p>
              </article>
              <article className="panel px-5 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fear & Greed</p>
                <h3 className={`mt-2 text-2xl font-bold ${riskScore.fear_greed.value <= 25 ? "text-red-400" : riskScore.fear_greed.value <= 50 ? "text-orange-400" : riskScore.fear_greed.value <= 75 ? "text-yellow-400" : "text-green-400"}`}>
                  {riskScore.fear_greed.value}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{riskScore.fear_greed.label}</p>
              </article>
              <article className="panel px-5 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">BTC Dominance</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{riskScore.coingecko.btc_dominance.toFixed(1)}%</h3>
                <p className="mt-1 text-sm text-slate-400">ETH: {riskScore.coingecko.eth_dominance.toFixed(1)}%</p>
              </article>
              <article className="panel px-5 py-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">ATH</p>
                <h3 className="mt-2 text-2xl font-bold text-white">${formatNumber(riskScore.btc_ath)}</h3>
                <p className="mt-1 text-sm text-slate-400">Distanta: {Math.abs(riskScore.pct_from_ath).toFixed(0)}%</p>
              </article>
            </div>
          </section>

          {/* Overrides / Warnings */}
          {riskScore.overrides.length > 0 && (
            <section className="mb-8">
              {riskScore.overrides.map((override) => (
                <div
                  key={override}
                  className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-4 text-sm text-yellow-300"
                >
                  {override}
                </div>
              ))}
            </section>
          )}

          {/* Indicator Bars */}
          <section className="panel mb-8 p-6 md:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Indicatori ({components.length})
            </p>
            <h2 className="mb-6 text-2xl font-bold text-white">Detalii pe componente</h2>
            <div className="space-y-4">
              {components.map(([key, comp]) => (
                <div key={key}>
                  <NormBar label={componentLabels[key] ?? key} value={comp.norm} />
                  <p className="ml-[9.75rem] mt-1 text-xs text-slate-500">{comp.why}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Derivatives + Macro */}
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <article className="panel p-6 md:p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Derivate</p>
              <h2 className="mb-5 text-2xl font-bold text-white">Futures & Funding</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Funding Rate</span>
                  <span className="text-white">{riskScore.derivatives.funding_pct.toFixed(4)}%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Open Interest</span>
                  <span className="text-white">${(riskScore.derivatives.oi_value / 1e9).toFixed(2)}B</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">OI Delta 4H</span>
                  <span className="text-white">{formatPercent(riskScore.derivatives.oi_delta_pct)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Long/Short Ratio</span>
                  <span className="text-white">{riskScore.derivatives.ls_ratio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Longs</span>
                  <span className="text-green-400">{riskScore.derivatives.long_pct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Shorts</span>
                  <span className="text-red-400">{riskScore.derivatives.short_pct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basis</span>
                  <span className="text-white">{riskScore.derivatives.basis_pct.toFixed(3)}%</span>
                </div>
              </div>
            </article>

            <article className="panel p-6 md:p-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Macro</p>
              <h2 className="mb-5 text-2xl font-bold text-white">Indicatori Macro</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">VIX</span>
                  <span className={riskScore.macro.vix > 30 ? "text-red-400" : "text-white"}>
                    {riskScore.macro.vix.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">DXY</span>
                  <span className="text-white">{riskScore.macro.dxy.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">US 10Y Yield</span>
                  <span className="text-white">{riskScore.macro.us10y.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Fed Funds Rate</span>
                  <span className="text-white">{riskScore.macro.fed_funds_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">M2 Money Supply</span>
                  <span className="text-white">${riskScore.macro.m2.toFixed(1)}T</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Unemployment</span>
                  <span className="text-white">{riskScore.macro.unemployment.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BTC Dominance</span>
                  <span className="text-white">{riskScore.coingecko.btc_dominance.toFixed(1)}%</span>
                </div>
              </div>
            </article>
          </section>

          {/* Analysis */}
          <section className="panel mb-8 p-6 md:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Analiză</p>
            <h2 className="mb-5 text-2xl font-bold text-white">Rezumat complet</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{riskScore.analysis}</div>
          </section>

          {/* Footer info */}
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
