"use client";

import { useCallback, useEffect, useState } from "react";

type NewsItem = {
  title: string;
  url: string;
  source: string;
  published: string;
  category: string;
};

const SOURCE_COLORS: Record<string, string> = {
  CoinDesk: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  CoinTelegraph: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  Decrypt: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  "Bitcoin Magazine": "bg-amber-400/10 text-amber-400 border-amber-400/20",
  CryptoSlate: "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
};

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

export function NewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchNews = useCallback(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300_000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const sources = [...new Set(news.map((n) => n.source))];
  const filtered = filter === "all" ? news : news.filter((n) => n.source === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Source filter */}
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === "all" ? "bg-accent-emerald/20 text-accent-emerald" : "bg-white/5 text-slate-500"}`}
          onClick={() => setFilter("all")}
          type="button"
        >
          Toate ({news.length})
        </button>
        {sources.map((src) => {
          const count = news.filter((n) => n.source === src).length;
          return (
            <button
              key={src}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === src ? "bg-accent-emerald/20 text-accent-emerald" : "bg-white/5 text-slate-500"}`}
              onClick={() => setFilter(filter === src ? "all" : src)}
              type="button"
            >
              {src} ({count})
            </button>
          );
        })}
      </div>

      {/* News items */}
      <div className="space-y-2">
        {filtered.map((item, i) => {
          const colorClass = SOURCE_COLORS[item.source] ?? "bg-white/5 text-slate-400 border-white/10";
          return (
            <a
              key={`${item.url}-${i}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="glass-card flex items-start gap-3 px-4 py-3 transition hover:border-white/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-snug line-clamp-2">{item.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${colorClass}`}>
                    {item.source}
                  </span>
                  <span className="text-[11px] text-slate-600">{timeAgo(item.published)}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-700 mt-1">↗</span>
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          Nicio știre disponibilă. Revino în câteva minute.
        </div>
      )}
    </div>
  );
}
