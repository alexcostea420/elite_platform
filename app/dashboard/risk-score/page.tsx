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
    "Scorul de risc BTC calculat din 14 indicatori on-chain, tehnici si macro. Exclusiv pentru membrii Elite.",
  keywords: ["risk score btc", "analiza risc crypto", "indicatori on-chain", "elite trading"],
  path: "/dashboard/risk-score",
  host: "app",
  index: false,
});

export const revalidate = 0;

/* ── Romanian translations ── */

const componentLabels: Record<string, string> = {
  pi_cycle_top: "Pi Cycle Top",
  mvrv: "MVRV Z-Score",
  mayer_multiple: "Mayer Multiple",
  halving_cycle: "Ciclul Halving",
  macd_weekly: "MACD Saptamanal",
  rsi_weekly: "RSI Saptamanal",
  stoch_rsi_weekly: "Stoch RSI Saptamanal",
  fear_greed: "Indice Frica si Lacomie",
  funding_rate: "Rata de Finantare",
  ma50w_bear: "Media 50 Saptamani",
  sopr: "SOPR (Profit/Pierdere)",
  puell_multiple: "Puell Multiple",
  vix: "VIX (Volatilitate)",
  fomc_proximity: "Proximitate FOMC",
};

const componentWhyRo: Record<string, string> = {
  vix: "Peste 44 = oportunitate de cumparare (100% istoric)",
  mvrv: "Semnaleaza fiecare top (>7) si bottom (<0) de ciclu",
  sopr: "Sub 1 = capitulare, semnal de bottom",
  fear_greed: "Indicator contrarian - frica extrema = cumpara",
  ma50w_bear: "Cel mai puternic semnal de trend pe termen lung",
  rsi_weekly: "Sub 30 = zona de acumulare",
  macd_weekly: "Schimbare de directie = schimbare de momentum",
  funding_rate: "Sentiment derivate - aglomerare pe o parte",
  pi_cycle_top: "Niciodata gresit - semnalul definitiv de top",
  halving_cycle: "Ciclul de 4 ani - peak la ~494 zile dupa halving",
  fomc_proximity: "Risc eveniment - 73% scadere in cicluri de crestere rate",
  mayer_multiple: "Sub 0.8 = zona de acumulare istorica",
  puell_multiple: "Economia minerilor - sub 0.5 = bottom de ciclu",
  stoch_rsi_weekly: "Mai precis decat RSI la extreme de ciclu",
};

// Top 6 most important components to highlight
const TOP_COMPONENTS = [
  "fear_greed",
  "mvrv",
  "rsi_weekly",
  "mayer_multiple",
  "pi_cycle_top",
  "ma50w_bear",
];

/* ── Helper functions ── */

function getDecisionColor(decision: string) {
  if (decision === "BUY") return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (decision === "SELL") return "text-red-400 border-red-400/40 bg-red-400/10";
  return "text-amber-400 border-amber-400/40 bg-amber-400/10";
}

function getDecisionLabel(decision: string) {
  if (decision === "BUY") return "CUMPARA";
  if (decision === "SELL") return "VINDE";
  return "ASTEAPTA";
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function formatPercent(num: number) {
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function getNormColor(norm: number) {
  const pct = Math.round(norm * 100);
  if (pct >= 70) return "#22C55E";
  if (pct >= 50) return "#A3E635";
  if (pct >= 30) return "#EAB308";
  return "#EF4444";
}

function getFearGreedLabel(value: number): string {
  if (value <= 20) return "Frica Extrema";
  if (value <= 40) return "Frica";
  if (value <= 60) return "Neutru";
  if (value <= 80) return "Lacomie";
  return "Lacomie Extrema";
}

function getFearGreedColor(value: number): string {
  if (value <= 25) return "text-red-400";
  if (value <= 50) return "text-orange-400";
  if (value <= 75) return "text-amber-400";
  return "text-emerald-400";
}

function getMacroSentiment(key: string, value: number): { color: string; label: string } {
  switch (key) {
    case "vix":
      if (value > 30) return { color: "bg-red-500", label: "Risc ridicat" };
      if (value > 20) return { color: "bg-amber-500", label: "Moderat" };
      return { color: "bg-emerald-500", label: "Calm" };
    case "dxy":
      if (value > 105) return { color: "bg-red-500", label: "Dolar puternic" };
      if (value > 100) return { color: "bg-amber-500", label: "Neutru" };
      return { color: "bg-emerald-500", label: "Dolar slab" };
    case "fed_funds_rate":
      if (value > 5) return { color: "bg-red-500", label: "Restrictiv" };
      if (value > 3) return { color: "bg-amber-500", label: "Moderat" };
      return { color: "bg-emerald-500", label: "Acomodativ" };
    case "m2":
      if (value > 22) return { color: "bg-emerald-500", label: "Lichiditate mare" };
      if (value > 20) return { color: "bg-amber-500", label: "Neutru" };
      return { color: "bg-red-500", label: "Lichiditate scazuta" };
    case "us10y":
      if (value > 4.5) return { color: "bg-red-500", label: "Randament ridicat" };
      if (value > 3.5) return { color: "bg-amber-500", label: "Moderat" };
      return { color: "bg-emerald-500", label: "Randament scazut" };
    case "unemployment":
      if (value > 5) return { color: "bg-red-500", label: "Somaj ridicat" };
      if (value > 4) return { color: "bg-amber-500", label: "Moderat" };
      return { color: "bg-emerald-500", label: "Piata muncii solida" };
    default:
      return { color: "bg-slate-500", label: "" };
  }
}

/* ── Circular Progress Ring (small, for component cards) ── */

function CircularProgress({ value, size = 48, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value * circumference;
  const color = getNormColor(value);
  const center = size / 2;

  return (
    <svg height={size} width={size} className="shrink-0">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ filter: `drop-shadow(0 0 4px ${color}40)`, transition: "stroke-dasharray 0.8s ease-out" }}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={size * 0.26}
        fontWeight="bold"
      >
        {Math.round(value * 100)}
      </text>
    </svg>
  );
}

/* ── Page ── */

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
                Scorul de risc nu a putut fi incarcat. Incearca din nou mai tarziu.
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

  // Get top 6 components sorted by weight
  const topComponents = components
    .filter(([key]) => TOP_COMPONENTS.includes(key))
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, 6);

  // Mayer Multiple and RSI from components
  const mayerComp = riskScore.components.mayer_multiple;
  const rsiComp = riskScore.components.rsi_weekly;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-3">
            <Link className="text-sm text-slate-500 hover:text-accent-emerald transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Risk Score</p>
          </div>

          {/* ─── 1. HERO SECTION ─── */}
          <section className="panel mb-8 px-6 py-10 md:px-10 md:py-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
              {/* Left side - BTC Price */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bitcoin</p>
                <p className="text-3xl font-bold text-white md:text-4xl">
                  ${formatNumber(riskScore.btc_price_live)}
                </p>
                <p className={`text-sm font-medium ${riskScore.pct_from_ath >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatPercent(riskScore.pct_from_ath)} de la ATH
                </p>
              </div>

              {/* Center - Gauge + Decision */}
              <div className="flex flex-col items-center">
                <RiskGauge score={riskScore.score} size={260} />
                <div className="mt-5">
                  <span
                    className={`inline-block rounded-full border-2 px-8 py-2.5 text-lg font-bold tracking-wider ${getDecisionColor(riskScore.decision)}`}
                  >
                    {getDecisionLabel(riskScore.decision)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Convingere: <span className="font-semibold text-white">{riskScore.conviction}</span>
                </p>
              </div>

              {/* Right side - Fear & Greed */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frica & Lacomie</p>
                <p className={`text-3xl font-bold md:text-4xl ${getFearGreedColor(riskScore.fear_greed.value)}`}>
                  {riskScore.fear_greed.value}
                </p>
                <p className="text-sm text-slate-400">
                  {getFearGreedLabel(riskScore.fear_greed.value)}
                </p>
              </div>
            </div>
          </section>

          {/* ─── 2. WARNING SECTION (overrides) ─── */}
          {riskScore.overrides.length > 0 && (
            <section className="mb-8 space-y-3">
              {riskScore.overrides.map((override, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-5 py-4"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <p className="text-sm leading-relaxed text-amber-200">{override}</p>
                </div>
              ))}
            </section>
          )}

          {/* ─── 3. KEY METRICS (6 cards) ─── */}
          <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {/* BTC Pret */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BTC Pret</p>
              <h3 className="mt-3 text-2xl font-bold text-white lg:text-3xl">
                ${formatNumber(riskScore.btc_price_live)}
              </h3>
              <p className={`mt-2 text-sm font-medium ${riskScore.pct_from_ath >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPercent(riskScore.pct_from_ath)} de la ATH
              </p>
            </article>

            {/* Fear & Greed */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frica & Lacomie</p>
              <h3 className={`mt-3 text-2xl font-bold lg:text-3xl ${getFearGreedColor(riskScore.fear_greed.value)}`}>
                {riskScore.fear_greed.value}
              </h3>
              <p className="mt-2 text-sm text-slate-400">{getFearGreedLabel(riskScore.fear_greed.value)}</p>
            </article>

            {/* BTC Dominance */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BTC Dominanta</p>
              <h3 className="mt-3 text-2xl font-bold text-white lg:text-3xl">
                {riskScore.coingecko.btc_dominance.toFixed(1)}%
              </h3>
              <p className="mt-2 text-sm text-slate-400">ETH: {riskScore.coingecko.eth_dominance.toFixed(1)}%</p>
            </article>

            {/* Mayer Multiple */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mayer Multiple</p>
              <h3 className="mt-3 text-2xl font-bold text-white lg:text-3xl">
                {mayerComp?.raw != null ? (typeof mayerComp.raw === "number" ? mayerComp.raw.toFixed(2) : String(mayerComp.raw)) : "--"}
              </h3>
              <p className="mt-2 text-sm text-slate-400">Sub 0.8 = zona de acumulare</p>
            </article>

            {/* RSI Weekly */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">RSI Saptamanal</p>
              <h3 className={`mt-3 text-2xl font-bold lg:text-3xl ${
                rsiComp?.raw != null && typeof rsiComp.raw === "number"
                  ? rsiComp.raw < 30
                    ? "text-red-400"
                    : rsiComp.raw > 70
                      ? "text-emerald-400"
                      : "text-white"
                  : "text-white"
              }`}>
                {rsiComp?.raw != null ? (typeof rsiComp.raw === "number" ? rsiComp.raw.toFixed(1) : String(rsiComp.raw)) : "--"}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {rsiComp?.raw != null && typeof rsiComp.raw === "number"
                  ? rsiComp.raw < 30
                    ? "Zona de acumulare"
                    : rsiComp.raw > 70
                      ? "Supracumparat"
                      : "Zona neutra"
                  : "Indisponibil"}
              </p>
            </article>

            {/* Funding Rate */}
            <article className="panel px-5 py-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rata de Finantare</p>
              <h3 className={`mt-3 text-2xl font-bold lg:text-3xl ${
                riskScore.derivatives.funding_pct > 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {riskScore.derivatives.funding_pct.toFixed(4)}%
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {riskScore.derivatives.funding_pct > 0 ? "Longii platesc" : "Shortii platesc"}
              </p>
            </article>
          </section>

          {/* ─── 4. COMPONENTE (Top 6 with circular progress) ─── */}
          <section className="mb-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Componente</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Indicatori principali</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topComponents.map(([key, comp]) => (
                <article key={key} className="panel flex items-start gap-4 px-5 py-5">
                  <CircularProgress value={comp.norm} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{componentLabels[key] ?? key}</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {comp.raw != null ? (typeof comp.raw === "number" ? comp.raw.toFixed(2) : String(comp.raw)) : `${Math.round(comp.norm * 100)}%`}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {componentWhyRo[key] ?? comp.why}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ─── 5. DERIVATE ─── */}
          <section className="mb-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Derivate</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Futures & Finantare</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Open Interest */}
              <article className="panel px-5 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open Interest</p>
                <h3 className="mt-3 text-2xl font-bold text-white">
                  ${(riskScore.derivatives.oi_value / 1e9).toFixed(2)}B
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Delta 4H: <span className={riskScore.derivatives.oi_delta_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatPercent(riskScore.derivatives.oi_delta_pct)}
                  </span>
                </p>
              </article>

              {/* Long vs Short */}
              <article className="panel px-5 py-6 sm:col-span-1 lg:col-span-2">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Long vs Short</p>
                <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                  <span className="text-emerald-400">{riskScore.derivatives.long_pct.toFixed(1)}% Long</span>
                  <span className="text-red-400">{riskScore.derivatives.short_pct.toFixed(1)}% Short</span>
                </div>
                <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full">
                  <div
                    className="rounded-l-full bg-emerald-500/80 transition-all"
                    style={{ width: `${riskScore.derivatives.long_pct}%` }}
                  />
                  <div
                    className="rounded-r-full bg-red-500/80 transition-all"
                    style={{ width: `${riskScore.derivatives.short_pct}%` }}
                  />
                </div>
                <p className="mt-3 text-center text-sm text-slate-400">
                  Ratio: <span className="font-semibold text-white">{riskScore.derivatives.ls_ratio.toFixed(2)}</span>
                </p>
              </article>

              {/* Basis */}
              <article className="panel px-5 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Basis</p>
                <h3 className={`mt-3 text-2xl font-bold ${
                  riskScore.derivatives.basis_pct > 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {riskScore.derivatives.basis_pct.toFixed(3)}%
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {riskScore.derivatives.basis_pct > 0.1
                    ? "Contango - sentiment bullish"
                    : riskScore.derivatives.basis_pct < -0.05
                      ? "Backwardation - sentiment bearish"
                      : "Neutru"}
                </p>
              </article>
            </div>
          </section>

          {/* ─── 6. MACRO ─── */}
          <section className="mb-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Macro</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Indicatori macroeconomici</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { key: "vix", label: "VIX", value: riskScore.macro.vix.toFixed(2), unit: "" },
                { key: "dxy", label: "DXY", value: riskScore.macro.dxy.toFixed(2), unit: "" },
                { key: "fed_funds_rate", label: "Rata Fed", value: riskScore.macro.fed_funds_rate.toFixed(2), unit: "%" },
                { key: "m2", label: "M2 Supply", value: riskScore.macro.m2.toFixed(1), unit: "T" },
                { key: "us10y", label: "Randament 10Y", value: riskScore.macro.us10y.toFixed(2), unit: "%" },
              ].map(({ key, label, value, unit }) => {
                const sentiment = getMacroSentiment(key, riskScore.macro[key as keyof typeof riskScore.macro]);
                return (
                  <article key={key} className="panel px-4 py-5 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
                    <h3 className="mt-3 text-xl font-bold text-white">
                      {key === "m2" ? "$" : ""}{value}{unit}
                    </h3>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${sentiment.color}`} />
                      <span className="text-xs text-slate-400">{sentiment.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ─── 7. ANALIZA ─── */}
          <section className="panel mb-8 p-6 md:p-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Analiza</p>
            <h2 className="mb-6 text-2xl font-bold text-white">Rezumat complet</h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              {riskScore.analysis
                .split("\n")
                .filter((line) => line.trim().length > 0)
                .map((paragraph, i) => (
                  <p key={i} className="leading-7">
                    {paragraph
                      .split(/(\*\*[^*]+\*\*)/)
                      .map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <span key={j} className="font-semibold text-white">
                            {part.slice(2, -2)}
                          </span>
                        ) : (
                          <span key={j}>{part}</span>
                        ),
                      )}
                  </p>
                ))}
            </div>
          </section>

          {/* ─── 8. FOOTER ─── */}
          <div className="mb-8 space-y-2 text-center">
            <p className="text-xs text-slate-500">
              Ultima actualizare: {updatedAt.toLocaleString("ro-RO")}
            </p>
            <p className="text-xs text-slate-600">
              Datele sunt generate automat si nu constituie sfaturi de investitii. Tradingul implica risc semnificativ.
            </p>
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
