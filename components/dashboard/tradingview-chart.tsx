"use client";

import { useEffect, useRef, useState } from "react";

export function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showZones, setShowZones] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const studies: string[] = [];
    if (showZones) {
      // MA 50 + MA 200 + VWAP - useful for intraday levels
      studies.push("MAExp@tv-basicstudies");
      studies.push("VWAP@tv-basicstudies");
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      symbol: "BINANCE:BTCUSDT",
      interval: "15",
      timezone: "Europe/Bucharest",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(10, 10, 15, 1)",
      gridColor: "rgba(255, 255, 255, 0.02)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      allow_symbol_change: true,
      support_host: "https://www.tradingview.com",
      studies,
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, [showZones]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          BTC/USDT - 15 min
        </p>
        <button
          className={`glass-card rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            showZones
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "text-[var(--text-secondary)]"
          }`}
          onClick={() => setShowZones((v) => !v)}
          type="button"
        >
          {showZones ? "EMA + VWAP ON" : "Indicatori OFF"}
        </button>
      </div>
      <div
        className="tradingview-widget-container overflow-hidden rounded-2xl"
        ref={containerRef}
        style={{ height: "clamp(400px, 60vh, 700px)", width: "100%", border: "1px solid var(--border-subtle)" }}
      >
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
