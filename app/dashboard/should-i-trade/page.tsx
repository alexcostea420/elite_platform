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

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function getFundingInterpretation(fundingPct: number) {
  if (fundingPct > 0.05) return { word: "Agresiv", color: "text-red-400" };
  if (fundingPct > 0.01) return { word: "Bullish", color: "text-emerald-400" };
  if (fundingPct < -0.01) return { word: "Bearish", color: "text-red-400" };
  return { word: "Neutru", color: "text-slate-400" };
}

function getSentimentInterpretation(longPct: number) {
  if (longPct > 60) return { word: "Bullish", color: "text-emerald-400" };
  if (longPct < 40) return { word: "Bearish", color: "text-red-400" };
  return { word: "Neutru", color: "text-slate-400" };
}

function translateOverride(override: string): string {
  const translations: Record<string, string> = {
    "FOMC meeting within 3 days": "FOMC in urmatoarele 3 zile",
    "MA50W bear cross": "MA50 saptamanal in bear cross",
    "Extreme funding rate": "Funding rate extrem",
    "VIX above 30": "VIX peste 30 - volatilitate ridicata",
    "DXY spike": "DXY in crestere brusca",
  };
  return translations[override] ?? override;
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
  const funding = getFundingInterpretation(riskScore.derivatives.funding_pct);
  const sentiment = getSentimentInterpretation(riskScore.derivatives.long_pct);
  const takerRatio = riskScore.derivatives.taker_ratio;
  const buyPct = Math.round(takerRatio * 100 / (takerRatio + 1));
  const sellPct = 100 - buyPct;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-8 pt-20 md:pt-24">
        <Container>
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <Link className="text-slate-500 transition-colors hover:text-accent-emerald" href="/dashboard">
              Dashboard
            </Link>
            <span className="text-slate-700">/</span>
            <span className="font-semibold uppercase tracking-[0.2em] text-accent-emerald">Should I Trade?</span>
          </nav>

          {/* 1. DECISION STRIP */}
          <div
            className={`mb-3 flex items-center justify-between rounded-xl border px-4 py-2.5 md:px-6 ${display.border} ${display.bg}`}
          >
            <div className="flex items-center gap-3">
              <span className={`inline-block h-3 w-3 rounded-full ${display.dot} animate-pulse`} />
              <span className={`text-lg font-bold md:text-xl ${display.color}`}>{display.label}</span>
              <span className="hidden text-sm text-slate-400 md:inline">{display.sublabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">BTC</span>
              <span className="font-display text-lg font-bold text-white md:text-xl">
                ${formatNumber(riskScore.btc_price_live)}
              </span>
            </div>
          </div>

          {/* 2. TRADINGVIEW CHART - Main element */}
          <section className="panel mb-3 overflow-hidden p-1 md:p-2">
            <div className="aspect-[16/9] min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
              <TradingViewChart />
            </div>
          </section>

          {/* 3. ALERTS - "La ce sa fii atent" */}
          <section className="mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Alerte</span>
              {riskScore.overrides.length > 0 ? (
                riskScore.overrides.map((override) => (
                  <span
                    key={override}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs font-medium text-amber-300"
                  >
                    <span>&#9888;</span>
                    {translateOverride(override)}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-400">
                  Fara alerte active
                </span>
              )}
            </div>
          </section>

          {/* 4. SENTIMENT DASHBOARD - 4 compact cards */}
          <section className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {/* Sentiment */}
            <article className="panel flex items-center gap-3 px-3 py-3 md:px-4">
              <span className="text-xl">&#9878;&#65039;</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Sentiment</p>
                <p className="text-sm font-bold text-white">
                  {riskScore.derivatives.long_pct.toFixed(0)}% L / {riskScore.derivatives.short_pct.toFixed(0)}% S
                </p>
                <p className={`text-xs font-medium ${sentiment.color}`}>{sentiment.word}</p>
              </div>
            </article>

            {/* Funding */}
            <article className="panel flex items-center gap-3 px-3 py-3 md:px-4">
              <span className="text-xl">&#128176;</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Funding</p>
                <p className="text-sm font-bold text-white">{riskScore.derivatives.funding_pct.toFixed(4)}%</p>
                <p className={`text-xs font-medium ${funding.color}`}>{funding.word}</p>
              </div>
            </article>

            {/* Volume */}
            <article className="panel flex items-center gap-3 px-3 py-3 md:px-4">
              <span className="text-xl">&#128202;</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Volum Taker</p>
                <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: `${buyPct}%` }} />
                  <div className="bg-red-500" style={{ width: `${sellPct}%` }} />
                </div>
                <p className="mt-0.5 text-xs">
                  <span className="font-medium text-emerald-400">{buyPct}%</span>
                  <span className="text-slate-600"> / </span>
                  <span className="font-medium text-red-400">{sellPct}%</span>
                </p>
              </div>
            </article>

            {/* Basis */}
            <article className="panel flex items-center gap-3 px-3 py-3 md:px-4">
              <span className="text-xl">&#128208;</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Basis</p>
                <p className="text-sm font-bold text-white">{riskScore.derivatives.basis_pct.toFixed(3)}%</p>
                <p className={`text-xs font-medium ${riskScore.derivatives.basis_pct > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {riskScore.derivatives.basis_pct > 0 ? "Contango" : "Backwardation"}
                </p>
              </div>
            </article>
          </section>

          {/* 5. LINK to Risk Score */}
          <div className="mb-4 text-center">
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-emerald transition-colors hover:text-emerald-300"
              href="/dashboard/risk-score"
            >
              Analiza completa Risk Score ({riskScore.score}/100)
              <span>&#8594;</span>
            </Link>
          </div>

          {/* 6. FOOTER: timestamp + disclaimer */}
          <p className="text-center text-[11px] text-slate-600">
            Actualizat: {updatedAt.toLocaleString("ro-RO")} &middot; Nu constituie sfaturi de investitii. Tradingul implica riscuri.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
