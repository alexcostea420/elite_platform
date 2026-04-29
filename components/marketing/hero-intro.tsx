"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "armata-intro-seen";
const INTRO_DURATION_MS = 2400;
const FADE_OUT_MS = 600;

export function HeroIntro() {
  const [phase, setPhase] = useState<"hidden" | "playing" | "fading" | "done">(
    "hidden",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    const seen = sessionStorage.getItem(STORAGE_KEY) === "1";

    if (reduceMotion || seen) {
      setPhase("done");
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, "1");
    document.body.style.overflow = "hidden";
    setPhase("playing");

    const fadeTimer = window.setTimeout(() => {
      setPhase("fading");
    }, INTRO_DURATION_MS);

    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
    }, INTRO_DURATION_MS + FADE_OUT_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (phase === "done" || phase === "hidden") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-crypto-dark transition-opacity duration-[600ms] ease-out ${
        phase === "fading" ? "opacity-0" : "opacity-100"
      }`}
      style={{ pointerEvents: phase === "fading" ? "none" : "auto" }}
    >
      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[120px] intro-glow" />

      {/* Chart */}
      <div className="relative w-full max-w-[1100px] px-8">
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid meet"
          className="block w-full"
        >
          <defs>
            <linearGradient id="intro-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="intro-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Faint horizontal grid */}
          <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
            <line x1="0" x2="1000" y1="80" y2="80" />
            <line x1="0" x2="1000" y1="160" y2="160" />
            <line x1="0" x2="1000" y1="240" y2="240" />
            <line x1="0" x2="1000" y1="320" y2="320" />
          </g>

          {/* Area fill (fades in after line) */}
          <path
            className="intro-area-fill"
            d="M 0,340 L 60,310 L 120,290 L 180,260 L 240,275 L 300,230 L 360,210 L 420,195 L 480,170 L 540,180 L 600,140 L 660,120 L 720,100 L 780,80 L 840,90 L 900,60 L 960,40 L 1000,30 L 1000,400 L 0,400 Z"
            fill="url(#intro-area)"
            opacity="0"
          />

          {/* Animated line */}
          <path
            className="intro-line-draw"
            d="M 0,340 L 60,310 L 120,290 L 180,260 L 240,275 L 300,230 L 360,210 L 420,195 L 480,170 L 540,180 L 600,140 L 660,120 L 720,100 L 780,80 L 840,90 L 900,60 L 960,40 L 1000,30"
            fill="none"
            stroke="url(#intro-line)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulsing endpoint */}
          <circle
            className="intro-endpoint"
            cx="1000"
            cy="30"
            r="8"
            fill="#10B981"
          />
        </svg>

        {/* Brand text */}
        <div className="mt-8 text-center intro-brand">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-accent-emerald/80">
            Armata de Traderi
          </p>
        </div>
      </div>

      <style jsx>{`
        .intro-line-draw {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          animation: intro-draw 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s
            forwards;
        }
        .intro-area-fill {
          animation: intro-fade 0.7s ease-out 1.4s forwards;
        }
        .intro-endpoint {
          opacity: 0;
          transform-origin: 1000px 30px;
          animation:
            intro-endpoint-in 0.5s ease-out 1.6s forwards,
            intro-pulse 1.4s ease-in-out 2.1s infinite;
        }
        .intro-brand {
          opacity: 0;
          transform: translateY(8px);
          animation: intro-brand-in 0.6s ease-out 1.7s forwards;
        }
        .intro-glow {
          opacity: 0;
          animation: intro-glow-in 1.4s ease-out 0.3s forwards;
        }

        @keyframes intro-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes intro-fade {
          to {
            opacity: 1;
          }
        }
        @keyframes intro-endpoint-in {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes intro-pulse {
          0%,
          100% {
            r: 8;
            opacity: 1;
          }
          50% {
            r: 14;
            opacity: 0.5;
          }
        }
        @keyframes intro-brand-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes intro-glow-in {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
