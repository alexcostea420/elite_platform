"use client";

import { useState } from "react";
import type { MacroDashboardData } from "@/lib/trading-data";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ── Design tokens ── */

const COLOR_BULLISH = "#34D399"; // emerald-400
const COLOR_BEARISH = "#F87171"; // red-400
const COLOR_NEUTRAL = "#FBBF24"; // amber-400
const COLOR_DIM = "#94A3B8"; // slate-400

const SIGNAL_COLORS: Record<string, string> = {
  supportive: COLOR_BULLISH,
  neutral: COLOR_NEUTRAL,
  restrictive: COLOR_BEARISH,
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

function changeColorFor(change?: number): string {
  if (change === undefined) return COLOR_DIM;
  if (change > 0) return COLOR_BULLISH;
  if (change < 0) return COLOR_BEARISH;
  return COLOR_NEUTRAL;
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
  liquidity: { title: "Lichiditate", icon: "💧", description: "Capital în sistem" },
  rates: { title: "Rate", icon: "📊", description: "Costul riscului" },
  credit: { title: "Credit", icon: "🔌", description: "Stres financiar" },
  risk_assets: { title: "Risk Assets", icon: "📈", description: "Apetit de risc" },
  dollar: { title: "Dolar", icon: "💵", description: "Forța dolarului" },
};

/* ── Components ── */

function RegimePulse({ regime, layers }: { regime: MacroDashboardData["regime"]; layers: MacroDashboardData["layers"] }) {
  return (
    <div className="glass-card animate-fade-in-up relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${regime.color}33, transparent 60%)` }} />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Regim Macro
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl" style={{ color: regime.color }}>
              {regime.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="live-dot" style={{ backgroundColor: regime.color }} />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {Object.entries(layers).map(([key, layer], i) => {
            const info = LAYER_LABELS[key] || { title: key, icon: "?", description: "" };
            return (
              <div
                key={key}
                className="animate-fade-in-up rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2.5 text-center"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-lg leading-none">{info.icon}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{info.title}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: SIGNAL_COLORS[layer.signal] }}>
                  {SIGNAL_LABELS[layer.signal]}
                </p>
                <p className="mt-0.5 font-data text-xs tabular-nums text-slate-500">
                  {layer.score >= 0 ? "+" : ""}{layer.score.toFixed(1)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metricKey, metric, timeseries, index }: {
  metricKey: string; metric: MacroDashboardData["metrics"][string];
  timeseries?: Array<{ date: string; value: number }>; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const change = metric.change_3m;
  const tone = changeColorFor(change);
  const chartData = timeseries ? [...timeseries].reverse() : [];

  return (
    <div
      className="glass-card card-hover animate-fade-in-up cursor-pointer p-5"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {METRIC_LABELS[metricKey] || metricKey}
          </p>
          <p className="mt-1 font-data text-xl font-bold tabular-nums text-white sm:text-2xl">
            {formatValue(metricKey, metric.value)}
          </p>
        </div>
        {change !== undefined && (
          <span
            className="shrink-0 rounded-md px-2 py-0.5 font-data text-xs font-semibold tabular-nums"
            style={{ color: tone, backgroundColor: `${tone}1a` }}
          >
            {formatChange(change)} 3L
          </span>
        )}
      </div>

      {chartData.length > 5 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={tone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke={tone} strokeWidth={1.5}
                fill={`url(#grad-${metricKey})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {expanded && chartData.length > 5 && (
        <div className="mt-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-exp-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={tone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(d: string) => d.slice(5)} interval={Math.floor(chartData.length / 5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={55}
                tickFormatter={(v: number) => formatValue(metricKey, v)} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="value" stroke={tone} strokeWidth={2}
                fill={`url(#grad-exp-${metricKey})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {metric.source && (
        <p className="mt-2 text-[10px] text-slate-600">
          {metric.source}{metric.date ? ` · ${metric.date}` : ""}
        </p>
      )}
    </div>
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
    <section className="animate-fade-in-up">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl leading-none">{icon}</span>
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
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
    </section>
  );
}

function FearGreedGauge({ value, label }: { value: number; label?: string }) {
  const color = value <= 25 ? COLOR_BEARISH : value <= 45 ? "#FB923C" : value <= 55 ? COLOR_NEUTRAL : value <= 75 ? "#86EFAC" : COLOR_BULLISH;
  const rotation = (value / 100) * 180 - 90;
  const localLabel = label
    ?? (value <= 25 ? "Frică Extremă" : value <= 45 ? "Frică" : value <= 55 ? "Neutru" : value <= 75 ? "Lăcomie" : "Lăcomie Extremă");

  return (
    <div className="glass-card animate-fade-in-up p-5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Fear &amp; Greed Index</p>
      <div className="relative mx-auto mt-3 h-20 w-40 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-20 w-40 rounded-t-full"
          style={{ background: `conic-gradient(from -90deg, ${COLOR_BEARISH} 0deg, #FB923C 45deg, ${COLOR_NEUTRAL} 90deg, #86EFAC 135deg, ${COLOR_BULLISH} 180deg, transparent 180deg)` }}
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-16 w-32 rounded-t-full bg-crypto-dark" />
        <div
          className="absolute bottom-0 left-1/2 h-16 w-0.5 origin-bottom rounded-full bg-white"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <p className="mt-2 font-data text-3xl font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-400">{localLabel}</p>
    </div>
  );
}

/* ── Main Component ── */

export function MacroClient({ initialData }: { initialData: MacroDashboardData | null }) {
  if (!initialData) {
    return (
      <div className="glass-card flex min-h-[400px] items-center justify-center p-7">
        <div className="text-center">
          <p className="text-4xl">📊</p>
          <p className="mt-4 text-lg font-semibold text-slate-300">Date macro indisponibile</p>
          <p className="mt-1 text-sm text-slate-500">Se actualizează la fiecare 4 ore.</p>
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
          <div className="glass-card animate-fade-in-up p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bitcoin</p>
            <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white sm:text-3xl">
              ${btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            {btcChange !== undefined && (
              <p className="mt-1 font-data text-sm tabular-nums" style={{ color: changeColorFor(btcChange) }}>
                {formatChange(btcChange)} · 3 luni
              </p>
            )}
            {metrics.btc_dominance && (
              <p className="mt-2 text-xs text-slate-400">
                Dominance: <span className="font-data tabular-nums text-slate-300">{metrics.btc_dominance.value}%</span>
              </p>
            )}
          </div>

          {fg && <FearGreedGauge value={fg.value} label={fg.label} />}
        </div>
      </div>

      <MetricSection title="Lichiditate" icon="💧" description="Capital în sistem — M2, Fed, RRP, TGA"
        metricKeys={["m2", "m2_yoy", "fed_balance_sheet", "reverse_repo", "treasury_general", "net_liquidity"]}
        metrics={metrics} timeseries={timeseries} startIndex={3} />

      <MetricSection title="Rate și Randamente" icon="📊" description="Costul riscului — Fed Funds, real yields, curba randamentelor"
        metricKeys={["fed_funds_rate", "real_yield_10y", "nominal_yield_10y", "yield_curve_10y2y", "inflation_expect_5y"]}
        metrics={metrics} timeseries={timeseries} startIndex={9} />

      <MetricSection title="Credit & Stres" icon="🔌" description="Spread-uri de credit — măsoară stresul în piață"
        metricKeys={["hy_spread"]}
        metrics={metrics} timeseries={timeseries} startIndex={14} />

      <MetricSection title="Cross-Asset" icon="🌍" description="DXY, VIX, Gold, S&P, Oil — contextul macro global"
        metricKeys={["dxy", "vix", "gold", "spx", "oil", "silver"]}
        metrics={metrics} timeseries={timeseries} startIndex={16} />

      <p className="text-center text-xs text-slate-500">
        Actualizat: <span className="font-data tabular-nums text-slate-400">{new Date(initialData.timestamp).toLocaleString("ro-RO")} UTC</span>
        <span className="mx-2 text-slate-700">·</span>
        Surse: FRED, Yahoo Finance, CoinGecko, Alternative.me
      </p>
    </div>
  );
}
