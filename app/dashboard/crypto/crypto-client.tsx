"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type CryptoData = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  ath: number;
  pctFromATH: number;
  cyclePeak: number;
  pctFromCyclePeak: number;
  sparkline: number[];
  image: string;
};

type CryptoZones = {
  buy1: number;
  buy2: number;
  sell1: number;
  sell2: number;
};

// BTC & ETH: zone manuale de la Alex
// Altcoins: Buy 1 = -80% de la cycle peak (peak * 0.20)
// Buy 2, Sell 1, Sell 2 rămân placeholder până Alex le setează manual
const CYCLE_PEAKS: Record<string, number> = {
  SOL: 295, XRP: 3.66, DOGE: 0.48, ADA: 1.32, AVAX: 65.55,
  LINK: 30.92, SUI: 5.37, TAO: 760, BNB: 1376, DOT: 10.40,
  NEAR: 8.88, LTC: 143, UNI: 18.60, RENDER: 13.53, INJ: 52.94,
  HYPE: 59.37, CRV: 1.33, CVX: 7.99, SEI: 1.14, ALGO: 0.51,
  ENA: 1.52, FIL: 11.48, IOTA: 0.62,
};

function altZone(symbol: string): CryptoZones {
  const peak = CYCLE_PEAKS[symbol] ?? 0;
  const buy1 = peak * 0.20; // -80% from cycle peak
  const buy2 = peak * 0.10; // -90% from cycle peak
  const sell1 = peak * 0.85; // -15% from peak
  const sell2 = peak * 1.00; // at peak
  return { buy1, buy2, sell1, sell2 };
}

const ZONES: Record<string, CryptoZones> = {
  // Manual: BTC & ETH
  BTC: { buy1: 68000, buy2: 58000, sell1: 95000, sell2: 110000 },
  ETH: { buy1: 2200, buy2: 1800, sell1: 4500, sell2: 5500 },
  // Auto: -80% from cycle peak
  SOL: altZone("SOL"),
  XRP: altZone("XRP"),
  DOGE: altZone("DOGE"),
  ADA: altZone("ADA"),
  AVAX: altZone("AVAX"),
  LINK: altZone("LINK"),
  SUI: altZone("SUI"),
  TAO: altZone("TAO"),
  BNB: altZone("BNB"),
  DOT: altZone("DOT"),
  NEAR: altZone("NEAR"),
  LTC: altZone("LTC"),
  UNI: altZone("UNI"),
  RENDER: altZone("RENDER"),
  INJ: altZone("INJ"),
  HYPE: altZone("HYPE"),
  CRV: altZone("CRV"),
  CVX: altZone("CVX"),
  SEI: altZone("SEI"),
  ALGO: altZone("ALGO"),
  ENA: altZone("ENA"),
  FIL: altZone("FIL"),
  IOTA: altZone("IOTA"),
};

function getSignal(zones: CryptoZones | undefined, price: number): string {
  if (!zones) return "HOLD";
  if (price <= zones.buy2) return "BUY 2";
  if (price <= zones.buy1) return "BUY 1";
  if (price >= zones.sell2) return "SELL 2";
  if (price >= zones.sell1) return "SELL 1";
  return "HOLD";
}

function getSignalStyle(signal: string) {
  if (signal.includes("BUY")) return { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30", dot: "bg-emerald-400" };
  if (signal.includes("SELL")) return { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", dot: "bg-orange-400" };
  return { color: "text-slate-400", bg: "bg-white/5 border-white/10", dot: "bg-slate-500" };
}

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
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

// Mini sparkline SVG with gradient fill
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div className="h-6 w-16" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const gradId = `cg-${color.replace("#", "")}`;

  return (
    <svg width={w} height={h} className="inline-block opacity-80">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#${gradId})`} />
    </svg>
  );
}

// Skeleton components
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: 10 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="skeleton h-4 w-14" /></td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card px-4 py-4 space-y-3">
      <div className="flex justify-between">
        <div className="flex gap-2 items-center">
          <div className="skeleton h-6 w-6 rounded-full" />
          <div className="skeleton h-5 w-14" />
        </div>
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-7 w-24" />
      <div className="skeleton h-3 w-full rounded-full" />
    </div>
  );
}

type SortKey = "rank" | "price" | "change24h" | "change7d" | "pctFromCyclePeak" | "signal";
type Filter = "all" | "buy" | "sell" | "hold";
type Tab = "all" | "gainers" | "losers";

export function CryptoClient() {
  const [coins, setCoins] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<Filter>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("crypto_disclaimer_accepted");
    if (stored === "true") setAccepted(true);
  }, []);

  const fetchData = useCallback(() => {
    if (!accepted) return;
    fetch("/api/crypto")
      .then((r) => r.json())
      .then((d) => {
        const newCoins = d.coins ?? [];
        const flashes: Record<string, "up" | "down"> = {};
        for (const c of newCoins) {
          const prev = prevPrices.current[c.symbol];
          if (prev !== undefined && prev !== c.price) {
            flashes[c.symbol] = c.price > prev ? "up" : "down";
          }
          prevPrices.current[c.symbol] = c.price;
        }
        setCoins(newCoins);
        setUpdatedAt(d.updated_at ?? "");
        if (Object.keys(flashes).length > 0) {
          setFlashMap(flashes);
          setTimeout(() => setFlashMap({}), 900);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accepted]);

  useEffect(() => {
    fetchData();
    if (!accepted) return;
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData, accepted]);

  const handleAccept = () => {
    setAccepted(true);
    sessionStorage.setItem("crypto_disclaimer_accepted", "true");
  };

  // Disclaimer gate
  if (!accepted) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="glass-card border-amber-500/30 p-8 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 text-2xl font-bold text-white">Disclaimer</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Îmi asum că investiția în altcoins este riscantă și poate duce la pierderea totală a capitalului investit.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Înțeleg că trebuie să urmăresc supraperformanța lor față de Bitcoin și că zonele de Buy/Sell sunt orientative, nu sfaturi financiare.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Performanțele trecute nu garantează rezultate viitoare. Fac propriile cercetări înainte de orice decizie de investiție.
          </p>
          <button
            className="accent-button mt-6 w-full py-3 text-base font-bold"
            onClick={handleAccept}
            type="button"
          >
            Înțeleg și accept riscurile
          </button>
          <a
            className="mt-3 inline-block text-sm text-slate-500 hover:text-slate-300"
            href="/dashboard"
          >
            Înapoi la Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Add signals
  const withSignals = coins.map((c, i) => {
    const zones = ZONES[c.symbol];
    const signal = getSignal(zones, c.price);
    return { ...c, signal, zones, rank: i + 1 };
  });

  // Global stats
  const totalMarketCap = withSignals.reduce((s, c) => s + c.marketCap, 0);
  const btcDominance = withSignals.find((c) => c.symbol === "BTC");
  const btcDom = btcDominance ? ((btcDominance.marketCap / totalMarketCap) * 100) : 0;
  const avg24h = withSignals.length > 0
    ? withSignals.reduce((s, c) => s + c.change24h, 0) / withSignals.length
    : 0;

  const buyCount = withSignals.filter((s) => s.signal.includes("BUY")).length;
  const sellCount = withSignals.filter((s) => s.signal.includes("SELL")).length;
  const holdCount = withSignals.filter((s) => s.signal === "HOLD").length;

  // Apply tab filter first
  let tabFiltered = withSignals;
  if (tab === "gainers") {
    tabFiltered = [...withSignals].sort((a, b) => b.change24h - a.change24h).slice(0, 10);
  } else if (tab === "losers") {
    tabFiltered = [...withSignals].sort((a, b) => a.change24h - b.change24h).slice(0, 10);
  }

  // Then apply signal filter
  const filtered = tabFiltered.filter((s) => {
    if (filter === "buy") return s.signal.includes("BUY");
    if (filter === "sell") return s.signal.includes("SELL");
    if (filter === "hold") return s.signal === "HOLD";
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (tab !== "all") return 0; // Tab already sorted
    let cmp = 0;
    switch (sortBy) {
      case "rank": cmp = a.rank - b.rank; break;
      case "price": cmp = a.price - b.price; break;
      case "change24h": cmp = a.change24h - b.change24h; break;
      case "change7d": cmp = a.change7d - b.change7d; break;
      case "pctFromCyclePeak": cmp = a.pctFromCyclePeak - b.pctFromCyclePeak; break;
      case "signal": {
        const order = (s: string) => s.includes("BUY") ? 0 : s.includes("SELL") ? 2 : 1;
        cmp = order(a.signal) - order(b.signal);
        break;
      }
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir(key === "change24h" || key === "change7d" ? "desc" : "asc"); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card flex items-center gap-3 px-5 py-3">
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="hidden md:block">
          <div className="panel p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/5"><th className="px-4 py-3" colSpan={10}><div className="skeleton h-3 w-full" /></th></tr></thead>
              <tbody>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

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
            Total Cap: <span className="font-semibold text-white">{formatMarketCap(totalMarketCap)}</span>
          </span>
          <span className="text-slate-500">
            BTC Dom: <span className="font-data font-semibold text-amber-400">{btcDom.toFixed(1)}%</span>
          </span>
          <span className="text-slate-500">
            Medie 24h:{" "}
            <span className={`font-data font-semibold ${avg24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avg24h >= 0 ? "+" : ""}{avg24h.toFixed(2)}%
            </span>
          </span>
          {updatedAt && (
            <span className="text-slate-600">
              {new Date(updatedAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Signal summary */}
      <div className="grid grid-cols-3 gap-3">
        <button className={`glass-card px-4 py-5 text-center transition ${filter === "buy" ? "border-emerald-400/50 bg-emerald-400/5" : ""}`} onClick={() => setFilter(filter === "buy" ? "all" : "buy")} type="button">
          <p className="font-data text-3xl font-bold text-emerald-400">{buyCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">Cumpără</p>
        </button>
        <button className={`glass-card px-4 py-5 text-center transition ${filter === "hold" ? "border-slate-400/50 bg-slate-400/5" : ""}`} onClick={() => setFilter(filter === "hold" ? "all" : "hold")} type="button">
          <p className="font-data text-3xl font-bold text-slate-400">{holdCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Așteaptă</p>
        </button>
        <button className={`glass-card px-4 py-5 text-center transition ${filter === "sell" ? "border-orange-400/50 bg-orange-400/5" : ""}`} onClick={() => setFilter(filter === "sell" ? "all" : "sell")} type="button">
          <p className="font-data text-3xl font-bold text-orange-400">{sellCount}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-400/70">Vinde</p>
        </button>
      </div>

      {/* Tabs: All / Gainers / Losers */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
        {([
          { key: "all" as Tab, label: "Toate", icon: "📊" },
          { key: "gainers" as Tab, label: "Top Câștigători", icon: "🟢" },
          { key: "losers" as Tab, label: "Top Perdanți", icon: "🔴" },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === key
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
            onClick={() => setTab(key)}
            type="button"
          >
            <span className="mr-1">{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* Mobile sort */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {([
          { key: "rank" as SortKey, label: "#" },
          { key: "change24h" as SortKey, label: "24h" },
          { key: "change7d" as SortKey, label: "7d" },
          { key: "pctFromCyclePeak" as SortKey, label: "Ciclu" },
          { key: "signal" as SortKey, label: "Semnal" },
        ]).map(({ key, label }) => (
          <button key={key} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${sortBy === key ? "bg-accent-emerald/20 text-accent-emerald" : "bg-white/5 text-slate-500"}`} onClick={() => handleSort(key)} type="button">
            {label} {sortBy === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("rank")}># {sortBy === "rank" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="px-4 py-3">Monedă</th>
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("price")}>Preț</th>
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("change24h")}>24h {sortBy === "change24h" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("change7d")}>7d {sortBy === "change7d" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="px-4 py-3">7d Chart</th>
                <th className="px-4 py-3">Market Cap</th>
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("pctFromCyclePeak")}>% Vârf {sortBy === "pctFromCyclePeak" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
                <th className="px-4 py-3">Poziție range</th>
                <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("signal")}>Semnal {sortBy === "signal" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((coin) => {
                const style = getSignalStyle(coin.signal);
                const zones = coin.zones;
                const pos = zones ? getPricePosition(coin.price, zones.buy2, zones.sell2) : 50;
                const buy1Pos = zones ? getZonePosition(zones.buy1, zones.buy2, zones.sell2) : 0;
                const sell1Pos = zones ? getZonePosition(zones.sell1, zones.buy2, zones.sell2) : 100;
                const sparkColor = coin.change7d >= 0 ? "#22c55e" : "#ef4444";
                const flash = flashMap[coin.symbol];

                return (
                  <tr key={coin.id} className={`border-b border-white/5 transition hover:bg-white/[0.02] ${flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : ""}`}>
                    <td className="px-4 py-3 text-slate-600">{coin.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coin.image} alt={coin.symbol} width={20} height={20} className="rounded-full" />
                        <span className="font-bold text-white">{coin.symbol}</span>
                        <span className="text-xs text-slate-600">{coin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-data font-semibold text-white tabular-nums">{formatPrice(coin.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-data font-semibold tabular-nums ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-data font-semibold tabular-nums ${coin.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {coin.change7d >= 0 ? "+" : ""}{coin.change7d.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Sparkline data={coin.sparkline} color={sparkColor} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{formatMarketCap(coin.marketCap)}</td>
                    <td className="px-4 py-3">
                      <span className={coin.pctFromCyclePeak > -20 ? "text-amber-400" : "text-red-400"}>
                        {coin.pctFromCyclePeak.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {zones ? (
                        <div className="relative h-2.5 w-20 overflow-hidden rounded-full bg-white/5">
                          <div className="absolute top-0 h-full bg-emerald-500/20 rounded-l-full" style={{ left: 0, width: `${buy1Pos}%` }} />
                          <div className="absolute top-0 h-full bg-orange-500/20 rounded-r-full" style={{ left: `${sell1Pos}%`, width: `${100 - sell1Pos}%` }} />
                          <div className="absolute top-0 h-full w-1 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" style={{ left: `${pos}%` }} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {coin.signal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {sorted.map((coin) => {
          const style = getSignalStyle(coin.signal);
          const zones = coin.zones;
          const pos = zones ? getPricePosition(coin.price, zones.buy2, zones.sell2) : 50;
          const buy1Pos = zones ? getZonePosition(zones.buy1, zones.buy2, zones.sell2) : 0;
          const sell1Pos = zones ? getZonePosition(zones.sell1, zones.buy2, zones.sell2) : 100;
          const sparkColor = coin.change7d >= 0 ? "#22c55e" : "#ef4444";
          const flash = flashMap[coin.symbol];

          return (
            <div key={coin.id} className={`glass-card px-4 py-4 ${flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coin.image} alt={coin.symbol} width={24} height={24} className="rounded-full" />
                  <span className="text-lg font-bold text-white">{coin.symbol}</span>
                  <span className="text-xs text-slate-600">{coin.name}</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {coin.signal}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="font-data text-xl font-bold text-white tabular-nums">{formatPrice(coin.price)}</span>
                  <span className={`ml-2 font-data text-sm font-semibold tabular-nums ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
                <Sparkline data={coin.sparkline} color={sparkColor} />
              </div>

              <div className="mt-2 flex gap-4 text-xs text-slate-500">
                <span>7d: <span className={coin.change7d >= 0 ? "text-emerald-400" : "text-red-400"}>{coin.change7d >= 0 ? "+" : ""}{coin.change7d.toFixed(1)}%</span></span>
                <span>Vârf: <span className={coin.pctFromCyclePeak > -20 ? "text-amber-400" : "text-red-400"}>{coin.pctFromCyclePeak.toFixed(1)}%</span></span>
                <span>Cap: {formatMarketCap(coin.marketCap)}</span>
              </div>

              {zones && (
                <>
                  <div className="mt-3 relative h-3 overflow-hidden rounded-full bg-white/5">
                    <div className="absolute top-0 h-full bg-emerald-500/20 rounded-l-full" style={{ left: 0, width: `${buy1Pos}%` }} />
                    <div className="absolute top-0 h-full bg-orange-500/20 rounded-r-full" style={{ left: `${sell1Pos}%`, width: `${100 - sell1Pos}%` }} />
                    <div className="absolute top-0 h-full w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" style={{ left: `${pos}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                    <span>B2: {formatPrice(zones.buy2)}</span>
                    <span>B1: {formatPrice(zones.buy1)}</span>
                    <span>S1: {formatPrice(zones.sell1)}</span>
                    <span>S2: {formatPrice(zones.sell2)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-slate-600">
          Datele sunt orientative și nu constituie sfaturi de investiții. Zonele Buy/Sell sunt setate de Alex Costea. Prețuri de la CoinGecko.
        </p>
      </div>
    </div>
  );
}
