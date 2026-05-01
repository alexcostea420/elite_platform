"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MacroDashboardData } from "@/lib/trading-data";

const COLOR_BULLISH = "#34D399";
const COLOR_BEARISH = "#F87171";
const COLOR_NEUTRAL = "#FBBF24";
const COLOR_DIM = "#94A3B8";
const COLOR_BTC = "#F7931A";

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

const METRIC_LABELS: Record<string, string> = {
  m2: "M2 Money Supply",
  m2_yoy: "M2 YoY",
  fed_balance_sheet: "Fed Balance Sheet",
  reverse_repo: "Reverse Repo (RRP)",
  treasury_general: "Treasury (TGA)",
  net_liquidity: "Net Liquidity",
  fed_funds_rate: "Fed Funds Rate",
  real_yield_10y: "10Y Real Yield",
  nominal_yield_10y: "10Y Nominal Yield",
  yield_curve_10y2y: "Curba 10Y-2Y",
  inflation_expect_5y: "Inflație 5Y",
  hy_spread: "HY Credit Spread",
  dxy: "Dollar Index",
  vix: "VIX",
  gold: "Gold",
  spx: "S&P 500",
  oil: "Crude Oil",
  silver: "Silver",
  btc: "Bitcoin",
  btc_dominance: "BTC Dominance",
  fear_greed: "Fear & Greed",
};

// What does a value increase mean for "risk assets" (BTC/stocks)?
// "up" = bullish for risk when this metric rises; "down" = bullish for risk when this metric falls.
const BULLISH_DIRECTION: Record<string, "up" | "down"> = {
  m2: "up",
  m2_yoy: "up",
  fed_balance_sheet: "up",
  reverse_repo: "down",
  treasury_general: "down",
  net_liquidity: "up",
  fed_funds_rate: "down",
  real_yield_10y: "down",
  nominal_yield_10y: "down",
  yield_curve_10y2y: "up",
  inflation_expect_5y: "down",
  hy_spread: "down",
  dxy: "down",
  vix: "down",
  gold: "up",
  spx: "up",
  oil: "down",
  silver: "up",
  btc: "up",
  btc_dominance: "down",
  fear_greed: "up",
};

const METRIC_TOOLTIPS: Record<string, string> = {
  m2: "Stoc total de bani (cash + depozite). În creștere = lichiditate mai multă pentru active de risc.",
  m2_yoy: "Schimbarea M2 față de acum 12 luni. Peste 5% = expansiune monetară puternică.",
  fed_balance_sheet: "Activele deținute de Fed. Crește când Fed face QE, scade la QT. Crypto urmează această curbă.",
  reverse_repo: "Cash parcat de bănci la Fed peste noapte. Scădere = bani revin în piețe = bullish risk.",
  treasury_general: "Contul Trezoreriei la Fed. Scade când Trezoreria cheltuie = lichiditate în piață.",
  net_liquidity: "Fed Balance Sheet minus Reverse Repo minus TGA. Cea mai bună aproximare a lichidității care ajunge în piață.",
  fed_funds_rate: "Rata dobânzii setată de Fed. În creștere = restrictiv pentru active de risc.",
  real_yield_10y: "Randament 10Y ajustat la inflație (TIPS). Peste 2% = restrictiv. Sub 0% = stimulativ.",
  nominal_yield_10y: "Randamentul brut al obligațiunilor pe 10 ani. Crescător = costul capitalului crește = presiune pe stocuri/crypto.",
  yield_curve_10y2y: "Spread 10Y minus 2Y. Negativ = inversare = recesiune posibilă în 12-24 luni.",
  inflation_expect_5y: "Așteptarea pieței pentru inflație medie pe 5 ani. Peste 2.5% = inflație ridicată anticipată.",
  hy_spread: "Spread între obligațiuni high-yield și Treasury. Crește în stres financiar. Sub 4% = piețe relaxate.",
  dxy: "Indicele dolarului vs un coș de monede. Dolar puternic = presiune pe BTC și emerging markets.",
  vix: "Volatilitatea așteptată S&P 500 pe 30 zile. Sub 15 = calm. Peste 30 = panică.",
  gold: "Aurul. Hedge împotriva inflației și a riscului sistemic.",
  spx: "Indicele S&P 500. Barometru pentru risk assets.",
  oil: "Petrol WTI. Crescător = presiune inflaționistă = Fed mai restrictiv.",
  silver: "Argintul. Industrial + stocare de valoare. Beta mai mare decât aurul.",
  btc: "Bitcoin. Cea mai sensibilă la lichiditate macro.",
  btc_dominance: "Procent BTC din totalul market cap crypto. Scădere = altseason posibil.",
  fear_greed: "Indice de sentiment crypto 0-100. Sub 25 = oportunitate contrariană.",
};

const LAYER_INFO: Record<string, { title: string; icon: string; description: string }> = {
  liquidity: { title: "Lichiditate", icon: "💧", description: "M2, Fed Balance Sheet, Net Liquidity" },
  rates: { title: "Rate", icon: "📊", description: "Fed Funds, real yields, curba" },
  credit: { title: "Credit", icon: "🔌", description: "HY Spread, stres financiar" },
  risk_assets: { title: "Risk Assets", icon: "📈", description: "S&P 500, VIX, Gold" },
  dollar: { title: "Dolar", icon: "💵", description: "DXY, forța dolarului" },
};

function formatValue(key: string, value: number): string {
  if (["btc", "gold", "spx", "oil", "silver"].includes(key))
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (["m2", "fed_balance_sheet", "reverse_repo", "treasury_general", "net_liquidity"].includes(key))
    return `$${(value / 1000).toFixed(1)}T`;
  if (["dxy", "vix"].includes(key)) return value.toFixed(1);
  if (["fear_greed", "btc_dominance"].includes(key)) return `${value.toFixed(0)}`;
  if (
    key.includes("yield") ||
    key.includes("rate") ||
    key.includes("spread") ||
    key.includes("curve") ||
    key.includes("expect") ||
    key.includes("yoy")
  )
    return `${value.toFixed(2)}%`;
  return value.toFixed(2);
}

function formatPct(change?: number, digits = 1): string {
  if (change === undefined || change === null || Number.isNaN(change)) return "-";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(digits)}%`;
}

function colorFor(change?: number): string {
  if (change === undefined || change === null) return COLOR_DIM;
  if (change > 0) return COLOR_BULLISH;
  if (change < 0) return COLOR_BEARISH;
  return COLOR_DIM;
}

type Series = Array<{ date: string; value: number }>;

// timeseries are stored newest-first. Return them oldest-first for charts.
function ascending(ts?: Series): Series {
  if (!ts || ts.length === 0) return [];
  // detect order
  const a = new Date(ts[0].date).getTime();
  const b = new Date(ts[ts.length - 1].date).getTime();
  return a > b ? [...ts].reverse() : ts;
}

function pctChange(now: number, then: number): number | undefined {
  if (then === 0 || !Number.isFinite(then) || !Number.isFinite(now)) return undefined;
  return ((now - then) / Math.abs(then)) * 100;
}

function deltaOver(ts: Series | undefined, days: number): number | undefined {
  if (!ts || ts.length < 2) return undefined;
  const asc = ascending(ts);
  const latest = asc[asc.length - 1];
  const cutoff = new Date(latest.date).getTime() - days * 86400000;
  // find last point on/before cutoff
  let pick = asc[0];
  for (const p of asc) {
    if (new Date(p.date).getTime() <= cutoff) pick = p;
    else break;
  }
  return pctChange(latest.value, pick.value);
}

function deltaYTD(ts: Series | undefined): number | undefined {
  if (!ts || ts.length < 2) return undefined;
  const asc = ascending(ts);
  const latest = asc[asc.length - 1];
  const year = new Date(latest.date).getFullYear();
  const startOfYear = new Date(`${year}-01-01`).getTime();
  let pick: typeof latest | null = null;
  for (const p of asc) {
    if (new Date(p.date).getTime() >= startOfYear) {
      pick = p;
      break;
    }
  }
  if (!pick) pick = asc[0];
  return pctChange(latest.value, pick.value);
}

type RangeStat = { min: number; max: number; pct: number };
function range52W(ts: Series | undefined): RangeStat | undefined {
  if (!ts || ts.length < 2) return undefined;
  const asc = ascending(ts);
  const latest = asc[asc.length - 1];
  const cutoff = new Date(latest.date).getTime() - 365 * 86400000;
  const window = asc.filter((p) => new Date(p.date).getTime() >= cutoff);
  if (window.length < 2) return undefined;
  const values = window.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pct = max === min ? 50 : ((latest.value - min) / (max - min)) * 100;
  return { min, max, pct };
}

function interpretationFor(key: string, weeklyDelta: number | undefined): {
  label: string;
  color: string;
} | null {
  if (weeklyDelta === undefined || Math.abs(weeklyDelta) < 0.05) {
    return { label: "Stabil", color: COLOR_DIM };
  }
  const dir = BULLISH_DIRECTION[key];
  if (!dir) return null;
  const positiveForRisk = (dir === "up" && weeklyDelta > 0) || (dir === "down" && weeklyDelta < 0);
  if (positiveForRisk) return { label: "Favorabil pt risc", color: COLOR_BULLISH };
  return { label: "Nefavorabil pt risc", color: COLOR_BEARISH };
}

function liquidityScore(layers: MacroDashboardData["layers"]): number {
  // average layer score, then map roughly -25..+25 → 0..100 (clamped).
  const scores = Object.values(layers).map((l) => l.score);
  if (scores.length === 0) return 50;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const mapped = 50 + avg * 2;
  return Math.max(0, Math.min(100, mapped));
}

function generateNarrative(layers: MacroDashboardData["layers"], regime: MacroDashboardData["regime"]): string {
  const entries = Object.entries(layers).map(([key, layer]) => ({
    key,
    title: LAYER_INFO[key]?.title ?? key,
    score: layer.score,
    signal: layer.signal,
  }));
  entries.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const top = entries.slice(0, 2);
  const phrases = top.map((e) => {
    const verb = e.signal === "supportive" ? "favorabilă" : e.signal === "restrictive" ? "restrictivă" : "neutră";
    return `${e.title.toLowerCase()} ${verb} (${e.score >= 0 ? "+" : ""}${e.score.toFixed(1)})`;
  });
  return `Per ansamblu regim ${regime.label}. Cel mai relevant: ${phrases.join(", iar ")}.`;
}

type TopMove = { key: string; deltaWeek: number };
function topWeeklyMoves(timeseries: MacroDashboardData["timeseries"], limit = 3): TopMove[] {
  const moves: TopMove[] = [];
  for (const [key, ts] of Object.entries(timeseries)) {
    const d = deltaOver(ts, 7);
    if (d !== undefined && Number.isFinite(d)) moves.push({ key, deltaWeek: d });
  }
  moves.sort((a, b) => Math.abs(b.deltaWeek) - Math.abs(a.deltaWeek));
  return moves.slice(0, limit);
}

/* ── Components ─────────────────────────────────────────── */

function HeroCard({
  data,
  liqScore,
  narrative,
}: {
  data: MacroDashboardData;
  liqScore: number;
  narrative: string;
}) {
  const { regime, layers } = data;
  const dotColor = liqScore >= 60 ? COLOR_BULLISH : liqScore <= 40 ? COLOR_BEARISH : COLOR_NEUTRAL;

  return (
    <div className="glass-card animate-fade-in-up relative overflow-hidden p-5 md:p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: `radial-gradient(60% 80% at 0% 0%, ${regime.color}33, transparent 70%)` }}
      />
      <div className="relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Macro Score
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-data text-5xl font-bold tabular-nums text-white sm:text-6xl">
                {liqScore.toFixed(0)}
              </span>
              <span className="text-sm text-slate-400">/ 100</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ color: regime.color, backgroundColor: `${regime.color}1f` }}
              >
                {regime.label}
              </span>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{narrative}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="live-dot" style={{ backgroundColor: dotColor }} />
              <span>Live · actualizat la fiecare 4 ore</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full max-w-sm md:w-72">
            <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span>Restrictiv</span>
              <span>Neutru</span>
              <span>Favorabil</span>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-white/[0.05]">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${liqScore}%`,
                  background: `linear-gradient(90deg, ${COLOR_BEARISH}, ${COLOR_NEUTRAL}, ${COLOR_BULLISH})`,
                }}
              />
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white shadow"
                style={{ left: `${liqScore}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-1.5 text-center">
              {Object.entries(layers).map(([key, layer]) => {
                const info = LAYER_INFO[key] ?? { title: key, icon: "?", description: "" };
                return (
                  <div key={key} className="rounded-lg border border-white/5 bg-white/[0.02] px-1 py-1.5">
                    <p className="text-[14px] leading-none">{info.icon}</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                      {info.title}
                    </p>
                    <p
                      className="mt-0.5 font-data text-[11px] font-bold tabular-nums"
                      style={{ color: SIGNAL_COLORS[layer.signal] }}
                    >
                      {layer.score >= 0 ? "+" : ""}
                      {layer.score.toFixed(0)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BTCMacroChart({
  btcSeries,
  netLiqSeries,
}: {
  btcSeries?: Series;
  netLiqSeries?: Series;
}) {
  const merged = useMemo(() => {
    if (!btcSeries || !netLiqSeries) return [];
    const btc = ascending(btcSeries);
    const liq = ascending(netLiqSeries);
    if (btc.length === 0 || liq.length === 0) return [];
    // align by approximate date (weekly liq, daily btc): for each btc point, take latest liq <= date
    const result: Array<{ date: string; btc: number; liq: number }> = [];
    let li = 0;
    for (const b of btc) {
      const t = new Date(b.date).getTime();
      while (li + 1 < liq.length && new Date(liq[li + 1].date).getTime() <= t) li += 1;
      const lv = liq[li];
      if (!lv) continue;
      result.push({ date: b.date, btc: b.value, liq: lv.value });
    }
    // keep last ~365 days
    const last = result[result.length - 1];
    if (!last) return result;
    const cutoff = new Date(last.date).getTime() - 365 * 86400000;
    return result.filter((p) => new Date(p.date).getTime() >= cutoff);
  }, [btcSeries, netLiqSeries]);

  if (merged.length < 10) return null;

  const corr = useMemo(() => {
    if (merged.length < 5) return 0;
    const xs = merged.map((m) => m.btc);
    const ys = merged.map((m) => m.liq);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < xs.length; i += 1) {
      num += (xs[i] - mx) * (ys[i] - my);
      dx += (xs[i] - mx) ** 2;
      dy += (ys[i] - my) ** 2;
    }
    if (dx === 0 || dy === 0) return 0;
    return num / Math.sqrt(dx * dy);
  }, [merged]);

  return (
    <div className="glass-card animate-fade-in-up p-5 md:p-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Lichiditate vs Bitcoin
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">BTC overlay Net Liquidity (52 săptămâni)</h3>
          <p className="mt-1 text-xs text-slate-400">
            Cripto-traderii urmăresc lichiditatea netă pentru direcția Bitcoin pe termen mediu.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: COLOR_BTC }} />
            <span className="text-slate-400">BTC</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: COLOR_BULLISH }} />
            <span className="text-slate-400">Net Liquidity</span>
          </span>
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-data text-[11px] tabular-nums text-slate-300">
            ρ {corr.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="h-[280px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={merged} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => d.slice(5)}
              interval={Math.max(1, Math.floor(merged.length / 6))}
            />
            <YAxis
              yAxisId="btc"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="liq"
              orientation="right"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}T`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10, 14, 22, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "btc") return [`$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, "BTC"];
                if (name === "liq") return [`$${(v / 1000).toFixed(2)}T`, "Net Liq"];
                return [String(value), String(name)];
              }}
            />
            <Line
              yAxisId="btc"
              type="monotone"
              dataKey="btc"
              stroke={COLOR_BTC}
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="liq"
              type="monotone"
              dataKey="liq"
              stroke={COLOR_BULLISH}
              strokeWidth={1.8}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopMovesBar({
  moves,
  metrics,
}: {
  moves: TopMove[];
  metrics: MacroDashboardData["metrics"];
}) {
  if (moves.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
        Top mișcări săptămâna
      </span>
      {moves.map((m) => {
        const tone = colorFor(m.deltaWeek);
        const m2 = metrics[m.key];
        return (
          <div
            key={m.key}
            className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1"
          >
            <span className="font-data text-xs tabular-nums text-slate-200">
              {METRIC_LABELS[m.key] ?? m.key}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-data text-xs font-semibold tabular-nums" style={{ color: tone }}>
              {formatPct(m.deltaWeek, 1)}
            </span>
            {m2 !== undefined && (
              <>
                <span className="text-slate-600">·</span>
                <span className="font-data text-[11px] tabular-nums text-slate-400">
                  {formatValue(m.key, m2.value)}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RangeBar52W({ stat }: { stat: RangeStat | undefined }) {
  if (!stat) return null;
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] text-slate-600">
        <span>52w low</span>
        <span className="font-data tabular-nums text-slate-500">{stat.pct.toFixed(0)}%</span>
        <span>52w high</span>
      </div>
      <div className="relative mt-1 h-1 rounded-full bg-white/[0.04]">
        <div
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white shadow"
          style={{ left: `${Math.max(0, Math.min(100, stat.pct))}%` }}
        />
      </div>
    </div>
  );
}

function MetricCardV2({
  metricKey,
  metric,
  timeseries,
  index,
}: {
  metricKey: string;
  metric: MacroDashboardData["metrics"][string];
  timeseries?: Series;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const ts = timeseries;

  const dWeek = useMemo(() => deltaOver(ts, 7), [ts]);
  const dMonth = useMemo(() => deltaOver(ts, 30), [ts]);
  const d3M = useMemo(() => deltaOver(ts, 90) ?? metric.change_3m, [ts, metric.change_3m]);
  const d1Y = useMemo(() => deltaOver(ts, 365) ?? metric.change_1y, [ts, metric.change_1y]);
  const range = useMemo(() => range52W(ts), [ts]);
  const interp = interpretationFor(metricKey, dWeek ?? d3M);

  const tone = colorFor(d3M);
  const chartData = ascending(ts);

  return (
    <div
      className="glass-card card-hover animate-fade-in-up cursor-pointer p-5"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
      title={METRIC_TOOLTIPS[metricKey] ?? ""}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {METRIC_LABELS[metricKey] ?? metricKey}
          </p>
          <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white">
            {formatValue(metricKey, metric.value)}
          </p>
        </div>
        {interp && (
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
            style={{ color: interp.color, backgroundColor: `${interp.color}1a` }}
            title="Direcție vs apetit pentru risc"
          >
            {interp.label}
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {[
          { l: "1S", v: dWeek },
          { l: "1L", v: dMonth },
          { l: "3L", v: d3M },
          { l: "1A", v: d1Y },
        ].map((d) => (
          <div key={d.l} className="rounded-md bg-white/[0.02] px-1 py-1">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">{d.l}</p>
            <p className="font-data text-[11px] font-semibold tabular-nums" style={{ color: colorFor(d.v) }}>
              {formatPct(d.v, 1)}
            </p>
          </div>
        ))}
      </div>

      {chartData.length > 5 && (
        <div className="mt-3 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={tone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={tone}
                strokeWidth={1.6}
                fill={`url(#grad-${metricKey})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3">
        <RangeBar52W stat={range} />
      </div>

      {expanded && chartData.length > 5 && (
        <div className="mt-4 overflow-hidden">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-exp-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tone} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={tone} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(d: string) => d.slice(5)}
                interval={Math.max(1, Math.floor(chartData.length / 5))}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={55}
                tickFormatter={(v: number) => formatValue(metricKey, v)}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v) => [formatValue(metricKey, Number(v)), METRIC_LABELS[metricKey] ?? metricKey]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={tone}
                strokeWidth={2}
                fill={`url(#grad-exp-${metricKey})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {METRIC_TOOLTIPS[metricKey] && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{METRIC_TOOLTIPS[metricKey]}</p>
      )}

      {metric.source && (
        <p className="mt-2 text-[10px] text-slate-600">
          {metric.source}
          {metric.date ? ` · ${metric.date}` : ""}
        </p>
      )}
    </div>
  );
}

function MetricSection({
  title,
  icon,
  description,
  metricKeys,
  metrics,
  timeseries,
  startIndex,
}: {
  title: string;
  icon: string;
  description: string;
  metricKeys: string[];
  metrics: MacroDashboardData["metrics"];
  timeseries: MacroDashboardData["timeseries"];
  startIndex: number;
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
          <MetricCardV2
            key={key}
            metricKey={key}
            metric={metrics[key]}
            timeseries={timeseries[key]}
            index={startIndex + i}
          />
        ))}
      </div>
    </section>
  );
}

type SortKey = "value" | "d1" | "d7" | "d30" | "d90" | "ytd" | "label";

function MultiTimeframeTable({
  metrics,
  timeseries,
}: {
  metrics: MacroDashboardData["metrics"];
  timeseries: MacroDashboardData["timeseries"];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("d7");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    return Object.entries(metrics).map(([key, m]) => {
      const ts = timeseries[key];
      const d1 = deltaOver(ts, 1);
      const d7 = deltaOver(ts, 7);
      const d30 = deltaOver(ts, 30);
      const d90 = deltaOver(ts, 90) ?? m.change_3m;
      const ytd = deltaYTD(ts);
      const range = range52W(ts);
      return { key, label: METRIC_LABELS[key] ?? key, value: m.value, d1, d7, d30, d90, ytd, range };
    });
  }, [metrics, timeseries]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let av: number | string | undefined;
      let bv: number | string | undefined;
      if (sortBy === "label") {
        av = a.label;
        bv = b.label;
      } else if (sortBy === "value") {
        av = a.value;
        bv = b.value;
      } else {
        av = a[sortBy];
        bv = b[sortBy];
      }
      if (av === undefined && bv === undefined) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av);
      const bn = Number(bv);
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return arr;
  }, [rows, sortBy, sortDir]);

  function setSort(k: SortKey) {
    if (sortBy === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortDir("desc");
    }
  }

  function HeaderCell({ k, label, align = "right" }: { k: SortKey; label: string; align?: "left" | "right" }) {
    const active = sortBy === k;
    return (
      <th
        className={`sticky top-0 z-10 cursor-pointer select-none bg-crypto-dark/95 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${active ? "text-white" : "text-slate-500"} ${align === "right" ? "text-right" : "text-left"}`}
        onClick={() => setSort(k)}
      >
        <span>{label}</span>
        {active && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </th>
    );
  }

  return (
    <section className="animate-fade-in-up">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl leading-none">📋</span>
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">Toate metricele</h3>
          <p className="text-xs text-slate-400">Sortabil pe orice coloană. Click pe header.</p>
        </div>
      </div>
      <div className="glass-card overflow-x-auto p-2 md:p-3">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <HeaderCell k="label" label="Metric" align="left" />
              <HeaderCell k="value" label="Valoare" />
              <HeaderCell k="d1" label="1Z" />
              <HeaderCell k="d7" label="1S" />
              <HeaderCell k="d30" label="1L" />
              <HeaderCell k="d90" label="3L" />
              <HeaderCell k="ytd" label="YTD" />
              <th className="sticky top-0 z-10 bg-crypto-dark/95 px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                52W range
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.key} className="border-t border-white/[0.04] hover:bg-white/[0.015]">
                <td className="px-2 py-1.5 text-left text-slate-200">{r.label}</td>
                <td className="px-2 py-1.5 text-right font-data tabular-nums text-white">
                  {formatValue(r.key, r.value)}
                </td>
                {(["d1", "d7", "d30", "d90", "ytd"] as const).map((k) => (
                  <td
                    key={k}
                    className="px-2 py-1.5 text-right font-data tabular-nums"
                    style={{ color: colorFor(r[k]) }}
                  >
                    {formatPct(r[k], 1)}
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <div className="ml-auto w-24 sm:w-32">
                    <RangeBar52W stat={r.range} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FearGreedGauge({ value, label }: { value: number; label?: string }) {
  const color =
    value <= 25 ? COLOR_BEARISH : value <= 45 ? "#FB923C" : value <= 55 ? COLOR_NEUTRAL : value <= 75 ? "#86EFAC" : COLOR_BULLISH;
  const rotation = (value / 100) * 180 - 90;
  const localLabel =
    label ??
    (value <= 25
      ? "Frică Extremă"
      : value <= 45
        ? "Frică"
        : value <= 55
          ? "Neutru"
          : value <= 75
            ? "Lăcomie"
            : "Lăcomie Extremă");

  return (
    <div className="glass-card animate-fade-in-up p-5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Fear &amp; Greed Index</p>
      <div className="relative mx-auto mt-3 h-20 w-40 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-20 w-40 rounded-t-full"
          style={{
            background: `conic-gradient(from -90deg, ${COLOR_BEARISH} 0deg, #FB923C 45deg, ${COLOR_NEUTRAL} 90deg, #86EFAC 135deg, ${COLOR_BULLISH} 180deg, transparent 180deg)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-16 w-32 rounded-t-full bg-crypto-dark" />
        <div
          className="absolute bottom-0 left-1/2 h-16 w-0.5 origin-bottom rounded-full bg-white"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <p className="mt-2 font-data text-3xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-slate-400">{localLabel}</p>
    </div>
  );
}

function BTCMiniCard({
  price,
  d1,
  d7,
  d30,
  dominance,
}: {
  price: number;
  d1?: number;
  d7?: number;
  d30?: number;
  dominance?: number;
}) {
  return (
    <div className="glass-card animate-fade-in-up p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bitcoin</p>
      <p className="mt-1 font-data text-3xl font-bold tabular-nums text-white">
        ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {[
          { l: "24H", v: d1 },
          { l: "7Z", v: d7 },
          { l: "30Z", v: d30 },
        ].map((d) => (
          <div key={d.l} className="rounded-md bg-white/[0.02] px-1.5 py-1">
            <p className="text-[9px] uppercase tracking-[0.15em] text-slate-600">{d.l}</p>
            <p className="font-data text-xs font-semibold tabular-nums" style={{ color: colorFor(d.v) }}>
              {formatPct(d.v, 1)}
            </p>
          </div>
        ))}
      </div>
      {dominance !== undefined && (
        <p className="mt-3 text-xs text-slate-400">
          Dominance: <span className="font-data tabular-nums text-slate-200">{dominance.toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
}

type CalEvent = {
  title: string;
  titleRo: string;
  date: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  btcImpact: string | null;
};

function InlineCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const list: CalEvent[] = Array.isArray(d?.events) ? d.events : Array.isArray(d) ? d : [];
        const now = Date.now();
        const cutoff = now + 7 * 86400000;
        const filtered = list
          .filter((e) => {
            const t = new Date(e.date).getTime();
            return t >= now - 6 * 3600 * 1000 && t <= cutoff;
          })
          .sort((a, b) => {
            const ai = a.impact === "high" ? 3 : a.impact === "medium" ? 2 : 1;
            const bi = b.impact === "high" ? 3 : b.impact === "medium" ? 2 : 1;
            if (ai !== bi) return bi - ai;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          })
          .slice(0, 6);
        setEvents(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="animate-fade-in-up">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl leading-none">📅</span>
        <div>
          <h3 className="text-lg font-bold text-white sm:text-xl">Calendar economic, 7 zile</h3>
          <p className="text-xs text-slate-400">Cele mai impactante evenimente care urmează</p>
        </div>
      </div>
      <div className="glass-card p-3">
        {loading && <p className="p-4 text-center text-sm text-slate-500">Se încarcă...</p>}
        {!loading && events.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-500">Niciun eveniment notabil în următoarele 7 zile.</p>
        )}
        {!loading &&
          events.map((e, i) => {
            const dt = new Date(e.date);
            const days = Math.max(0, Math.floor((dt.getTime() - Date.now()) / 86400000));
            const impactColor =
              e.impact === "high" ? COLOR_BEARISH : e.impact === "medium" ? COLOR_NEUTRAL : COLOR_DIM;
            return (
              <div
                key={`${e.title}-${e.date}-${i}`}
                className="flex flex-col gap-2 border-b border-white/[0.04] px-2 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex w-20 shrink-0 flex-col">
                  <span className="font-data text-[11px] tabular-nums text-slate-200">
                    {dt.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="font-data text-[10px] tabular-nums text-slate-500">
                    {dt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} · în {days}z
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: impactColor }}
                  />
                  <span className="text-sm text-slate-200">{e.titleRo || e.title}</span>
                </div>
                {e.btcImpact && <span className="text-[11px] text-slate-500 sm:max-w-xs">{e.btcImpact}</span>}
              </div>
            );
          })}
      </div>
    </section>
  );
}

/* ── Main ───────────────────────────────────────────────── */

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
  const liqScore = useMemo(() => liquidityScore(layers), [layers]);
  const narrative = useMemo(() => generateNarrative(layers, regime), [layers, regime]);
  const moves = useMemo(() => topWeeklyMoves(timeseries, 3), [timeseries]);
  const btcSeries = timeseries.btc;
  const btcD1 = useMemo(() => deltaOver(btcSeries, 1), [btcSeries]);
  const btcD7 = useMemo(() => deltaOver(btcSeries, 7), [btcSeries]);
  const btcD30 = useMemo(() => deltaOver(btcSeries, 30), [btcSeries]);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeroCard data={initialData} liqScore={liqScore} narrative={narrative} />
        </div>
        <div className="space-y-4">
          <BTCMiniCard
            price={metrics.btc?.value ?? 0}
            d1={btcD1}
            d7={btcD7}
            d30={btcD30}
            dominance={metrics.btc_dominance?.value}
          />
          {metrics.fear_greed && (
            <FearGreedGauge value={metrics.fear_greed.value} label={metrics.fear_greed.label} />
          )}
        </div>
      </div>

      {/* TOP MOVES */}
      <TopMovesBar moves={moves} metrics={metrics} />

      {/* BTC vs LIQUIDITY CHART */}
      <BTCMacroChart btcSeries={btcSeries} netLiqSeries={timeseries.net_liquidity ?? timeseries.fed_balance_sheet} />

      {/* MULTI-TIMEFRAME TABLE */}
      <MultiTimeframeTable metrics={metrics} timeseries={timeseries} />

      {/* SECTIONS */}
      <MetricSection
        title="Lichiditate"
        icon="💧"
        description="Capital în sistem: M2, Fed, RRP, TGA"
        metricKeys={["m2", "m2_yoy", "fed_balance_sheet", "reverse_repo", "treasury_general", "net_liquidity"]}
        metrics={metrics}
        timeseries={timeseries}
        startIndex={3}
      />

      <MetricSection
        title="Rate și Randamente"
        icon="📊"
        description="Costul riscului: Fed Funds, real yields, curba randamentelor"
        metricKeys={["fed_funds_rate", "real_yield_10y", "nominal_yield_10y", "yield_curve_10y2y", "inflation_expect_5y"]}
        metrics={metrics}
        timeseries={timeseries}
        startIndex={9}
      />

      <MetricSection
        title="Credit & Stres"
        icon="🔌"
        description="Spread-uri de credit care măsoară stresul în piață"
        metricKeys={["hy_spread"]}
        metrics={metrics}
        timeseries={timeseries}
        startIndex={14}
      />

      <MetricSection
        title="Cross-Asset"
        icon="🌍"
        description="DXY, VIX, Gold, S&P, Oil. Contextul macro global"
        metricKeys={["dxy", "vix", "gold", "spx", "oil", "silver"]}
        metrics={metrics}
        timeseries={timeseries}
        startIndex={16}
      />

      {/* CALENDAR */}
      <InlineCalendar />

      <p className="text-center text-xs text-slate-500">
        Actualizat:{" "}
        <span className="font-data tabular-nums text-slate-400">
          {new Date(initialData.timestamp).toLocaleString("ro-RO")} UTC
        </span>
        <span className="mx-2 text-slate-700">·</span>
        Surse: FRED, Yahoo Finance, CoinGecko, Alternative.me
      </p>
    </div>
  );
}
