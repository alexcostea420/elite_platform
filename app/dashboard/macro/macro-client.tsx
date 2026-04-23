"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { MacroDashboardData } from "@/lib/trading-data";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ── Helpers ── */

const SIGNAL_COLORS: Record<string, string> = {
  supportive: "#00d97e",
  neutral: "#f6c343",
  restrictive: "#e63757",
};

const SIGNAL_LABELS: Record<string, string> = {
  supportive: "Favorabil",
  neutral: "Neutru",
  restrictive: "Restrictiv",
};

function formatValue(key: string, value: number): string {
  if (["btc", "gold", "spx", "oil", "silver"].includes(key)) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (["m2", "fed_balance_sheet", "reverse_repo", "treasury_general", "net_liquidity"].includes(key)) return `$${(value / 1000).toFixed(1)}T`;
  if (["dxy", "vix"].includes(key)) return value.toFixed(1);
  if (["fear_greed", "btc_dominance"].includes(key)) return `${value}`;
  if (key.includes("yield") || key.includes("rate") || key.includes("spread") || key.includes("curve") || key.includes("expect") || key.includes("yoy")) return `${value.toFixed(2)}%`;
  return value.toFixed(2);
}

function formatChange(change?: number): string {
  if (change === undefined || change === null) return "";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

const METRIC_LABELS: Record<string, string> = {
  m2: "M2 Money Supply", fed_balance_sheet: "Fed Balance Sheet", reverse_repo: "Reverse Repo (RRP)",
  treasury_general: "Treasury General (TGA)", net_liquidity: "Net Liquidity", m2_yoy: "M2 YoY",
  fed_funds_rate: "Fed Funds Rate", real_yield_10y: "10Y Real Yield (TIPS)", nominal_yield_10y: "10Y Nominal Yield",
  yield_curve_10y2y: "Yield Curve (10Y-2Y)", inflation_expect_5y: "5Y Inflation Expect",
  hy_spread: "HY Credit Spread", dxy: "Dollar Index (DXY)", vix: "VIX Volatility",
  gold: "Gold", spx: "S&P 500", oil: "Crude Oil", silver: "Silver", btc: "Bitcoin",
  btc_dominance: "BTC Dominance", fear_greed: "Fear & Greed",
};

const LAYER_LABELS: Record<string, { title: string; icon: string; description: string }> = {
  liquidity: { title: "Lichiditate", icon: "💧", description: "Capital in sistem" },
  rates: { title: "Rate", icon: "📊", description: "Costul riscului" },
  credit: { title: "Credit", icon: "🔌", description: "Stres financiar" },
  risk_assets: { title: "Risk Assets", icon: "📈", description: "Apetit de risc" },
  dollar: { title: "Dollar", icon: "💵", description: "Forta dolarului" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

/* ── Components ── */

function RegimePulse({ regime, layers }: { regime: MacroDashboardData["regime"]; layers: MacroDashboardData["layers"] }) {
  return (
    <motion.div
      initial="hidden" animate="visible" custom={0} variants={fadeUp}
      className="glass-card relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8"
    >
      <div className="absolute inset-0 rounded-2xl opacity-20" style={{ background: `linear-gradient(135deg, ${regime.color}22, transparent 60%)` }} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Regim Macro</p>
            <h2 className="mt-1 text-2xl font-bold" style={{ color: regime.color }}>{regime.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: regime.color }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: regime.color }} />
            </span>
            <span className="text-xs text-white/40">Live</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(layers).map(([key, layer]) => {
            const info = LAYER_LABELS[key] || { title: key, icon: "?", description: "" };
            return (
              <motion.div
                key={key} custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-xl border border-white/5 bg-white/5 p-3 text-center"
              >
                <p className="text-lg">{info.icon}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/60">{info.title}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: SIGNAL_COLORS[layer.signal] }}>
                  {SIGNAL_LABELS[layer.signal]}
                </p>
                <p className="mt-0.5 text-xs text-white/30">{layer.score >= 0 ? "+" : ""}{layer.score.toFixed(1)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ metricKey, metric, timeseries, index }: {
  metricKey: string; metric: MacroDashboardData["metrics"][string];
  timeseries?: Array<{ date: string; value: number }>; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const change = metric.change_3m;
  const changeColor = change !== undefined ? (change > 0 ? "#00d97e" : change < 0 ? "#e63757" : "#f6c343") : "#888";

  // Prepare chart data (reversed for chronological order)
  const chartData = timeseries ? [...timeseries].reverse() : [];

  return (
    <motion.div
      custom={index} variants={fadeUp} initial="hidden" animate="visible"
      className="cursor-pointer rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.06]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            {METRIC_LABELS[metricKey] || metricKey}
          </p>
          <p className="mt-1 text-xl font-bold text-white">{formatValue(metricKey, metric.value)}</p>
        </div>
        {change !== undefined && (
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color: changeColor, backgroundColor: `${changeColor}15` }}>
            {formatChange(change)} 3mo
          </span>
        )}
      </div>

      {/* Sparkline */}
      {chartData.length > 5 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={changeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={changeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={changeColor} strokeWidth={1.5}
                fill={`url(#grad-${metricKey})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expanded chart */}
      {expanded && chartData.length > 5 && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 180, opacity: 1 }}
          className="mt-4 overflow-hidden"
        >
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-exp-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={changeColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={changeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(d: string) => d.slice(5)} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} width={55}
                tickFormatter={(v: number) => formatValue(metricKey, v)} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#888" }}
                />
              <Area type="monotone" dataKey="value" stroke={changeColor} strokeWidth={2}
                fill={`url(#grad-exp-${metricKey})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {metric.source && <p className="mt-2 text-[10px] text-white/20">{metric.source}{metric.date ? ` | ${metric.date}` : ""}</p>}
    </motion.div>
  );
}

function MetricSection({ title, icon, description, metricKeys, metrics, timeseries, startIndex }: {
  title: string; icon: string; description: string;
  metricKeys: string[]; metrics: MacroDashboardData["metrics"];
  timeseries: MacroDashboardData["timeseries"]; startIndex: number;
}) {
  const available = metricKeys.filter((k) => metrics[k]);
  if (available.length === 0) return null;

  return (
    <motion.div custom={startIndex} variants={fadeUp} initial="hidden" animate="visible">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-white/40">{description}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((key, i) => (
          <MetricCard
            key={key} metricKey={key} metric={metrics[key]}
            timeseries={timeseries[key]} index={startIndex + i}
          />
        ))}
      </div>
    </motion.div>
  );
}

function FearGreedGauge({ value, label }: { value: number; label?: string }) {
  const color = value <= 25 ? "#e63757" : value <= 45 ? "#fd7e14" : value <= 55 ? "#f6c343" : value <= 75 ? "#86efac" : "#00d97e";
  const rotation = (value / 100) * 180 - 90;

  return (
    <motion.div custom={20} variants={fadeUp} initial="hidden" animate="visible"
      className="rounded-xl border border-white/5 bg-white/[0.03] p-5 text-center"
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Fear & Greed Index</p>
      <div className="relative mx-auto mt-3 h-20 w-40 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-20 w-40 rounded-t-full"
          style={{ background: `conic-gradient(from -90deg, #e63757 0deg, #fd7e14 45deg, #f6c343 90deg, #86efac 135deg, #00d97e 180deg, transparent 180deg)` }}
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-16 w-32 rounded-t-full bg-[#0a0a0f]" />
        <div className="absolute bottom-0 left-1/2 h-16 w-0.5 origin-bottom rounded-full bg-white"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <p className="mt-2 text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-white/50">{label || (value <= 25 ? "Frica Extrema" : value <= 45 ? "Frica" : value <= 55 ? "Neutru" : value <= 75 ? "Lacomie" : "Lacomie Extrema")}</p>
    </motion.div>
  );
}

/* ── Main Component ── */

export function MacroClient({ initialData }: { initialData: MacroDashboardData | null }) {
  if (!initialData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-4xl">📊</p>
          <p className="mt-4 text-lg font-semibold text-white/70">Date macro indisponibile</p>
          <p className="mt-1 text-sm text-white/40">Se actualizeaza la fiecare 4 ore.</p>
        </div>
      </div>
    );
  }

  const { metrics, timeseries, regime, layers } = initialData;
  const fg = metrics.fear_greed;
  const btcPrice = metrics.btc?.value ?? 0;
  const btcChange = metrics.btc?.change_3m;

  return (
    <div className="space-y-8">
      {/* Hero: BTC + Regime */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RegimePulse regime={regime} layers={layers} />
        </div>
        <div className="space-y-4">
          {/* BTC Price Card */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">Bitcoin</p>
            <p className="mt-1 text-2xl font-bold text-white">${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
            {btcChange !== undefined && (
              <p className="mt-1 text-sm" style={{ color: btcChange >= 0 ? "#00d97e" : "#e63757" }}>
                {formatChange(btcChange)} 3 luni
              </p>
            )}
            {metrics.btc_dominance && (
              <p className="mt-2 text-xs text-white/40">Dominance: {metrics.btc_dominance.value}%</p>
            )}
          </motion.div>

          {/* Fear & Greed */}
          {fg && <FearGreedGauge value={fg.value} label={fg.label} />}
        </div>
      </div>

      {/* Liquidity */}
      <MetricSection title="Lichiditate" icon="💧" description="Cantitatea de capital in sistem - M2, Fed, RRP, TGA"
        metricKeys={["m2", "m2_yoy", "fed_balance_sheet", "reverse_repo", "treasury_general", "net_liquidity"]}
        metrics={metrics} timeseries={timeseries} startIndex={3} />

      {/* Rates & Yields */}
      <MetricSection title="Rate si Randamente" icon="📊" description="Costul riscului - Fed Funds, real yields, curba randamentelor"
        metricKeys={["fed_funds_rate", "real_yield_10y", "nominal_yield_10y", "yield_curve_10y2y", "inflation_expect_5y"]}
        metrics={metrics} timeseries={timeseries} startIndex={9} />

      {/* Credit */}
      <MetricSection title="Credit & Stres" icon="🔌" description="Spread-uri de credit - masoara stresul in piata"
        metricKeys={["hy_spread"]}
        metrics={metrics} timeseries={timeseries} startIndex={14} />

      {/* Cross-Asset */}
      <MetricSection title="Cross-Asset" icon="🌍" description="DXY, VIX, Gold, S&P, Oil - contextul macro global"
        metricKeys={["dxy", "vix", "gold", "spx", "oil", "silver"]}
        metrics={metrics} timeseries={timeseries} startIndex={16} />

      {/* Timestamp */}
      <motion.p custom={25} variants={fadeUp} initial="hidden" animate="visible"
        className="text-center text-xs text-white/20"
      >
        Actualizat: {new Date(initialData.timestamp).toLocaleString("ro-RO")} UTC |
        Surse: FRED, Yahoo Finance, CoinGecko, Alternative.me
      </motion.p>
    </div>
  );
}
