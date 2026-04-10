"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("splash_seen")) return;
    setVisible(true);
    sessionStorage.setItem("splash_seen", "1");

    const t1 = setTimeout(() => setFadeOut(true), 2400);
    const t2 = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  // Generate smooth uptrend line points
  const points: string[] = [];
  const width = 400;
  const height = 140;
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const progress = i / steps;
    // Exponential growth curve with small noise
    const base = height - 15 - (progress * progress * (height - 40));
    const noise = Math.sin(i * 0.8) * 4 + Math.sin(i * 2.1) * 2 + Math.sin(i * 3.7) * 1.5;
    const y = Math.max(8, Math.min(height - 5, base + noise));
    points.push(`${x},${y}`);
  }
  const linePoints = points.join(" ");
  // Area fill (same points but closed at bottom)
  const areaPath = `M0,${height} L${points.map(p => `L${p}`).join(" ")} L${width},${height} Z`;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#060A08" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center" style={{ opacity: 0, animation: "splashFadeIn 0.6s ease-out 0.2s forwards" }}>
        <span className="text-4xl">🪖</span>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-[0.2em] text-accent-emerald sm:text-3xl">
          ARMATA DE TRADERI
        </h1>
      </div>

      {/* Animated Line Chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-[85%] max-w-lg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient for area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(11,102,35,0.3)" />
            <stop offset="100%" stopColor="rgba(11,102,35,0)" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(11,102,35,0.4)" />
            <stop offset="100%" stopColor="#0B6623" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGrad)"
          style={{
            opacity: 0,
            animation: "splashFadeIn 0.8s ease-out 0.8s forwards",
          }}
        />

        {/* Main line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="800"
          strokeDashoffset="800"
          style={{ animation: "lineGrow 2s ease-out 0.3s forwards" }}
        />

        {/* Glow dot at the end */}
        <circle
          cx={width}
          cy={points[points.length - 1]?.split(",")[1] || "20"}
          r="5"
          fill="#0B6623"
          style={{
            opacity: 0,
            animation: "glowDot 0.6s ease-out 2s forwards",
            filter: "drop-shadow(0 0 12px rgba(11,102,35,0.8))",
          }}
        />
      </svg>

      {/* Subtitle */}
      <p
        className="mt-8 text-xs tracking-[0.3em] text-slate-600"
        style={{ opacity: 0, animation: "splashFadeIn 0.5s ease-out 1s forwards" }}
      >
        ELITE TRADING PLATFORM
      </p>

      <style>{`
        @keyframes lineGrow { to { stroke-dashoffset: 0; } }
        @keyframes splashFadeIn { to { opacity: 1; } }
        @keyframes glowDot {
          0% { opacity: 0; r: 2; }
          60% { opacity: 1; r: 8; }
          100% { opacity: 1; r: 5; }
        }
      `}</style>
    </div>
  );
}
