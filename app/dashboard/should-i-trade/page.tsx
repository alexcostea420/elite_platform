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
import { TimeGateLock } from "@/components/dashboard/time-gate-lock";
import { TradingViewChart } from "@/components/dashboard/tradingview-chart";
import { getDaysUntilUnlock, hasPassedTimeGate } from "@/lib/utils/time-gate";

export const metadata: Metadata = buildPageMetadata({
  title: "Should I Trade? | Decizia Zilei",
  description:
    "Decizie clara de trading bazata pe analiza automata a riscului. DA / NU / ASTEAPTA - actualizat in timp real.",
  keywords: ["should i trade", "decizie trading", "semnal trading crypto", "elite trading"],
  path: "/dashboard/should-i-trade",
  host: "app",
  index: false,
});

export const revalidate = 0;

type Decision = "BUY" | "SELL" | "HOLD";

function getDecisionDisplay(decision: Decision) {
  const map: Record<
    Decision,
    { label: string; sublabel: string; color: string; bg: string; border: string; dot: string }
  > = {
    BUY: {
      label: "DA",
      sublabel: "Conditii favorabile pentru tranzactionare",
      color: "text-emerald-400",
      bg: "bg-emerald-500/8",
      border: "border-emerald-500/25",
      dot: "bg-emerald-400",
    },
    SELL: {
      label: "NU",
      sublabel: "Conditii nefavorabile - evita tranzactiile",
      color: "text-red-400",
      bg: "bg-red-500/8",
      border: "border-red-500/25",
      dot: "bg-red-400",
    },
    HOLD: {
      label: "ASTEAPTA",
      sublabel: "Piata incerta - nu forta intrari",
      color: "text-amber-400",
      bg: "bg-amber-500/8",
      border: "border-amber-500/25",
      dot: "bg-amber-400",
    },
  };
  return map[decision];
}

function getConvictionLabel(conviction: string) {
  switch (conviction) {
    case "HIGH":
      return "Conviction ridicat";
    case "MEDIUM":
      return "Conviction moderat";
    case "LOW":
      return "Conviction scazut";
    default:
      return conviction;
  }
}

function getConvictionColor(conviction: string) {
  switch (conviction) {
    case "HIGH":
      return "text-emerald-400";
    case "MEDIUM":
      return "text-amber-400";
    case "LOW":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function StatusDot({ color }: { color: "green" | "red" | "amber" | "neutral" }) {
  const colors = {
    green: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    neutral: "bg-slate-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[color]}`} />;
}

export default async function ShouldITradePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/should-i-trade");
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
            <TimeGateLock daysRemaining={daysRemaining} featureName="Should I Trade" />
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
              <p className="mt-3 text-slate-400">Analiza nu a putut fi incarcata. Incearca din nou mai tarziu.</p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const display = getDecisionDisplay(riskScore.decision);
  const updatedAt = new Date(riskScore.timestamp);
  const mayerComp = riskScore.components.mayer_multiple;
  const mayerValue = mayerComp?.raw != null && typeof mayerComp.raw === "number" ? mayerComp.raw : null;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link className="text-slate-500 transition-colors hover:text-accent-emerald" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-semibold uppercase tracking-[0.2em] text-accent-emerald">Should I Trade?</span>
          </nav>

          {/* ─── 1. DECISION CARD ─── */}
          <section
            className={`panel mb-6 border ${display.border} ${display.bg} px-5 py-5 md:px-8 md:py-6`}
          >
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              {/* Left: label + decision + subtitle */}
              <div className="flex flex-col items-center gap-1 md:items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
                  Intraday BTC
                </span>
                <h1 className={`font-display text-4xl font-bold leading-none md:text-5xl ${display.color}`}>
                  {display.label}
                </h1>
                <p className="mt-1 text-sm text-slate-400">{display.sublabel}</p>
              </div>

              {/* Right: BTC price */}
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">BTC Pret</span>
                <span className="font-display text-3xl font-bold text-white md:text-4xl">
                  ${formatNumber(riskScore.btc_price_live)}
                </span>
              </div>
            </div>
          </section>

          {/* ─── 2. THREE CONTEXT CARDS ─── */}
          <section className="mb-6 grid grid-cols-3 gap-3 md:gap-4">
            {/* Risk Score */}
            <article className="panel px-3 py-4 text-center md:px-5 md:py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 md:text-xs">Risk Score</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    riskScore.score <= 35
                      ? "bg-emerald-400"
                      : riskScore.score <= 65
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                />
                <span className="font-display text-2xl font-bold text-white md:text-3xl">
                  {riskScore.score}
                  <span className="text-base text-slate-500">/100</span>
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 md:text-xs">
                {riskScore.score <= 35 ? "Risc scazut" : riskScore.score <= 65 ? "Zona neutra" : "Risc crescut"}
              </p>
            </article>

            {/* Conviction */}
            <article className="panel px-3 py-4 text-center md:px-5 md:py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 md:text-xs">Conviction</p>
              <p className={`mt-2 text-xl font-bold md:text-2xl ${getConvictionColor(riskScore.conviction)}`}>
                {riskScore.conviction === "HIGH" ? "RIDICAT" : riskScore.conviction === "MEDIUM" ? "MODERAT" : "SCAZUT"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 md:text-xs">
                {getConvictionLabel(riskScore.conviction)}
              </p>
            </article>

            {/* Fear & Greed */}
            <article className="panel px-3 py-4 text-center md:px-5 md:py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 md:text-xs">
                Frica & Lacomie
              </p>
              <p
                className={`mt-2 font-display text-2xl font-bold md:text-3xl ${
                  riskScore.fear_greed.value <= 25
                    ? "text-red-400"
                    : riskScore.fear_greed.value <= 45
                      ? "text-orange-400"
                      : riskScore.fear_greed.value <= 55
                        ? "text-amber-400"
                        : "text-emerald-400"
                }`}
              >
                {riskScore.fear_greed.value}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 md:text-xs">{riskScore.fear_greed.label}</p>
            </article>
          </section>

          {/* ─── 3. TRADINGVIEW CHART ─── */}
          <section className="panel mb-6 p-3 md:p-6">
            <TradingViewChart />
          </section>

          {/* ─── 4. DERIVATE ─── */}
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-accent-emerald">
              Derivate
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {/* Open Interest */}
              <article className="panel p-4 text-center">
                <span className="text-2xl">📊</span>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Open Interest</p>
                <p className="mt-1 font-display text-xl font-bold text-white md:text-2xl">
                  ${(riskScore.derivatives.oi_value / 1e9).toFixed(2)}B
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Bani in futures</p>
              </article>

              {/* Long vs Short */}
              <article className="panel p-4 text-center">
                <span className="text-2xl">⚖️</span>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Long vs Short</p>
                {/* Proportional bar */}
                <div className="mx-auto mt-2 flex h-3 w-full max-w-[120px] overflow-hidden rounded-full">
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${riskScore.derivatives.long_pct}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${riskScore.derivatives.short_pct}%` }}
                  />
                </div>
                <p className="mt-2 text-sm font-bold">
                  <span className="text-emerald-400">{riskScore.derivatives.long_pct.toFixed(0)}%</span>
                  <span className="mx-1 text-slate-600">/</span>
                  <span className="text-red-400">{riskScore.derivatives.short_pct.toFixed(0)}%</span>
                </p>
              </article>

              {/* Funding Rate */}
              <article className="panel p-4 text-center">
                <span className="text-2xl">💰</span>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Funding Rate</p>
                <p
                  className={`mt-1 font-display text-xl font-bold md:text-2xl ${
                    riskScore.derivatives.funding_pct > 0.01
                      ? "text-emerald-400"
                      : riskScore.derivatives.funding_pct < -0.01
                        ? "text-red-400"
                        : "text-white"
                  }`}
                >
                  {riskScore.derivatives.funding_pct.toFixed(4)}%
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {riskScore.derivatives.funding_pct > 0 ? "Longii platesc" : "Shortii platesc"}
                </p>
              </article>

              {/* Basis */}
              <article className="panel p-4 text-center">
                <span className="text-2xl">📐</span>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Basis</p>
                <p
                  className={`mt-1 font-display text-xl font-bold md:text-2xl ${
                    riskScore.derivatives.basis_pct > 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {riskScore.derivatives.basis_pct.toFixed(3)}%
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {riskScore.derivatives.basis_pct > 0 ? "Contango" : "Backwardation"}
                </p>
              </article>
            </div>
          </section>

          {/* ─── 5. CONTEXT PRET + MACRO ─── */}
          <section className="mb-6 grid gap-3 md:grid-cols-2 md:gap-4">
            {/* Context Pret */}
            <article className="panel p-5 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-emerald">Context Pret</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color="green" /> BTC Pret
                  </span>
                  <span className="font-bold text-white">${formatNumber(riskScore.btc_price_live)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color="neutral" /> ATH
                  </span>
                  <span className="text-slate-300">${formatNumber(riskScore.btc_ath)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={riskScore.pct_from_ath > -10 ? "green" : "red"} /> Distanta de ATH
                  </span>
                  <span className="font-medium text-red-400">{riskScore.pct_from_ath.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={mayerValue != null && mayerValue < 1 ? "green" : mayerValue != null && mayerValue > 2.4 ? "red" : "amber"} /> Mayer Multiple
                  </span>
                  <span className="font-medium text-white">
                    {mayerValue != null ? mayerValue.toFixed(2) : "--"}
                  </span>
                </div>
              </div>
            </article>

            {/* Context Macro */}
            <article className="panel p-5 md:p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-emerald">Context Macro</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={riskScore.macro.vix < 20 ? "green" : riskScore.macro.vix > 30 ? "red" : "amber"} /> VIX
                  </span>
                  <span className={`font-medium ${riskScore.macro.vix > 30 ? "text-red-400" : "text-white"}`}>
                    {riskScore.macro.vix.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={riskScore.macro.dxy < 100 ? "green" : "red"} /> DXY
                  </span>
                  <span className="font-medium text-white">{riskScore.macro.dxy.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={riskScore.macro.fed_funds_rate < 4 ? "green" : "red"} /> Rata Fed
                  </span>
                  <span className="font-medium text-white">{riskScore.macro.fed_funds_rate.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color="green" /> M2 Supply
                  </span>
                  <span className="font-medium text-white">${riskScore.macro.m2.toFixed(1)}T</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <StatusDot color={riskScore.coingecko.btc_dominance > 50 ? "green" : "amber"} /> BTC Dominance
                  </span>
                  <span className="font-medium text-white">{riskScore.coingecko.btc_dominance.toFixed(1)}%</span>
                </div>
              </div>
            </article>
          </section>

          {/* ─── 6. WARNINGS (OVERRIDES) ─── */}
          {riskScore.overrides.length > 0 && (
            <section className="mb-6 space-y-2">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                Avertismente
              </h3>
              {riskScore.overrides.map((override) => (
                <div
                  key={override}
                  className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300"
                >
                  <span className="mt-0.5 shrink-0">&#9888;</span>
                  <span>{override}</span>
                </div>
              ))}
            </section>
          )}

          {/* ─── 7. LINK + DISCLAIMER ─── */}
          <section className="mb-6 text-center">
            <Link className="accent-button inline-block" href="/dashboard/risk-score">
              Vezi analiza completa Risk Score
            </Link>
          </section>

          <p className="pb-4 text-center text-xs leading-relaxed text-slate-600">
            Ultima actualizare: {updatedAt.toLocaleString("ro-RO")} &middot; Decizia este generata automat si nu
            constituie sfaturi de investitii. Tradingul implica riscuri semnificative.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
