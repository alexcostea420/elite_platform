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
    "Decizie clară de trading bazată pe analiza automată a riscului. YES / NO / WAIT - actualizat în timp real.",
  keywords: ["should i trade", "decizie trading", "semnal trading crypto", "elite trading"],
  path: "/dashboard/should-i-trade",
  host: "app",
  index: false,
});

export const revalidate = 0; // always fresh

type Decision = "BUY" | "SELL" | "HOLD";

function getDecisionDisplay(decision: Decision) {
  const map: Record<Decision, { label: string; sublabel: string; color: string; bg: string; glow: string }> = {
    BUY: {
      label: "YES",
      sublabel: "Condițiile sunt favorabile",
      color: "text-green-400",
      bg: "bg-green-400/10 border-green-400/30",
      glow: "shadow-[0_0_80px_rgba(74,222,128,0.3)]",
    },
    SELL: {
      label: "NO",
      sublabel: "Condițiile sunt nefavorabile",
      color: "text-red-400",
      bg: "bg-red-400/10 border-red-400/30",
      glow: "shadow-[0_0_80px_rgba(248,113,113,0.3)]",
    },
    HOLD: {
      label: "WAIT",
      sublabel: "Condițiile sunt incerte",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10 border-yellow-400/30",
      glow: "shadow-[0_0_80px_rgba(250,204,21,0.3)]",
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
      return "Conviction scăzut";
    default:
      return conviction;
  }
}

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
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
              <p className="mt-3 text-slate-400">Analiza nu a putut fi încărcată. Încearcă din nou mai târziu.</p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const display = getDecisionDisplay(riskScore.decision);
  const updatedAt = new Date(riskScore.timestamp);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Breadcrumb */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/dashboard">
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Should I Trade?</p>
            </div>
          </section>

          {/* Big Decision Card */}
          <section className={`panel mb-8 border p-8 text-center md:p-12 ${display.bg} ${display.glow}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Decizia botului</p>
            <h1 className={`mt-4 font-display text-8xl font-bold md:text-9xl ${display.color}`}>{display.label}</h1>
            <p className="mt-4 text-xl text-slate-300">{display.sublabel}</p>
            <p className="mt-3 text-sm text-slate-500">{riskScore.decision_text}</p>
          </section>

          {/* Context Cards */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Risk Score</p>
              <h3 className="mt-3 font-display text-4xl font-bold text-white">{riskScore.score}/100</h3>
              <p className="mt-2 text-sm text-slate-400">
                {riskScore.score <= 35 ? "Risc scăzut = oportunitate" : riskScore.score <= 65 ? "Zona neutră" : "Risc crescut"}
              </p>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Conviction</p>
              <h3 className={`mt-3 text-3xl font-bold ${display.color}`}>{riskScore.conviction}</h3>
              <p className="mt-2 text-sm text-slate-400">{getConvictionLabel(riskScore.conviction)}</p>
              <p className="mt-1 text-xs text-slate-500">{riskScore.conviction_detail}</p>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fear & Greed</p>
              <h3
                className={`mt-3 text-3xl font-bold ${riskScore.fear_greed.value <= 25 ? "text-red-400" : riskScore.fear_greed.value <= 50 ? "text-orange-400" : "text-green-400"}`}
              >
                {riskScore.fear_greed.value}
              </h3>
              <p className="mt-2 text-sm text-slate-400">{riskScore.fear_greed.label}</p>
            </article>
          </section>

          {/* TradingView Chart with Zone Toggle */}
          <section className="panel mb-8 p-4 md:p-6">
            <TradingViewChart />
          </section>

          {/* Derivatives Explained */}
          <section className="panel mb-8 p-6 md:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Derivatives</p>
            <h2 className="mb-5 text-2xl font-bold text-white">Ce spun futuresurile</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">Open Interest</p>
                <p className="mt-1 text-xl font-bold text-white">${(riskScore.derivatives.oi_value / 1e9).toFixed(2)}B</p>
                <p className="mt-1 text-xs text-slate-500">Bani in futures</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">Long / Short</p>
                <p className={`mt-1 text-xl font-bold ${riskScore.derivatives.long_pct > 55 ? "text-green-400" : riskScore.derivatives.short_pct > 55 ? "text-red-400" : "text-white"}`}>
                  {riskScore.derivatives.long_pct.toFixed(0)}% / {riskScore.derivatives.short_pct.toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{riskScore.derivatives.long_pct > 55 ? "Majority long" : riskScore.derivatives.short_pct > 55 ? "Majority short" : "Echilibrat"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">Funding Rate</p>
                <p className={`mt-1 text-xl font-bold ${riskScore.derivatives.funding_pct > 0.01 ? "text-green-400" : riskScore.derivatives.funding_pct < -0.01 ? "text-red-400" : "text-white"}`}>
                  {riskScore.derivatives.funding_pct.toFixed(4)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{riskScore.derivatives.funding_pct > 0 ? "Longii platesc" : "Shortii platesc"}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">Basis</p>
                <p className={`mt-1 text-xl font-bold ${riskScore.derivatives.basis_pct > 0 ? "text-green-400" : "text-red-400"}`}>
                  {riskScore.derivatives.basis_pct.toFixed(3)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{riskScore.derivatives.basis_pct > 0 ? "Futures > Spot" : "Spot > Futures"}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              Funding rate pozitiv = longii sunt majoritari si platesc taxa. Basis negativ = futures sub spot, semn de pesimism.
            </p>
          </section>

          {/* Key Data Points */}
          <section className="mb-8 grid gap-4 md:grid-cols-2">
            <article className="panel p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Context Preț</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">BTC Live</span>
                  <span className="font-bold text-white">${formatNumber(riskScore.btc_price_live)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ATH</span>
                  <span className="text-slate-300">${formatNumber(riskScore.btc_ath)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distanță de ATH</span>
                  <span className="text-red-400">{riskScore.pct_from_ath.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Funding Rate</span>
                  <span className="text-white">{riskScore.derivatives.funding_pct.toFixed(4)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">L/S Ratio</span>
                  <span className="text-white">{riskScore.derivatives.ls_ratio.toFixed(2)}</span>
                </div>
              </div>
            </article>

            <article className="panel p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Context Macro</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">VIX</span>
                  <span className={riskScore.macro.vix > 30 ? "font-bold text-red-400" : "text-white"}>
                    {riskScore.macro.vix.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DXY</span>
                  <span className="text-white">{riskScore.macro.dxy.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fed Rate</span>
                  <span className="text-white">{riskScore.macro.fed_funds_rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">M2 Supply</span>
                  <span className="text-white">${riskScore.macro.m2.toFixed(1)}T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BTC Dominance</span>
                  <span className="text-white">{riskScore.coingecko.btc_dominance.toFixed(1)}%</span>
                </div>
              </div>
            </article>
          </section>

          {/* Overrides */}
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

          {/* CTA */}
          <section className="mb-8 text-center">
            <Link className="accent-button" href="/dashboard/risk-score">
              Vezi analiza completă
            </Link>
          </section>

          <p className="mb-8 text-center text-xs text-slate-600">
            Ultima actualizare: {updatedAt.toLocaleString("ro-RO")} &middot; Decizia este generată automat și nu
            constituie sfaturi de investiții.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
