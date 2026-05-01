"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Latest = {
  exchange: string;
  volume_usd: number | null;
  oi_usd: number | null;
  funding_pct: number | null;
  price_close: number | null;
  ts: string | null;
};

type ApiResp = {
  asset: string;
  updated_at: string | null;
  hours: string[];
  price_series: (number | null)[];
  per_exchange: { exchange: string; volume_series: (number | null)[] }[];
  latest: Latest[];
};

const EX_LABEL: Record<string, string> = {
  binance: "Binance",
  bybit: "Bybit",
  okx: "OKX",
  bitget: "Bitget",
  hyperliquid: "Hyperliquid",
};

const EX_COLOR: Record<string, string> = {
  binance: "#f0b90b",
  bybit: "#f7a600",
  okx: "#10b981",
  bitget: "#06b6d4",
  hyperliquid: "#a78bfa",
};

function fmtUsd(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(digits)}k`;
  return `$${Math.round(n)}`;
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(4)}%`;
}

function fmtHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export function ExchangeFlowsPanel() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      setError(null);
      fetch("/api/exchange-flows", { cache: "no-store" })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d: ApiResp) => {
          if (!cancelled) setData(d);
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const aggregated = useMemo(() => {
    if (!data || data.hours.length === 0) return [];
    return data.hours.map((h, i) => {
      const row: Record<string, number | string | null> = {
        hour: h,
        price: data.price_series[i] ?? null,
      };
      let total = 0;
      for (const ex of data.per_exchange) {
        const v = ex.volume_series[i] ?? 0;
        row[ex.exchange] = v;
        total += v;
      }
      row.total = total;
      return row;
    });
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return { total: 0, share: [] as { exchange: string; pct: number; volume: number }[] };
    let grand = 0;
    const sums = new Map<string, number>();
    for (const ex of data.per_exchange) {
      const s = ex.volume_series.reduce<number>((a, v) => a + (v ?? 0), 0);
      sums.set(ex.exchange, s);
      grand += s;
    }
    const share = Array.from(sums.entries())
      .map(([exchange, volume]) => ({
        exchange,
        volume,
        pct: grand > 0 ? (volume / grand) * 100 : 0,
      }))
      .sort((a, b) => b.volume - a.volume);
    return { total: grand, share };
  }, [data]);

  const totalOi = useMemo(() => {
    if (!data) return { total: 0, items: [] as Latest[] };
    const items = [...data.latest].sort((a, b) => (b.oi_usd ?? 0) - (a.oi_usd ?? 0));
    const total = items.reduce<number>((a, x) => a + (x.oi_usd ?? 0), 0);
    return { total, items };
  }, [data]);

  if (loading) {
    return (
      <section className="glass-card p-5 md:p-7">
        <div className="h-[260px] animate-pulse rounded-xl bg-white/[0.02]" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-card p-5 md:p-7">
        <p className="text-sm text-red-400">Eroare: {error}</p>
      </section>
    );
  }

  if (!data || data.hours.length === 0) {
    return (
      <section className="glass-card p-5 md:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
          Multi-Exchange · BTC Perp
        </p>
        <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
          Agregare flux între burse
        </h3>
        <p className="mt-3 text-sm text-slate-400">
          Datele vor apărea după prima rulare a cron-ului (la fiecare 15 minute).
        </p>
      </section>
    );
  }

  return (
    <section className="glass-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Multi-Exchange · BTC Perp · 48h
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Agregare flux între burse
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Ce vezi pe un singur exchange = doar o felie. Aici ai volumul, OI și funding-ul cumulate
            din 5 burse, exact ce nu-ți arată TradingView.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 font-data text-slate-300">
            Total volum 48h: <span className="text-white">{fmtUsd(totals.total, 2)}</span>
          </span>
          <span className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 font-data text-slate-300">
            Total OI: <span className="text-white">{fmtUsd(totalOi.total, 2)}</span>
          </span>
        </div>
      </div>

      <div className="h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={aggregated} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={fmtHour}
              minTickGap={50}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="vol"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickFormatter={(v) => fmtUsd(v, 0)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: "#475569", fontSize: 10 }}
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(9, 9, 15, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              labelFormatter={(value) => fmtHour(value as string)}
              formatter={(value, name) => {
                const num = typeof value === "number" ? value : Number(value);
                if (!Number.isFinite(num)) return ["-", String(name)];
                if (name === "price") return [`$${Math.round(num).toLocaleString("en-US")}`, "BTC"];
                if (name === "total") return [fmtUsd(num, 1), "Total"];
                return [fmtUsd(num, 1), EX_LABEL[String(name)] ?? String(name)];
              }}
            />
            {data.per_exchange.map((ex) => (
              <Area
                key={ex.exchange}
                yAxisId="vol"
                type="monotone"
                dataKey={ex.exchange}
                stackId="vol"
                stroke={EX_COLOR[ex.exchange] ?? "#888"}
                fill={EX_COLOR[ex.exchange] ?? "#888"}
                fillOpacity={0.55}
                strokeOpacity={0.9}
                strokeWidth={1}
                isAnimationActive={false}
              />
            ))}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#f1f5f9"
              strokeWidth={1.4}
              strokeDasharray="3 4"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Cota volum 48h
          </p>
          <div className="space-y-2">
            {totals.share.map((s) => (
              <div key={s.exchange} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: EX_COLOR[s.exchange] }}
                />
                <span className="w-24 text-slate-300">{EX_LABEL[s.exchange]}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-white/[0.03]">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${s.pct}%`,
                      background: EX_COLOR[s.exchange],
                      opacity: 0.85,
                    }}
                  />
                </div>
                <span className="w-12 text-right font-data tabular-nums text-slate-300">
                  {s.pct.toFixed(1)}%
                </span>
                <span className="w-16 text-right font-data tabular-nums text-slate-500">
                  {fmtUsd(s.volume, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Snapshot · Open Interest + Funding
          </p>
          <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.02] text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Exchange</th>
                  <th className="px-3 py-2 text-right font-medium">OI</th>
                  <th className="px-3 py-2 text-right font-medium">Funding</th>
                </tr>
              </thead>
              <tbody>
                {totalOi.items.map((it) => {
                  const isPositive = (it.funding_pct ?? 0) >= 0;
                  return (
                    <tr key={it.exchange} className="border-t border-white/5">
                      <td className="px-3 py-2 text-slate-300">
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-sm align-middle"
                          style={{ background: EX_COLOR[it.exchange] }}
                        />
                        {EX_LABEL[it.exchange]}
                      </td>
                      <td className="px-3 py-2 text-right font-data tabular-nums text-slate-200">
                        {fmtUsd(it.oi_usd, 2)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-data tabular-nums ${
                          isPositive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {fmtPct(it.funding_pct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-600">
            Funding pozitiv = longii plătesc shorturile (piață lacomă).
            Spread mare între burse = oportunitate de arbitraj sau o singură venue agresivă.
          </p>
        </div>
      </div>

      {data.updated_at ? (
        <p className="mt-4 text-[10px] text-slate-600">
          Actualizat: {new Date(data.updated_at).toLocaleString("ro-RO")} · Cron 15 min
        </p>
      ) : null}
    </section>
  );
}
