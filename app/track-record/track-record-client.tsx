"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Stats = {
  starting_equity: number;
  current_equity: number;
  total_pnl: number;
  total_pnl_pct: number;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  best_trade: number;
  worst_trade: number;
  avg_win: number;
  avg_loss: number;
  assets_traded: number;
};

type EquityPoint = { date: string; equity: number; pnl: number };
type Trade = {
  date: string;
  asset: string;
  direction: string;
  entry: number;
  exit: number;
  pnlPct: number;
  pnlUsd: number;
  type: string;
};

function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function LivePerformanceSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [curve, setCurve] = useState<EquityPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch("/api/track-record")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setCurve(d.equity_curve ?? []);
        setTrades(d.recent_trades ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 py-10">
        <div className="skeleton h-8 w-64 mx-auto" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
        <div className="skeleton h-48 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  const chartData = curve.map((p) => ({
    date: new Date(p.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
    equity: p.equity,
  }));

  return (
    <div className="space-y-8 py-10">
      {/* Header */}
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent-emerald">Live Performance</p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">V5 Pro ML Bot</h2>
        <p className="mt-2 text-sm text-slate-500">Date reale din contul master. Actualizare automată la fiecare 5 minute.</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="live-dot" />
          <span className="text-xs text-slate-600">Live</span>
        </div>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card px-4 py-5 text-center">
          <p className={`font-data text-3xl font-bold ${stats.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {stats.total_pnl >= 0 ? "+" : ""}{stats.total_pnl_pct}%
          </p>
          <p className="mt-1 text-xs text-slate-500">PnL Total</p>
        </div>
        <div className="glass-card px-4 py-5 text-center">
          <p className="font-data text-3xl font-bold text-white">{stats.total_trades}</p>
          <p className="mt-1 text-xs text-slate-500">Tranzacții</p>
        </div>
        <div className="glass-card px-4 py-5 text-center">
          <p className="font-data text-3xl font-bold text-white">{stats.win_rate}%</p>
          <p className="mt-1 text-xs text-slate-500">Win Rate</p>
        </div>
        <div className="glass-card px-4 py-5 text-center">
          <p className="font-data text-3xl font-bold text-white">{stats.profit_factor}</p>
          <p className="mt-1 text-xs text-slate-500">Profit Factor</p>
        </div>
      </div>

      {/* Equity Curve */}
      {chartData.length > 2 && (
        <div className="glass-card p-4 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-400">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#5A7168", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#5A7168", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} width={50} />
              <Tooltip
                contentStyle={{ background: "#0D1F18", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Equity"]}
              />
              <Area type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2} fill="url(#eqGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {[
          { label: "Max Drawdown", value: `${stats.max_drawdown}%`, color: "text-red-400" },
          { label: "Avg Win", value: formatUsd(stats.avg_win), color: "text-emerald-400" },
          { label: "Avg Loss", value: formatUsd(stats.avg_loss), color: "text-red-400" },
          { label: "Best Trade", value: formatUsd(stats.best_trade), color: "text-emerald-400" },
          { label: "Worst Trade", value: formatUsd(stats.worst_trade), color: "text-red-400" },
          { label: "Active tranzacționate", value: `${stats.assets_traded}`, color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white/[0.03] px-3 py-3 text-center">
            <p className={`font-data text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-400">Ultimele Tranzacții</h3>
          </div>
          {/* Desktop */}
          <div className="hidden sm:block">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-left uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Activ</th>
                  <th className="px-4 py-2">Direcție</th>
                  <th className="px-4 py-2">Entry</th>
                  <th className="px-4 py-2">Exit</th>
                  <th className="px-4 py-2">PnL</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-4 py-2 text-slate-500">{t.date}</td>
                    <td className="px-4 py-2 font-semibold text-white">{t.asset}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.direction === "LONG" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-data tabular-nums text-slate-400">${t.entry.toFixed(2)}</td>
                    <td className="px-4 py-2 font-data tabular-nums text-slate-400">${t.exit.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`font-data font-semibold tabular-nums ${t.pnlUsd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {t.pnlUsd >= 0 ? "+" : ""}{formatUsd(t.pnlUsd)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="divide-y divide-white/5 sm:hidden">
            {trades.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className="font-semibold text-white text-sm">{t.asset}</span>
                  <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.direction === "LONG" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {t.direction}
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">{t.date}</p>
                </div>
                <span className={`font-data font-semibold text-sm tabular-nums ${t.pnlUsd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.pnlUsd >= 0 ? "+" : ""}{formatUsd(t.pnlUsd)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center">
        <Link className="accent-button px-8 py-4 text-lg font-bold" href="/upgrade#copytrade">
          Copytrade - €45/lună pentru membri Elite →
        </Link>
        <p className="mt-3 text-xs text-slate-600">Disponibil în curând. Intră în Elite pentru acces prioritar.</p>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-slate-700">
        Performanțele trecute nu garantează rezultate viitoare. Tradingul implică riscuri semnificative.
        Datele prezentate sunt din contul master anonimizat și nu constituie sfaturi de investiții.
      </p>
    </div>
  );
}
