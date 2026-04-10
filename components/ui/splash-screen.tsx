"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show only once per session
    if (sessionStorage.getItem("splash_seen")) return;
    setVisible(true);
    sessionStorage.setItem("splash_seen", "1");

    // Start fade out after 2.2s
    const t1 = setTimeout(() => setFadeOut(true), 2200);
    // Remove from DOM after fade
    const t2 = setTimeout(() => setVisible(false), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: "#060A08" }}
    >
      {/* Logo */}
      <div className="mb-8 animate-scale-in text-center">
        <span className="text-3xl">🪖</span>
        <h1 className="mt-2 font-display text-2xl font-bold text-accent-emerald tracking-wide">ARMATA DE TRADERI</h1>
      </div>

      {/* Animated Chart */}
      <svg
        viewBox="0 0 400 120"
        className="w-[80%] max-w-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(11,102,35,0.1)" strokeWidth="0.5" />
        ))}

        {/* Candlesticks */}
        {[
          { x: 20, o: 85, c: 75, h: 70, l: 90 },
          { x: 40, o: 75, c: 80, h: 68, l: 82 },
          { x: 60, o: 80, c: 70, h: 65, l: 85 },
          { x: 80, o: 70, c: 65, h: 60, l: 75 },
          { x: 100, o: 65, c: 72, h: 58, l: 73 },
          { x: 120, o: 72, c: 60, h: 55, l: 76 },
          { x: 140, o: 60, c: 55, h: 50, l: 65 },
          { x: 160, o: 55, c: 58, h: 48, l: 60 },
          { x: 180, o: 58, c: 50, h: 45, l: 62 },
          { x: 200, o: 50, c: 55, h: 42, l: 52 },
          { x: 220, o: 55, c: 48, h: 44, l: 58 },
          { x: 240, o: 48, c: 52, h: 40, l: 50 },
          { x: 260, o: 52, c: 45, h: 38, l: 55 },
          { x: 280, o: 45, c: 38, h: 32, l: 48 },
          { x: 300, o: 38, c: 35, h: 28, l: 42 },
          { x: 320, o: 35, c: 28, h: 22, l: 38 },
          { x: 340, o: 28, c: 22, h: 18, l: 32 },
          { x: 360, o: 22, c: 15, h: 10, l: 25 },
          { x: 380, o: 15, c: 12, h: 8, l: 18 },
        ].map((candle, i) => {
          const isGreen = candle.c < candle.o;
          const top = Math.min(candle.o, candle.c);
          const height = Math.abs(candle.o - candle.c) || 1;
          const delay = i * 0.08;
          return (
            <g key={i} style={{ opacity: 0, animation: `candleAppear 0.3s ease-out ${delay}s forwards` }}>
              {/* Wick */}
              <line
                x1={candle.x} y1={candle.h} x2={candle.x} y2={candle.l}
                stroke={isGreen ? "#0B6623" : "#dc2626"}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={candle.x - 6} y={top} width="12" height={height}
                fill={isGreen ? "#0B6623" : "#dc2626"}
                rx="1"
              />
            </g>
          );
        })}

        {/* Uptrend line overlay */}
        <path
          d="M20,85 Q100,70 200,50 T380,12"
          fill="none"
          stroke="rgba(11,102,35,0.5)"
          strokeWidth="1.5"
          strokeDasharray="400"
          strokeDashoffset="400"
          style={{ animation: "lineGrow 1.8s ease-out 0.3s forwards" }}
        />

        {/* Glow at the end */}
        <circle
          cx="380" cy="12" r="4"
          fill="#0B6623"
          style={{ opacity: 0, animation: "glowPulse 0.5s ease-out 1.8s forwards" }}
        />

        <style>{`
          @keyframes candleAppear {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes lineGrow {
            to { stroke-dashoffset: 0; }
          }
          @keyframes glowPulse {
            0% { opacity: 0; r: 2; }
            50% { opacity: 1; r: 8; filter: drop-shadow(0 0 10px #0B6623); }
            100% { opacity: 0.8; r: 4; }
          }
        `}</style>
      </svg>

      {/* Loading text */}
      <p className="mt-6 text-xs tracking-[0.3em] text-slate-600" style={{ animation: "fadeIn 0.5s ease-out 0.5s forwards", opacity: 0 }}>
        ELITE TRADING PLATFORM
      </p>

      <style>{`
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
    </div>
  );
}
