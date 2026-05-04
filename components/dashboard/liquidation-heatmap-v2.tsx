"use client";

import { useEffect, useMemo, useState } from "react";

type Candle = { t: number; o: number; h: number; l: number; c: number };

type WhaleDot = {
  address: string;
  direction: "LONG" | "SHORT";
  leverage: number;
  entry_price: number;
  liq_price: number;
  notional_usd: number;
  distance_pct: number;
};

type Magnet = {
  from: number;
  to: number;
  center: number;
  intensity: number;
  direction: "LONG" | "SHORT";
  notional_usd: number;
  distance_pct: number;
};

type Pressure = {
  longs_within_5pct_norm: number;
  longs_within_10pct_norm: number;
  shorts_within_5pct_norm: number;
  shorts_within_10pct_norm: number;
};

type LiqV2Response = {
  asset: string;
  updated_at: string;
  candles: Candle[];
  current_price: number;
  price_buckets: number[];
  bucket_size: number;
  heatmap: number[][];
  funding_pct: number | null;
  ls_ratio: number | null;
  top_ls_ratio: number | null;
  total_oi_usd: number | null;
  avg_oi_usd: number | null;
  pressure: Pressure;
  magnets: Magnet[];
  whales: WhaleDot[];
};

const ASSETS = ["BTC", "ETH", "SOL", "XRP", "DOGE"] as const;
type Asset = (typeof ASSETS)[number];

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

function formatPrice(p: number, asset: Asset): string {
  if (!Number.isFinite(p)) return "-";
  if (asset === "DOGE" || asset === "XRP") {
    return `$${p.toFixed(p >= 1 ? 3 : 4)}`;
  }
  if (p >= 10000) return `$${(p / 1000).toFixed(1)}k`;
  if (p >= 1000) return `$${p.toFixed(0)}`;
  if (p >= 100) return `$${p.toFixed(1)}`;
  return `$${p.toFixed(2)}`;
}

function formatTimeLabel(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "-";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function shortAddr(a: string): string {
  if (!a || a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function LiquidationHeatmapV2() {
  const [asset, setAsset] = useState<Asset>("BTC");
  const [data, setData] = useState<LiqV2Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/liquidation-map/v2?asset=${asset}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: LiqV2Response) => {
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
  }, [asset]);

  return (
    <section className="glass-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            Liquidation Pressure · {asset} · 7 zile
          </p>
          <h3 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Unde se lichidează pozițiile cu leverage
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Date reale orare (OKX OI + L/S + funding) distribuite pe trepte de leverage,
            ponderate de funding rate. Punctele galbene = whales Hyperliquid (top 20).
            Zonele luminoase = magneți pentru cascade de lichidări.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ASSETS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAsset(a)}
                disabled={loading && a !== asset}
                className={
                  a === asset
                    ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-data text-xs font-bold text-emerald-300 transition"
                    : "rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1 font-data text-xs font-bold text-slate-400 transition hover:bg-white/[0.04]"
                }
              >
                {a}
              </button>
            ))}
          </div>
          {data && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="OI" value={formatUsd(data.total_oi_usd)} />
              <Stat
                label="Funding"
                value={data.funding_pct != null ? `${data.funding_pct.toFixed(4)}%` : "-"}
                tone={
                  data.funding_pct != null
                    ? data.funding_pct > 0
                      ? "long"
                      : "short"
                    : "neutral"
                }
              />
              <Stat
                label="Top L/S"
                value={data.top_ls_ratio != null ? data.top_ls_ratio.toFixed(2) : "-"}
                tone={
                  data.top_ls_ratio != null
                    ? data.top_ls_ratio > 1
                      ? "long"
                      : "short"
                    : "neutral"
                }
              />
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex h-[480px] items-center justify-center rounded-xl border border-white/5 bg-[#05050a]">
          <p className="text-sm text-slate-500">Se încarcă heatmap-ul {asset}…</p>
        </div>
      )}

      {!loading && (error || !data) && (
        <div className="flex h-[480px] items-center justify-center rounded-xl border border-white/5 bg-[#05050a]">
          <p className="text-sm text-red-400">{error ?? "Date indisponibile"}</p>
        </div>
      )}

      {!loading && data && (
        <>
          <HeatmapChart data={data} asset={asset} />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <PressurePanel pressure={data.pressure} />
            <MagnetPanel magnets={data.magnets} asset={asset} />
          </div>

          {data.whales.length > 0 && <WhalePanel whales={data.whales} asset={asset} />}
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>Densitate</span>
          <Legend />
        </div>
        <p className="text-[10px] text-slate-600">
          Surse: OKX hourly (OI + L/S + funding) · Binance top trader L/S · Hyperliquid whales.
          Levereje 5/10/20/25/50/100x ponderate de funding. MM ≈ 0.5–1%.
        </p>
      </div>
    </section>
  );
}

function HeatmapChart({ data, asset }: { data: LiqV2Response; asset: Asset }) {
  const PAD_LEFT = 64;
  const PAD_RIGHT = 12;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;
  const SIDE_W = 90;

  const numCols = data.candles.length;
  const numRows = data.heatmap.length;
  const VIEW_W = 1280;
  const VIEW_H = 700;
  const cellW = (VIEW_W - PAD_LEFT - PAD_RIGHT - SIDE_W) / Math.max(1, numCols);
  const cellH = (VIEW_H - PAD_TOP - PAD_BOTTOM) / Math.max(1, numRows);

  const minP = data.price_buckets[0];
  const maxP = data.price_buckets[data.price_buckets.length - 1] + data.bucket_size;

  const priceToY = (price: number) => {
    if (maxP === minP) return PAD_TOP + (VIEW_H - PAD_TOP - PAD_BOTTOM) / 2;
    const norm = (price - minP) / (maxP - minP);
    const clamped = Math.max(0, Math.min(1, norm));
    return PAD_TOP + (1 - clamped) * (VIEW_H - PAD_TOP - PAD_BOTTOM);
  };

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
  }, [data.candles, cellW, minP, maxP]);

  const sideTotals = useMemo(() => {
    const totals = data.heatmap.map((row) => row.reduce((s, v) => s + v, 0));
    const max = totals.reduce((m, v) => (v > m ? v : m), 0);
    return { totals, max };
  }, [data.heatmap]);

  const yTicks = useMemo(() => {
    const step = Math.max(1, Math.floor(data.price_buckets.length / 8));
    const ticks: number[] = [];
    for (let i = 0; i < data.price_buckets.length; i += step) {
      ticks.push(data.price_buckets[i]);
    }
    return ticks;
  }, [data.price_buckets]);

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

  // Last column x for whale dots — anchor at right edge of chart, just left of side panel
  const dotsX = VIEW_W - PAD_RIGHT - SIDE_W - 14;

  // Cap displayed whales to those within plotting range
  const visibleWhales = useMemo(
    () => data.whales.filter((w) => w.liq_price >= minP && w.liq_price <= maxP),
    [data.whales, minP, maxP],
  );

  // Whale notional → dot radius
  const maxNotional = visibleWhales.reduce((m, w) => Math.max(m, w.notional_usd), 1);
  const whaleRadius = (n: number) => {
    const norm = Math.sqrt(n / maxNotional);
    return 4 + norm * 9;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#05050a]">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ minWidth: "720px", height: "auto", maxHeight: "720px" }}
      >
        <defs>
          <filter id="heatBlurV2" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
          <radialGradient id="whaleDotLong">
            <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="whaleDotShort">
            <stop offset="0%" stopColor="#f87171" stopOpacity="1" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect
          x={PAD_LEFT}
          y={PAD_TOP}
          width={VIEW_W - PAD_LEFT - PAD_RIGHT - SIDE_W}
          height={VIEW_H - PAD_TOP - PAD_BOTTOM}
          fill="#070611"
        />

        <g filter="url(#heatBlurV2)">
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
                {formatPrice(p, asset)}
              </text>
            </g>
          );
        })}

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

        {visibleWhales.map((w, idx) => {
          const y = priceToY(w.liq_price);
          const r = whaleRadius(w.notional_usd);
          const fill = w.direction === "LONG" ? "url(#whaleDotLong)" : "url(#whaleDotShort)";
          return (
            <g key={`whale-${idx}`}>
              <circle cx={dotsX} cy={y} r={r * 1.6} fill={fill} opacity={0.35} />
              <circle
                cx={dotsX}
                cy={y}
                r={r}
                fill={w.direction === "LONG" ? "#10b981" : "#ef4444"}
                stroke="#000"
                strokeWidth={1}
                opacity={0.95}
              />
            </g>
          );
        })}

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
          x={VIEW_W - PAD_RIGHT - SIDE_W - 64}
          y={currentY - 11}
          width={60}
          height={16}
          rx={3}
          fill="#10b981"
          opacity={0.95}
        />
        <text
          x={VIEW_W - PAD_RIGHT - SIDE_W - 34}
          y={currentY + 1}
          fill="#04111a"
          fontSize={11}
          fontWeight="700"
          textAnchor="middle"
          fontFamily="var(--font-data, monospace)"
        >
          {formatPrice(data.current_price, asset)}
        </text>
      </svg>
    </div>
  );
}

function PressurePanel({ pressure }: { pressure: Pressure }) {
  const long5 = pressure.longs_within_5pct_norm;
  const short5 = pressure.shorts_within_5pct_norm;
  const long10 = pressure.longs_within_10pct_norm;
  const short10 = pressure.shorts_within_10pct_norm;
  const total5 = long5 + short5 || 1;
  const total10 = long10 + short10 || 1;
  const longPct5 = (long5 / total5) * 100;
  const longPct10 = (long10 / total10) * 100;

  const verdict =
    longPct5 > 65
      ? { text: "Long-uri vulnerabile la cascadă", tone: "short" as const }
      : longPct5 < 35
        ? { text: "Short-uri vulnerabile la squeeze", tone: "long" as const }
        : { text: "Echilibrat, fără clusterizare clară", tone: "neutral" as const };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Presiune lichidare
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          verdict.tone === "long"
            ? "text-emerald-400"
            : verdict.tone === "short"
              ? "text-red-400"
              : "text-slate-200"
        }`}
      >
        {verdict.text}
      </p>

      <PressureBar label="±5% spot" longPct={longPct5} />
      <PressureBar label="±10% spot" longPct={longPct10} />
    </div>
  );
}

function PressureBar({ label, longPct }: { label: string; longPct: number }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-baseline justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span className="font-data">
          <span className="text-emerald-400">{longPct.toFixed(0)}% longs</span>
          <span className="mx-1 text-slate-600">·</span>
          <span className="text-red-400">{(100 - longPct).toFixed(0)}% shorts</span>
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded">
        <div className="bg-emerald-500/70" style={{ width: `${longPct}%` }} />
        <div className="bg-red-500/70" style={{ width: `${100 - longPct}%` }} />
      </div>
    </div>
  );
}

function MagnetPanel({ magnets, asset }: { magnets: Magnet[]; asset: Asset }) {
  if (magnets.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
          Zone magnet
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Nu există clustere semnificative deasupra pragului.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Zone magnet · top {magnets.length}
      </p>
      <div className="mt-2 space-y-1.5">
        {magnets.map((m, idx) => {
          const isLong = m.direction === "LONG";
          const sign = m.distance_pct >= 0 ? "+" : "";
          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-data text-[10px] font-bold uppercase tracking-wider ${
                    isLong ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {isLong ? "Longs ↓" : "Shorts ↑"}
                </span>
                <span className="font-data text-xs text-slate-200">
                  {formatPrice(m.from, asset)} – {formatPrice(m.to, asset)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-data text-[11px] text-slate-400">
                  {sign}
                  {m.distance_pct.toFixed(1)}%
                </span>
                <span className="font-data text-xs font-bold text-white">
                  ~{formatUsd(m.notional_usd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        Notional aproximat din OI mediu × densitate. Real liquidations pot fi mai mari (acoperă doar exposure
        OKX cu trepte tipice).
      </p>
    </div>
  );
}

function WhalePanel({ whales, asset }: { whales: WhaleDot[]; asset: Asset }) {
  const sorted = [...whales].sort((a, b) => Math.abs(a.distance_pct) - Math.abs(b.distance_pct));
  const top = sorted.slice(0, 6);
  return (
    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.015] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Whales Hyperliquid · cei mai expuși ({whales.length} total)
      </p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {top.map((w, idx) => {
          const sign = w.distance_pct >= 0 ? "+" : "";
          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    w.direction === "LONG" ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <span className="font-data text-[11px] text-slate-300">{shortAddr(w.address)}</span>
                <span className="font-data text-[10px] text-slate-500">{w.leverage.toFixed(0)}x</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-data text-[11px] text-slate-200">
                  {formatPrice(w.liq_price, asset)}
                </span>
                <span className="font-data text-[11px] text-slate-400">
                  {sign}
                  {w.distance_pct.toFixed(1)}%
                </span>
                <span className="font-data text-[11px] font-bold text-white">
                  {formatUsd(w.notional_usd)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
        <div key={i} className="flex-1" style={{ background: colorFor(s) }} />
      ))}
    </div>
  );
}
