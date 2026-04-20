"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type StockZones = {
  ticker: string;
  buy1: number;
  buy2: number;
  sell1: number;
  sell2: number;
  signal: string;
};

type LiveData = {
  ticker: string;
  price: number;
  change: string;
  changePct: number;
  marketCap: string;
  pe: string;
  volume: string;
  w52High: number;
  w52Low: number;
  pctFromATH: number;
  sparkline?: number[];
};

type ZoneHit = {
  zone: string;
  price: number;
  date: string;
  hit: boolean;
};

type TickerHistory = {
  ticker: string;
  zones: ZoneHit[];
  low3m: number;
  high3m: number;
};

type MergedStock = StockZones & Partial<LiveData> & { price: number };

const ZONES: StockZones[] = [
  { ticker: "TSLA", buy1: 350, buy2: 280, sell1: 580, sell2: 677, signal: "HOLD" },
  { ticker: "COIN", buy1: 118, buy2: 86, sell1: 450, sell2: 690, signal: "HOLD" },
  { ticker: "HOOD", buy1: 33, buy2: 23, sell1: 150, sell2: 250, signal: "HOLD" },
  { ticker: "MSTR", buy1: 105, buy2: 75, sell1: 800, sell2: 1150, signal: "HOLD" },
  { ticker: "MARA", buy1: 7, buy2: 5, sell1: 22, sell2: 56, signal: "HOLD" },
  { ticker: "CRCL", buy1: 45, buy2: 31, sell1: 230, sell2: 350, signal: "HOLD" },
  { ticker: "GOOG", buy1: 240, buy2: 210, sell1: 275, sell2: 410, signal: "SELL 1" },
  { ticker: "META", buy1: 550, buy2: 350, sell1: 850, sell2: 1000, signal: "HOLD" },
  { ticker: "NVDA", buy1: 150, buy2: 130, sell1: 250, sell2: 300, signal: "HOLD" },
  { ticker: "AAPL", buy1: 205, buy2: 170, sell1: 300, sell2: 350, signal: "HOLD" },
  { ticker: "MSFT", buy1: 390, buy2: 345, sell1: 650, sell2: 700, signal: "BUY 1" },
  { ticker: "AMZN", buy1: 184, buy2: 167, sell1: 350, sell2: 400, signal: "HOLD" },
  { ticker: "PYPL", buy1: 33, buy2: 30, sell1: 80, sell2: 180, signal: "HOLD" },
  { ticker: "SHOP", buy1: 110, buy2: 70, sell1: 180, sell2: 360, signal: "HOLD" },
  { ticker: "PLTR", buy1: 63, buy2: 45, sell1: 400, sell2: 500, signal: "HOLD" },
  { ticker: "ORCL", buy1: 150, buy2: 110, sell1: 260, sell2: 440, signal: "BUY 1" },
];

function getSignalFromPrice(zones: StockZones, price: number): string {
  if (price <= zones.buy2) return "BUY 2";
  if (price <= zones.buy1) return "BUY 1";
  if (price >= zones.sell2) return "SELL 2";
  if (price >= zones.sell1) return "SELL 1";
  return "WAIT";
}

function getSignalStyle(signal: string) {
  if (signal.includes("BUY")) return { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400" };
  if (signal.includes("SELL")) return { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", dot: "bg-orange-400" };
  return { color: "text-slate-400", bg: "bg-white/5 border-white/10", dot: "bg-slate-500" };
}

function formatPrice(n: number) {
  return n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : `$${n.toFixed(2)}`;
}

function getPricePosition(current: number, low: number, high: number) {
  const range = high - low;
  if (range <= 0) return 50;
  return Math.max(1, Math.min(99, ((current - low) / range) * 100));
}

function getZonePosition(value: number, low: number, high: number) {
  const range = high - low;
  if (range <= 0) return 50;
  return Math.max(0, Math.min(100, ((value - low) / range) * 100));
}

// Skeleton loading row
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-3"><div className="skeleton h-4 w-12" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-14" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-12" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-12" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-12" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-10" /></td>
      <td className="px-4 py-3"><div className="skeleton h-2.5 w-24" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-16 rounded-full" /></td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card px-4 py-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-7 w-24" />
      <div className="skeleton h-3 w-full rounded-full" />
    </div>
  );
}

function getNearestZone(price: number, zones: StockZones): { label: string; pct: number; direction: "buy" | "sell" | "in" } {
  const distances = [
    { label: "B1", price: zones.buy1, pct: ((price - zones.buy1) / zones.buy1) * 100, type: "buy" as const },
    { label: "B2", price: zones.buy2, pct: ((price - zones.buy2) / zones.buy2) * 100, type: "buy" as const },
    { label: "S1", price: zones.sell1, pct: ((zones.sell1 - price) / price) * 100, type: "sell" as const },
    { label: "S2", price: zones.sell2, pct: ((zones.sell2 - price) / price) * 100, type: "sell" as const },
  ];

  // Find nearest zone the price hasn't crossed yet
  if (price <= zones.buy1) {
    // In buy zone, show distance to B2
    const pct = ((price - zones.buy2) / zones.buy2) * 100;
    return { label: `${pct.toFixed(0)}% > B2`, pct, direction: "buy" };
  }
  if (price >= zones.sell1) {
    // In sell zone, show distance to S2
    const pct = ((zones.sell2 - price) / price) * 100;
    return { label: `${pct.toFixed(0)}% → S2`, pct, direction: "sell" };
  }

  // In neutral zone: find nearest buy or sell
  const toB1 = ((price - zones.buy1) / price) * 100;
  const toS1 = ((zones.sell1 - price) / price) * 100;

  if (toB1 < toS1) {
    return { label: `${toB1.toFixed(0)}% > B1`, pct: toB1, direction: "buy" };
  }
  return { label: `${toS1.toFixed(0)}% → S1`, pct: toS1, direction: "sell" };
}

type SortKey = "ticker" | "price" | "changePct" | "pctFromATH" | "signal";
type Filter = "all" | "buy" | "sell" | "hold";

export function StocksClient() {
  const [liveData, setLiveData] = useState<Record<string, LiveData>>({});
  const [zoneHistory, setZoneHistory] = useState<Record<string, TickerHistory>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<Filter>("all");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [expandedTicker, setExpandedTicker] = useState<string | "all" | null>("all");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const prevPrices = useRef<Record<string, number>>({});

  const fetchData = useCallback(() => {
    fetch("/api/stocks")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, LiveData> = {};
        const flashes: Record<string, "up" | "down"> = {};
        for (const s of d.stocks ?? []) {
          map[s.ticker] = s;
          // Detect price change for flash animation
          const prev = prevPrices.current[s.ticker];
          if (prev !== undefined && prev !== s.price) {
            flashes[s.ticker] = s.price > prev ? "up" : "down";
          }
          prevPrices.current[s.ticker] = s.price;
        }
        setLiveData(map);
        setUpdatedAt(d.updated_at ?? "");
        if (Object.keys(flashes).length > 0) {
          setFlashMap(flashes);
          setTimeout(() => setFlashMap({}), 900);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/stocks/history")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, TickerHistory> = {};
        for (const h of d.history ?? []) map[h.ticker] = h;
        setZoneHistory(map);
      })
      .catch(() => {});
  }, []);

  // Merge zones + live data
  const merged: MergedStock[] = ZONES.map((z) => {
    const live = liveData[z.ticker];
    const price = live?.price ?? 0;
    const signal = price > 0 ? getSignalFromPrice(z, price) : z.signal;
    return { ...z, ...live, signal, price };
  });

  // Filter
  const filtered = merged.filter((s) => {
    if (filter === "buy") return s.signal.includes("BUY");
    if (filter === "sell") return s.signal.includes("SELL");
    if (filter === "hold") return s.signal === "WAIT";
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "ticker": cmp = a.ticker.localeCompare(b.ticker); break;
      case "price": cmp = (a.price ?? 0) - (b.price ?? 0); break;
      case "changePct": cmp = (a.changePct ?? 0) - (b.changePct ?? 0); break;
      case "pctFromATH": cmp = (a.pctFromATH ?? 0) - (b.pctFromATH ?? 0); break;
      case "signal": {
        const order = (s: string) => s.includes("BUY") ? 0 : s.includes("SELL") ? 2 : 1;
        cmp = order(a.signal) - order(b.signal);
        break;
      }
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const buyCount = merged.filter((s) => s.signal.includes("BUY")).length;
  const sellCount = merged.filter((s) => s.signal.includes("SELL")).length;
  const holdCount = merged.filter((s) => s.signal === "WAIT").length;

  // Market summary
  const avgChange = merged.length > 0
    ? merged.reduce((sum, s) => sum + (s.changePct ?? 0), 0) / merged.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Market stats bar */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-slate-400">Prețuri Live</span>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-slate-500">
            Portofoliu: <span className="font-semibold text-white">{merged.length} acțiuni</span>
          </span>
          <span className="text-slate-500">
            Medie azi:{" "}
            <span className={`font-data font-semibold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </span>
          </span>
          {updatedAt && (
            <span className="text-slate-600">
              {new Date(updatedAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Signal summary cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <button
          className={`glass-card px-4 py-5 text-center transition ${filter === "buy" ? "border-emerald-400/50 bg-emerald-400/5" : ""}`}
          onClick={() => setFilter(filter === "buy" ? "all" : "buy")}
          type="button"
        >
          <p className="font-data text-3xl font-bold text-emerald-400">{buyCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Cumpără</p>
        </button>
        <button
          className={`glass-card px-4 py-5 text-center transition ${filter === "hold" ? "border-slate-400/50 bg-slate-400/5" : ""}`}
          onClick={() => setFilter(filter === "hold" ? "all" : "hold")}
          type="button"
        >
          <p className="font-data text-3xl font-bold text-slate-400">{holdCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Neutru</p>
        </button>
        <button
          className={`glass-card px-4 py-5 text-center transition ${filter === "sell" ? "border-orange-400/50 bg-orange-400/5" : ""}`}
          onClick={() => setFilter(filter === "sell" ? "all" : "sell")}
          type="button"
        >
          <p className="font-data text-3xl font-bold text-orange-400">{sellCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-400/70">Vinde</p>
        </button>
      </div>

      {/* Sort buttons - mobile */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {[
          { key: "ticker" as SortKey, label: "Nume" },
          { key: "changePct" as SortKey, label: "% Azi" },
          { key: "pctFromATH" as SortKey, label: "% ATH" },
          { key: "signal" as SortKey, label: "Semnal" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              sortBy === key ? "bg-accent-emerald/20 text-accent-emerald" : "bg-white/5 text-slate-500"
            }`}
            onClick={() => handleSort(key)}
            type="button"
          >
            {label} {sortBy === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          {/* Desktop skeleton */}
          <div className="hidden md:block">
            <div className="panel overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3">Preț</th>
                    <th className="px-4 py-3">% Azi</th>
                    <th className="px-4 py-3">Zonă</th>
                    <th className="px-4 py-3">Buy 1</th>
                    <th className="px-4 py-3">Buy 2</th>
                    <th className="px-4 py-3">Sell 1</th>
                    <th className="px-4 py-3">Sell 2</th>
                    <th className="px-4 py-3">Poziție</th>
                    <th className="px-4 py-3">Semnal</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile skeleton */}
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="panel overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("ticker")}>
                      Ticker {sortBy === "ticker" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("price")}>
                      Preț {sortBy === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("changePct")}>
                      % Azi {sortBy === "changePct" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-3">Cea mai apropiată</th>
                    <th className="px-4 py-3">Buy 1</th>
                    <th className="px-4 py-3">Buy 2</th>
                    <th className="px-4 py-3">Sell 1</th>
                    <th className="px-4 py-3">Sell 2</th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("pctFromATH")}>
                      % ATH {sortBy === "pctFromATH" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-3">Poziție în range</th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("signal")}>
                      Semnal {sortBy === "signal" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((stock) => {
                    const style = getSignalStyle(stock.signal);
                    const pos = getPricePosition(stock.price ?? 0, stock.buy2, stock.sell2);
                    const buy1Pos = getZonePosition(stock.buy1, stock.buy2, stock.sell2);
                    const sell1Pos = getZonePosition(stock.sell1, stock.buy2, stock.sell2);
                    const flash = flashMap[stock.ticker];
                    const nearest = getNearestZone(stock.price, stock);

                    return (
                      <React.Fragment key={stock.ticker}>
                      <tr
                        className={`border-b border-white/5 cursor-pointer transition hover:bg-white/[0.02] ${flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : ""}`}
                        onClick={() => setExpandedTicker(
                          expandedTicker === "all" ? stock.ticker :
                          expandedTicker === stock.ticker ? "all" : stock.ticker
                        )}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={`https://finviz.com/quote.ashx?t=${stock.ticker}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-white hover:text-accent-emerald"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {stock.ticker}
                          </a>
                          {stock.marketCap && (
                            <span className="ml-2 text-[10px] text-slate-600">{stock.marketCap}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-data font-semibold text-white tabular-nums">
                          {formatPrice(stock.price ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-data font-semibold tabular-nums ${(stock.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {(stock.changePct ?? 0) >= 0 ? "+" : ""}{(stock.changePct ?? 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-data text-xs font-semibold ${nearest.direction === "buy" ? "text-emerald-400" : "text-orange-400"}`}>
                            {nearest.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-data text-emerald-400 tabular-nums">{formatPrice(stock.buy1)}</td>
                        <td className="px-4 py-3 font-data text-emerald-400/60 tabular-nums">{formatPrice(stock.buy2)}</td>
                        <td className="px-4 py-3 font-data text-orange-400 tabular-nums">{formatPrice(stock.sell1)}</td>
                        <td className="px-4 py-3 font-data text-orange-400/60 tabular-nums">{formatPrice(stock.sell2)}</td>
                        <td className="px-4 py-3">
                          <span className={(stock.pctFromATH ?? 0) > -20 ? "text-amber-400" : "text-red-400"}>
                            {(stock.pctFromATH ?? 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative h-2.5 w-24 overflow-hidden rounded-full bg-white/5">
                            <div className="absolute top-0 h-full bg-emerald-500/20 rounded-l-full" style={{ left: 0, width: `${buy1Pos}%` }} />
                            <div className="absolute top-0 h-full bg-orange-500/20 rounded-r-full" style={{ left: `${sell1Pos}%`, width: `${100 - sell1Pos}%` }} />
                            <div
                              className="absolute top-0 h-full w-1 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                              style={{ left: `${pos}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                            {stock.signal}
                          </span>
                        </td>
                      </tr>
                      {(expandedTicker === "all" || expandedTicker === stock.ticker) && zoneHistory[stock.ticker]?.zones && (
                        <tr className="border-b border-white/5 bg-white/[0.015]">
                          <td colSpan={11} className="px-4 py-2.5">
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-slate-600 font-medium">3L:</span>
                              {zoneHistory[stock.ticker].zones.map((z) => (
                                <span
                                  key={z.zone}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                                    z.hit
                                      ? z.zone.startsWith("Buy")
                                        ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/20"
                                        : "bg-orange-400/15 text-orange-400 border border-orange-400/20"
                                      : "bg-white/[0.03] text-slate-600 border border-white/5"
                                  }`}
                                >
                                  {z.hit && <span className="text-[9px]">✓</span>}
                                  {z.zone.replace("Buy ", "B").replace("Sell ", "S")}
                                  {z.hit && z.date && (
                                    <span className="text-[9px] opacity-60">
                                      {new Date(z.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                                    </span>
                                  )}
                                </span>
                              ))}
                              <span className="ml-auto text-slate-600 font-data tabular-nums">
                                {formatPrice(zoneHistory[stock.ticker].low3m)} — {formatPrice(zoneHistory[stock.ticker].high3m)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {sorted.map((stock) => {
              const style = getSignalStyle(stock.signal);
              const pos = getPricePosition(stock.price, stock.buy2, stock.sell2);
              const buy1Pos = getZonePosition(stock.buy1, stock.buy2, stock.sell2);
              const sell1Pos = getZonePosition(stock.sell1, stock.buy2, stock.sell2);
              const flash = flashMap[stock.ticker];
              const nearest = getNearestZone(stock.price, stock);

              return (
                <div
                  key={stock.ticker}
                  className={`glass-card block px-4 py-4 transition ${flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://finviz.com/quote.ashx?t=${stock.ticker}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-bold text-white hover:text-accent-emerald"
                      >
                        {stock.ticker}
                      </a>
                      {stock.marketCap && (
                        <span className="text-xs text-slate-600">{stock.marketCap}</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {stock.signal}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="font-data text-2xl font-bold text-white tabular-nums">{formatPrice(stock.price ?? 0)}</span>
                    <span className={`font-data text-sm font-semibold tabular-nums ${(stock.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(stock.changePct ?? 0) >= 0 ? "+" : ""}{(stock.changePct ?? 0).toFixed(2)}%
                    </span>
                    <span className={`font-data text-xs font-semibold ${nearest.direction === "buy" ? "text-emerald-400" : "text-orange-400"}`}>
                      {nearest.label}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    ATH: {(stock.pctFromATH ?? 0).toFixed(1)}%
                  </div>

                  {/* Range bar */}
                  <div className="mt-3 relative h-3 overflow-hidden rounded-full bg-white/5">
                    <div className="absolute top-0 h-full bg-emerald-500/20 rounded-l-full" style={{ left: 0, width: `${buy1Pos}%` }} />
                    <div className="absolute top-0 h-full bg-orange-500/20 rounded-r-full" style={{ left: `${sell1Pos}%`, width: `${100 - sell1Pos}%` }} />
                    <div
                      className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                      style={{ left: `${pos}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                    <span>B2: {formatPrice(stock.buy2)}</span>
                    <span>B1: {formatPrice(stock.buy1)}</span>
                    <span>S1: {formatPrice(stock.sell1)}</span>
                    <span>S2: {formatPrice(stock.sell2)}</span>
                  </div>

                  {/* Zone hits - 3 months */}
                  {zoneHistory[stock.ticker]?.zones && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                      {zoneHistory[stock.ticker].zones.map((z) => (
                        <div key={z.zone} className="flex items-center gap-1.5 text-[11px]">
                          <span className={z.hit ? "text-emerald-400" : "text-slate-600"}>
                            {z.hit ? "✅" : "⬜"}
                          </span>
                          <span className={z.hit ? "text-slate-300" : "text-slate-600"}>
                            {z.zone} ({formatPrice(z.price)})
                          </span>
                          {z.hit && z.date && (
                            <span className="text-[10px] text-slate-600">
                              {new Date(z.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-slate-600">
          Datele sunt orientative și nu constituie sfaturi de investiții. Zonele Buy/Sell sunt setate de Alex Costea. Prețuri de la Finviz.
        </p>
      </div>
    </div>
  );
}
