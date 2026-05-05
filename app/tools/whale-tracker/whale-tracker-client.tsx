"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useBlurMode } from "@/components/ui/blur-guard";

// Discord daily digest: scripts/whale_tracker/daily_digest.py (cron 9:05 EEST)

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

type FlowRow = {
  asset: string;
  open_long_usd: number;
  open_short_usd: number;
  net_open_usd: number;
  total_open_usd: number;
};

type ThesisData = {
  available: boolean;
  risk_score?: {
    score: number | null;
    decision: "BUY" | "SELL" | "HOLD";
    decision_text: string;
    conviction: string | null;
  };
  matches?: Array<{
    asset: string;
    long_pct: number;
    short_pct: number;
    dominant_side: string;
    total_whales: number;
    alignment: "ALIGN" | "DIVERGE" | "MIXT";
  }>;
};

// ─── Helpers ───────────────────────────────────────────────────
function formatUsd(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-[10px] text-slate-600 hover:text-accent-emerald transition"
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      title="Copiază adresa"
      type="button"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
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

// ─── KPI Strip ─────────────────────────────────────────────────
function KpiStrip({
  wallets,
  positions,
  consensus,
}: {
  wallets: Wallet[];
  positions: Position[];
  consensus: Consensus[];
}) {
  const netLong = consensus.reduce((sum, c) => sum + (c.net_long_notional_usd ?? 0), 0);
  const totalLongs = consensus.reduce((sum, c) => sum + (c.long_count ?? 0), 0);
  const totalShorts = consensus.reduce((sum, c) => sum + (c.short_count ?? 0), 0);
  const biasPct = totalLongs + totalShorts > 0 ? Math.round((totalLongs / (totalLongs + totalShorts)) * 100) : 50;
  const biasLabel = biasPct >= 60 ? "BULLISH" : biasPct <= 40 ? "BEARISH" : "MIXT";
  const biasColor = biasPct >= 60 ? "text-emerald-400" : biasPct <= 40 ? "text-red-400" : "text-amber-400";

  const topWhale = [...wallets].sort((a, b) => b.pnl_90d - a.pnl_90d)[0];
  const biggestPos = [...positions].sort((a, b) => b.notional_usd - a.notional_usd)[0];
  const newWallets = wallets.filter((w) => w.previous_rank === null).length;
  const climbers = wallets.filter((w) => w.previous_rank !== null && w.previous_rank > w.rank).length;

  const tiles = [
    {
      label: "Bias whales",
      value: biasLabel,
      sub: `${biasPct}% long · ${100 - biasPct}% short`,
      color: biasColor,
    },
    {
      label: "Net exposure",
      value: `${netLong >= 0 ? "+" : ""}${formatUsd(netLong)}`,
      sub: netLong >= 0 ? "long bias" : "short bias",
      color: netLong >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      label: "Top whale 90d",
      value: topWhale ? formatUsd(topWhale.pnl_90d) : "-",
      sub: topWhale ? (topWhale.display_name ?? shortAddr(topWhale.address)) : "",
      color: "text-white",
    },
    {
      label: "Cea mai mare poziție",
      value: biggestPos ? formatUsd(biggestPos.notional_usd) : "-",
      sub: biggestPos ? `${biggestPos.asset} · ${biggestPos.direction}` : "",
      color: biggestPos?.direction === "LONG" ? "text-emerald-400" : biggestPos?.direction === "SHORT" ? "text-red-400" : "text-white",
    },
    {
      label: "Mișcări săptămânale",
      value: `${newWallets + climbers}`,
      sub: `${newWallets} noi · ${climbers} urcă`,
      color: "text-accent-emerald",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t.label}</p>
          <p className={`mt-1 font-data text-lg font-bold tabular-nums ${t.color}`}>{t.value}</p>
          {t.sub && <p className="mt-0.5 truncate text-[10px] text-slate-600">{t.sub}</p>}
        </div>
      ))}
    </div>
  );
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

// ─── 7-day Flow Heatmap ───────────────────────────────────────
function FlowHeatmap({ data }: { data: FlowRow[] }) {
  if (!data.length) return null;
  const maxTotal = Math.max(...data.map((r) => r.total_open_usd));

  return (
    <div className="glass-card p-5 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            7 zile · flux deschideri
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">Heatmap pe asset</h3>
        </div>
        <span className="text-[10px] text-slate-600">notional OPEN long minus short</span>
      </div>
      <div className="space-y-1.5">
        {data.map((r) => {
          const longPct = r.total_open_usd > 0 ? (r.open_long_usd / r.total_open_usd) * 100 : 50;
          const widthPct = (r.total_open_usd / maxTotal) * 100;
          const netColor = r.net_open_usd >= 0 ? "text-emerald-400" : "text-red-400";
          return (
            <div key={r.asset} className="flex items-center gap-3 text-xs">
              <span className="w-12 shrink-0 font-bold text-white">{r.asset}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.02]">
                <div
                  className="h-full"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, rgba(16,185,129,0.5) 0%, rgba(16,185,129,0.5) ${longPct}%, rgba(248,113,113,0.5) ${longPct}%, rgba(248,113,113,0.5) 100%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-data tabular-nums">
                  <span className="text-emerald-200">{formatUsd(r.open_long_usd)}</span>
                  <span className="text-red-200">{formatUsd(r.open_short_usd)}</span>
                </div>
              </div>
              <span className={`w-20 shrink-0 text-right font-data font-semibold tabular-nums ${netColor}`}>
                {r.net_open_usd >= 0 ? "+" : ""}{formatUsd(r.net_open_usd)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Thesis Match Panel ───────────────────────────────────────
function ThesisMatch({ data }: { data: ThesisData }) {
  if (!data.available || !data.risk_score) return null;
  const { decision, score, decision_text } = data.risk_score;
  const decisionColor =
    decision === "BUY" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : decision === "SELL" ? "text-red-400 border-red-400/30 bg-red-400/10"
    : "text-amber-400 border-amber-400/30 bg-amber-400/10";

  return (
    <div className="glass-card p-5 md:p-7">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Confluență · risk score vs whales
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">Validare Teză</h3>
        </div>
        <div className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${decisionColor}`}>
          {decision}
          {score !== null ? ` · ${score}` : ""}
        </div>
      </div>
      {decision_text && (
        <p className="mb-3 text-xs text-slate-400">{decision_text}</p>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        {(data.matches ?? []).map((m) => {
          const pillColor =
            m.alignment === "ALIGN" ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
            : m.alignment === "DIVERGE" ? "bg-red-400/10 text-red-400 border-red-400/30"
            : "bg-amber-400/10 text-amber-400 border-amber-400/30";
          const label =
            m.alignment === "ALIGN" ? "Confluență"
            : m.alignment === "DIVERGE" ? "Divergență"
            : "Mixt";
          return (
            <div key={m.asset} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{m.asset}</span>
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${pillColor}`}>{label}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[10px] tabular-nums">
                <span className="text-emerald-400">{m.long_pct}%L</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-red-400/20">
                  <div className="absolute top-0 left-0 h-full bg-emerald-400" style={{ width: `${m.long_pct}%` }} />
                </div>
                <span className="text-red-400">{m.short_pct}%S</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-600">{m.total_whales} whales pe {m.asset}</p>
            </div>
          );
        })}
        {!(data.matches ?? []).length && (
          <p className="col-span-full text-center text-xs text-slate-500 py-4">
            Aștept date consensus pentru BTC/ETH/SOL.
          </p>
        )}
      </div>
    </div>
  );
}

// Aggregate partial fills from the same wallet+asset+direction within 1 hour
function aggregateFills(fills: Fill[]): (Fill & { count: number })[] {
  const groups: Map<string, Fill & { count: number }> = new Map();
  for (const f of fills) {
    const hourBucket = f.filled_at.slice(0, 13); // group by hour
    const key = `${f.address}_${f.asset}_${f.direction}_${f.action_type}_${hourBucket}`;
    const existing = groups.get(key);
    if (existing) {
      existing.notional_usd += f.notional_usd;
      existing.closed_pnl += f.closed_pnl;
      existing.count += 1;
      // Keep the latest timestamp
      if (f.filled_at > existing.filled_at) existing.filled_at = f.filled_at;
    } else {
      groups.set(key, { ...f, count: 1 });
    }
  }
  return Array.from(groups.values()).sort((a, b) => new Date(b.filled_at).getTime() - new Date(a.filled_at).getTime());
}

// ─── Activity Feed ─────────────────────────────────────────────
function ActivityFeed({ fills, wallets, onSelectWallet }: { fills: Fill[]; wallets: Wallet[]; onSelectWallet?: (addr: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const rankMap = Object.fromEntries(wallets.map((w) => [w.address, w.rank]));
  const aggregated = aggregateFills(fills);
  const visible = showAll ? aggregated : aggregated.slice(0, 10);

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
        {visible.map((f, i) => {
          const rank = rankMap[f.address];
          const isOpen = f.action_type === "OPEN";
          const isLong = f.direction === "LONG";
          return (
            <div key={`${f.tid}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-xs cursor-pointer hover:bg-white/[0.02] transition" onClick={() => onSelectWallet?.(f.address)}>
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
              {f.count > 1 && <span className="text-[10px] text-slate-600">({f.count} fills)</span>}
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
      {aggregated.length > 10 && (
        <button
          className="w-full border-t border-white/5 px-4 py-2 text-xs text-slate-500 hover:text-white transition"
          onClick={() => setShowAll(!showAll)}
          type="button"
        >
          {showAll ? "Arată mai puține" : `Arată toate (${aggregated.length})`}
        </button>
      )}
    </div>
  );
}

// ─── Star Button ───────────────────────────────────────────────
function StarButton({ address, isFav, onToggle }: { address: string; isFav: boolean; onToggle: (addr: string, fav: boolean) => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(address, !isFav); }}
      className={`text-xs transition ${isFav ? "text-amber-400" : "text-slate-700 hover:text-amber-400"}`}
      title={isFav ? "Șterge din favorite" : "Adaugă la favorite"}
      aria-label={isFav ? "Șterge din favorite" : "Adaugă la favorite"}
      type="button"
    >
      {isFav ? "★" : "☆"}
    </button>
  );
}

// ─── Whale Table ───────────────────────────────────────────────
function WhaleTable({
  wallets,
  positions,
  fills,
  onSelectWallet,
  selectedWallet,
  favorites,
  onToggleFavorite,
}: {
  wallets: Wallet[];
  positions: Position[];
  fills: Fill[];
  onSelectWallet: (addr: string | null) => void;
  selectedWallet: string | null;
  favorites: Set<string>;
  onToggleFavorite: (addr: string, fav: boolean) => void;
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
                          <StarButton address={w.address} isFav={favorites.has(w.address)} onToggle={onToggleFavorite} />
                          <span className="font-data text-white">{shortAddr(w.address)}</span>
                          <CopyButton text={w.address} />
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
                        {w.last_activity ? timeAgo(w.last_activity) : <span className="text-slate-700">Inactiv</span>}
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
                    <StarButton address={w.address} isFav={favorites.has(w.address)} onToggle={onToggleFavorite} />
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
    setPnlData([]);
  }, [wallet.address]);

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

// ─── PnL Chart (Recharts) ──────────────────────────────────────
function PnlChart({ data }: { data: PnlDay[] }) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
    pnl: d.cumulative_pnl,
    daily: d.daily_pnl,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: "#5A7168", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#5A7168", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatUsd(v)}
          width={60}
        />
        <Tooltip
          contentStyle={{
            background: "#0D1F18",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#fff", fontWeight: 600 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => formatUsd(Number(value))}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#pnlGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Component ────────────────────────────────────────────
export function WhaleTrackerClient() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activityFills, setActivityFills] = useState<Fill[]>([]);
  const [allFills, setAllFills] = useState<Fill[]>([]);
  const [consensus, setConsensus] = useState<Consensus[]>([]);
  const [flow7d, setFlow7d] = useState<FlowRow[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [thesis, setThesis] = useState<ThesisData>({ available: false });
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "pnl" | "value" | "activity">("rank");
  const [filterDir, setFilterDir] = useState<"all" | "long" | "short">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/whale-tracker")
      .then((r) => r.json())
      .then((d) => {
        setWallets(d.wallets ?? []);
        setPositions(d.positions ?? []);
        setActivityFills(d.activity_fills ?? []);
        setAllFills(d.all_fills ?? []);
        setConsensus(d.consensus ?? []);
        setFlow7d(d.flow_7d ?? []);
        setFavorites(new Set<string>(d.favorites ?? []));
        setUpdatedAt(d.updated_at ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/whale-tracker/thesis")
      .then((r) => r.json())
      .then((d) => setThesis(d))
      .catch(() => setThesis({ available: false }));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleFavorite = useCallback(async (address: string, fav: boolean) => {
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (fav) next.add(address); else next.delete(address);
      return next;
    });
    try {
      if (fav) {
        await fetch("/api/whale-tracker/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
      } else {
        await fetch(`/api/whale-tracker/favorites?address=${encodeURIComponent(address)}`, { method: "DELETE" });
      }
    } catch {
      // Revert on failure
      setFavorites((prev) => {
        const next = new Set(prev);
        if (fav) next.delete(address); else next.add(address);
        return next;
      });
    }
  }, []);

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

      {/* KPI strip */}
      <KpiStrip wallets={wallets} positions={positions} consensus={consensus} />

      {/* Thesis match (Risk Score V2 vs whale consensus) */}
      <ThesisMatch data={thesis} />

      {/* Consensus strip */}
      <div>
        <h2 className="section-label mb-3">Consens per asset</h2>
        <ConsensusPanel data={consensus} />
      </div>

      {/* 7-day flow heatmap */}
      <FlowHeatmap data={flow7d} />

      {/* Activity feed */}
      <ActivityFeed fills={activityFills} wallets={wallets} onSelectWallet={setSelectedWallet} />

      {/* Filter/Sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="section-label">Top 20 Portofele</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {/* Favorites toggle */}
          <button
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${showFavoritesOnly ? "bg-amber-400/20 text-amber-400" : "bg-white/5 text-slate-500 hover:text-amber-400"}`}
            onClick={() => setShowFavoritesOnly((v) => !v)}
            disabled={favorites.size === 0}
            title={favorites.size === 0 ? "Adaugă favorite cu ★" : "Doar favorite"}
            type="button"
          >
            ★ Favorite ({favorites.size})
          </button>
          {/* Sort */}
          {([
            { key: "rank" as const, label: "Rank" },
            { key: "pnl" as const, label: "PnL" },
            { key: "value" as const, label: "Valoare" },
            { key: "activity" as const, label: "Activitate" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${sortBy === key ? "bg-accent-emerald/20 text-accent-emerald" : "bg-white/5 text-slate-500"}`}
              onClick={() => setSortBy(key)}
              type="button"
            >
              {label}
            </button>
          ))}
          {/* Direction filter */}
          <select
            className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400 border border-white/10 outline-none"
            value={filterDir}
            onChange={(e) => setFilterDir(e.target.value as "all" | "long" | "short")}
          >
            <option value="all">Toate direcțiile</option>
            <option value="long">Doar Long</option>
            <option value="short">Doar Short</option>
          </select>
        </div>
      </div>

      {/* Whale table */}
      <div>
        <WhaleTable
          wallets={(() => {
            let sorted = [...wallets];
            if (showFavoritesOnly && favorites.size > 0) sorted = sorted.filter((w) => favorites.has(w.address));
            switch (sortBy) {
              case "pnl": sorted.sort((a, b) => b.pnl_90d - a.pnl_90d); break;
              case "value": sorted.sort((a, b) => b.account_value - a.account_value); break;
              case "activity": sorted.sort((a, b) => {
                const ta = a.last_activity ? new Date(a.last_activity).getTime() : 0;
                const tb = b.last_activity ? new Date(b.last_activity).getTime() : 0;
                return tb - ta;
              }); break;
              default: sorted.sort((a, b) => a.rank - b.rank);
            }
            return sorted;
          })()}
          positions={filterDir === "all" ? positions : positions.filter((p) => p.direction === filterDir.toUpperCase())}
          fills={allFills}
          onSelectWallet={setSelectedWallet}
          selectedWallet={selectedWallet}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-slate-600">
        Datele nu sunt sfat de investiții. Fiecare trader își asumă propriile decizii.
      </p>
    </div>
  );
}
