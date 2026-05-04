"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BlurGuard, useBlurMode } from "@/components/ui/blur-guard";

type StockZones = {
  ticker: string;
  buy1: number;
  buy2: number;
  sell1: number;
  sell2: number;
  signal: string;
};

type ScoreData = {
  score: number | null;
  scoreQuality: number | null;
  scoreValue: number | null;
  scoreBalance: number | null;
  isBtcDriven: boolean;
  grossMargin: number | null;
  fcfMargin: number | null;
  roe: number | null;
  fcfYield: number | null;
  pFcf: number | null;
  evEbit: number | null;
  netDebtToMarketCap: number | null;
  asOf: string | null;
};

type LiveData = {
  ticker: string;
  price: number;
  change: string;
  changePct: number;
  marketCap: string;
  pe: string;
  volume: string;
  avgVolume: string;
  sector: string;
  w52High: number;
  w52Low: number;
  pctFromATH: number;
  sparkline?: number[];
  scoreData?: ScoreData;
};

const SECTORS: Record<string, string> = {
  TSLA: "Auto/EV", COIN: "Crypto", HOOD: "Fintech", MSTR: "Crypto",
  MARA: "Crypto", CRCL: "Crypto", GOOG: "Tech", META: "Tech",
  NVDA: "Tech", AAPL: "Tech", MSFT: "Tech", AMZN: "Tech",
  PYPL: "Fintech", SHOP: "Tech", PLTR: "Tech/AI", ORCL: "Tech",
};

const SECTOR_COLORS: Record<string, string> = {
  Tech: "text-blue-400", "Tech/AI": "text-blue-400", Crypto: "text-amber-400",
  Fintech: "text-purple-400", "Auto/EV": "text-cyan-400",
};

function parseVolume(vol: string): number {
  if (!vol || vol === "-") return 0;
  const clean = vol.replace(/,/g, "").trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  const suffix = clean.slice(-1).toUpperCase();
  if (suffix === "B") return num * 1_000_000_000;
  if (suffix === "M") return num * 1_000_000;
  if (suffix === "K") return num * 1_000;
  return num;
}

function volumeRatio(vol: string, avgVol: string): { ratio: number; label: string; color: string } {
  const v = parseVolume(vol);
  const a = parseVolume(avgVol);
  if (a === 0) return { ratio: 0, label: "-", color: "text-slate-600" };
  const r = v / a;
  if (r >= 2) return { ratio: r, label: `${r.toFixed(1)}x`, color: "text-emerald-400" };
  if (r >= 1.2) return { ratio: r, label: `${r.toFixed(1)}x`, color: "text-white" };
  if (r >= 0.5) return { ratio: r, label: `${r.toFixed(1)}x`, color: "text-slate-400" };
  return { ratio: r, label: `${r.toFixed(1)}x`, color: "text-red-400" };
}

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

function scoreColor(score: number): { ring: string; text: string; bg: string; label: string } {
  if (score >= 80) return { ring: "border-emerald-400/60", text: "text-emerald-300", bg: "bg-emerald-400/10", label: "SOLID" };
  if (score >= 60) return { ring: "border-emerald-500/40", text: "text-emerald-400", bg: "bg-emerald-500/5", label: "BUN" };
  if (score >= 40) return { ring: "border-amber-400/40", text: "text-amber-300", bg: "bg-amber-400/5", label: "NEUTRU" };
  if (score >= 20) return { ring: "border-orange-400/40", text: "text-orange-300", bg: "bg-orange-400/5", label: "SLAB" };
  return { ring: "border-red-400/50", text: "text-red-300", bg: "bg-red-400/5", label: "PERICOL" };
}

function ScoreBadge({ data }: { data?: ScoreData }) {
  if (!data) return <span className="text-xs text-slate-700">-</span>;
  if (data.isBtcDriven) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/5 px-2 py-0.5 text-[10px] font-bold text-amber-300">
        ⚡ BTC
      </span>
    );
  }
  if (data.score === null) return <span className="text-xs text-slate-700">-</span>;
  const c = scoreColor(data.score);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums ${c.ring} ${c.bg} ${c.text}`}>
      <span className="font-data">{data.score.toFixed(0)}</span>
      <span className="text-[9px] font-semibold opacity-70">{c.label}</span>
    </span>
  );
}

function fmtPct(v: number | null, digits = 1): string {
  if (v === null || v === undefined) return "-";
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtNum(v: number | null, digits = 1): string {
  if (v === null || v === undefined) return "-";
  return v.toFixed(digits);
}

function ScoreBreakdown({ data, ticker }: { data: ScoreData; ticker: string }) {
  if (data.isBtcDriven) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 text-xs">
        <p className="font-semibold text-amber-300">⚡ Acțiune BTC-driven</p>
        <p className="text-slate-400">
          Pentru {ticker}, fundamentele (FCF, ROE) sunt distorsionate de evaluarea
          rezervelor BTC sau de operațiuni miniere. Scorul standard nu se aplică - urmărește direct prețul BTC și zonele tehnice.
        </p>
      </div>
    );
  }
  const q = data.scoreQuality ?? 0;
  const v = data.scoreValue ?? 0;
  const b = data.scoreBalance ?? 0;
  const sub = (label: string, val: number, weight: string) => {
    const c = scoreColor(val);
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-[9px] text-slate-600">{weight}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
            <div className={`h-full ${c.text.replace("text", "bg")}`} style={{ width: `${val}%` }} />
          </div>
          <span className={`font-data text-xs font-bold tabular-nums ${c.text}`}>{val.toFixed(0)}</span>
        </div>
      </div>
    );
  };
  const metric = (label: string, value: string, hint?: string) => (
    <div className="flex items-baseline justify-between border-b border-white/5 py-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="font-data text-xs tabular-nums text-slate-300">
        {value}
        {hint && <span className="ml-1 text-[9px] text-slate-600">{hint}</span>}
      </span>
    </div>
  );
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
      <div className="space-y-2">
        {sub("Quality", q, "50% pondere · margini, FCF, ROE")}
        {sub("Value", v, "30% pondere · FCF yield, EV/EBIT")}
        {sub("Balance", b, "20% pondere · datorie netă")}
      </div>
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Metrici cheie</p>
        {metric("Gross margin", fmtPct(data.grossMargin), "(target ≥60%)")}
        {metric("FCF margin", fmtPct(data.fcfMargin), "(target ≥30%)")}
        {metric("ROE", fmtPct(data.roe), "(target ≥30%)")}
        {metric("FCF yield", fmtPct(data.fcfYield), "(target ≥8%)")}
        {metric("P/FCF", fmtNum(data.pFcf), "(sub 30 = ieftin)")}
        {metric("EV/EBIT", fmtNum(data.evEbit), "(sub 20 = ieftin)")}
        {metric("Datorie netă/Mcap", fmtPct(data.netDebtToMarketCap), "(0 sau negativ = bine)")}
      </div>
      {data.asOf && (
        <p className="text-[9px] text-slate-600">Date raport: {data.asOf}</p>
      )}
    </div>
  );
}

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

// Skeleton loading row
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      <td className="px-4 py-3"><div className="skeleton h-4 w-12" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-14" /></td>
      <td className="px-4 py-3"><div className="skeleton h-4 w-14" /></td>
      <td className="px-4 py-3"><div className="skeleton h-2.5 w-40" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-16 rounded-full" /></td>
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

function ZoneLadder({
  buy2,
  buy1,
  sell1,
  sell2,
  current,
  hits,
  width = "w-44",
}: {
  buy2: number;
  buy1: number;
  sell1: number;
  sell2: number;
  current: number;
  hits?: Record<string, ZoneHit>;
  width?: string;
}) {
  const lo = buy2;
  const hi = sell2;
  const range = hi - lo;
  if (range <= 0) return null;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / range) * 100));
  const buy1Pct = pct(buy1);
  const sell1Pct = pct(sell1);
  const currentPct = pct(current);
  const inRange = current >= lo && current <= hi;
  const hitB1 = hits?.["Buy 1"]?.hit;
  const hitB2 = hits?.["Buy 2"]?.hit;
  const hitS1 = hits?.["Sell 1"]?.hit;
  const hitS2 = hits?.["Sell 2"]?.hit;
  return (
    <div className={width}>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <div className="absolute top-0 h-full bg-emerald-400/25" style={{ left: 0, width: `${buy1Pct}%` }} />
        <div className="absolute top-0 h-full bg-orange-400/25" style={{ left: `${sell1Pct}%`, width: `${100 - sell1Pct}%` }} />
        {inRange && (
          <div
            className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]"
            style={{ left: `${currentPct}%` }}
          />
        )}
        {!inRange && current < lo && (
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-300">‹</span>
        )}
        {!inRange && current > hi && (
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-orange-300">›</span>
        )}
      </div>
      <div className="relative mt-1 flex h-3 text-[9px] tabular-nums">
        <span className={`absolute left-0 ${hitB2 ? "text-emerald-300" : "text-emerald-400/60"}`}>
          {hitB2 ? "✓" : ""}{formatPrice(buy2)}
        </span>
        <span className={`absolute -translate-x-1/2 ${hitB1 ? "text-emerald-300" : "text-emerald-400/60"}`} style={{ left: `${buy1Pct}%` }}>
          {hitB1 ? "✓" : ""}{formatPrice(buy1)}
        </span>
        <span className={`absolute -translate-x-1/2 ${hitS1 ? "text-orange-300" : "text-orange-400/60"}`} style={{ left: `${sell1Pct}%` }}>
          {hitS1 ? "✓" : ""}{formatPrice(sell1)}
        </span>
        <span className={`absolute right-0 ${hitS2 ? "text-orange-300" : "text-orange-400/60"}`}>
          {hitS2 ? "✓" : ""}{formatPrice(sell2)}
        </span>
      </div>
    </div>
  );
}

function LiveCountdown({ updatedAt }: { updatedAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(i);
  }, []);
  const secs = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
  const label = secs < 60 ? "acum" : secs < 3600 ? `${Math.floor(secs / 60)}m ago` : `${Math.floor(secs / 3600)}h ago`;
  return <span className="text-slate-600 tabular-nums">{label}</span>;
}

type SortKey = "ticker" | "price" | "changePct" | "pctFromATH" | "signal" | "score";
type Filter = "all" | "buy" | "sell" | "hold";

export function StocksClient() {
  const blur = useBlurMode();
  const [liveData, setLiveData] = useState<Record<string, LiveData>>({});
  const [zoneHistory, setZoneHistory] = useState<Record<string, TickerHistory>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down">>({});
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
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
    if (search && !s.ticker.toLowerCase().includes(search.toLowerCase())) return false;
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
      case "score": {
        // Sort: BTC-driven last, missing scores last, otherwise by score
        const score = (s: MergedStock) => {
          if (!s.scoreData || s.scoreData.score === null) return -1;
          return s.scoreData.score;
        };
        cmp = score(a) - score(b);
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
          {updatedAt && <LiveCountdown updatedAt={updatedAt} />}
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

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent-emerald/30"
          placeholder="Caută ticker... (ex: TSLA, NVDA)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-white" onClick={() => setSearch("")} type="button">✕</button>
        )}
      </div>

      {/* Sort buttons - mobile */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {[
          { key: "ticker" as SortKey, label: "Nume" },
          { key: "changePct" as SortKey, label: "% Azi" },
          { key: "pctFromATH" as SortKey, label: "% ATH" },
          { key: "score" as SortKey, label: "Scor" },
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
                    <th className="px-4 py-3">Zone Ladder</th>
                    <th className="px-4 py-3">Scor</th>
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
            <div className="panel overflow-x-clip p-0">
              <table className="w-full text-sm">
                <thead className="sticky top-24 z-10 md:top-28 [&>tr>th]:bg-surface-graphite">
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500 [&>th]:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("ticker")}>
                      Ticker {sortBy === "ticker" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("price")}>
                      Preț {sortBy === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("changePct")}>
                      % Azi {sortBy === "changePct" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="px-4 py-3">52W Range</th>
                    <th className="px-4 py-3">Vol</th>
                    <th className="px-4 py-3">P/E</th>
                    <th className="px-4 py-3">Zonă</th>
                    <th className="px-4 py-3">Zone Ladder</th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("pctFromATH")}>
                      % ATH {sortBy === "pctFromATH" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("score")}>
                      Scor {sortBy === "score" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="cursor-pointer px-4 py-3 hover:text-white" onClick={() => handleSort("signal")}>
                      Semnal {sortBy === "signal" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((stock) => {
                    const style = getSignalStyle(stock.signal);
                    const flash = flashMap[stock.ticker];
                    const nearest = getNearestZone(stock.price, stock);
                    const zh = zoneHistory[stock.ticker];
                    const zoneHitMap: Record<string, ZoneHit> = {};
                    if (zh?.zones) for (const z of zh.zones) zoneHitMap[z.zone] = z;

                    const scoreOpen = expandedScore === stock.ticker;
                    return (
                      <React.Fragment key={stock.ticker}>
                      <tr
                        className={`border-b border-white/5 transition hover:bg-white/[0.02] ${flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : ""}`}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={`https://finviz.com/quote.ashx?t=${stock.ticker}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-white hover:text-accent-emerald"
                          >
                            {stock.ticker}
                          </a>
                          {stock.marketCap && (
                            <span className="ml-2 text-[10px] text-slate-600">{stock.marketCap}</span>
                          )}
                          <span className={`ml-1 text-[9px] ${SECTOR_COLORS[SECTORS[stock.ticker] ?? ""] ?? "text-slate-700"}`}>
                            {SECTORS[stock.ticker] ?? ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-data font-semibold text-white tabular-nums">
                          {formatPrice(stock.price ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-data font-semibold tabular-nums ${(stock.changePct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {(stock.changePct ?? 0) >= 0 ? "+" : ""}{(stock.changePct ?? 0).toFixed(2)}%
                          </span>
                        </td>
                        {/* 52W Range */}
                        <td className="px-4 py-3">
                          {stock.w52Low && stock.w52High ? (
                            <div className="w-20">
                              <div className="relative h-1.5 rounded-full bg-white/5">
                                <div
                                  className="absolute top-0 h-full w-1.5 rounded-full bg-accent-emerald shadow-[0_0_4px_rgba(16,185,129,0.6)]"
                                  style={{ left: `${Math.max(0, Math.min(100, ((stock.price - stock.w52Low) / (stock.w52High - stock.w52Low)) * 100))}%` }}
                                />
                              </div>
                              <div className="mt-0.5 flex justify-between text-[8px] text-slate-700 tabular-nums">
                                <span>{formatPrice(stock.w52Low)}</span>
                                <span>{formatPrice(stock.w52High)}</span>
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-600">-</span>}
                        </td>
                        {/* Volume relative */}
                        <td className="px-4 py-3">
                          {(() => {
                            const vr = volumeRatio(stock.volume ?? "", stock.avgVolume ?? "");
                            return <span className={`font-data text-xs font-semibold ${vr.color}`}>{vr.label}</span>;
                          })()}
                        </td>
                        {/* P/E */}
                        <td className="px-4 py-3 font-data text-xs tabular-nums text-slate-400">
                          {stock.pe && stock.pe !== "-" ? stock.pe : <span className="text-slate-700">-</span>}
                        </td>
                        {/* Nearest zone */}
                        <td className="px-4 py-3">
                          <span className={`font-data text-xs font-semibold ${nearest.direction === "buy" ? "text-emerald-400" : "text-orange-400"}`}>
                            {nearest.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {blur ? (
                            <BlurGuard label="Zone Elite Only">
                              <div className="h-2 w-44 rounded-full bg-white/5" />
                            </BlurGuard>
                          ) : (
                            <ZoneLadder
                              buy2={stock.buy2}
                              buy1={stock.buy1}
                              sell1={stock.sell1}
                              sell2={stock.sell2}
                              current={stock.price}
                              hits={zoneHitMap}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={(stock.pctFromATH ?? 0) > -20 ? "text-amber-400" : "text-red-400"}>
                            {(stock.pctFromATH ?? 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {stock.scoreData ? (
                            <button
                              onClick={() => setExpandedScore(scoreOpen ? null : stock.ticker)}
                              type="button"
                              className="cursor-pointer transition hover:opacity-80"
                              aria-label={`Detalii scor ${stock.ticker}`}
                            >
                              <ScoreBadge data={stock.scoreData} />
                            </button>
                          ) : (
                            <ScoreBadge data={stock.scoreData} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {blur ? (
                            <BlurGuard label="Semnal Elite"><span className="text-slate-600">---</span></BlurGuard>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {stock.signal}
                            </span>
                          )}
                        </td>
                      </tr>
                      {scoreOpen && stock.scoreData && (
                        <tr className="bg-white/[0.015]">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="max-w-xl">
                              <ScoreBreakdown data={stock.scoreData} ticker={stock.ticker} />
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
              const flash = flashMap[stock.ticker];
              const nearest = getNearestZone(stock.price, stock);
              const zhMobile = zoneHistory[stock.ticker];
              const zoneHitMobile: Record<string, ZoneHit> = {};
              if (zhMobile?.zones) for (const z of zhMobile.zones) zoneHitMobile[z.zone] = z;

              const scoreOpenMobile = expandedScore === stock.ticker;
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
                    <div className="flex items-center gap-2">
                      {stock.scoreData ? (
                        <button
                          onClick={() => setExpandedScore(scoreOpenMobile ? null : stock.ticker)}
                          type="button"
                          className="cursor-pointer transition active:opacity-70"
                          aria-label={`Detalii scor ${stock.ticker}`}
                        >
                          <ScoreBadge data={stock.scoreData} />
                        </button>
                      ) : null}
                      {blur ? (
                        <BlurGuard label="Semnal Elite"><span className="text-slate-600">---</span></BlurGuard>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {stock.signal}
                        </span>
                      )}
                    </div>
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

                  <div className="mt-3">
                    {blur ? (
                      <BlurGuard label="Zone Elite Only">
                        <div className="h-2 w-full rounded-full bg-white/5" />
                      </BlurGuard>
                    ) : (
                      <ZoneLadder
                        buy2={stock.buy2}
                        buy1={stock.buy1}
                        sell1={stock.sell1}
                        sell2={stock.sell2}
                        current={stock.price}
                        hits={zoneHitMobile}
                        width="w-full"
                      />
                    )}
                  </div>

                  {scoreOpenMobile && stock.scoreData && (
                    <div className="mt-3">
                      <ScoreBreakdown data={stock.scoreData} ticker={stock.ticker} />
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
