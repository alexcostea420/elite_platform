"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type NewsItem = {
  title: string;
  url: string;
  source: string;
  published: string;
  category: string;
};

type Cluster = {
  lead: NewsItem;
  others: NewsItem[];
  tags: string[];
  publishedAt: number;
};

const SOURCE_STRIPE: Record<string, string> = {
  CoinDesk: "border-l-blue-400",
  CoinTelegraph: "border-l-emerald-400",
  Decrypt: "border-l-pink-400",
  "Bitcoin Magazine": "border-l-amber-400",
  CryptoSlate: "border-l-cyan-400",
};

const SOURCE_TEXT: Record<string, string> = {
  CoinDesk: "text-blue-400",
  CoinTelegraph: "text-emerald-400",
  Decrypt: "text-pink-400",
  "Bitcoin Magazine": "text-amber-400",
  CryptoSlate: "text-cyan-400",
};

const TAG_PATTERNS: Array<{ tag: string; rx: RegExp; impact: "high" | "med" | "low" }> = [
  { tag: "Fed", rx: /\b(fomc|fed|federal reserve|powell|rate cut|rate hike)\b/i, impact: "high" },
  { tag: "ETF", rx: /\b(etf|spot etf|ibit|fbtc)\b/i, impact: "high" },
  { tag: "Reglementare", rx: /\b(sec|cftc|mica|lawsuit|sue|charge|fine|ban)\b/i, impact: "high" },
  { tag: "Hack", rx: /\b(hack|exploit|drained|stolen|rug pull|breach)\b/i, impact: "high" },
  { tag: "BTC", rx: /\b(bitcoin|btc)\b/i, impact: "med" },
  { tag: "ETH", rx: /\b(ethereum|eth)\s|\beth\b/i, impact: "med" },
  { tag: "Solana", rx: /\b(solana|sol)\b/i, impact: "low" },
  { tag: "Macro", rx: /\b(cpi|inflation|gdp|recession|treasury|yields|dxy)\b/i, impact: "high" },
  { tag: "Stablecoin", rx: /\b(usdt|usdc|tether|circle|stablecoin|depeg)\b/i, impact: "med" },
  { tag: "DeFi", rx: /\b(defi|aave|uniswap|curve|liquidity pool)\b/i, impact: "low" },
  { tag: "Halving", rx: /\b(halving|halve)\b/i, impact: "med" },
];

const STOPWORDS = new Set([
  "a","an","the","of","in","on","at","to","for","with","and","or","but","is","are","was","were","be",
  "as","by","from","that","this","these","those","it","its","not","no","just","also","than","then",
  "after","before","up","down","over","under","into","out","new","more","less","may","can","will",
  "says","said","report","reports","report:","reports:","price","crypto","market","markets","what",
  "why","how","when","who","which","you","your","we","us","our",
]);

function tokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter += 1;
  });
  const union = a.size + b.size - inter;
  return inter / union;
}

function inferTags(title: string): string[] {
  const out: string[] = [];
  for (const { tag, rx } of TAG_PATTERNS) {
    if (rx.test(title)) out.push(tag);
  }
  return out;
}

function clusterNews(items: NewsItem[]): Cluster[] {
  const sorted = [...items].sort((a, b) => +new Date(b.published) - +new Date(a.published));
  const clusters: Cluster[] = [];
  const sixHoursMs = 6 * 60 * 60 * 1000;

  for (const item of sorted) {
    const itemTokens = tokens(item.title);
    const itemTime = +new Date(item.published);
    let merged = false;

    for (const c of clusters) {
      if (Math.abs(itemTime - c.publishedAt) > sixHoursMs) continue;
      if (c.others.some((o) => o.source === item.source) || c.lead.source === item.source) continue;
      const sim = jaccard(itemTokens, tokens(c.lead.title));
      if (sim >= 0.32) {
        c.others.push(item);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({
        lead: item,
        others: [],
        tags: inferTags(item.title),
        publishedAt: itemTime,
      });
    }
  }

  return clusters;
}

function timeAgo(iso: string | number): string {
  const time = typeof iso === "number" ? iso : new Date(iso).getTime();
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "acum";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}z`;
}

function dayBucket(ts: number): "today" | "yesterday" | "older" {
  const now = new Date();
  const d = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yest = today - 24 * 60 * 60 * 1000;
  if (d.getTime() >= today) return "today";
  if (d.getTime() >= yest) return "yesterday";
  return "older";
}

const BUCKET_LABEL: Record<"today" | "yesterday" | "older", string> = {
  today: "Astăzi",
  yesterday: "Ieri",
  older: "Mai vechi",
};

const LAST_VISIT_KEY = "news-last-visit-ts";

export function NewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [lastVisit, setLastVisit] = useState<number>(0);

  const fetchNews = useCallback(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prev = Number(window.localStorage.getItem(LAST_VISIT_KEY) ?? 0);
      setLastVisit(prev);
      window.localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    }
    fetchNews();
    const interval = setInterval(fetchNews, 300_000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const clusters = useMemo(() => clusterNews(news), [news]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clusters) {
      for (const t of c.tags) counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [clusters]);

  const filtered = useMemo(() => {
    if (tagFilter === "all") return clusters;
    return clusters.filter((c) => c.tags.includes(tagFilter));
  }, [clusters, tagFilter]);

  const newCount = useMemo(() => {
    if (!lastVisit) return 0;
    return clusters.filter((c) => c.publishedAt > lastVisit).length;
  }, [clusters, lastVisit]);

  const grouped = useMemo(() => {
    const buckets: Record<"today" | "yesterday" | "older", Cluster[]> = {
      today: [],
      yesterday: [],
      older: [],
    };
    for (const c of filtered) buckets[dayBucket(c.publishedAt)].push(c);
    return buckets;
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([t]) => t);

  return (
    <div className="space-y-5">
      {newCount > 0 && lastVisit > 0 && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 text-xs text-emerald-300">
          {newCount} {newCount === 1 ? "știre nouă" : "știri noi"} de la ultima vizită
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            tagFilter === "all"
              ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              : "border border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
          }`}
          onClick={() => setTagFilter("all")}
          type="button"
        >
          Toate ({clusters.length})
        </button>
        {topTags.map((tag) => (
          <button
            key={tag}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tagFilter === tag
                ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                : "border border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
            }`}
            onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
            type="button"
          >
            {tag} ({tagCounts[tag]})
          </button>
        ))}
      </div>

      {(["today", "yesterday", "older"] as const).map((bucket) => {
        const items = grouped[bucket];
        if (items.length === 0) return null;
        return (
          <div key={bucket} className="space-y-2">
            <h3 className="sticky top-16 z-10 -mx-4 bg-crypto-dark/95 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
              {BUCKET_LABEL[bucket]} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((cluster) => {
                const stripe = SOURCE_STRIPE[cluster.lead.source] ?? "border-l-white/10";
                const isNew = lastVisit > 0 && cluster.publishedAt > lastVisit;
                return (
                  <article
                    key={cluster.lead.url}
                    className={`glass-card relative border-l-2 px-4 py-3 transition hover:border-white/20 ${stripe}`}
                  >
                    {isNew && (
                      <span
                        aria-label="știre nouă"
                        className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-emerald-400"
                      />
                    )}
                    <a
                      className="block"
                      href={cluster.lead.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <p className="pr-4 text-sm font-medium leading-snug text-white line-clamp-2">
                        {cluster.lead.title}
                      </p>
                    </a>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                      <span
                        className={`font-semibold uppercase tracking-wider ${
                          SOURCE_TEXT[cluster.lead.source] ?? "text-slate-400"
                        }`}
                      >
                        {cluster.lead.source}
                      </span>
                      {cluster.others.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <span className="h-1 w-1 rounded-full bg-slate-600" />
                          {cluster.others.length === 1
                            ? "1 altă sursă"
                            : `${cluster.others.length} alte surse`}
                          <span className="ml-1 flex gap-0.5">
                            {cluster.others.map((o) => (
                              <a
                                key={o.url}
                                href={o.url}
                                rel="noreferrer"
                                target="_blank"
                                className={`rounded px-1 text-[9px] font-semibold uppercase tracking-wider hover:underline ${
                                  SOURCE_TEXT[o.source] ?? "text-slate-400"
                                }`}
                                title={o.title}
                              >
                                {o.source.slice(0, 2)}
                              </a>
                            ))}
                          </span>
                        </span>
                      )}
                      <span className="text-slate-600">{timeAgo(cluster.publishedAt)}</span>
                      {cluster.tags.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {cluster.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          Nicio știre pentru filtrul curent.
        </div>
      )}
    </div>
  );
}
