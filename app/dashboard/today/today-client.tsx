"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type TodaySnapshot = {
  risk: {
    score: number;
    decision: "BUY" | "SELL" | "HOLD";
    decision_text: string;
    conviction: "HIGH" | "MEDIUM" | "LOW";
    btc_price: number;
    btc_24h_change: number | null;
    pct_from_ath: number;
    fear_greed_value: number | null;
    fear_greed_label: string | null;
    updated: string;
  } | null;
  whale: {
    net_sentiment: number;
    sentiment_label: string;
    smart_long_usd: number;
    smart_short_usd: number;
    wallet_count: number;
    top_assets: Array<{
      asset: string;
      net_notional_usd: number;
      long_count: number;
      short_count: number;
      side: string;
    }>;
    updated: string;
  } | null;
};

type NewsItem = {
  title: string;
  url: string;
  source: string;
  published: string;
  category: string;
};

type CalendarEvent = {
  title: string;
  titleRo: string;
  date: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  btcImpact: string | null;
};

const decisionColor = (d: string) =>
  d === "BUY" ? "text-emerald-400" : d === "SELL" ? "text-rose-400" : "text-amber-400";
const decisionBg = (d: string) =>
  d === "BUY" ? "bg-emerald-400/10 border-emerald-400/30" : d === "SELL" ? "bg-rose-400/10 border-rose-400/30" : "bg-amber-400/10 border-amber-400/30";
const decisionLabel = (d: string) => (d === "BUY" ? "CUMPĂRĂ" : d === "SELL" ? "VINDE" : "AȘTEAPTĂ");

const impactColor = (impact: string) =>
  impact === "high" ? "text-rose-400 border-rose-400/30 bg-rose-400/10"
    : impact === "medium" ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
    : "text-slate-400 border-slate-400/20 bg-slate-400/5";

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function TodayClient({ snapshot }: { snapshot: TodaySnapshot }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [newsRes, calRes] = await Promise.all([
        fetch("/api/news").then((r) => r.json()).catch(() => ({ news: [] })),
        fetch("/api/calendar").then((r) => r.json()).catch(() => ({ events: [] })),
      ]);
      setNews(Array.isArray(newsRes.news) ? newsRes.news.slice(0, 6) : []);
      setCalendar(Array.isArray(calRes.events) ? calRes.events : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 300_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const todayEvents = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return calendar
      .filter((e) => {
        const d = new Date(e.date);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === todayKey;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [calendar]);

  const highImpactToday = todayEvents.filter((e) => e.impact === "high").length;

  const { risk, whale } = snapshot;

  return (
    <div className="space-y-6">
      {/* HERO: Risk Score + BTC Snapshot */}
      <section className={`glass-card rounded-2xl border p-4 sm:p-6 ${risk ? decisionBg(risk.decision) : "border-white/10"}`}>
        {risk ? (
          <div className="space-y-5 md:grid md:grid-cols-[auto,1fr,auto] md:items-center md:gap-6 md:space-y-0">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border border-white/10 bg-black/30 sm:h-24 sm:w-24">
                <span className={`font-data text-3xl font-bold sm:text-4xl ${decisionColor(risk.decision)}`}>{risk.score}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Risk Score</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xl font-bold sm:text-2xl ${decisionColor(risk.decision)}`}>{decisionLabel(risk.decision)}</p>
                <p className="mt-1 text-sm text-slate-400">{risk.decision_text}</p>
                <p className="mt-1 text-xs text-slate-500">Convicție: <span className="text-slate-300">{risk.conviction}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Stat label="BTC" value={`$${risk.btc_price.toLocaleString("ro-RO", { maximumFractionDigits: 0 })}`} sub={
                risk.btc_24h_change != null ? `${risk.btc_24h_change >= 0 ? "+" : ""}${risk.btc_24h_change.toFixed(2)}% 24h` : ""
              } subTone={risk.btc_24h_change != null ? (risk.btc_24h_change >= 0 ? "pos" : "neg") : "neutral"} />
              <Stat label="Față de ATH" value={`${risk.pct_from_ath.toFixed(1)}%`} sub="distanță" />
              <Stat
                label="Fear & Greed"
                value={risk.fear_greed_value != null ? String(risk.fear_greed_value) : "—"}
                sub={risk.fear_greed_label ?? ""}
              />
            </div>
            <Link
              href="/dashboard/risk-score"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:bg-white/10 md:w-auto md:self-center"
            >
              Vezi detalii →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Risk Score indisponibil. Reîncearcă în câteva minute.</p>
        )}
        {risk ? (
          <p className="mt-4 text-xs text-slate-600">Actualizat acum {timeAgo(risk.updated)}</p>
        ) : null}
      </section>

      {/* Quick alerts row */}
      <section className="grid gap-4 md:grid-cols-3">
        <AlertCard
          icon="🐋"
          title="Whale Sentiment"
          value={whale ? whale.sentiment_label : "—"}
          sub={whale ? `${whale.wallet_count} portofele monitorizate · Long ${formatUsd(whale.smart_long_usd)} · Short ${formatUsd(whale.smart_short_usd)}` : "Indisponibil"}
          href="/tools/whale-tracker"
          tone={whale && whale.net_sentiment > 0 ? "pos" : whale && whale.net_sentiment < 0 ? "neg" : "neutral"}
        />
        <AlertCard
          icon="📅"
          title="Evenimente Azi"
          value={loading ? "…" : `${todayEvents.length}`}
          sub={highImpactToday > 0 ? `${highImpactToday} cu impact mare 🔴` : "Fără evenimente high-impact"}
          href="/dashboard/calendar"
          tone={highImpactToday > 0 ? "warn" : "neutral"}
        />
        <AlertCard
          icon="📰"
          title="Știri Live"
          value={loading ? "…" : `${news.length}`}
          sub={news[0] ? `Ultima: ${timeAgo(news[0].published)} · ${news[0].source}` : "Se încarcă…"}
          href="/dashboard/news"
          tone="neutral"
        />
      </section>

      {/* Whale top assets */}
      {whale && whale.top_assets.length > 0 ? (
        <section className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="section-label mb-1">Whale Flow Top 3</p>
              <h2 className="text-lg font-bold text-white">Ce fac whale-urile chiar acum</h2>
              <p className="mt-1 text-xs text-slate-500">Top 20 portofele Hyperliquid · actualizat acum {timeAgo(whale.updated)}</p>
            </div>
            <Link href="/tools/whale-tracker" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">Toate →</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {whale.top_assets.map((a) => (
              <div key={a.asset} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-white">{a.asset}</span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${a.side === "LONG" ? "text-emerald-400" : a.side === "SHORT" ? "text-rose-400" : "text-slate-400"}`}>
                    {a.side === "LONG" ? "Long" : a.side === "SHORT" ? "Short" : "Mixt"}
                  </span>
                </div>
                <p className={`mt-2 font-data text-lg font-bold tabular-nums ${a.net_notional_usd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {a.net_notional_usd >= 0 ? "+" : ""}{formatUsd(a.net_notional_usd)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {a.long_count} long · {a.short_count} short
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Today's economic calendar */}
      <section className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Calendar Economic — Azi</p>
            <h2 className="text-lg font-bold text-white">Evenimente programate</h2>
          </div>
          <Link href="/dashboard/calendar" className="text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">Săptămâna →</Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Se încarcă…</p>
        ) : todayEvents.length === 0 ? (
          <p className="text-sm text-slate-500">Niciun eveniment programat azi. Zi liniștită pe macro.</p>
        ) : (
          <ul className="space-y-2">
            {todayEvents.slice(0, 6).map((e, i) => {
              const time = new Date(e.date).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
              return (
                <li key={`${e.title}-${i}`} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="font-data text-sm text-slate-400 sm:w-16">{time}</span>
                  <span className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${impactColor(e.impact)}`}>
                    {e.impact === "high" ? "Mare" : e.impact === "medium" ? "Mediu" : "Mic"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{e.titleRo || e.title}</p>
                    {e.btcImpact ? <p className="mt-0.5 text-xs text-slate-500">{e.btcImpact}</p> : null}
                  </div>
                  <span className="font-data text-xs text-slate-500 sm:w-32 sm:text-right">
                    {e.forecast ? `Est. ${e.forecast}` : ""} {e.previous ? `· Prec. ${e.previous}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* News feed */}
      <section className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Știri Critice</p>
            <h2 className="text-lg font-bold text-white">Ce mișcă piața</h2>
          </div>
          <Link href="/dashboard/news" className="text-xs font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">Feed complet →</Link>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Se încarcă știrile…</p>
        ) : news.length === 0 ? (
          <p className="text-sm text-slate-500">Nicio știre disponibilă acum.</p>
        ) : (
          <ul className="space-y-2">
            {news.map((n, i) => (
              <li key={`${n.url}-${i}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-200">{n.title}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">{timeAgo(n.published)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{n.source}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "pos" | "neg" | "neutral";
}) {
  const subColor = subTone === "pos" ? "text-emerald-400" : subTone === "neg" ? "text-rose-400" : "text-slate-500";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-data text-lg font-bold text-white tabular-nums">{value}</p>
      {sub ? <p className={`text-xs ${subColor}`}>{sub}</p> : null}
    </div>
  );
}

function AlertCard({
  icon,
  title,
  value,
  sub,
  href,
  tone,
}: {
  icon: string;
  title: string;
  value: string;
  sub: string;
  href: string;
  tone: "pos" | "neg" | "warn" | "neutral";
}) {
  const valueColor =
    tone === "pos" ? "text-emerald-400"
      : tone === "neg" ? "text-rose-400"
      : tone === "warn" ? "text-amber-400"
      : "text-white";
  return (
    <Link href={href} className="glass-card group rounded-xl border border-white/10 p-4 transition hover:border-white/20">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400">→</span>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <p className={`font-data text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{sub}</p>
    </Link>
  );
}
