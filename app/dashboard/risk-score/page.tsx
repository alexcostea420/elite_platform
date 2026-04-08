import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRiskScore, getRiskScoreV2 } from "@/lib/trading-data";
import type { RiskScoreData, RiskScoreComponent } from "@/lib/trading-data";
import { getDisplayIdentity } from "@/lib/utils/identity";
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

/* ── Romanian labels ── */

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
  nupl: "NUPL",
  realized_price: "Pret Realizat",
  vix: "VIX (Volatilitate)",
  fomc_proximity: "Proximitate FOMC",
  dxy: "Indicele Dolarului",
  m2_supply: "M2 Money Supply",
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
  nupl: "Net Unrealized Profit/Loss - >0.75 = zona de euforie",
  realized_price: "Pretul mediu de achizitie al tuturor BTC",
  dxy: "Dolar slab = favorabil pentru crypto",
  m2_supply: "Lichiditate globala - expansiune = bullish",
};

/* ── Indicator groups for accordion ── */

type IndicatorGroup = { title: string; keys: string[] };

const indicatorGroups: IndicatorGroup[] = [
  { title: "On-Chain", keys: ["mvrv", "sopr", "nupl", "puell_multiple", "realized_price"] },
  { title: "Tehnice", keys: ["rsi_weekly", "macd_weekly", "stoch_rsi_weekly", "pi_cycle_top", "mayer_multiple", "ma50w_bear"] },
  { title: "Derivate", keys: ["funding_rate"] },
  { title: "Macro", keys: ["vix", "fomc_proximity", "dxy", "m2_supply"] },
];

/* ── Helpers ── */

function getDecisionLabel(decision: string) {
  if (decision === "BUY") return "CUMPARA";
  if (decision === "SELL") return "VINDE";
  return "ASTEAPTA";
}

function scoreColor(score: number): { css: string; hex: string; glow: string } {
  if (score <= 30) return { css: "text-red-400", hex: "#ef4444", glow: "rgba(239,68,68,0.15)" };
  if (score <= 50) return { css: "text-amber-400", hex: "#f59e0b", glow: "rgba(245,158,11,0.15)" };
  return { css: "text-emerald-400", hex: "#22c55e", glow: "rgba(34,197,94,0.15)" };
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function safeNum(val: unknown, fallback = 0): number {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

function getNormColor(norm: number): string {
  const pct = Math.round(norm * 100);
  if (pct >= 70) return "#22c55e";
  if (pct >= 50) return "#a3e635";
  if (pct >= 30) return "#eab308";
  return "#ef4444";
}

function signalIcon(norm: number): string {
  if (norm >= 0.65) return "▲";
  if (norm <= 0.35) return "▼";
  return "●";
}

function signalColor(norm: number): string {
  if (norm >= 0.65) return "text-emerald-400";
  if (norm <= 0.35) return "text-red-400";
  return "text-amber-400";
}

function getSentimentPos(d: RiskScoreData["derivatives"]): number {
  const longSig = safeNum(d.long_pct, 50);
  const fundPct = safeNum(d.funding_pct, 0);
  const fundSig = fundPct > 0 ? 50 + Math.min(fundPct * 500, 50) : 50 + Math.max(fundPct * 500, -50);
  return Math.round(longSig * 0.7 + fundSig * 0.3);
}

function getMacroColor(key: string, value: number): string {
  switch (key) {
    case "vix":
      return value > 30 ? "bg-red-500" : value > 20 ? "bg-amber-500" : "bg-emerald-500";
    case "dxy":
      return value > 105 ? "bg-red-500" : value > 100 ? "bg-amber-500" : "bg-emerald-500";
    case "fed_funds_rate":
      return value > 5 ? "bg-red-500" : value > 3 ? "bg-amber-500" : "bg-emerald-500";
    case "fear_greed":
      return value <= 25 ? "bg-red-500" : value <= 50 ? "bg-orange-500" : value <= 75 ? "bg-amber-500" : "bg-emerald-500";
    default:
      return "bg-slate-500";
  }
}

function fearGreedLabel(v: number): string {
  if (v <= 20) return "Frica extrema";
  if (v <= 40) return "Frica";
  if (v <= 60) return "Neutru";
  if (v <= 80) return "Lacomie";
  return "Lacomie extrema";
}

function halvingPhase(days: number | null): string {
  if (days == null) return "N/A";
  if (days < 180) return "Acumulare timpurie";
  if (days < 365) return "Expansiune";
  if (days < 540) return "Euforie / Peak";
  return "Corectie / Bear";
}

function getConvictionRo(c: string): string {
  if (c === "HIGH") return "ridicata";
  if (c === "MEDIUM") return "moderata";
  return "scazuta";
}

function getSimpleSummary(decision: string, conviction: string): string {
  const conv = getConvictionRo(conviction);
  if (decision === "BUY") return `Conditiile de piata sunt favorabile pentru acumulare pe termen lung. Convingere ${conv}.`;
  if (decision === "SELL") return `Piata arata semne de supraincalzire. Prudenta la achizitii noi. Convingere ${conv}.`;
  return `Piata este in zona neutra. Nu exista un semnal clar. Convingere ${conv}.`;
}

/* ── SVG Gauge (inline client component) ── */

function HeroGaugeSVG({ score, decision }: { score: number; decision: string }) {
  const { hex, glow } = scoreColor(score);
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 138;
  const mainR = 120;
  const strokeW = 14;
  const circumference = 2 * Math.PI * mainR;
  const progress = (score / 100) * circumference;
  const label = getDecisionLabel(decision);

  // Color stops for outer ring glow
  const gradId = "gauge-grad";
  const glowId = "gauge-glow";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle
        cx={cx} cy={cy} r={outerR}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        opacity="0.4"
        filter={`url(#${glowId})`}
      />

      {/* Track */}
      <circle
        cx={cx} cy={cy} r={mainR}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeW}
        strokeLinecap="round"
      />

      {/* Progress arc */}
      <circle
        cx={cx} cy={cy} r={mainR}
        fill="none"
        stroke={hex}
        strokeWidth={strokeW}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
      >
        <animate
          attributeName="stroke-dasharray"
          from={`0 ${circumference}`}
          to={`${progress} ${circumference}`}
          dur="1.2s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.25 0.1 0.25 1"
          keyTimes="0;1"
        />
      </circle>

      {/* Score number */}
      <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="central"
        fill={hex} fontSize="64" fontWeight="900" fontFamily="var(--font-mono), monospace"
      >
        <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
        {score}
      </text>

      {/* Decision label */}
      <text x={cx} y={cy + 32} textAnchor="middle" dominantBaseline="central"
        fill={hex} fontSize="16" fontWeight="700" letterSpacing="0.2em" opacity="0.85"
      >
        {label}
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
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center md:p-12">
              <div className="mb-4 text-5xl">🚀</div>
              <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">Aceasta sectiune va fi disponibila in curand.</p>
              <a className="accent-button mt-6 inline-block" href="/dashboard">Inapoi la Dashboard</a>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

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

  // Try V2 first, fallback to V1
  const riskScore = (await getRiskScoreV2()) ?? (await getRiskScore());

  if (!riskScore) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center">
              <div className="text-5xl font-data">--</div>
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

  const price = riskScore.btc_price_live ?? riskScore.btc_price;
  const overrides = riskScore.overrides ?? [];
  const updatedAt = new Date(riskScore.timestamp);
  const { css: scoreCss, hex: scoreHex, glow: scoreGlow } = scoreColor(riskScore.score);

  // Argument card data
  const fgValue = safeNum(riskScore.fear_greed?.value, 50);
  const pctFromAth = safeNum(riskScore.pct_from_ath, 0);
  const halvingComp = riskScore.components?.halving_cycle;
  const halvingDays = halvingComp?.raw != null && typeof halvingComp.raw === "number" ? Math.round(halvingComp.raw) : null;

  // Derivatives (may be empty)
  const deriv = riskScore.derivatives ?? {} as RiskScoreData["derivatives"];
  const longPct = safeNum(deriv.long_pct, 50);
  const shortPct = safeNum(deriv.short_pct, 50);
  const fundingPct = safeNum(deriv.funding_pct, 0);
  const sentimentPos = getSentimentPos(deriv);

  // Macro (may be empty)
  const macro = riskScore.macro ?? {} as RiskScoreData["macro"];

  // Components grouped
  const allComponents = riskScore.components ?? {};

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />

      <main className="relative pb-16 pt-24 md:pt-28 overflow-hidden">
        {/* Background mood glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${scoreGlow}, transparent 70%)`,
          }}
        />

        <Container className="relative z-10">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-3">
            <Link className="text-sm text-slate-500 hover:text-emerald-400 transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: scoreHex }}>
              Risk Score
            </p>
          </div>

          {/* ─── 1. HERO GAUGE ─── */}
          <section
            className="glass-card mb-8 py-10 md:py-16"
            style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <div className="flex flex-col items-center text-center w-full px-4">
              <HeroGaugeSVG score={riskScore.score} decision={riskScore.decision} />

              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
                {getSimpleSummary(riskScore.decision, riskScore.conviction)}
              </p>

              <p className="mt-3 font-data text-sm text-slate-500">
                BTC: <span className="font-semibold text-white">${formatNumber(price)}</span>
                {riskScore.btc_24h_change != null && (
                  <span className={`ml-2 ${riskScore.btc_24h_change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {riskScore.btc_24h_change >= 0 ? "+" : ""}{riskScore.btc_24h_change.toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </section>

          {/* Overrides / Alerte */}
          {overrides.length > 0 && (
            <section className="mb-8 space-y-3">
              {overrides.map((override, i) => (
                <div
                  key={i}
                  className="glass-card flex items-start gap-3 px-5 py-4"
                  style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}
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

          {/* ─── 2. ARGUMENT CARDS ─── */}
          <section className="mb-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {/* Card 1: Fear & Greed */}
            <article className="glass-card flex-shrink-0 w-[85vw] snap-center px-6 py-7 md:w-auto">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{
                    background: fgValue <= 30 ? "rgba(239,68,68,0.15)" : fgValue <= 60 ? "rgba(245,158,11,0.15)" : "rgba(34,197,94,0.15)",
                    color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e",
                  }}
                >
                  {fgValue <= 30 ? "😨" : fgValue <= 60 ? "😐" : "🤑"}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Frica si Lacomie</p>
              </div>
              <h3
                className="font-data text-5xl font-black"
                style={{ color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e" }}
              >
                {fgValue}
              </h3>
              <p className="mt-1 text-sm font-medium" style={{ color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e" }}>
                {fearGreedLabel(fgValue)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Frica extrema este istoric un semnal contrarian de cumparare.
              </p>
            </article>

            {/* Card 2: Distance from ATH */}
            <article className="glass-card flex-shrink-0 w-[85vw] snap-center px-6 py-7 md:w-auto">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{
                    background: pctFromAth >= -5 ? "rgba(34,197,94,0.15)" : pctFromAth >= -20 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                    color: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  📊
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Distanta de la ATH</p>
              </div>
              <h3
                className="font-data text-5xl font-black"
                style={{ color: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444" }}
              >
                {pctFromAth >= 0 ? "ATH" : `${pctFromAth.toFixed(0)}%`}
              </h3>
              {/* Visual bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, 100 + pctFromAth)}%`,
                    backgroundColor: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                ${formatNumber(price)} vs ${formatNumber(safeNum(riskScore.btc_ath, 0))} ATH
              </p>
            </article>

            {/* Card 3: Halving Cycle */}
            <article className="glass-card flex-shrink-0 w-[85vw] snap-center px-6 py-7 md:w-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                >
                  ⏳
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Ciclul Halving</p>
              </div>
              <h3 className="font-data text-5xl font-black text-white">
                {halvingDays != null ? halvingDays : "--"}
              </h3>
              <p className="mt-1 text-sm font-medium text-violet-400">
                {halvingPhase(halvingDays)}
              </p>
              {/* Timeline bar */}
              {halvingDays != null && (
                <div className="mt-3 relative h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${Math.min(100, (halvingDays / 1460) * 100)}%` }}
                  />
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Ciclul de 4 ani: peak la ~494 zile dupa halving
              </p>
            </article>
          </section>

          {/* ─── 3. SENTIMENT METER ─── */}
          <section className="glass-card mb-8 px-6 py-7 md:px-10">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sentiment derivate</p>

            {/* Gradient bar */}
            <div className="relative">
              <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
              <div
                className="absolute -top-1.5 h-6 w-6 rounded-full border-2 border-white shadow-lg transition-all duration-700"
                style={{
                  left: `clamp(0px, calc(${sentimentPos}% - 12px), calc(100% - 24px))`,
                  background: sentimentPos < 35 ? "#ef4444" : sentimentPos > 65 ? "#22c55e" : "#f59e0b",
                  boxShadow: `0 0 12px ${sentimentPos < 35 ? "rgba(239,68,68,0.5)" : sentimentPos > 65 ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs font-semibold">
              <span className="text-red-400">BEARISH</span>
              <span className="text-amber-400">NEUTRU</span>
              <span className="text-emerald-400">BULLISH</span>
            </div>

            {/* Contributing factors chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Long {longPct.toFixed(1)}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Short {shortPct.toFixed(1)}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Funding {fundingPct.toFixed(4)}%
              </span>
              {safeNum(deriv.ls_ratio) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  L/S {safeNum(deriv.ls_ratio).toFixed(2)}
                </span>
              )}
            </div>
          </section>

          {/* ─── 4. MACRO SNAPSHOT ─── */}
          <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { key: "fear_greed", label: "Fear & Greed", value: String(fgValue), rawVal: fgValue, icon: "😨" },
              { key: "vix", label: "VIX", value: safeNum(macro.vix).toFixed(1), rawVal: safeNum(macro.vix), icon: "📉" },
              { key: "dxy", label: "DXY", value: safeNum(macro.dxy).toFixed(1), rawVal: safeNum(macro.dxy), icon: "💵" },
              { key: "fed_funds_rate", label: "Rata Fed", value: `${safeNum(macro.fed_funds_rate).toFixed(2)}%`, rawVal: safeNum(macro.fed_funds_rate), icon: "🏦" },
            ].map(({ key, label, value, rawVal, icon }) => {
              const dotColor = getMacroColor(key, rawVal);
              return (
                <article key={key} className="glass-card px-5 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{icon}</span>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
                  </div>
                  <p className="font-data text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </article>
              );
            })}
          </section>

          {/* ─── 5. DETALII TEHNICE (accordion) ─── */}
          <details className="mb-8 group">
            <summary className="glass-card cursor-pointer px-6 py-5 text-sm font-semibold text-slate-400 hover:text-white transition-colors select-none flex items-center justify-between">
              <span>Vezi analiza detaliata</span>
              <svg
                className="h-4 w-4 transition-transform duration-300 group-open:rotate-180"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>

            <div className="mt-4 space-y-4">
              {indicatorGroups.map((group) => {
                const items = group.keys
                  .map((k) => ({ key: k, comp: allComponents[k] }))
                  .filter((x): x is { key: string; comp: RiskScoreComponent } => x.comp != null);

                if (items.length === 0) return null;

                return (
                  <div key={group.title} className="glass-card p-5 md:p-6">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {group.title}
                    </h3>

                    {/* Header row */}
                    <div className="hidden md:grid md:grid-cols-[1fr_80px_50px_60px] gap-3 mb-2 text-xs text-slate-600 px-1">
                      <span>Indicator</span>
                      <span className="text-right">Valoare</span>
                      <span className="text-center">Semnal</span>
                      <span className="text-right">Pondere</span>
                    </div>

                    <div className="space-y-3">
                      {items
                        .sort((a, b) => b.comp.weight - a.comp.weight)
                        .map(({ key, comp }) => {
                          const normColor = getNormColor(comp.norm);
                          const pct = Math.round(comp.norm * 100);
                          const rawDisplay = comp.raw != null && typeof comp.raw === "number"
                            ? comp.raw.toFixed(2)
                            : `${pct}%`;

                          return (
                            <div key={key} className="rounded-xl bg-white/[0.02] px-3 py-3 md:px-4">
                              <div className="flex items-center justify-between md:grid md:grid-cols-[1fr_80px_50px_60px] md:gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-300 truncate">
                                    {componentLabels[key] ?? key}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-0.5 md:hidden">
                                    {componentWhyRo[key] ?? comp.why ?? ""}
                                  </p>
                                </div>

                                <p className="font-data text-sm font-bold text-right" style={{ color: normColor }}>
                                  {rawDisplay}
                                </p>

                                <p className={`text-center text-base ${signalColor(comp.norm)} hidden md:block`}>
                                  {signalIcon(comp.norm)}
                                </p>

                                <p className="font-data text-xs text-slate-500 text-right hidden md:block">
                                  {(comp.weight * 100).toFixed(0)}%
                                </p>
                              </div>

                              {/* Progress bar (mobile & desktop) */}
                              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, backgroundColor: normColor }}
                                />
                              </div>

                              {/* Why text (desktop only) */}
                              <p className="hidden md:block mt-1.5 text-xs text-slate-600">
                                {componentWhyRo[key] ?? comp.why ?? ""}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}

              {/* Derivatives detail */}
              {safeNum(deriv.oi_value) > 0 && (
                <div className="glass-card p-5 md:p-6">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Derivate (detalii)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Open Interest</p>
                      <p className="font-data text-lg font-bold text-white">
                        ${(safeNum(deriv.oi_value) / 1e9).toFixed(2)}B
                      </p>
                      <p className={`text-xs ${safeNum(deriv.oi_delta_pct) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {safeNum(deriv.oi_delta_pct) >= 0 ? "+" : ""}{safeNum(deriv.oi_delta_pct).toFixed(2)}% 4H
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Ratio L/S</p>
                      <p className="font-data text-lg font-bold text-white">{safeNum(deriv.ls_ratio).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Basis</p>
                      <p className={`font-data text-lg font-bold ${safeNum(deriv.basis_pct) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {safeNum(deriv.basis_pct).toFixed(3)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Taker Buy/Sell</p>
                      <p className="font-data text-lg font-bold text-white">{safeNum(deriv.taker_ratio).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis text */}
              {riskScore.analysis && (
                <div className="glass-card p-5 md:p-6">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Analiza completa
                  </h3>
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
              )}
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
