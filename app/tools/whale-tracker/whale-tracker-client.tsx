"use client";

import React, { useCallback, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────
type Wallet = {
  address: string;
  rank: number;
  previous_rank: number | null;
  display_name: string | null;
  account_value: number;
  pnl_90d: number;
  volume_90d: number;
  win_rate: number | null;
  last_activity: string | null;
  updated_at: string;
};

type Position = {
  address: string;
  asset: string;
  direction: string;
  size: number;
  entry_price: number;
  leverage: number;
  unrealized_pnl: number;
  margin_used: number;
  notional_usd: number;
  snapshot_at: string;
};

type Fill = {
  address: string;
  asset: string;
  direction: string;
  price: number;
  size: number;
  notional_usd: number;
  closed_pnl: number;
  action_type: string;
  filled_at: string;
  tid: string;
};

type Consensus = {
  asset: string;
  long_count: number;
  short_count: number;
  net_long_notional_usd: number;
  avg_long_leverage: number | null;
  avg_short_leverage: number | null;
  dominant_side: string;
};

type PnlDay = { date: string; cumulative_pnl: number; daily_pnl: number };

// ─── Helpers ───────────────────────────────────────────────────
function formatUsd(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

function rankChange(rank: number, prev: number | null): React.ReactNode {
  if (prev === null) return <span className="text-[10px] text-emerald-400">NOU</span>;
  const diff = prev - rank;
  if (diff > 0) return <span className="text-[10px] text-emerald-400">▲{diff}</span>;
  if (diff < 0) return <span className="text-[10px] text-red-400">▼{Math.abs(diff)}</span>;
  return null;
}

// ─── Skeleton ──────────────────────────────────────────────────
function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Consensus Panel ───────────────────────────────────────────
function ConsensusPanel({ data }: { data: Consensus[] }) {
  if (!data.length) return null;
  const top = data.slice(0, 10);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {top.map((c) => {
        const total = c.long_count + c.short_count;
        const longPct = total > 0 ? (c.long_count / total) * 100 : 50;
        return (
          <div key={c.asset} className="glass-card flex-shrink-0 px-4 py-3 min-w-[140px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{c.asset}</span>
              <span className={`text-[10px] font-bold ${
                c.dominant_side === "LONG" ? "text-emerald-400" : c.dominant_side === "SHORT" ? "text-red-400" : "text-slate-400"
              }`}>
                {c.dominant_side}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs tabular-nums">
              <span className="text-emerald-400">{c.long_count}L</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-red-400/20">
                <div className="absolute top-0 left-0 h-full rounded-full bg-emerald-400" style={{ width: `${longPct}%` }} />
              </div>
              <span className="text-red-400">{c.short_count}S</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-600 tabular-nums">
              Net: {formatUsd(c.net_long_notional_usd)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Feed ─────────────────────────────────────────────
function ActivityFeed({ fills, wallets }: { fills: Fill[]; wallets: Wallet[] }) {
  const [showAll, setShowAll] = useState(false);
  const rankMap = Object.fromEntries(wallets.map((w) => [w.address, w.rank]));
  const visible = showAll ? fills : fills.slice(0, 10);

  if (!fills.length) {
    return (
      <div className="glass-card px-6 py-8 text-center text-sm text-slate-500">
        Se actualizează datele. Revino în câteva minute.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-slate-400">Activitate Recentă</span>
        </div>
        <span className="text-[10px] text-slate-600">Tranzacții &gt; $25K</span>
      </div>
      <div className="divide-y divide-white/5">
        {visible.map((f) => {
          const rank = rankMap[f.address];
          const isOpen = f.action_type === "OPEN";
          const isLong = f.direction === "LONG";
          return (
            <div key={f.tid} className="flex items-center gap-3 px-4 py-2.5 text-xs">
              <span className="font-data text-slate-600 w-8">#{rank}</span>
              <span className="text-slate-500">{shortAddr(f.address)}</span>
              <span className={`rounded-md px-1.5 py-0.5 font-bold ${
                isOpen
                  ? isLong ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                  : "bg-slate-400/10 text-slate-400"
              }`}>
                {f.action_type} {f.direction}
              </span>
              <span className="font-bold text-white">{f.asset}</span>
              <span className="font-data text-slate-400 tabular-nums">{formatUsd(f.notional_usd)}</span>
              {f.closed_pnl !== 0 && (
                <span className={`font-data tabular-nums ${f.closed_pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {f.closed_pnl > 0 ? "+" : ""}{formatUsd(f.closed_pnl)}
                </span>
              )}
              <span className="ml-auto text-slate-600">{timeAgo(f.filled_at)}</span>
            </div>
          );
        })}
      </div>
      {fills.length > 10 && (
        <button
          className="w-full border-t border-white/5 px-4 py-2 text-xs text-slate-500 hover:text-white transition"
          onClick={() => setShowAll(!showAll)}
          type="button"
        >
          {showAll ? "Arată mai puține" : `Arată toate (${fills.length})`}
        </button>
      )}
    </div>
  );
}

// ─── Whale Table ───────────────────────────────────────────────
function WhaleTable({
  wallets,
  positions,
  fills,
  onSelectWallet,
  selectedWallet,
}: {
  wallets: Wallet[];
  positions: Position[];
  fills: Fill[];
  onSelectWallet: (addr: string | null) => void;
  selectedWallet: string | null;
}) {
  const positionsByAddr = positions.reduce((acc, p) => {
    (acc[p.address] ??= []).push(p);
    return acc;
  }, {} as Record<string, Position[]>);

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Portofel</th>
                <th className="px-4 py-3">Valoare</th>
                <th className="px-4 py-3">PnL Luna</th>
                <th className="px-4 py-3">Poziții</th>
                <th className="px-4 py-3">Ultima Activitate</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => {
                const wPositions = positionsByAddr[w.address] ?? [];
                const isSelected = selectedWallet === w.address;
                return (
                  <React.Fragment key={w.address}>
                    <tr
                      className={`border-b border-white/5 cursor-pointer transition hover:bg-white/[0.02] ${isSelected ? "bg-white/[0.03]" : ""}`}
                      onClick={() => onSelectWallet(isSelected ? null : w.address)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-data font-bold text-white">{w.rank}</span>
                          {rankChange(w.rank, w.previous_rank)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-data text-white">{shortAddr(w.address)}</span>
                          <a
                            href={`https://app.hyperliquid.xyz/explorer/address/${w.address}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-600 hover:text-accent-emerald"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ↗
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-data font-semibold text-white tabular-nums">
                        {formatUsd(w.account_value)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-data font-semibold tabular-nums ${w.pnl_90d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {w.pnl_90d >= 0 ? "+" : ""}{formatUsd(w.pnl_90d)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-data text-slate-400">{wPositions.length}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {w.last_activity ? timeAgo(w.last_activity) : "-"}
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="border-b border-white/5 bg-white/[0.015]">
                        <td colSpan={6} className="px-4 py-4">
                          <WalletDetail
                            wallet={w}
                            positions={wPositions}
                            fills={fills.filter((f) => f.address === w.address).slice(0, 20)}
                          />
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

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {wallets.map((w) => {
          const wPositions = positionsByAddr[w.address] ?? [];
          const isSelected = selectedWallet === w.address;
          return (
            <div key={w.address}>
              <button
                className={`glass-card w-full px-4 py-4 text-left transition ${isSelected ? "border-accent-emerald/30" : ""}`}
                onClick={() => onSelectWallet(isSelected ? null : w.address)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-data text-lg font-bold text-white">#{w.rank}</span>
                    {rankChange(w.rank, w.previous_rank)}
                    <span className="font-data text-sm text-slate-400">{shortAddr(w.address)}</span>
                  </div>
                  <span className="text-xs text-slate-600">{wPositions.length} poz</span>
                </div>
                <div className="mt-2 flex gap-4 text-xs">
                  <span className="text-slate-500">
                    AV: <span className="font-data font-semibold text-white">{formatUsd(w.account_value)}</span>
                  </span>
                  <span className="text-slate-500">
                    PnL:{" "}
                    <span className={`font-data font-semibold ${w.pnl_90d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {w.pnl_90d >= 0 ? "+" : ""}{formatUsd(w.pnl_90d)}
                    </span>
                  </span>
                </div>
              </button>
              {isSelected && (
                <div className="glass-card mt-1 px-4 py-4 border-accent-emerald/20">
                  <WalletDetail
                    wallet={w}
                    positions={wPositions}
                    fills={fills.filter((f) => f.address === w.address).slice(0, 20)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wallet Detail (expanded row) ──────────────────────────────
function WalletDetail({ wallet, positions, fills }: { wallet: Wallet; positions: Position[]; fills: Fill[] }) {
  const [tab, setTab] = useState<"positions" | "fills" | "pnl">("positions");
  const [pnlData, setPnlData] = useState<PnlDay[]>([]);

  useEffect(() => {
    if (tab === "pnl" && !pnlData.length) {
      fetch(`/api/whale-tracker/pnl?address=${wallet.address}`)
        .then((r) => r.json())
        .then((d) => setPnlData(d.pnl ?? []))
        .catch(() => {});
    }
  }, [tab, wallet.address, pnlData.length]);

  return (
    <div>
      <div className="flex gap-1 rounded-lg bg-white/[0.03] p-1 mb-3">
        {([
          { key: "positions" as const, label: "Poziții Deschise" },
          { key: "fills" as const, label: "Ultimele Tranzacții" },
          { key: "pnl" as const, label: "PnL" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === key ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"
            }`}
            onClick={() => setTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "positions" && (
        <div className="space-y-2">
          {positions.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Nicio poziție deschisă</p>
          ) : (
            positions.map((p, i) => {
              const isLong = p.direction === "LONG";
              const isNew = (Date.now() - new Date(p.snapshot_at).getTime()) < 24 * 3600 * 1000;
              return (
                <div key={i} className="flex flex-wrap items-center gap-2 text-xs rounded-lg bg-white/[0.02] px-3 py-2">
                  <span className={`rounded-md px-1.5 py-0.5 font-bold ${isLong ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {p.direction}
                  </span>
                  <span className="font-bold text-white">{p.asset}</span>
                  {isNew && <span className="rounded-md bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">NOU</span>}
                  <span className="font-data text-slate-400 tabular-nums">{formatUsd(p.notional_usd)}</span>
                  <span className="text-slate-600">@{p.entry_price.toFixed(2)}</span>
                  <span className="text-slate-600">{p.leverage}x</span>
                  <span className={`ml-auto font-data font-semibold tabular-nums ${p.unrealized_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {p.unrealized_pnl >= 0 ? "+" : ""}{formatUsd(p.unrealized_pnl)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "fills" && (
        <div className="space-y-1">
          {fills.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">Nicio tranzacție recentă</p>
          ) : (
            fills.map((f) => (
              <div key={f.tid} className="flex flex-wrap items-center gap-2 text-xs px-2 py-1.5">
                <span className={`rounded-md px-1.5 py-0.5 font-bold ${
                  f.action_type === "OPEN"
                    ? f.direction === "LONG" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                    : "bg-slate-400/10 text-slate-400"
                }`}>
                  {f.action_type}
                </span>
                <span className="font-bold text-white">{f.asset}</span>
                <span className="text-slate-500">{f.direction}</span>
                <span className="font-data text-slate-400 tabular-nums">{formatUsd(f.notional_usd)}</span>
                {f.closed_pnl !== 0 && (
                  <span className={`font-data tabular-nums ${f.closed_pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    PnL: {f.closed_pnl > 0 ? "+" : ""}{formatUsd(f.closed_pnl)}
                  </span>
                )}
                <span className="ml-auto text-slate-600">{timeAgo(f.filled_at)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "pnl" && (
        <div>
          {pnlData.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Se încarcă datele PnL...</p>
          ) : (
            <PnlChart data={pnlData} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── PnL Chart (SVG) ───────────────────────────────────────────
function PnlChart({ data }: { data: PnlDay[] }) {
  const w = 600;
  const h = 140;
  const pad = { top: 10, right: 10, bottom: 20, left: 50 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const values = data.map((d) => d.cumulative_pnl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * cw;
    const y = pad.top + ch - ((d.cumulative_pnl - min) / range) * ch;
    return `${x},${y}`;
  }).join(" ");

  const polygonPoints = `${pad.left},${pad.top + ch} ${points} ${pad.left + cw},${pad.top + ch}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 180 }}>
      <defs>
        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = pad.top + ch * (1 - pct);
        const val = min + range * pct;
        return (
          <g key={pct}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fill="#5A7168" fontSize="9" fontFamily="monospace">
              {formatUsd(val)}
            </text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill="url(#pnlGrad)" />
      <polyline points={points} fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      {/* Date labels */}
      {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d, idx) => {
        const i = data.indexOf(d);
        const x = pad.left + (i / (data.length - 1)) * cw;
        return (
          <text key={idx} x={x} y={h - 4} textAnchor="middle" fill="#5A7168" fontSize="8">
            {new Date(d.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────
export function WhaleTrackerClient() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [consensus, setConsensus] = useState<Consensus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");

  const fetchData = useCallback(() => {
    fetch("/api/whale-tracker")
      .then((r) => r.json())
      .then((d) => {
        setWallets(d.wallets ?? []);
        setPositions(d.positions ?? []);
        setFills(d.fills ?? []);
        setConsensus(d.consensus ?? []);
        setUpdatedAt(d.updated_at ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-96" />
        <SkeletonCards count={5} />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Whale Tracker Hyperliquid</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Urmărim <span className="font-semibold text-white">top 20 cele mai profitabile portofele</span> de pe Hyperliquid din ultimele <span className="font-semibold text-white">90 de zile</span>.
          Vezi ce cumpără și ce vând în timp real.
          Dacă mișcările lor se <span className="font-semibold text-white">aliniază cu viziunea ta</span>, ai o confluență extra.
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          {updatedAt && <span>Poziții actualizate: {timeAgo(updatedAt)}</span>}
          <span>Ranking: săptămânal</span>
        </div>
      </div>

      {/* Consensus strip */}
      <div>
        <h2 className="section-label mb-3">Consens per asset</h2>
        <ConsensusPanel data={consensus} />
      </div>

      {/* Activity feed */}
      <ActivityFeed fills={fills} wallets={wallets} />

      {/* Whale table */}
      <div>
        <h2 className="section-label mb-3">Top 20 Portofele</h2>
        <WhaleTable
          wallets={wallets}
          positions={positions}
          fills={fills}
          onSelectWallet={setSelectedWallet}
          selectedWallet={selectedWallet}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-600">
        Datele nu sunt sfat de investiții. Fiecare trader își asumă propriile decizii.
      </p>
    </div>
  );
}
