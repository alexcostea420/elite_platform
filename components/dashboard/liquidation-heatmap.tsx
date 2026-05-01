"use client";

import { useEffect, useMemo, useState } from "react";

type Candle = { t: number; o: number; h: number; l: number; c: number };

type HeatmapResponse = {
  asset: string;
  updated_at: string;
  hours: number[];
  candles: Candle[];
  current_price: number;
  price_buckets: number[];
  bucket_size: number;
  heatmap: number[][]; // [priceIdx][hourIdx], values 0..1
  funding_pct: number | null;
  ls_ratio: number | null;
  total_oi_usd: number | null;
};

const STOPS = [
  { v: 0, c: [8, 6, 18] },
  { v: 0.1, c: [30, 14, 60] },
  { v: 0.3, c: [90, 18, 110] },
  { v: 0.5, c: [170, 36, 130] },
  { v: 0.7, c: [230, 90, 90] },
  { v: 0.85, c: [250, 170, 70] },
  { v: 1, c: [255, 240, 180] },
];

function colorFor(v: number): string {
  const x = Math.max(0, Math.min(1, v));
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i].v) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const t = (x - a.v) / (b.v - a.v || 1);
      const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t);
      const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t);
      return `rgb(${r},${g},${bl})`;
    }
  }
  return "rgb(255,230,180)";
}

function formatPrice(p: number): string {
  if (!Number.isFinite(p)) return "-";
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`;
  return `$${p.toFixed(0)}`;
}

function formatTimeLabel(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

function formatUsd(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export function LiquidationHeatmap() {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/liquidation-map/heatmap", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: HeatmapResponse) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message || "Eroare");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-card flex h-[480px] items-center justify-center">
        <p className="text-sm text-slate-500">Se încarcă heatmap-ul…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card flex h-[480px] items-center justify-center">
        <p className="text-sm text-red-400">{error ?? "Date indisponibile"}</p>
      </div>
    );
  }

  return <HeatmapChart data={data} />;
}

function HeatmapChart({ data }: { data: HeatmapResponse }) {
  const PAD_LEFT = 56;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;

  const numCols = data.candles.length;
  const numRows = data.heatmap.length;
  const VIEW_W = 1280;
  const VIEW_H = 700;
  const SIDE_W = 90; // right-side concentration panel width (in viewport units)
  const cellW = (VIEW_W - PAD_LEFT - PAD_RIGHT - SIDE_W) / numCols;
  const cellH = (VIEW_H - PAD_TOP - PAD_BOTTOM) / numRows;

  // Price → SVG y (price_buckets[0] is lowest price; row 0 should be at bottom of canvas)
  const priceToY = (price: number) => {
    const minP = data.price_buckets[0];
    const maxP = data.price_buckets[data.price_buckets.length - 1] + data.bucket_size;
    if (maxP === minP) return PAD_TOP + (VIEW_H - PAD_TOP - PAD_BOTTOM) / 2;
    const norm = (price - minP) / (maxP - minP);
    return PAD_TOP + (1 - norm) * (VIEW_H - PAD_TOP - PAD_BOTTOM);
  };

  // Build candle path
  const candlePath = useMemo(() => {
    if (data.candles.length === 0) return "";
    return data.candles
      .map((c, i) => {
        const x = PAD_LEFT + i * cellW + cellW / 2;
        const y = priceToY(c.c);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.candles, cellW]);

  // Right-side concentration: sum density per price row (across all hours)
  const sideTotals = useMemo(() => {
    const totals: number[] = data.heatmap.map((row) =>
      row.reduce((s, v) => s + v, 0),
    );
    const max = totals.reduce((m, v) => (v > m ? v : m), 0);
    return { totals, max };
  }, [data.heatmap]);

  // Y-axis ticks every ~5 buckets
  const yTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(data.price_buckets.length / 8));
    const ticks: number[] = [];
    for (let i = 0; i < data.price_buckets.length; i += step) {
      ticks.push(data.price_buckets[i]);
    }
    return ticks;
  }, [data.price_buckets]);

  // X-axis ticks every ~24h
  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(data.candles.length / 7));
    const out: { x: number; label: string }[] = [];
    for (let i = 0; i < data.candles.length; i += step) {
      out.push({
        x: PAD_LEFT + i * cellW + cellW / 2,
        label: formatTimeLabel(data.candles[i].t),
      });
    }
    return out;
  }, [data.candles, cellW]);

  const currentY = priceToY(data.current_price);

  return (
    <section className="glass-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Liquidation Pressure · BTC · 7 zile
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Unde se lichidează pozițiile cu leverage
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Pentru fiecare oră, distribuim Open Interest pe trepte tipice de leverage (5x, 10x, 25x, 50x, 100x)
            și marcăm prețurile la care s-ar declanșa lichidările. Bara din dreapta = concentrarea
            cumulată per nivel de preț. Zonele galben-portocalii = magneți pentru cascade.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="OI total" value={formatUsd(data.total_oi_usd)} />
          <Stat
            label="Funding"
            value={data.funding_pct != null ? `${data.funding_pct.toFixed(4)}%` : "-"}
            tone={data.funding_pct != null ? (data.funding_pct > 0 ? "long" : "short") : "neutral"}
          />
          <Stat
            label="L/S"
            value={data.ls_ratio != null ? data.ls_ratio.toFixed(2) : "-"}
            tone={data.ls_ratio != null ? (data.ls_ratio > 1 ? "long" : "short") : "neutral"}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#05050a]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ minWidth: "720px", height: "auto", maxHeight: "720px" }}
        >
          {/* Gaussian blur filter so cell grid renders as smooth gradient, not bricks */}
          <defs>
            <filter id="heatBlur" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          {/* Background fill */}
          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={VIEW_W - PAD_LEFT - PAD_RIGHT - SIDE_W}
            height={VIEW_H - PAD_TOP - PAD_BOTTOM}
            fill="#070611"
          />

          {/* Heatmap cells — bottom-up (row 0 = lowest price = bottom of canvas) */}
          <g filter="url(#heatBlur)">
            {data.heatmap.map((row, rowIdx) => {
              const y = PAD_TOP + (numRows - 1 - rowIdx) * cellH;
              return row.map((value, colIdx) => {
                if (value < 0.015) return null;
                const x = PAD_LEFT + colIdx * cellW;
                return (
                  <rect
                    key={`${rowIdx}-${colIdx}`}
                    x={x.toFixed(2)}
                    y={y.toFixed(2)}
                    width={(cellW + 1).toFixed(2)}
                    height={(cellH + 1).toFixed(2)}
                    fill={colorFor(value)}
                    opacity={0.5 + value * 0.5}
                  />
                );
              });
            })}
          </g>

          {/* Right-side concentration panel: total density per price row */}
          {sideTotals.max > 0 &&
            sideTotals.totals.map((total, rowIdx) => {
              const norm = total / sideTotals.max;
              if (norm < 0.02) return null;
              const y = PAD_TOP + (numRows - 1 - rowIdx) * cellH;
              const barW = (SIDE_W - 16) * norm;
              return (
                <rect
                  key={`side-${rowIdx}`}
                  x={VIEW_W - PAD_RIGHT - SIDE_W + 8}
                  y={y.toFixed(2)}
                  width={barW.toFixed(2)}
                  height={(cellH + 0.6).toFixed(2)}
                  fill={colorFor(Math.pow(norm, 0.6))}
                  opacity={0.85}
                  shapeRendering="crispEdges"
                />
              );
            })}
          {/* Side panel separator */}
          <line
            x1={VIEW_W - PAD_RIGHT - SIDE_W + 4}
            x2={VIEW_W - PAD_RIGHT - SIDE_W + 4}
            y1={PAD_TOP}
            y2={VIEW_H - PAD_BOTTOM}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
          <text
            x={VIEW_W - PAD_RIGHT - SIDE_W + 8}
            y={PAD_TOP - 2}
            fill="#64748b"
            fontSize={9}
            fontFamily="var(--font-data, monospace)"
          >
            CONCENTRARE
          </text>

          {/* Y-axis price labels */}
          {yTicks.map((p) => {
            const y = priceToY(p);
            return (
              <g key={`y-${p}`}>
                <line
                  x1={PAD_LEFT}
                  x2={VIEW_W - PAD_RIGHT - SIDE_W}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.035)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize={11}
                  textAnchor="end"
                  fontFamily="var(--font-data, monospace)"
                >
                  {formatPrice(p)}
                </text>
              </g>
            );
          })}

          {/* X-axis time labels */}
          {xTicks.map((tk, i) => (
            <text
              key={`x-${i}`}
              x={tk.x}
              y={VIEW_H - 8}
              fill="#64748b"
              fontSize={10}
              textAnchor="middle"
              fontFamily="var(--font-data, monospace)"
            >
              {tk.label}
            </text>
          ))}

          {/* Candle close path — drop shadow first for legibility over hot cells */}
          <path
            d={candlePath}
            fill="none"
            stroke="#000000"
            strokeWidth={3.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.55}
          />
          <path
            d={candlePath}
            fill="none"
            stroke="#5eead4"
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.95}
          />

          {/* Current price marker */}
          <line
            x1={PAD_LEFT}
            x2={VIEW_W - PAD_RIGHT - SIDE_W}
            y1={currentY}
            y2={currentY}
            stroke="#10b981"
            strokeWidth={1.2}
            strokeDasharray="6 4"
            opacity={0.85}
          />
          <rect
            x={VIEW_W - PAD_RIGHT - SIDE_W - 56}
            y={currentY - 11}
            width={52}
            height={16}
            rx={3}
            fill="#10b981"
            opacity={0.95}
          />
          <text
            x={VIEW_W - PAD_RIGHT - SIDE_W - 30}
            y={currentY + 1}
            fill="#04111a"
            fontSize={11}
            fontWeight="700"
            textAnchor="middle"
            fontFamily="var(--font-data, monospace)"
          >
            {formatPrice(data.current_price)}
          </text>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>Densitate</span>
          <Legend />
        </div>
        <p className="text-[10px] text-slate-600">
          Surse: OKX (klines + OI USD + funding + L/S). Levereje asumate: 5/10/20/25/50/75/100x.
          Maintenance margin ≈ 0.5%. Actualizat la fiecare încărcare a paginii.
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "long" | "short" | "neutral";
}) {
  const color =
    tone === "long" ? "text-emerald-400" : tone === "short" ? "text-red-400" : "text-slate-200";
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-0.5 font-data text-sm font-bold ${color} sm:text-base`}>{value}</p>
    </div>
  );
}

function Legend() {
  const stops = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="flex h-3 w-32 overflow-hidden rounded">
      {stops.map((s, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ background: colorFor(s) }}
        />
      ))}
    </div>
  );
}
