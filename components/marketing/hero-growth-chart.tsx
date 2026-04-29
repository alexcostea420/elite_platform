"use client";

import { useEffect, useRef, useState } from "react";

const POINTS: { m: string; v: number }[] = [
  { m: "Aug '25", v: 100 },
  { m: "Sep", v: 104 },
  { m: "Oct", v: 96 },
  { m: "Nov", v: 99 },
  { m: "Dec", v: 108 },
  { m: "Ian '26", v: 113 },
  { m: "Feb", v: 110 },
  { m: "Mar", v: 121 },
  { m: "Apr", v: 128 },
  { m: "Mai", v: 135 },
  { m: "Iun", v: 132 },
  { m: "Iul", v: 144 },
  { m: "Aug", v: 152 },
  { m: "Sep", v: 158 },
];

const W = 800;
const H = 320;
const PAD_X = 36;
const PAD_TOP = 28;
const PAD_BOTTOM = 36;

const xs = POINTS.map((_, i) => PAD_X + (i / (POINTS.length - 1)) * (W - PAD_X * 2));
const minV = Math.min(...POINTS.map((p) => p.v));
const maxV = Math.max(...POINTS.map((p) => p.v));
const range = maxV - minV;
const ys = POINTS.map((p) => PAD_TOP + (1 - (p.v - minV) / range) * (H - PAD_TOP - PAD_BOTTOM));

function linePath() {
  return xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
}

function areaPath() {
  const baseY = H - PAD_BOTTOM;
  const top = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  return `${top} L ${xs[xs.length - 1].toFixed(1)} ${baseY} L ${xs[0].toFixed(1)} ${baseY} Z`;
}

const MILESTONES: { i: number; label: string; sub: string }[] = [
  { i: 2, label: "Crash evitat", sub: "Risk Score → cash" },
  { i: 7, label: "Re-entry", sub: "Zonă semnalată" },
  { i: 13, label: "Acum", sub: "+58% / 13 luni" },
];

export function HeroGrowthChart() {
  const [pathLength, setPathLength] = useState<number>(0);
  const [visible, setVisible] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
    const t = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  const lastIdx = POINTS.length - 1;

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18),transparent_70%)] blur-2xl" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-emerald">
              Strategia comunității
            </p>
            <h3 className="mt-1 text-lg font-bold text-white md:text-xl">
              Așa arată un plan cu management de risc
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Live
            </span>
          </div>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[240px] w-full md:h-[320px]"
            role="img"
            aria-label="Grafic creștere portofoliu cu management de risc"
          >
            <defs>
              <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(52,211,153)" />
                <stop offset="100%" stopColor="rgb(16,185,129)" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((p) => {
              const y = PAD_TOP + p * (H - PAD_TOP - PAD_BOTTOM);
              return (
                <line
                  key={p}
                  x1={PAD_X}
                  x2={W - PAD_X}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.04)"
                  strokeDasharray="2 6"
                />
              );
            })}

            <path
              d={areaPath()}
              fill="url(#hero-area)"
              style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 1.2s ease-out 0.8s",
              }}
            />

            <path
              ref={pathRef}
              d={linePath()}
              fill="none"
              stroke="url(#hero-line)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: pathLength || 1,
                strokeDashoffset: visible ? 0 : pathLength || 1,
                transition: "stroke-dashoffset 2.4s cubic-bezier(0.65, 0, 0.35, 1)",
              }}
            />

            {MILESTONES.map((mi, idx) => {
              const cx = xs[mi.i];
              const cy = ys[mi.i];
              const isLast = mi.i === lastIdx;
              const labelOnLeft = mi.i > POINTS.length - 4;
              const delay = 1.6 + idx * 0.35;
              return (
                <g
                  key={mi.label}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(6px)",
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
                  }}
                >
                  {isLast ? (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill="rgb(16,185,129)"
                      opacity={0.25}
                    >
                      <animate
                        attributeName="r"
                        values="6;14;6"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0;0.4"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLast ? 5 : 4}
                    fill="#0D1117"
                    stroke="rgb(16,185,129)"
                    strokeWidth={2}
                  />
                  <g
                    transform={`translate(${labelOnLeft ? cx - 10 : cx + 10}, ${cy - 18})`}
                  >
                    <text
                      textAnchor={labelOnLeft ? "end" : "start"}
                      className="fill-white text-[11px] font-bold"
                    >
                      {mi.label}
                    </text>
                    <text
                      y={12}
                      textAnchor={labelOnLeft ? "end" : "start"}
                      className="fill-slate-400 text-[10px]"
                    >
                      {mi.sub}
                    </text>
                  </g>
                </g>
              );
            })}

            {POINTS.map((p, i) => {
              if (i % 3 !== 0 && i !== POINTS.length - 1) return null;
              return (
                <text
                  key={`x-${i}`}
                  x={xs[i]}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-slate-600 text-[9px]"
                >
                  {p.m}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
            <span>Ilustrare educativă · nu garanție de profit</span>
          </div>
          <div className="font-data tabular-nums text-slate-400">
            <span className="text-slate-600">Drawdown maxim </span>
            <span className="font-bold text-white">-7.7%</span>
            <span className="mx-2 text-slate-700">|</span>
            <span className="text-slate-600">Sharpe </span>
            <span className="font-bold text-white">1.8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
