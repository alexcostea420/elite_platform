"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { WhaleData } from "@/lib/trading-data";

/* ── Types ── */

type PositionRow = WhaleData["positioning"][number];
type SortKey = "asset" | "price" | "open_interest" | "funding" | "signal" | "divergence_score";
type SortDir = "asc" | "desc";

/* ── Helpers ── */

function getSignalColor(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes("STRONG BUY")) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (s.includes("BUY")) return "text-emerald-300 bg-emerald-300/10 border-emerald-300/25";
  if (s.includes("STRONG SELL")) return "text-red-400 bg-red-400/10 border-red-400/30";
  if (s.includes("SELL")) return "text-red-300 bg-red-300/10 border-red-300/25";
  if (s === "NEUTRAL") return "text-slate-300 bg-slate-300/10 border-slate-300/20";
  return "text-amber-400 bg-amber-400/10 border-amber-400/25";
}

function getSentimentColor(label: string) {
  const l = label.toUpperCase();
  if (l.includes("BULLISH")) return "text-emerald-400";
  if (l.includes("BEARISH")) return "text-red-400";
  return "text-amber-400";
}

function getSentimentBg(label: string) {
  const l = label.toUpperCase();
  if (l.includes("BULLISH"))
    return "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_60px_rgba(52,211,153,0.15)]";
  if (l.includes("BEARISH"))
    return "border-red-400/40 bg-red-400/10 shadow-[0_0_60px_rgba(248,113,113,0.15)]";
  return "border-amber-400/40 bg-amber-400/10 shadow-[0_0_60px_rgba(251,191,36,0.15)]";
}

function getSentimentLabel(label: string) {
  const l = label.toUpperCase();
  if (l.includes("BULLISH")) return "BULLISH";
  if (l.includes("BEARISH")) return "BEARISH";
  if (l === "NO DATA") return "FARA DATE";
  return "NEUTRU";
}

function getSentimentPosition(net: number): number {
  return Math.max(0, Math.min(100, (net + 100) / 2));
}

function formatPrice(n: number): string {
  if (n >= 1000) return "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  if (n >= 1) return "$" + n.toFixed(2);
  return "$" + n.toFixed(4);
}

function formatOI(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}

function formatFunding(f: number): string {
  return (f * 100).toFixed(4) + "%";
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "chiar acum";
  if (mins < 60) return `${mins} min in urma`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h in urma`;
  return `${Math.floor(hours / 24)}z in urma`;
}

function compareFn(a: PositionRow, b: PositionRow, key: SortKey, dir: SortDir): number {
  if (key === "asset" || key === "signal") {
    const va = String(a[key]);
    const vb = String(b[key]);
    return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  }
  const va = Number(a[key]) || 0;
  const vb = Number(b[key]) || 0;
  return dir === "asc" ? va - vb : vb - va;
}

/* ── Sort Header ── */

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`cursor-pointer select-none px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:text-emerald-400 ${active ? "text-emerald-400" : "text-slate-500"} ${className ?? ""}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active && <span className="ml-1">{currentDir === "asc" ? "\u25B2" : "\u25BC"}</span>}
    </th>
  );
}

/* ── Client Component ── */

export function WhaleTrackerClient({ data }: { data: WhaleData }) {
  const [sortKey, setSortKey] = useState<SortKey>("divergence_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedPositioning = useMemo(() => {
    if (!data.positioning) return [];
    return [...data.positioning].sort((a, b) => compareFn(a, b, sortKey, sortDir));
  }, [data.positioning, sortKey, sortDir]);

  const topDivergence = useMemo(() => {
    if (!data.positioning) return [];
    return [...data.positioning]
      .filter((p) => p.divergence_score > 0)
      .sort((a, b) => b.divergence_score - a.divergence_score)
      .slice(0, 3);
  }, [data.positioning]);

  const sentimentPos = getSentimentPosition(data.sentiment.net_sentiment);
  const sentimentLabel = getSentimentLabel(data.sentiment.sentiment_label);

  return (
    <>
      {/* ─── HEADER + BREADCRUMB ─── */}
      <div className="mb-8 flex items-center gap-3">
        <Link className="text-sm text-slate-500 hover:text-accent-emerald transition-colors" href="/dashboard">
          Dashboard
        </Link>
        <span className="text-slate-700">/</span>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Whale Tracker</p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-3xl font-black text-white md:text-4xl">Whale Tracker</h1>
        <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
          PRO
        </span>
      </div>

      {/* ─── 1. SENTIMENT OVERVIEW ─── */}
      <section
        className={`panel mb-8 px-6 py-8 md:px-10 md:py-10 ${getSentimentBg(data.sentiment.sentiment_label)}`}
      >
        <div className="flex flex-col items-center text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Sentiment general
          </p>

          <h2
            className={`text-5xl font-black tracking-wider md:text-6xl ${getSentimentColor(data.sentiment.sentiment_label)}`}
          >
            {sentimentLabel}
          </h2>

          {/* Gradient bar */}
          <div className="relative mt-6 w-full max-w-md">
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
            <div
              className="absolute -top-1 h-5 w-5 rounded-full border-2 border-white bg-white shadow-lg transition-all duration-500"
              style={{ left: `calc(${sentimentPos}% - 10px)` }}
            />
          </div>
          <div className="mt-2 flex w-full max-w-md justify-between text-xs font-semibold">
            <span className="text-red-400">BEARISH</span>
            <span className="text-amber-400">NEUTRU</span>
            <span className="text-emerald-400">BULLISH</span>
          </div>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span>
              Smart Long:{" "}
              <span className="font-semibold text-emerald-400">
                ${formatOI(data.sentiment.total_smart_long_usd)}
              </span>
            </span>
            <span>
              Smart Short:{" "}
              <span className="font-semibold text-red-400">
                ${formatOI(data.sentiment.total_smart_short_usd)}
              </span>
            </span>
            <span>
              Portofele monitorizate:{" "}
              <span className="font-semibold text-white">{data.wallet_count}</span>
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500">Ultima actualizare: {timeAgo(data.timestamp)}</p>
        </div>
      </section>

      {/* ─── 2. POSITIONING TABLE ─── */}
      <section className="panel mb-8 overflow-hidden">
        <div className="px-6 py-5 md:px-8">
          <h3 className="text-lg font-bold text-white">Pozitionare pe active</h3>
          <p className="mt-1 text-sm text-slate-500">{sortedPositioning.length} active monitorizate</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-t border-white/5">
                <SortHeader
                  label="Asset"
                  sortKey="asset"
                  currentKey={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="pl-6 md:pl-8"
                />
                <SortHeader label="Pret" sortKey="price" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader label="OI" sortKey="open_interest" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                <SortHeader
                  label="Funding"
                  sortKey="funding"
                  currentKey={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Divergenta"
                  sortKey="divergence_score"
                  currentKey={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Semnal"
                  sortKey="signal"
                  currentKey={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  className="pr-6 md:pr-8"
                />
              </tr>
            </thead>
            <tbody>
              {sortedPositioning.map((row, i) => (
                <tr
                  key={row.asset}
                  className={`border-t border-white/5 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-3.5 pl-6 md:pl-8">
                    <span className="font-bold text-white">{row.asset}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-300">
                    {formatPrice(row.price)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-300">
                    {formatOI(row.open_interest)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-3.5 text-sm font-medium ${
                      row.funding >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatFunding(row.funding)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${Math.min(row.divergence_score * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        {row.divergence_score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 pr-6 md:pr-8">
                    <span
                      className={`inline-block rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getSignalColor(row.signal)}`}
                    >
                      {row.signal}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedPositioning.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nu exista date de pozitionare disponibile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 3. TOP DIVERGENCE SPOTLIGHT ─── */}
      {topDivergence.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-4 text-lg font-bold text-white">Top divergenta Smart Money</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topDivergence.map((item) => (
              <article key={item.asset} className="panel px-6 py-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-black text-white">{item.asset}</h4>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getSignalColor(item.signal)}`}
                  >
                    {item.signal}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Scor divergenta</span>
                    <span className="font-bold text-emerald-400">{item.divergence_score.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pret</span>
                    <span className="font-medium text-white">{formatPrice(item.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Smart Long %</span>
                    <span className="font-medium text-emerald-400">{item.smart_long_pct.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Funding</span>
                    <span className={`font-medium ${item.funding >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatFunding(item.funding)}
                    </span>
                  </div>
                </div>

                {/* Divergence bar */}
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all"
                      style={{ width: `${Math.min(item.divergence_score * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ─── 4. DISCLAIMER ─── */}
      <p className="mb-8 text-center text-xs leading-relaxed text-slate-600">
        Datele sunt colectate automat din surse publice blockchain si nu constituie sfaturi de investitii.
        Pozitionarea &quot;smart money&quot; este estimata pe baza analizei on-chain si poate contine inexactitati.
        Tranzactioneaza responsabil.
      </p>
    </>
  );
}
