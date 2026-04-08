"use client";

import { useEffect, useRef, useState } from "react";

export function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showZones, setShowZones] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const studies = [];
    if (showZones) {
      studies.push("MASimple@tv-basicstudies");
      studies.push("BB@tv-basicstudies");
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: "15",
      timezone: "Europe/Bucharest",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(8, 8, 8, 1)",
      gridColor: "rgba(255, 255, 255, 0.03)",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
      studies,
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, [showZones]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
          BTC/USDT - 15 min
        </p>
        <button
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            showZones
              ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30"
              : "bg-white/5 text-slate-400 border border-white/10"
          }`}
          onClick={() => setShowZones((v) => !v)}
          type="button"
        >
          {showZones ? "Zones ON" : "Zones OFF"}
        </button>
      </div>
      <div className="tradingview-widget-container overflow-hidden rounded-2xl border border-white/10" ref={containerRef} style={{ height: "min(70vh, 650px)", minHeight: 400 }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
