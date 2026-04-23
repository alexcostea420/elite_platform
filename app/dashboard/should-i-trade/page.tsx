import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRiskScore, getRiskScoreV2 } from "@/lib/trading-data";
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

/* ── Decision logic ── */

type Decision = "BUY" | "SELL" | "HOLD";

function getDecisionDisplay(decision: Decision) {
  const map: Record<
    Decision,
    {
      label: string;
      sublabel: string;
      textColor: string;
      glowColor: string;
      dotColor: string;
      stripBg: string;
      stripBorder: string;
    }
  > = {
    BUY: {
      label: "DA",
      sublabel: "Conditii favorabile",
      textColor: "text-emerald-400",
      glowColor: "shadow-[0_0_40px_rgba(34,197,94,0.15)]",
      dotColor: "bg-emerald-400",
      stripBg: "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent",
      stripBorder: "border-emerald-500/20",
    },
    SELL: {
      label: "NU",
      sublabel: "Evita tranzactiile",
      textColor: "text-red-400",
      glowColor: "shadow-[0_0_40px_rgba(239,68,68,0.15)]",
      dotColor: "bg-red-400",
      stripBg: "bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent",
      stripBorder: "border-red-500/20",
    },
    HOLD: {
      label: "ASTEAPTA",
      sublabel: "Nu forta intrari",
      textColor: "text-amber-400",
      glowColor: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
      dotColor: "bg-amber-400",
      stripBg: "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent",
      stripBorder: "border-amber-500/20",
    },
  };
  return map[decision];
}

/* ── Helpers ── */

function fmt(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

function fmtVol(num: number) {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  return `$${fmt(num)}`;
}

function getFundingLabel(pct: number) {
  if (pct > 0.05) return { word: "Agresiv Long", color: "text-red-400" };
  if (pct > 0.01) return { word: "Usor Bullish", color: "text-emerald-400" };
  if (pct < -0.03) return { word: "Agresiv Short", color: "text-red-400" };
  if (pct < -0.01) return { word: "Usor Bearish", color: "text-amber-400" };
  return { word: "Neutru", color: "text-slate-400" };
}

function getLsLabel(longPct: number) {
  if (longPct > 60) return { word: "Dominanta Long", color: "text-emerald-400" };
  if (longPct < 40) return { word: "Dominanta Short", color: "text-red-400" };
  return { word: "Echilibrat", color: "text-slate-400" };
}

function getBasisLabel(basisPct: number) {
  if (basisPct > 0.1) return { word: "Contango puternic", color: "text-emerald-400" };
  if (basisPct > 0) return { word: "Contango", color: "text-emerald-400" };
  if (basisPct < -0.1) return { word: "Backwardation puternica", color: "text-red-400" };
  return { word: "Backwardation", color: "text-red-400" };
}

function translateOverride(override: string): { text: string; severity: "red" | "amber" | "green" } {
  const map: Record<string, { text: string; severity: "red" | "amber" | "green" }> = {
    "FOMC meeting within 3 days": { text: "FOMC in urmatoarele 3 zile", severity: "red" },
    "FOMC meeting within 7 days": { text: "FOMC in urmatoarele 7 zile", severity: "red" },
    "MA50W bear cross": { text: "MA50W Bear Signal", severity: "red" },
    "Extreme funding rate": { text: "Funding rate extrem", severity: "amber" },
    "VIX above 30": { text: "VIX peste 30", severity: "amber" },
    "DXY spike": { text: "DXY in crestere brusca", severity: "amber" },
  };

  if (map[override]) return map[override];

  // Check for fear/greed
  if (override.toLowerCase().includes("fear") && override.toLowerCase().includes("20"))
    return { text: "Fear < 20 = Oportunitate", severity: "green" };

  return { text: override, severity: "amber" };
}

const severityStyles = {
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  amber: "border-amber-500/25 bg-amber-500/8 text-amber-300",
  green: "border-emerald-500/25 bg-emerald-500/8 text-emerald-300",
};

/* ── Page ── */

export default async function ShouldITradePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/should-i-trade");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, subscription_expires_at, elite_since, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) redirect("/upgrade");

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
              <p className="mx-auto mt-4 max-w-lg text-slate-400">Această secțiune va fi disponibilă în curând.</p>
              <a className="accent-button mt-6 inline-block" href="/dashboard">Înapoi la Dashboard</a>
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
            <TimeGateLock daysRemaining={daysRemaining} featureName="Should I Trade" />
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const riskScore = (await getRiskScoreV2()) ?? (await getRiskScore());

  if (!riskScore) {
    return (
      <>
        <Navbar mode="dashboard" userIdentity={identity} />
        <main className="pb-16 pt-24 md:pt-28">
          <Container>
            <section className="glass-card p-8 text-center">
              <div className="font-data text-5xl text-slate-600">--</div>
              <h2 className="mt-4 text-xl font-bold text-white">Date indisponibile</h2>
              <p className="mt-2 text-sm text-slate-500">
                Analiza nu a putut fi incarcata. Incearca din nou mai tarziu.
              </p>
            </section>
          </Container>
        </main>
        <Footer compact />
      </>
    );
  }

  const d = getDecisionDisplay(riskScore.decision);
  const updatedAt = new Date(riskScore.timestamp);
  const change24h = riskScore.btc_24h_change ?? 0;
  const changeColor = change24h >= 0 ? "text-emerald-400" : "text-red-400";
  const changeSign = change24h >= 0 ? "+" : "";

  const deriv = riskScore.derivatives;
  const fundingPct = deriv?.funding_pct ?? 0;
  const longPct = deriv?.long_pct ?? 50;
  const shortPct = deriv?.short_pct ?? 50;
  const basisPct = deriv?.basis_pct ?? 0;
  const vol24h = deriv?.taker_buy_vol && deriv?.taker_sell_vol
    ? deriv.taker_buy_vol + deriv.taker_sell_vol
    : 0;

  const funding = getFundingLabel(fundingPct);
  const lsLabel = getLsLabel(longPct);
  const basis = getBasisLabel(basisPct);

  const overrides = riskScore.overrides ?? [];
  const alertChips = overrides.map((o) => translateOverride(o));

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-6 pt-[72px] md:pt-20">
        {/* ━━ 1. DECISION STRIP ━━ */}
        <div
          className={`sticky top-[56px] z-30 border-b ${d.stripBorder} ${d.stripBg} backdrop-blur-xl`}
          style={{ height: 60 }}
        >
          <Container>
            <div className="flex h-[60px] items-center justify-between">
              {/* Left: decision badge */}
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full ${d.dotColor} opacity-60`}
                  />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${d.dotColor}`} />
                </span>
                <span className={`font-display text-xl font-black tracking-wide md:text-2xl ${d.textColor}`}>
                  {d.label}
                </span>
                <span className="hidden text-xs text-slate-500 md:inline">{d.sublabel}</span>
              </div>

              {/* Center/Right: BTC price */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">
                  BTC
                </span>
                <span className="font-data text-lg font-bold text-white md:text-xl">
                  ${fmt(riskScore.btc_price_live)}
                </span>
                <span className={`font-data text-xs font-semibold ${changeColor}`}>
                  {changeSign}{change24h.toFixed(1)}%
                </span>
              </div>
            </div>
          </Container>
        </div>

        <Container>
          {/* ━━ 2. TRADINGVIEW CHART ━━ */}
          <section className={`glass-card mt-3 overflow-hidden p-1 md:p-2 ${d.glowColor}`}>
            <div className="h-[50vh] min-h-[360px] md:h-[65vh] md:min-h-[500px]">
              <TradingViewChart />
            </div>
          </section>

          {/* ━━ 3. ALERT CHIPS ━━ */}
          <section className="mt-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 pb-1">
              <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.35em] text-slate-600">
                Alerte
              </span>
              {alertChips.length > 0 ? (
                alertChips.map((chip, i) => (
                  <span
                    key={i}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${severityStyles[chip.severity]}`}
                  >
                    {chip.severity === "red" && "\u26A0"}
                    {chip.severity === "amber" && "\u26A1"}
                    {chip.severity === "green" && "\u2714"}
                    {chip.text}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-600">Niciun eveniment major detectat. Conditii normale de tranzactionare.</span>
              )}
            </div>
          </section>

          {/* ━━ 4. SENTIMENT CARDS ━━ */}
          <section className="mt-3 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 pb-1 md:grid md:grid-cols-4 md:gap-3">
              {/* Card 1: Long/Short Ratio */}
              <article className="glass-card flex w-[200px] shrink-0 flex-col gap-2 p-3 md:w-auto md:p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">&#9878;&#65039;</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Long/Short
                  </span>
                </div>
                <p className="font-data text-lg font-bold text-white">
                  {longPct.toFixed(0)}%
                  <span className="text-slate-600"> / </span>
                  {shortPct.toFixed(0)}%
                </p>
                {/* Tug-of-war bar */}
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="rounded-l-full bg-emerald-500 transition-all"
                    style={{ width: `${longPct}%` }}
                  />
                  <div
                    className="rounded-r-full bg-red-500 transition-all"
                    style={{ width: `${shortPct}%` }}
                  />
                </div>
                <p className={`text-[11px] font-semibold ${lsLabel.color}`}>{lsLabel.word}</p>
              </article>

              {/* Card 2: Funding Rate */}
              <article className="glass-card flex w-[200px] shrink-0 flex-col gap-2 p-3 md:w-auto md:p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">&#128176;</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Funding Rate
                  </span>
                </div>
                <p className={`font-data text-lg font-bold ${fundingPct === 0 ? "text-white" : fundingPct > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fundingPct > 0 ? "+" : ""}{fundingPct.toFixed(4)}%
                </p>
                <p className={`text-[11px] font-semibold ${funding.color}`}>{funding.word}</p>
                <p className="mt-1 text-[10px] text-slate-600">
                  {fundingPct < 0 ? "Funding negativ = shorts platesc = bullish bias" : fundingPct > 0.03 ? "Funding ridicat = risc de long squeeze" : "Funding normal = fara presiune"}
                </p>
              </article>

              {/* Card 3: Volum 24h */}
              <article className="glass-card flex w-[200px] shrink-0 flex-col gap-2 p-3 md:w-auto md:p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">&#128202;</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Volum 24h
                  </span>
                </div>
                <p className="font-data text-lg font-bold text-white">
                  {vol24h > 0 ? fmtVol(vol24h) : "N/A"}
                </p>
                {vol24h > 0 && (
                  <p className="text-[11px] text-slate-500">Taker buy + sell</p>
                )}
              </article>

              {/* Card 4: Basis */}
              <article className="glass-card flex w-[200px] shrink-0 flex-col gap-2 p-3 md:w-auto md:p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">&#128208;</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                    Basis
                  </span>
                </div>
                <p className="font-data text-lg font-bold text-white">
                  {basisPct > 0 ? "+" : ""}{basisPct.toFixed(3)}%
                </p>
                <p className={`text-[11px] font-semibold ${basis.color}`}>{basis.word}</p>
              </article>
            </div>
          </section>

          {/* ━━ 5. LINK TO RISK SCORE ━━ */}
          <div className="mt-5 text-center">
            <Link
              className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-accent-emerald"
              href="/dashboard/risk-score"
            >
              Vrei sa vezi analiza pe termen lung?
              <span className="inline-block transition-transform group-hover:translate-x-1">
                &#8594;
              </span>
            </Link>
          </div>

          {/* ━━ 6. FOOTER ━━ */}
          <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-700">
            Actualizat: {updatedAt.toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}
            {" \u00B7 "}Nu constituie sfaturi de investitii. Tradingul implica riscuri semnificative.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
