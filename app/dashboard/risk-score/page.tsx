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

/* ── Helper functions ── */

function getDecisionColor(decision: string) {
  if (decision === "BUY") return "text-emerald-400";
  if (decision === "SELL") return "text-red-400";
  return "text-amber-400";
}

function getDecisionGlow(decision: string) {
  if (decision === "BUY") return "shadow-[0_0_40px_rgba(52,211,153,0.3)] border-emerald-400/50 bg-emerald-400/10";
  if (decision === "SELL") return "shadow-[0_0_40px_rgba(248,113,113,0.3)] border-red-400/50 bg-red-400/10";
  return "shadow-[0_0_40px_rgba(251,191,36,0.3)] border-amber-400/50 bg-amber-400/10";
}

function getDecisionLabel(decision: string) {
  if (decision === "BUY") return "CUMPARA";
  if (decision === "SELL") return "VINDE";
  return "ASTEAPTA";
}

function getDecisionEmoji(decision: string) {
  if (decision === "BUY") return "🟢";
  if (decision === "SELL") return "🔴";
  return "🟡";
}

function getSimpleSummary(decision: string, score: number, conviction: string): string {
  const convictionRo = conviction === "HIGH" ? "ridicata" : conviction === "MEDIUM" ? "moderata" : "scazuta";
  if (decision === "BUY") {
    return `Conditiile de piata sunt favorabile pentru acumulare pe termen lung. Convingere ${convictionRo}.`;
  }
  if (decision === "SELL") {
    return `Piata arata semne de supraincalzire. Prudenta la achizitii noi. Convingere ${convictionRo}.`;
  }
  return `Piata este in zona neutra. Nu exista un semnal clar. Convingere ${convictionRo}.`;
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function getNormColor(norm: number) {
  const pct = Math.round(norm * 100);
  if (pct >= 70) return "#22C55E";
  if (pct >= 50) return "#A3E635";
  if (pct >= 30) return "#EAB308";
  return "#EF4444";
}

function getFearGreedColor(value: number): string {
  if (value <= 25) return "text-red-400";
  if (value <= 50) return "text-orange-400";
  if (value <= 75) return "text-amber-400";
  return "text-emerald-400";
}

function getSentimentPosition(longPct: number, fundingPct: number): number {
  // Combine long% (weight 70%) and funding direction (weight 30%) into 0-100 position
  const longSignal = longPct; // already 0-100
  const fundingSignal = fundingPct > 0 ? 50 + Math.min(fundingPct * 500, 50) : 50 + Math.max(fundingPct * 500, -50);
  return Math.round(longSignal * 0.7 + fundingSignal * 0.3);
}

function getMacroSentiment(key: string, value: number): { color: string } {
  switch (key) {
    case "vix":
      if (value > 30) return { color: "bg-red-500" };
      if (value > 20) return { color: "bg-amber-500" };
      return { color: "bg-emerald-500" };
    case "dxy":
      if (value > 105) return { color: "bg-red-500" };
      if (value > 100) return { color: "bg-amber-500" };
      return { color: "bg-emerald-500" };
    case "fed_funds_rate":
      if (value > 5) return { color: "bg-red-500" };
      if (value > 3) return { color: "bg-amber-500" };
      return { color: "bg-emerald-500" };
    case "fear_greed":
      if (value <= 25) return { color: "bg-red-500" };
      if (value <= 50) return { color: "bg-orange-500" };
      if (value <= 75) return { color: "bg-amber-500" };
      return { color: "bg-emerald-500" };
    default:
      return { color: "bg-slate-500" };
  }
}

/* ── Circular Progress Ring ── */

function CircularProgress({ value, size = 48, strokeWidth = 4 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value * circumference;
  const color = getNormColor(value);
  const center = size / 2;

  return (
    <svg height={size} width={size} className="shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
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
      <text x={center} y={center} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.26} fontWeight="bold">
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

  // Extract key data for argument cards
  const fearGreedValue = riskScore.fear_greed.value;
  const pctFromAth = riskScore.pct_from_ath;
  const halvingComp = riskScore.components.halving_cycle;
  const halvingDays = halvingComp?.raw != null && typeof halvingComp.raw === "number" ? Math.round(halvingComp.raw) : null;

  // Sentiment position (0 = full bearish, 100 = full bullish)
  const sentimentPos = getSentimentPosition(riskScore.derivatives.long_pct, riskScore.derivatives.funding_pct);

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

          {/* ─── 1. HERO ─── */}
          <section className="panel mb-8 px-6 py-10 md:px-10 md:py-14">
            <div className="flex flex-col items-center text-center">
              <RiskGauge score={riskScore.score} size={280} />

              <div className="mt-6">
                <span
                  className={`inline-block rounded-full border-2 px-10 py-3 text-2xl font-black tracking-widest ${getDecisionColor(riskScore.decision)} ${getDecisionGlow(riskScore.decision)}`}
                >
                  {getDecisionEmoji(riskScore.decision)} {getDecisionLabel(riskScore.decision)}
                </span>
              </div>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-300">
                {getSimpleSummary(riskScore.decision, riskScore.score, riskScore.conviction)}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                BTC: <span className="font-semibold text-white">${formatNumber(riskScore.btc_price_live)}</span>
              </p>
            </div>
          </section>

          {/* ─── Alerte (overrides) ─── */}
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

          {/* ─── 2. THREE ARGUMENT CARDS ─── */}
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Card 1: Fear & Greed */}
            <article className="panel px-6 py-7">
              <div className="mb-3 text-3xl">😨</div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frica si Lacomie</p>
              <h3 className={`mt-2 text-5xl font-black ${getFearGreedColor(fearGreedValue)}`}>
                {fearGreedValue}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Istoric: frica extrema = oportunitate de cumparare
              </p>
            </article>

            {/* Card 2: Distance from ATH */}
            <article className="panel px-6 py-7">
              <div className="mb-3 text-3xl">📉</div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Distanta de la ATH</p>
              <h3 className={`mt-2 text-5xl font-black ${pctFromAth >= -5 ? "text-emerald-400" : pctFromAth >= -20 ? "text-amber-400" : "text-red-400"}`}>
                {pctFromAth >= 0 ? "ATH" : `${pctFromAth.toFixed(0)}%`}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                BTC la ${formatNumber(riskScore.btc_price_live)} vs ${formatNumber(riskScore.btc_ath)} ATH
              </p>
            </article>

            {/* Card 3: Halving Cycle */}
            <article className="panel px-6 py-7">
              <div className="mb-3 text-3xl">⏳</div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Zile de la Halving</p>
              <h3 className="mt-2 text-5xl font-black text-white">
                {halvingDays != null ? halvingDays : "--"}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Istoric: bottom la ~370 zile dupa peak
              </p>
            </article>
          </section>

          {/* ─── 3. SENTIMENT METER ─── */}
          <section className="panel mb-8 px-6 py-7 md:px-10">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sentiment derivate</p>

            {/* Gradient bar */}
            <div className="relative">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
              {/* Marker */}
              <div
                className="absolute -top-1 h-5 w-5 rounded-full border-2 border-white bg-white shadow-lg transition-all"
                style={{ left: `calc(${sentimentPos}% - 10px)` }}
              />
            </div>

            {/* Labels */}
            <div className="mt-2 flex justify-between text-xs font-semibold">
              <span className="text-red-400">BEARISH</span>
              <span className="text-amber-400">NEUTRU</span>
              <span className="text-emerald-400">BULLISH</span>
            </div>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-slate-400">
              <span>
                <span className="font-semibold text-emerald-400">{riskScore.derivatives.long_pct.toFixed(1)}%</span> Long
                {" / "}
                <span className="font-semibold text-red-400">{riskScore.derivatives.short_pct.toFixed(1)}%</span> Short
              </span>
              <span>
                Funding: <span className="font-semibold text-white">{riskScore.derivatives.funding_pct.toFixed(4)}%</span>
              </span>
            </div>
          </section>

          {/* ─── 4. MACRO SNAPSHOT ─── */}
          <section className="panel mb-8 px-6 py-5 md:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {[
                { key: "fear_greed", label: "Fear&Greed", value: String(riskScore.fear_greed.value), rawVal: riskScore.fear_greed.value },
                { key: "vix", label: "VIX", value: riskScore.macro.vix.toFixed(1), rawVal: riskScore.macro.vix },
                { key: "dxy", label: "DXY", value: riskScore.macro.dxy.toFixed(1), rawVal: riskScore.macro.dxy },
                { key: "fed_funds_rate", label: "Rata Fed", value: `${riskScore.macro.fed_funds_rate.toFixed(2)}%`, rawVal: riskScore.macro.fed_funds_rate },
              ].map(({ key, label, value, rawVal }) => {
                const dot = getMacroSentiment(key, rawVal);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot.color}`} />
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-white">{value}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── 5. DETALII TEHNICE (collapsible) ─── */}
          <details className="mb-8">
            <summary className="panel cursor-pointer px-6 py-4 text-sm font-semibold text-slate-400 hover:text-white transition-colors select-none">
              Vezi detalii tehnice ▾
            </summary>

            <div className="mt-4 space-y-6">
              {/* Component bars */}
              <div className="panel p-6">
                <h3 className="mb-5 text-lg font-bold text-white">Toti indicatorii ({components.length})</h3>
                <div className="space-y-4">
                  {components
                    .sort((a, b) => b[1].weight - a[1].weight)
                    .map(([key, comp]) => {
                      const pct = Math.round(comp.norm * 100);
                      const color = getNormColor(comp.norm);
                      return (
                        <div key={key}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-300">{componentLabels[key] ?? key}</span>
                            <span className="text-sm font-bold" style={{ color }}>
                              {comp.raw != null ? (typeof comp.raw === "number" ? comp.raw.toFixed(2) : String(comp.raw)) : `${pct}%`}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{componentWhyRo[key] ?? comp.why}</p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Derivatives table */}
              <div className="panel p-6">
                <h3 className="mb-5 text-lg font-bold text-white">Derivate</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Open Interest</p>
                    <p className="text-lg font-bold text-white">${(riskScore.derivatives.oi_value / 1e9).toFixed(2)}B</p>
                    <p className={`text-xs ${riskScore.derivatives.oi_delta_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {riskScore.derivatives.oi_delta_pct >= 0 ? "+" : ""}{riskScore.derivatives.oi_delta_pct.toFixed(2)}% 4H
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Ratio L/S</p>
                    <p className="text-lg font-bold text-white">{riskScore.derivatives.ls_ratio.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Basis</p>
                    <p className={`text-lg font-bold ${riskScore.derivatives.basis_pct > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {riskScore.derivatives.basis_pct.toFixed(3)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Taker Buy/Sell</p>
                    <p className="text-lg font-bold text-white">{riskScore.derivatives.taker_ratio.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Analysis text */}
              <div className="panel p-6">
                <h3 className="mb-5 text-lg font-bold text-white">Analiza completa</h3>
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
              </div>
            </div>
          </details>

          {/* ─── 6. FOOTER ─── */}
          <p className="mb-8 text-center text-xs text-slate-600">
            Actualizat: {updatedAt.toLocaleString("ro-RO")} · Datele nu constituie sfaturi de investitii.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
