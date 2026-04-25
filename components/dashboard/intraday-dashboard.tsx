"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/ui/container";
import { TradingViewChart } from "@/components/dashboard/tradingview-chart";
import type { IntradaySignalData } from "@/lib/trading-data";

/* ─── helpers ─── */

const fmtUsd = (n: number | null | undefined) => {
  if (n == null) return "--";
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPrice = (n: number | null | undefined) =>
  n == null ? "--" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function biasStyle(bias: string) {
  if (bias === "LONG") return { color: "#10B981", glow: "rgba(16,185,129,0.18)", label: "BIAS LONG", emoji: "📈" };
  if (bias === "SHORT") return { color: "#EF4444", glow: "rgba(239,68,68,0.18)", label: "BIAS SHORT", emoji: "📉" };
  return { color: "#F59E0B", glow: "rgba(245,158,11,0.18)", label: "FĂRĂ EDGE", emoji: "⏸️" };
}

function rsiColor(v: number | null | undefined) {
  if (v == null) return "text-slate-600 border-white/10 bg-white/5";
  if (v >= 75) return "text-red-400 border-red-500/30 bg-red-500/10";
  if (v >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  if (v <= 25) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (v <= 40) return "text-emerald-300 border-emerald-500/20 bg-emerald-500/5";
  return "text-slate-300 border-white/15 bg-white/5";
}

function rsiLabel(v: number | null | undefined) {
  if (v == null) return "--";
  if (v >= 75) return "Overbought";
  if (v >= 60) return "Bullish";
  if (v <= 25) return "Oversold";
  if (v <= 40) return "Bearish";
  return "Neutru";
}

const severityClasses = {
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  amber: "border-amber-500/25 bg-amber-500/8 text-amber-300",
  green: "border-emerald-500/25 bg-emerald-500/8 text-emerald-300",
};

/* ─── component ─── */

export default function IntradayDashboard({
  initialData,
}: {
  initialData: IntradaySignalData;
}) {
  const [data, setData] = useState<IntradaySignalData>(initialData);
  const [updatedAgo, setUpdatedAgo] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 60s
  useEffect(() => {
    let cancelled = false;
    const fetchIt = async () => {
      try {
        setRefreshing(true);
        const res = await fetch("/api/intraday-signal", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        }
      } catch {
        /* keep stale */
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };
    const id = window.setInterval(fetchIt, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Live "Xm ago" timer
  useEffect(() => {
    const tick = () => {
      const t = new Date(data.timestamp).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (diff < 60) setUpdatedAgo(`acum ${diff}s`);
      else if (diff < 3600) setUpdatedAgo(`acum ${Math.floor(diff / 60)}m`);
      else setUpdatedAgo(`acum ${Math.floor(diff / 3600)}h`);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [data.timestamp]);

  const bs = biasStyle(data.bias);
  const ind = data.indicators;
  const change = data.btc_change_24h;
  const changeColor = change >= 0 ? "text-emerald-400" : "text-red-400";

  const macdHistRising = ind.macd_1h ? ind.macd_1h.hist > ind.macd_1h.hist_prev : false;
  const macdHist = ind.macd_1h?.hist ?? 0;

  return (
    <main className="pb-12 pt-[72px] md:pt-20">
      {/* ━━ STICKY HEADER ━━ */}
      <div
        className="sticky top-[56px] z-30 border-b backdrop-blur-xl"
        style={{ borderColor: `${bs.color}33`, background: `linear-gradient(90deg, ${bs.color}10, transparent)` }}
      >
        <Container>
          <div className="flex h-[58px] items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: bs.color }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: bs.color }} />
              </span>
              <span className="font-display text-sm font-black tracking-wide sm:text-base md:text-lg" style={{ color: bs.color }}>
                {bs.label}
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 md:inline">
                · intraday
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 sm:text-[10px]">BTC</span>
              <span className="font-data text-base font-bold text-white sm:text-lg">{fmtPrice(data.btc_price)}</span>
              <span className={`font-data text-xs font-semibold ${changeColor}`}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {/* ━━ HERO VERDICT ━━ */}
        <section
          className="glass-card relative mt-3 overflow-hidden p-4 sm:p-5 md:p-7"
          style={{
            background: `linear-gradient(135deg, rgba(10,10,12,0.92), rgba(10,10,12,0.7)), radial-gradient(ellipse 80% 50% at 80% 0%, ${bs.glow}, transparent 60%)`,
            boxShadow: `0 0 40px ${bs.glow}`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ borderColor: `${bs.color}55`, color: bs.color, background: `${bs.color}11` }}
            >
              Verdict intraday · {updatedAgo}
            </span>
            {refreshing && (
              <span className="text-[10px] text-slate-500">refresh…</span>
            )}
          </div>

          <h1
            className="mb-2 flex flex-wrap items-center gap-2 text-xl font-black leading-tight sm:gap-3 sm:text-3xl md:text-4xl"
            style={{ color: bs.color }}
          >
            <span className="text-3xl sm:text-4xl md:text-5xl">{bs.emoji}</span>
            {data.bias_text}
          </h1>

          <p className="mb-4 text-[12px] leading-relaxed text-slate-300 sm:text-sm">
            Conviction:{" "}
            <span className="font-bold text-white">
              {data.conviction === "HIGH" ? "ridicată" : data.conviction === "MEDIUM" ? "medie" : "scăzută"}
            </span>
            {" · "}
            Volatilitate {data.volatility.label}
            {data.volatility.atr_pct != null && ` (ATR ${data.volatility.atr_pct.toFixed(2)}%)`}
            {" · "}
            Sesiune: {data.session.active}
          </p>

          {/* Bias bar 0-100 */}
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>Short</span>
            <span className="text-slate-300">Score {data.score}/100</span>
            <span>Long</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5">
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
            <div
              className="absolute top-0 h-full rounded-full transition-all duration-500"
              style={{
                left: data.score >= 50 ? "50%" : `${data.score}%`,
                width: `${Math.abs(data.score - 50)}%`,
                background: bs.color,
                boxShadow: `0 0 12px ${bs.color}`,
              }}
            />
          </div>
        </section>

        {/* ━━ ALERTS ━━ */}
        {data.alerts.length > 0 && (
          <section className="mt-3 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 pb-1">
              <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.32em] text-slate-600">Alerte</span>
              {data.alerts.map((a, i) => (
                <span
                  key={i}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${severityClasses[a.severity]}`}
                >
                  {a.severity === "red" && "⚠"}
                  {a.severity === "amber" && "⚡"}
                  {a.severity === "green" && "✓"}
                  {a.text}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ━━ MULTI-TF RSI ━━ */}
        <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { tf: "15m", v: ind.rsi_15m },
            { tf: "1h", v: ind.rsi_1h },
            { tf: "4h", v: ind.rsi_4h },
            { tf: "1d", v: ind.rsi_1d },
          ].map(({ tf, v }) => (
            <div key={tf} className={`glass-card flex flex-col gap-1 p-3 ${rsiColor(v)}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">RSI {tf}</span>
              <span className="font-data text-xl font-bold tabular-nums">{v != null ? v.toFixed(0) : "--"}</span>
              <span className="text-[10px] font-semibold opacity-90">{rsiLabel(v)}</span>
            </div>
          ))}
        </section>

        {/* ━━ SETUP CHECKLISTS ━━ */}
        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <SetupCard title="Setup Long" emoji="📈" setup={data.setups.long} accent="emerald" />
          <SetupCard title="Setup Short" emoji="📉" setup={data.setups.short} accent="red" />
          <SetupCard title="Setup Squeeze" emoji="💥" setup={data.setups.squeeze} accent="amber" />
        </section>

        {/* ━━ CHART ━━ */}
        <section
          className="glass-card mt-4 overflow-hidden p-1 md:p-2"
          style={{ boxShadow: `0 0 30px ${bs.glow}` }}
        >
          <div className="h-[42vh] min-h-[320px] md:h-[55vh] md:min-h-[440px]">
            <TradingViewChart />
          </div>
        </section>

        {/* ━━ KEY LEVELS ━━ */}
        {ind.pivots && (
          <section className="mt-4">
            <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">Niveluri cheie</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              <LevelChip label="VWAP zi" value={ind.vwap} active />
              <LevelChip label="R2" value={ind.pivots.r2} bear />
              <LevelChip label="R1" value={ind.pivots.r1} bear />
              <LevelChip label="Pivot" value={ind.pivots.pivot} />
              <LevelChip label="S1" value={ind.pivots.s1} bull />
              <LevelChip label="S2" value={ind.pivots.s2} bull />
            </div>
          </section>
        )}

        {/* ━━ CROWD POSITIONING ━━ */}
        <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <CrowdCard
            label="Funding (8h)"
            value={data.crowd.funding_pct != null ? `${(data.crowd.funding_pct).toFixed(4)}%` : "--"}
            sub={fundingNarrative(data.crowd.funding_pct)}
            color={fundingColor(data.crowd.funding_pct)}
          />
          <CrowdCard
            label="OI Δ 12h"
            value={`${data.crowd.oi_delta_pct_12h >= 0 ? "+" : ""}${data.crowd.oi_delta_pct_12h.toFixed(2)}%`}
            sub={oiNarrative(data.crowd.oi_delta_pct_12h)}
            color={data.crowd.oi_delta_pct_12h > 3 ? "text-amber-400" : data.crowd.oi_delta_pct_12h < -3 ? "text-red-400" : "text-slate-300"}
          />
          <CrowdCard
            label="Top Trader L/S"
            value={data.crowd.top_trader_ls ? `${data.crowd.top_trader_ls.long_pct.toFixed(0)} / ${data.crowd.top_trader_ls.short_pct.toFixed(0)}` : "--"}
            sub="Smart money"
            color="text-slate-300"
            bar={data.crowd.top_trader_ls ? data.crowd.top_trader_ls.long_pct : null}
          />
          <CrowdCard
            label="Taker 5min"
            value={data.crowd.taker_ratio ? data.crowd.taker_ratio.ratio.toFixed(2) : "--"}
            sub={takerNarrative(data.crowd.taker_ratio?.ratio)}
            color={takerColor(data.crowd.taker_ratio?.ratio)}
          />
        </section>

        {/* ━━ WHALE FLOW + MACRO + MACD ━━ */}
        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🐋</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Whale Flow</span>
            </div>
            {data.whale_flow_6h ? (
              <>
                <p className="font-data text-lg font-bold text-white">{data.whale_flow_6h.signal ?? "--"}</p>
                <p className="text-[11px] text-slate-400">
                  Long: {fmtUsd(data.whale_flow_6h.long_usd)} · Short: {fmtUsd(data.whale_flow_6h.short_usd)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {data.whale_flow_6h.fill_count} traderi smart pe BTC
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">
                Date whale indisponibile momentan. Whale tracker rulează pe Hyperliquid.
              </p>
            )}
          </div>

          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">📊</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">MACD 1h</span>
            </div>
            {ind.macd_1h ? (
              <>
                <p className={`font-data text-lg font-bold ${macdHist >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  Hist {macdHist >= 0 ? "+" : ""}
                  {macdHist.toFixed(0)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {macdHist >= 0 ? "Momentum bullish" : "Momentum bearish"} ·{" "}
                  {macdHistRising ? "în creștere" : "în scădere"}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">--</p>
            )}
          </div>

          <div className="glass-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🌐</span>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Context Macro</span>
            </div>
            <p className="font-data text-lg font-bold text-white">
              Risk Score {data.macro_context.risk_v2_score ?? "--"}
              <span className="text-sm text-slate-500">/100</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Decision: {data.macro_context.risk_v2_decision ?? "--"} ·{" "}
              {data.macro_context.risk_v2_conviction ?? "--"}
            </p>
            <Link href="/dashboard/risk-score" className="mt-1 inline-block text-[11px] font-semibold text-emerald-400 hover:text-emerald-300">
              Vezi detalii →
            </Link>
          </div>
        </section>

        {/* ━━ EDUCATIONAL GLOSSARY ━━ */}
        <section className="mt-6">
          <details className="glass-card overflow-hidden p-4 [&_summary]:cursor-pointer">
            <summary className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <span className="text-base">📚</span> Cum citesc această pagină?
            </summary>
            <div className="mt-4 grid gap-3 text-[12px] leading-relaxed text-slate-400 md:grid-cols-2">
              <Glossary title="Bias intraday" body="Direcția probabilă pe ore-zile, NU pe luni. Score 0-100: sub 35 = short bias, peste 65 = long bias, între = fără edge clar (mai bine ești pe sideline)." />
              <Glossary title="RSI multi-TF" body="RSI > 70 pe 1h și 4h = overbought (risc pullback). RSI < 30 = oversold (bounce posibil). Diferențele între TF arată trend-ul: dacă 1h e bullish dar 4h e bearish, 4h are prioritate." />
              <Glossary title="VWAP zilnic" body="Prețul mediu ponderat cu volumul de la 00:00 UTC. Instituționalii îl folosesc ca anchor: peste VWAP = bias long pe ziua curentă, sub = bias short." />
              <Glossary title="Pivot points" body="Niveluri calculate din OHLC ieri. R1/R2 = rezistențe, S1/S2 = suporturi. Bounce-urile la S1/R1 sunt frecvente în range; break peste R2 sau sub S2 = trend continuation." />
              <Glossary title="Funding rate" body="Ce plătesc longii la shorți (sau invers) la fiecare 8h. Funding extrem pozitiv (>0.05%) = longii prea agresivi, risc de squeeze. Negativ = combustibil pentru rally." />
              <Glossary title="OI delta" body="Schimbare de Open Interest. OI ↑ + preț ↑ = trend confirmation. OI ↑ + preț flat = pozitionare în pregătire pentru mișcare. OI ↓ = unwinding (vol mai mică)." />
              <Glossary title="Top Trader L/S" body="Conturile mari Binance (smart money proxy). Dacă smart money e long și retail e short → bias bullish. Divergența contează mai mult decât ratio absolut." />
              <Glossary title="Setup-uri" body="Liste de condiții. 4-5/5 = setup curat. 0-2/5 = nu e momentul. Squeeze setup = volatilitate exploziva iminentă, dar direcția e neclară până la break." />
            </div>
          </details>
        </section>

        {/* ━━ DISCLAIMER ━━ */}
        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-700">
          Suport decizional educațional · NU constituie sfaturi de investiții · Tradingul intraday implică risc ridicat
        </p>
      </Container>
    </main>
  );
}

/* ─── sub-components ─── */

function SetupCard({
  title,
  emoji,
  setup,
  accent,
}: {
  title: string;
  emoji: string;
  setup: { conditions: { text: string; met: boolean }[]; met: number; total: number };
  accent: "emerald" | "red" | "amber";
}) {
  const colorMap = {
    emerald: { bar: "bg-emerald-500", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    red: { bar: "bg-red-500", text: "text-red-400", glow: "shadow-red-500/20" },
    amber: { bar: "bg-amber-500", text: "text-amber-400", glow: "shadow-amber-500/20" },
  };
  const c = colorMap[accent];
  const pct = (setup.met / setup.total) * 100;
  const isHot = setup.met >= setup.total - 1;
  return (
    <div className={`glass-card p-4 ${isHot ? `shadow-lg ${c.glow}` : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <span>{emoji}</span> {title}
        </span>
        <span className={`font-data text-sm font-bold ${c.text}`}>
          {setup.met}/{setup.total}
        </span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {setup.conditions.map((cond, i) => (
          <li
            key={i}
            className={`flex items-start gap-2 text-[11px] leading-relaxed ${cond.met ? "text-slate-200" : "text-slate-500"}`}
          >
            <span className={cond.met ? c.text : "text-slate-600"}>{cond.met ? "✓" : "○"}</span>
            <span>{cond.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LevelChip({
  label,
  value,
  bull,
  bear,
  active,
}: {
  label: string;
  value: number | null | undefined;
  bull?: boolean;
  bear?: boolean;
  active?: boolean;
}) {
  const cls = active
    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
    : bull
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
      : bear
        ? "border-red-500/20 bg-red-500/5 text-red-400"
        : "border-white/10 bg-white/5 text-slate-300";
  return (
    <div className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${cls}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{label}</span>
      <span className="font-data text-xs font-bold tabular-nums">{value != null ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "--"}</span>
    </div>
  );
}

function CrowdCard({
  label,
  value,
  sub,
  color,
  bar,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  bar?: number | null;
}) {
  return (
    <article className="glass-card flex flex-col gap-1.5 p-3 md:p-4">
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
      <p className={`font-data text-base font-bold tabular-nums ${color}`}>{value}</p>
      {bar != null && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className="bg-emerald-500" style={{ width: `${bar}%` }} />
          <div className="bg-red-500" style={{ width: `${100 - bar}%` }} />
        </div>
      )}
      <p className="text-[10px] text-slate-500">{sub}</p>
    </article>
  );
}

function Glossary({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">{title}</p>
      <p>{body}</p>
    </div>
  );
}

/* ─── narrative helpers ─── */

function fundingNarrative(pct: number | null | undefined) {
  if (pct == null) return "--";
  if (pct > 0.05) return "Long agresiv → squeeze risk";
  if (pct < -0.03) return "Short agresiv → fuel pentru rally";
  if (pct > 0.02) return "Long ușor încălzit";
  if (pct < -0.01) return "Bias bearish ușor";
  return "Neutru";
}

function fundingColor(pct: number | null | undefined) {
  if (pct == null) return "text-slate-300";
  if (pct > 0.05) return "text-red-400";
  if (pct < -0.03) return "text-emerald-400";
  if (pct > 0.02) return "text-amber-400";
  return "text-slate-300";
}

function oiNarrative(delta: number) {
  if (delta > 5) return "Pozitionare agresivă în creștere";
  if (delta > 2) return "Construire poziții";
  if (delta < -5) return "Unwind major (vol scade)";
  if (delta < -2) return "Pozitii închise";
  return "Stabil";
}

function takerNarrative(ratio: number | undefined) {
  if (ratio == null) return "--";
  if (ratio > 1.15) return "Cumpărători agresivi";
  if (ratio < 0.87) return "Vânzători agresivi";
  if (ratio > 1.05) return "Bias buy ușor";
  if (ratio < 0.95) return "Bias sell ușor";
  return "Echilibrat";
}

function takerColor(ratio: number | undefined) {
  if (ratio == null) return "text-slate-300";
  if (ratio > 1.15) return "text-emerald-400";
  if (ratio < 0.87) return "text-red-400";
  if (ratio > 1.05) return "text-emerald-300";
  if (ratio < 0.95) return "text-amber-400";
  return "text-slate-300";
}
