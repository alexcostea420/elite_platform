"use client";

import { useMemo, useState } from "react";

export type LiqLevel = {
  address: string;
  direction: "LONG" | "SHORT";
  size: number;
  entry_price: number;
  leverage: number;
  notional_usd: number;
  liq_price: number;
  distance_pct: number;
};

export type AssetLiqData = {
  asset: string;
  current_price: number;
  total_long_notional: number;
  total_short_notional: number;
  levels: LiqLevel[];
};

function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}z`;
}

function bucketLevels(levels: LiqLevel[]) {
  const close: LiqLevel[] = [];
  const mid: LiqLevel[] = [];
  const far: LiqLevel[] = [];
  for (const l of levels) {
    const abs = Math.abs(l.distance_pct);
    if (abs <= 5) close.push(l);
    else if (abs <= 15) mid.push(l);
    else far.push(l);
  }
  return { close, mid, far };
}

export function LiquidationMapClient({
  assets,
  updatedAt,
}: {
  assets: AssetLiqData[];
  updatedAt: string;
}) {
  const [filter, setFilter] = useState<"all" | "longs" | "shorts">("all");

  const totalLong = assets.reduce((s, a) => s + a.total_long_notional, 0);
  const totalShort = assets.reduce((s, a) => s + a.total_short_notional, 0);

  if (assets.length === 0) {
    return (
      <div className="glass-card rounded-2xl border border-white/10 p-8 text-center">
        <p className="text-sm text-slate-400">
          Nu sunt poziții deschise momentan în portofelele tracked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Active urmărite"
          value={String(assets.length)}
          hint={`${assets.reduce((s, a) => s + a.levels.length, 0)} poziții totale`}
        />
        <SummaryCard
          label="Notional Long"
          value={formatUsd(totalLong)}
          hint="Sumă expunere LONG"
          tone="long"
        />
        <SummaryCard
          label="Notional Short"
          value={formatUsd(totalShort)}
          hint="Sumă expunere SHORT"
          tone="short"
        />
      </div>

      {/* Filter + updated */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "Toate" },
              { id: "longs", label: "Doar Longs" },
              { id: "shorts", label: "Doar Shorts" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === f.id
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Actualizat <span className="font-data text-slate-400">{timeAgo(updatedAt)}</span> în urmă
        </p>
      </div>

      {/* Per-asset cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {assets.map((a) => (
          <AssetCard key={a.asset} data={a} filter={filter} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "long" | "short";
}) {
  const color =
    tone === "long" ? "text-emerald-400" : tone === "short" ? "text-rose-400" : "text-white";
  return (
    <div className="glass-card rounded-2xl border border-white/10 p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-data text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function AssetCard({ data, filter }: { data: AssetLiqData; filter: "all" | "longs" | "shorts" }) {
  const levels = useMemo(() => {
    if (filter === "longs") return data.levels.filter((l) => l.direction === "LONG");
    if (filter === "shorts") return data.levels.filter((l) => l.direction === "SHORT");
    return data.levels;
  }, [data.levels, filter]);

  const buckets = bucketLevels(levels);
  const totalSide = data.total_long_notional + data.total_short_notional;
  const longPct = totalSide > 0 ? (data.total_long_notional / totalSide) * 100 : 0;

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-white">{data.asset}</p>
          <p className="font-data text-xs text-slate-400 tabular-nums">
            ${formatPrice(data.current_price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Poziții</p>
          <p className="font-data text-sm font-semibold text-white tabular-nums">
            {levels.length}
          </p>
        </div>
      </div>

      {/* Long/Short ratio bar */}
      {totalSide > 0 ? (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider">
            <span className="text-emerald-400">L {formatUsd(data.total_long_notional)}</span>
            <span className="text-rose-400">S {formatUsd(data.total_short_notional)}</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className="bg-emerald-500/60"
              style={{ width: `${longPct}%` }}
            />
            <div className="bg-rose-500/60" style={{ width: `${100 - longPct}%` }} />
          </div>
        </div>
      ) : null}

      {/* Liq levels */}
      {levels.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          Nu sunt poziții pe acest filtru.
        </p>
      ) : (
        <div className="space-y-3">
          {buckets.close.length > 0 ? (
            <Bucket title="≤ 5% de preț (presiune)" levels={buckets.close} tone="hot" />
          ) : null}
          {buckets.mid.length > 0 ? (
            <Bucket title="5-15% de preț" levels={buckets.mid} tone="warm" />
          ) : null}
          {buckets.far.length > 0 ? (
            <Bucket title="> 15% de preț" levels={buckets.far} tone="cold" />
          ) : null}
        </div>
      )}
    </div>
  );
}

function Bucket({
  title,
  levels,
  tone,
}: {
  title: string;
  levels: LiqLevel[];
  tone: "hot" | "warm" | "cold";
}) {
  const headerColor =
    tone === "hot"
      ? "text-amber-300"
      : tone === "warm"
      ? "text-slate-300"
      : "text-slate-500";
  return (
    <div>
      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${headerColor}`}>
        {title} · {levels.length}
      </p>
      <div className="space-y-1.5">
        {levels.slice(0, 8).map((l, i) => (
          <LevelRow key={`${l.address}-${i}`} level={l} />
        ))}
        {levels.length > 8 ? (
          <p className="pt-1 text-[10px] text-slate-600">
            + {levels.length - 8} încă
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LevelRow({ level }: { level: LiqLevel }) {
  const isLong = level.direction === "LONG";
  const sideColor = isLong ? "text-emerald-400" : "text-rose-400";
  const sideBg = isLong ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20";
  const distAbs = Math.abs(level.distance_pct);
  const distColor =
    distAbs <= 5 ? "text-amber-300" : distAbs <= 15 ? "text-slate-300" : "text-slate-500";

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border ${sideBg} px-2.5 py-1.5`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`font-data text-[10px] font-bold ${sideColor}`}>
          {isLong ? "L" : "S"}
        </span>
        <span className="font-data text-[10px] text-slate-500 tabular-nums">
          {shortAddr(level.address)}
        </span>
        <span className="text-[10px] text-slate-600 tabular-nums">
          {level.leverage.toFixed(0)}x
        </span>
      </div>
      <div className="flex items-center gap-2 text-right">
        <span className="font-data text-xs text-white tabular-nums">
          ${formatPrice(level.liq_price)}
        </span>
        <span className={`font-data text-[10px] tabular-nums ${distColor}`}>
          {level.distance_pct >= 0 ? "+" : ""}
          {level.distance_pct.toFixed(1)}%
        </span>
        <span className="font-data text-[10px] text-slate-500 tabular-nums">
          {formatUsd(level.notional_usd)}
        </span>
      </div>
    </div>
  );
}
