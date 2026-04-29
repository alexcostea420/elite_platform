"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  GLOSSARY,
  INDICATOR_BY_KEY,
  INDICATOR_GROUPS,
  SECTION_INFO,
  getVerdictCopy,
} from "@/lib/data/risk-score-data";
import type { RiskScoreData, RiskScoreComponent } from "@/lib/trading-data";
import { RiskScoreHistoryChart } from "@/components/dashboard/risk-score-history-chart";

/* ────────────────────────────────────────────────────────────
   Helpers (mirrored from previous page.tsx)
   ──────────────────────────────────────────────────────────── */

function getDecisionLabel(decision: string) {
  if (decision === "BUY") return "CUMPARA";
  if (decision === "SELL") return "VINDE";
  return "ASTEAPTA";
}

function scoreColor(score: number): { hex: string; glow: string } {
  if (score <= 30) return { hex: "#ef4444", glow: "rgba(239,68,68,0.18)" };
  if (score <= 50) return { hex: "#f59e0b", glow: "rgba(245,158,11,0.18)" };
  return { hex: "#22c55e", glow: "rgba(34,197,94,0.18)" };
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

function signalColorClass(norm: number): string {
  if (norm >= 0.65) return "text-emerald-400";
  if (norm <= 0.35) return "text-red-400";
  return "text-amber-400";
}

function getSentimentPos(d: RiskScoreData["derivatives"]): number {
  const longSig = safeNum(d?.long_pct, 50);
  const fundPct = safeNum(d?.funding_pct, 0);
  const fundSig =
    fundPct > 0 ? 50 + Math.min(fundPct * 500, 50) : 50 + Math.max(fundPct * 500, -50);
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
      return value <= 25
        ? "bg-red-500"
        : value <= 50
        ? "bg-orange-500"
        : value <= 75
        ? "bg-amber-500"
        : "bg-emerald-500";
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

/* ────────────────────────────────────────────────────────────
   InfoTooltip — "?" badge with hover/click popover
   ──────────────────────────────────────────────────────────── */

function InfoTooltip({
  id,
  label,
  text,
}: {
  id?: string;
  label?: string;
  text?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const content = text ?? (id ? SECTION_INFO[id] : undefined);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  if (!content) return null;

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex items-center"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label="Ce înseamnă"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[11px] font-bold text-slate-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-400 active:bg-emerald-400/10 sm:h-5 sm:w-5"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`absolute top-[calc(100%+8px)] left-0 z-50 max-w-[calc(100vw-2rem)] w-[260px] rounded-xl border border-white/10 bg-[#0b0b0f] p-3 text-left text-xs leading-relaxed text-slate-300 shadow-2xl transition-all ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1"
        }`}
      >
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          {label ?? "Ce înseamnă"}
        </span>
        {content}
      </span>
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   Section — collapsible wrapper with optional info tooltip
   Default-open on desktop, default-closed on mobile.
   ──────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasInfo = Boolean(SECTION_INFO[id]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
  }, []);

  return (
    <section id={id} className="mb-6 scroll-mt-24 md:mb-8">
      <div className="mb-4 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{title}</h2>
        {hasInfo && <InfoTooltip id={id} label={title} />}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-400 md:hidden"
          aria-label={open ? "Ascunde secțiunea" : "Arată secțiunea"}
        >
          {open ? "−" : "+"}
        </button>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[12000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────
   Verdict Hero — TL;DR card for noobs at the top
   ──────────────────────────────────────────────────────────── */

function VerdictHero({
  decision,
  score,
  conviction,
}: {
  decision: string;
  score: number;
  conviction: string;
}) {
  const v = getVerdictCopy(decision, score);
  return (
    <motion.div
      className="glass-card relative mb-6 overflow-hidden p-4 sm:p-6 md:mb-8 md:p-9"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: `linear-gradient(135deg, rgba(10,10,12,0.92), rgba(10,10,12,0.7)), radial-gradient(ellipse 80% 50% at 80% 0%, ${v.color}22, transparent 60%)`,
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 md:mb-4">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em]"
          style={{
            borderColor: `${v.color}55`,
            color: v.color,
            background: `${v.color}11`,
          }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: v.color }}
          />
          <span className="hidden sm:inline">Verdict azi · </span>
          {new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
        <InfoTooltip id="hero" label="Cum e calculat?" />
      </div>

      <h2
        className="mb-3 flex flex-wrap items-center gap-2 text-lg font-black leading-tight sm:gap-3 sm:text-2xl md:text-4xl"
        style={{ color: v.color }}
      >
        <span className="text-2xl sm:text-3xl md:text-5xl">{v.emoji}</span>
        {v.title}
      </h2>

      <p className="mb-5 max-w-3xl text-[13px] leading-relaxed text-slate-300 sm:text-sm md:mb-6 md:text-base">
        <span className="font-semibold text-white">{v.short}</span> {v.long}
      </p>

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3 md:mb-6 md:gap-5">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center sm:p-3 sm:rounded-xl md:p-4">
          <div className="font-data text-base font-black sm:text-2xl md:text-3xl" style={{ color: v.color }}>
            {score}
            <span className="ml-0.5 text-[10px] font-medium text-slate-500 sm:ml-1 sm:text-sm">/100</span>
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Risk Score
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center sm:p-3 sm:rounded-xl md:p-4">
          <div className="font-data text-base font-black text-white sm:text-2xl md:text-3xl">
            {getDecisionLabel(decision)}
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Decizie
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center sm:p-3 sm:rounded-xl md:p-4">
          <div className="font-data text-base font-black text-white sm:text-2xl md:text-3xl">
            {conviction === "HIGH" ? "Ridicată" : conviction === "MEDIUM" ? "Moderată" : "Scăzută"}
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 sm:text-[10px]">
            Convingere
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            ✓ Ce să faci acum
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
            {v.doNow.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
            ✗ Ce să NU faci
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
            {v.dontDo.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────
   Hero Gauge — animated SVG (kept as-is from previous page)
   ──────────────────────────────────────────────────────────── */

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

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block w-full max-w-[260px] sm:max-w-[300px]"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="gauge-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="none"
        stroke="url(#gauge-grad)"
        strokeWidth="2"
        opacity="0.4"
        filter="url(#gauge-glow)"
      />
      <circle cx={cx} cy={cy} r={mainR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="round" />
      <circle
        cx={cx}
        cy={cy}
        r={mainR}
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
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hex}
        fontSize="64"
        fontWeight="900"
        fontFamily="var(--font-mono), monospace"
      >
        <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" />
        {score}
      </text>
      <text
        x={cx}
        y={cy + 32}
        textAnchor="middle"
        dominantBaseline="central"
        fill={hex}
        fontSize="16"
        fontWeight="700"
        letterSpacing="0.2em"
        opacity="0.85"
      >
        {label}
      </text>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   Glossary — clickable expanding cards
   ──────────────────────────────────────────────────────────── */

function GlossarySection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <>
      <p className="mb-5 text-sm leading-relaxed text-slate-500">
        Termeni tehnici explicați pe înțelesul tuturor. Click pe orice carte pentru explicație completă.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {GLOSSARY.map((g, i) => {
          const isOpen = openIdx === i;
          return (
            <motion.div
              key={g.term}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                isOpen
                  ? "border-emerald-400/40 bg-emerald-500/[0.05]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/15"
              }`}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenIdx(isOpen ? null : i);
                }
              }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-base font-bold text-white">{g.term}</h4>
                <span
                  className={`text-xs text-emerald-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{g.short}</p>
              <div
                className={`overflow-hidden text-sm leading-relaxed text-slate-300 transition-all ${
                  isOpen ? "mt-3 max-h-72 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {g.full}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   QuickJump — floating button to scroll to top
   ──────────────────────────────────────────────────────────── */

function QuickJump() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-40 flex h-12 items-center gap-2 rounded-full border border-emerald-400/40 bg-[#0b0b0f]/90 px-5 text-sm font-semibold text-emerald-400 shadow-2xl backdrop-blur transition-all hover:scale-105 md:bottom-8 md:right-8"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Înapoi sus"
    >
      ↑ Sus
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   Main dashboard
   ──────────────────────────────────────────────────────────── */

export default function RiskScoreDashboard({ riskScore }: { riskScore: RiskScoreData }) {
  const price = riskScore.btc_price_live ?? riskScore.btc_price;
  const overrides = riskScore.overrides ?? [];
  const updatedAt = new Date(riskScore.timestamp);
  const { hex: scoreHex, glow: scoreGlow } = scoreColor(riskScore.score);

  // Derived values
  const fgValue = safeNum(riskScore.fear_greed?.value, 50);
  const pctFromAth = safeNum(riskScore.pct_from_ath, 0);
  const halvingComp = riskScore.components?.halving_cycle as
    | (RiskScoreComponent & { days_since_halving?: number })
    | undefined;
  const halvingDate = new Date("2024-04-19T00:00:00Z");
  const halvingDays =
    halvingComp?.days_since_halving != null
      ? halvingComp.days_since_halving
      : halvingComp?.raw != null && typeof halvingComp.raw === "number"
      ? Math.round(halvingComp.raw)
      : Math.round((Date.now() - halvingDate.getTime()) / (24 * 60 * 60 * 1000));

  const deriv = riskScore.derivatives ?? ({} as RiskScoreData["derivatives"]);
  const longPct = safeNum(deriv.long_pct, 50);
  const shortPct = safeNum(deriv.short_pct, 50);
  const fundingPct = safeNum(deriv.funding_pct, 0);
  const sentimentPos = getSentimentPos(deriv);

  const macro = riskScore.macro ?? ({} as RiskScoreData["macro"]);
  const allComponents = riskScore.components ?? {};

  // Group components by their group from INDICATOR_BY_KEY
  const componentsByGroup: Record<string, Array<{ key: string; comp: RiskScoreComponent }>> = {};
  for (const [key, comp] of Object.entries(allComponents)) {
    const info = INDICATOR_BY_KEY[key];
    const group = info?.group ?? "On-Chain";
    if (!componentsByGroup[group]) componentsByGroup[group] = [];
    componentsByGroup[group].push({ key, comp });
  }

  const macroDataAvailable =
    safeNum(macro.vix) > 0 || safeNum(macro.dxy) > 0 || safeNum(macro.fed_funds_rate) > 0;

  return (
    <main className="relative pb-16 pt-24 md:pt-28">
      {/* Mood glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${scoreGlow}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-3">
          <Link className="text-sm text-slate-500 transition-colors hover:text-emerald-400" href="/dashboard">
            Dashboard
          </Link>
          <span className="text-slate-700">/</span>
          <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: scoreHex }}>
            Risk Score
          </p>
        </div>

        {/* ─── 0. VERDICT HERO (NEW) ─── */}
        <VerdictHero decision={riskScore.decision} score={riskScore.score} conviction={riskScore.conviction} />

        {/* ─── 0.5 HISTORICAL CHART ─── */}
        <Section id="history" title="Istoric scor" icon="📈" defaultOpen={true}>
          <RiskScoreHistoryChart />
        </Section>

        {/* ─── 1. HERO GAUGE ─── */}
        <Section id="hero" title="Scor agregat" icon="🎯">
          <motion.div
            className="glass-card py-7 md:py-14"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex w-full flex-col items-center px-4 text-center">
              <HeroGaugeSVG score={riskScore.score} decision={riskScore.decision} />

              <p className="mt-3 font-data text-sm text-slate-500">
                BTC: <span className="font-semibold text-white">${formatNumber(price)}</span>
                {riskScore.btc_24h_change != null && (
                  <span
                    className={`ml-2 ${
                      riskScore.btc_24h_change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {riskScore.btc_24h_change >= 0 ? "+" : ""}
                    {riskScore.btc_24h_change.toFixed(1)}%
                  </span>
                )}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {riskScore.regime_info && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                    🌍 {riskScore.regime_info.regime}
                    <span className={riskScore.regime_info.modifier >= 0 ? "text-emerald-400" : "text-red-400"}>
                      ({riskScore.regime_info.modifier >= 0 ? "+" : ""}
                      {riskScore.regime_info.modifier})
                    </span>
                  </span>
                )}
                {riskScore.dca_mult != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                    💰 DCA: {riskScore.dca_mult}x
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-500">
                  🕐 {updatedAt.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}{" "}
                  {updatedAt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ─── 2. LAYER SCORES ─── */}
        {riskScore.layer_scores && (
          <Section id="layers" title="Scor pe straturi" icon="🧱">
            <motion.div
              className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4"
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {[
                { key: "onchain", label: "On-Chain", weight: "30%", icon: "⛓️" },
                { key: "technical", label: "Tehnic", weight: "20%", icon: "📈" },
                { key: "macro", label: "Macro", weight: "25%", icon: "🏦" },
                { key: "derivatives", label: "Derivate", weight: "15%", icon: "📊" },
                { key: "cycle", label: "Ciclu", weight: "10%", icon: "🔄" },
              ].map(({ key, label, weight, icon }) => {
                const val = safeNum((riskScore.layer_scores as Record<string, number>)?.[key], 50);
                const { hex: layerHex } = scoreColor(val);
                return (
                  <motion.article
                    key={key}
                    className="glass-card px-4 py-5 text-center"
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <h4 className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</h4>
                    <p className="mt-1 font-data text-3xl font-bold" style={{ color: layerHex }}>
                      {val}
                    </p>
                    <p className="text-[10px] text-slate-600">/ 100 ({weight})</p>
                    <div className="mx-auto mt-2 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: layerHex }}
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                      />
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </Section>
        )}

        {/* ─── 3. FLAGS + OVERRIDES ─── */}
        {(riskScore.flags?.length || overrides.length > 0) && (
          <Section id="flags" title="Semnale active" icon="⚠️">
            <div className="space-y-3">
              {riskScore.flags?.map((flag, i) => (
                <motion.div
                  key={`f-${i}`}
                  className="glass-card flex items-start gap-3 px-5 py-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderColor: "rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.05)" }}
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">⚠️</span>
                  <p className="text-sm leading-relaxed text-amber-200">{flag}</p>
                </motion.div>
              ))}
              {overrides.map((override, i) => (
                <motion.div
                  key={`o-${i}`}
                  className="glass-card flex items-start gap-3 px-5 py-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (riskScore.flags?.length ?? 0) * 0.05 + i * 0.05 }}
                  style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)" }}
                >
                  <span className="mt-0.5 shrink-0 text-red-400">🚨</span>
                  <p className="text-sm leading-relaxed text-red-200">{override}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        )}

        {/* ─── 4. ARGUMENT CARDS ─── */}
        <Section id="arguments" title="3 argumente principale" icon="📌">
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {/* Card 1: Fear & Greed */}
            <motion.article
              className="glass-card w-[85vw] flex-shrink-0 snap-center px-6 py-7 md:w-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{
                    background:
                      fgValue <= 30
                        ? "rgba(239,68,68,0.15)"
                        : fgValue <= 60
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(34,197,94,0.15)",
                    color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e",
                  }}
                >
                  {fgValue <= 30 ? "😨" : fgValue <= 60 ? "😐" : "🤑"}
                </div>
                <p className="flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Frica si Lacomie
                  <InfoTooltip text={INDICATOR_BY_KEY.fear_greed.full} label="Fear & Greed" />
                </p>
              </div>
              <h3
                className="font-data text-5xl font-black"
                style={{ color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e" }}
              >
                {fgValue}
              </h3>
              <p
                className="mt-1 text-sm font-medium"
                style={{ color: fgValue <= 30 ? "#ef4444" : fgValue <= 60 ? "#f59e0b" : "#22c55e" }}
              >
                {fearGreedLabel(fgValue)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Frica extrema este istoric un semnal contrarian de cumparare.
              </p>
            </motion.article>

            {/* Card 2: Distance from ATH */}
            <motion.article
              className="glass-card w-[85vw] flex-shrink-0 snap-center px-6 py-7 md:w-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{
                    background:
                      pctFromAth >= -5
                        ? "rgba(34,197,94,0.15)"
                        : pctFromAth >= -20
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(239,68,68,0.15)",
                    color: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444",
                  }}
                >
                  📊
                </div>
                <p className="flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Distanta de la ATH
                  <InfoTooltip text={INDICATOR_BY_KEY.drawdown.full} label="Drawdown" />
                </p>
              </div>
              <h3
                className="font-data text-5xl font-black"
                style={{ color: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444" }}
              >
                {pctFromAth >= 0 ? "ATH" : `${pctFromAth.toFixed(0)}%`}
              </h3>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: pctFromAth >= -5 ? "#22c55e" : pctFromAth >= -20 ? "#f59e0b" : "#ef4444",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, 100 + pctFromAth)}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                ${formatNumber(price)} vs ${formatNumber(safeNum(riskScore.btc_ath, 0))} ATH
              </p>
            </motion.article>

            {/* Card 3: Halving Cycle */}
            <motion.article
              className="glass-card w-[85vw] flex-shrink-0 snap-center px-6 py-7 md:w-auto"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}
                >
                  ⏳
                </div>
                <p className="flex items-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  Ciclul Halving
                  <InfoTooltip text={INDICATOR_BY_KEY.halving_cycle.full} label="Halving" />
                </p>
              </div>
              <h3 className="font-data text-5xl font-black text-white">
                {halvingDays != null ? halvingDays : "--"}
              </h3>
              <p className="mt-1 text-sm font-medium text-violet-400">{halvingPhase(halvingDays)}</p>
              {halvingDays != null && (
                <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (halvingDays / 1460) * 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              )}
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Ciclul de 4 ani: peak la ~494 zile după halving
              </p>
            </motion.article>
          </div>
        </Section>

        {/* ─── 5. SENTIMENT METER ─── */}
        {safeNum(deriv.long_pct) > 0 && (
          <Section id="sentiment" title="Sentiment derivate" icon="📊">
            <div className="glass-card px-6 py-7 md:px-10">
              <div className="relative">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
                <motion.div
                  className="absolute -top-1.5 h-6 w-6 rounded-full border-2 border-white shadow-lg"
                  initial={{ left: "50%", opacity: 0 }}
                  animate={{
                    left: `clamp(0px, calc(${sentimentPos}% - 12px), calc(100% - 24px))`,
                    opacity: 1,
                  }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background:
                      sentimentPos < 35 ? "#ef4444" : sentimentPos > 65 ? "#22c55e" : "#f59e0b",
                    boxShadow: `0 0 12px ${
                      sentimentPos < 35
                        ? "rgba(239,68,68,0.5)"
                        : sentimentPos > 65
                        ? "rgba(34,197,94,0.5)"
                        : "rgba(245,158,11,0.5)"
                    }`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs font-semibold">
                <span className="text-red-400">BEARISH</span>
                <span className="text-amber-400">NEUTRU</span>
                <span className="text-emerald-400">BULLISH</span>
              </div>

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
            </div>
          </Section>
        )}

        {/* ─── 6. MACRO SNAPSHOT ─── */}
        {macroDataAvailable && (
          <Section id="macro" title="Snapshot macro" icon="🏦">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { key: "fear_greed", label: "Fear & Greed", value: String(fgValue), rawVal: fgValue, icon: "😨" },
                {
                  key: "vix",
                  label: "VIX",
                  value: safeNum(macro.vix) > 0 ? safeNum(macro.vix).toFixed(1) : "—",
                  rawVal: safeNum(macro.vix),
                  icon: "📉",
                },
                {
                  key: "dxy",
                  label: "DXY",
                  value: safeNum(macro.dxy) > 0 ? safeNum(macro.dxy).toFixed(1) : "—",
                  rawVal: safeNum(macro.dxy),
                  icon: "💵",
                },
                {
                  key: "fed_funds_rate",
                  label: "Rata Fed",
                  value:
                    safeNum(macro.fed_funds_rate) > 0
                      ? `${safeNum(macro.fed_funds_rate).toFixed(2)}%`
                      : "—",
                  rawVal: safeNum(macro.fed_funds_rate),
                  icon: "🏦",
                },
              ].map(({ key, label, value, rawVal, icon }) => {
                const dotColor = getMacroColor(key, rawVal);
                const info = INDICATOR_BY_KEY[key];
                return (
                  <article key={key} className="glass-card px-5 py-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-lg">{icon}</span>
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
                    </div>
                    <p className="font-data text-2xl font-bold text-white">{value}</p>
                    <p className="mt-1 flex items-center text-xs text-slate-500">
                      {label}
                      {info && <InfoTooltip text={info.full} label={label} />}
                    </p>
                  </article>
                );
              })}
            </div>
          </Section>
        )}

        {/* ─── 7. DETAILED INDICATORS (FIXED key mapping) ─── */}
        <Section id="details" title="Toți indicatorii" icon="🔍" defaultOpen={true}>
          <div className="space-y-4">
            {INDICATOR_GROUPS.map((g) => {
              const items = componentsByGroup[g.group] ?? [];
              if (items.length === 0) return null;
              return (
                <motion.div
                  key={g.title}
                  className="glass-card p-5 md:p-6"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {g.title}
                  </h3>

                  <div className="mb-2 hidden gap-3 px-1 text-xs text-slate-600 md:grid md:grid-cols-[1fr_80px_50px_60px]">
                    <span>Indicator</span>
                    <span className="text-right">Valoare</span>
                    <span className="text-center">Semnal</span>
                    <span className="text-right">Pondere</span>
                  </div>

                  <div className="space-y-3">
                    {items
                      .sort((a, b) => b.comp.weight - a.comp.weight)
                      .map(({ key, comp }) => {
                        const info = INDICATOR_BY_KEY[key];
                        const normColor = getNormColor(comp.norm);
                        const pct = Math.round(comp.norm * 100);
                        const rawDisplay =
                          comp.raw != null && typeof comp.raw === "number"
                            ? comp.raw.toFixed(2)
                            : `${pct}%`;
                        const label = info?.label ?? key;
                        const why = info?.howToRead ?? comp.why ?? "";

                        return (
                          <div key={key} className="rounded-xl bg-white/[0.02] px-3 py-3 md:px-4">
                            <div className="flex items-center justify-between md:grid md:grid-cols-[1fr_80px_50px_60px] md:gap-3">
                              <div className="min-w-0">
                                <p className="flex items-center truncate text-sm font-medium text-slate-300">
                                  {label}
                                  {info && <InfoTooltip text={info.full} label={label} />}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600 md:hidden">{why}</p>
                              </div>

                              <p
                                className="text-right font-data text-sm font-bold"
                                style={{ color: normColor }}
                              >
                                {rawDisplay}
                              </p>

                              <p
                                className={`hidden text-center text-base ${signalColorClass(comp.norm)} md:block`}
                              >
                                {signalIcon(comp.norm)}
                              </p>

                              <p className="hidden text-right font-data text-xs text-slate-500 md:block">
                                {(comp.weight * 100).toFixed(0)}%
                              </p>
                            </div>

                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: normColor }}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${pct}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                              />
                            </div>

                            <p className="mt-1.5 hidden text-xs text-slate-600 md:block">{why}</p>
                            {info?.source && (
                              <p className="mt-1 text-[10px] text-slate-700">📎 {info.source}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </motion.div>
              );
            })}

            {/* Derivatives detail */}
            {safeNum(deriv.oi_value) > 0 && (
              <motion.div
                className="glass-card p-5 md:p-6"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Derivate — medie 7 zile
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-slate-600">
                    {deriv.timeframe ?? "1d (7-day avg)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Open Interest</p>
                    <p className="font-data text-lg font-bold text-white">
                      ${(safeNum(deriv.oi_value) / 1e9).toFixed(2)}B
                    </p>
                    <p
                      className={`text-xs ${
                        safeNum(deriv.oi_delta_pct_7d ?? deriv.oi_delta_pct) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {safeNum(deriv.oi_delta_pct_7d ?? deriv.oi_delta_pct) >= 0 ? "+" : ""}
                      {safeNum(deriv.oi_delta_pct_7d ?? deriv.oi_delta_pct).toFixed(2)}% 7D
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">L/S 7d</p>
                    <p className="font-data text-lg font-bold text-white">
                      {safeNum(deriv.ls_ratio).toFixed(2)}
                    </p>
                    {deriv.ls_ratio_now != null && (
                      <p className="text-[10px] text-slate-500">
                        acum: {safeNum(deriv.ls_ratio_now).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Basis</p>
                    <p
                      className={`font-data text-lg font-bold ${
                        safeNum(deriv.basis_pct) > 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {safeNum(deriv.basis_pct).toFixed(3)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Taker 7d</p>
                    <p className="font-data text-lg font-bold text-white">
                      {safeNum(deriv.taker_ratio).toFixed(2)}
                    </p>
                    {deriv.taker_ratio_now != null && (
                      <p className="text-[10px] text-slate-500">
                        acum: {safeNum(deriv.taker_ratio_now).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Section>

        {/* ─── 8. GLOSSARY (NEW) ─── */}
        <Section id="glossary" title="Glosar — termeni explicați" icon="📚" defaultOpen={true}>
          <GlossarySection />
        </Section>

        {/* Footer */}
        <p className="mb-8 text-center text-xs text-slate-600">
          Actualizat: {updatedAt.toLocaleString("ro-RO")} · Datele nu constituie sfaturi de investiții.
        </p>
      </div>

      <QuickJump />
    </main>
  );
}
