"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export type WhaleDigest = {
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

const impactColor = (impact: string) =>
  impact === "high"
    ? "text-rose-400 border-rose-400/30 bg-rose-400/10"
    : impact === "medium"
      ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
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

export function TodayDigest({ whale }: { whale: WhaleDigest }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [newsRes, calRes] = await Promise.all([
        fetch("/api/news").then((r) => r.json()).catch(() => ({ news: [] })),
        fetch("/api/calendar").then((r) => r.json()).catch(() => ({ events: [] })),
      ]);
      setNews(Array.isArray(newsRes.news) ? newsRes.news.slice(0, 4) : []);
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
  const whaleNetTone = whale && whale.net_sentiment > 0 ? "pos" : whale && whale.net_sentiment < 0 ? "neg" : "neutral";

  return (
    <section className="mb-8 animate-fade-in-up stagger-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Astăzi pe piață</p>
          <h2 className="text-lg font-semibold text-white">Sentiment, evenimente și știri live</h2>
        </div>
      </div>

      {/* Quick alerts row */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <AlertCard
          icon="🐋"
          title="Whale Sentiment"
          value={whale ? whale.sentiment_label : "—"}
          sub={
            whale
              ? `${whale.wallet_count} portofele · Long ${formatUsd(whale.smart_long_usd)} / Short ${formatUsd(whale.smart_short_usd)}`
              : "Indisponibil"
          }
          href="/tools/whale-tracker"
          tone={whaleNetTone}
        />
        <AlertCard
          icon="📅"
          title="Evenimente Azi"
          value={loading ? "…" : `${todayEvents.length}`}
          sub={highImpactToday > 0 ? `${highImpactToday} cu impact mare 🔴` : "Fără high-impact"}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Whale top assets + Calendar */}
        <div className="space-y-4">
          {whale && whale.top_assets.length > 0 ? (
            <div className="glass-card rounded-2xl border border-white/10 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="section-label mb-0.5">Whale Flow Top 3</p>
                  <p className="text-xs text-slate-500">Acum {timeAgo(whale.updated)}</p>
                </div>
                <Link
                  href="/tools/whale-tracker"
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
                >
                  Toate →
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {whale.top_assets.map((a) => (
                  <div key={a.asset} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white">{a.asset}</span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          a.side === "LONG"
                            ? "text-emerald-400"
                            : a.side === "SHORT"
                              ? "text-rose-400"
                              : "text-slate-400"
                        }`}
                      >
                        {a.side === "LONG" ? "Long" : a.side === "SHORT" ? "Short" : "Mixt"}
                      </span>
                    </div>
                    <p
                      className={`mt-1 font-data text-sm font-bold tabular-nums ${
                        a.net_notional_usd >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {a.net_notional_usd >= 0 ? "+" : ""}
                      {formatUsd(a.net_notional_usd)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {a.long_count}L · {a.short_count}S
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="section-label mb-0.5">Calendar — Azi</p>
                <p className="text-xs text-slate-500">Evenimente programate</p>
              </div>
              <Link
                href="/dashboard/calendar"
                className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
              >
                Săptămâna →
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Se încarcă…</p>
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Niciun eveniment azi. Zi liniștită pe macro.</p>
            ) : (
              <ul className="space-y-1.5">
                {todayEvents.slice(0, 4).map((e, i) => {
                  const time = new Date(e.date).toLocaleTimeString("ro-RO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li
                      key={`${e.title}-${i}`}
                      className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                    >
                      <span className="font-data text-xs text-slate-400 sm:w-12">{time}</span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${impactColor(e.impact)}`}
                      >
                        {e.impact === "high" ? "Mare" : e.impact === "medium" ? "Med" : "Mic"}
                      </span>
                      <span className="line-clamp-1 flex-1 text-xs font-semibold text-white">
                        {e.titleRo || e.title}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* News */}
        <div className="glass-card rounded-2xl border border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="section-label mb-0.5">Știri Critice</p>
              <p className="text-xs text-slate-500">Ce mișcă piața</p>
            </div>
            <Link
              href="/dashboard/news"
              className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
            >
              Feed complet →
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Se încarcă știrile…</p>
          ) : news.length === 0 ? (
            <p className="text-sm text-slate-500">Nicio știre disponibilă acum.</p>
          ) : (
            <ul className="space-y-2">
              {news.map((n, i) => (
                <li
                  key={`${n.url}-${i}`}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition hover:bg-white/[0.04]"
                >
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-xs font-semibold text-slate-200">{n.title}</p>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
                        {timeAgo(n.published)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{n.source}</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
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
    tone === "pos"
      ? "text-emerald-400"
      : tone === "neg"
        ? "text-rose-400"
        : tone === "warn"
          ? "text-amber-400"
          : "text-white";
  return (
    <Link
      href={href}
      className="glass-card group rounded-xl border border-white/10 p-4 transition hover:border-white/20"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
          →
        </span>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <p className={`font-data text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{sub}</p>
    </Link>
  );
}
