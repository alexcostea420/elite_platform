"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryRow = {
  date: string;
  total_score: number;
  level: string;
  btc_price: number | null;
};

type RangeOption = { label: string; days: number };

const RANGES: RangeOption[] = [
  { label: "90Z", days: 90 },
  { label: "1A", days: 365 },
  { label: "2A", days: 730 },
  { label: "4A", days: 1460 },
  { label: "Tot", days: 4000 },
];

function formatDate(iso: string, withYear = false) {
  const d = new Date(iso);
  if (withYear) {
    return d.toLocaleDateString("ro-RO", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

function formatPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

export function RiskScoreHistoryChart() {
  const [range, setRange] = useState<RangeOption>(RANGES[4]);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/risk-score/history?days=${range.days}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { rows: HistoryRow[] }) => {
        if (cancelled) return;
        setRows(data.rows ?? []);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message || "Eroare la încărcare");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        date: r.date,
        score: r.total_score,
        price: r.btc_price,
      })),
    [rows],
  );

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const scores = rows.map((r) => r.total_score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = rows[rows.length - 1];
    return {
      min,
      max,
      avg: Math.round(avg),
      latest: latest.total_score,
      latestDate: latest.date,
    };
  }, [rows]);

  return (
    <section className="glass-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Istoric · Risk Score V2
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Cum a evoluat scorul în timp
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Pragurile colorate marchează zonele de decizie: ≥65 CUMPĂRA · ≤35 VINDE.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setRange(opt)}
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition sm:text-xs ${
                range.days === opt.days
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Stat label="Acum" value={stats.latest} accent />
          <Stat label="Min" value={stats.min} />
          <Stat label="Mediu" value={stats.avg} />
          <Stat label="Max" value={stats.max} />
        </div>
      ) : null}

      <div className="h-[280px] w-full sm:h-[340px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Se încarcă istoricul…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Încă nu avem suficient istoric.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={(v) => formatDate(v as string, range.days > 365)}
                minTickGap={40}
                axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="score"
                domain={[0, 100]}
                ticks={[0, 25, 35, 50, 65, 75, 100]}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="price"
                orientation="right"
                scale="log"
                domain={["dataMin", "dataMax"]}
                allowDataOverflow
                tick={{ fill: "#475569", fontSize: 10 }}
                tickFormatter={formatPrice}
                ticks={[5000, 10000, 25000, 50000, 100000]}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine yAxisId="score" y={65} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine yAxisId="score" y={35} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Tooltip
                contentStyle={{
                  background: "rgba(9, 9, 15, 0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value, name) => {
                  const num = typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(num)) return ["-", String(name)];
                  if (name === "score") return [`${Math.round(num)}/100`, "Scor"];
                  if (name === "price") return [`$${Math.round(num).toLocaleString("en-US")}`, "BTC"];
                  return [String(value), String(name)];
                }}
              />
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#scoreFill)"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981", stroke: "#0a0a0f", strokeWidth: 2 }}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#f59e0b"
                strokeWidth={1.2}
                strokeOpacity={0.55}
                strokeDasharray="2 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-3 text-[10px] text-slate-600">
        Linia verde = scorul agregat (0–100). Linia portocalie punctată = preț BTC pe axa dreaptă.
        Backfill-ul (până în {chartData[0]?.date ?? "-"}) e calculat fără derivative Binance,
        scorul e ~85% fidel față de cel live.
      </p>
    </section>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  const color = accent
    ? value >= 65
      ? "text-emerald-400"
      : value <= 35
        ? "text-red-400"
        : "text-amber-400"
    : "text-slate-200";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 font-data text-lg font-bold ${color} sm:text-xl`}>{value}</p>
    </div>
  );
}
