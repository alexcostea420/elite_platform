"use client";

import { useEffect, useRef, useState } from "react";

export function TradingViewChart() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [showZones, setShowZones] = useState(false);

  useEffect(() => {
    const host = widgetRef.current;
    if (!host) return;

    const studies: string[] = [];
    if (showZones) {
      studies.push("MAExp@tv-basicstudies");
      studies.push("VWAP@tv-basicstudies");
    }

    const config = {
      autosize: true,
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
    };

    while (host.firstChild) host.removeChild(host.firstChild);
    const slot = document.createElement("div");
    slot.className = "tradingview-widget-container__widget";
    slot.style.height = "100%";
    slot.style.width = "100%";
    host.appendChild(slot);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify(config);
    host.appendChild(script);
  }, [showZones]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
          BTC/USDT · 15min
        </p>
        <button
          className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition sm:text-xs ${
            showZones
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
          }`}
          onClick={() => setShowZones((v) => !v)}
          type="button"
        >
          {showZones ? "EMA + VWAP" : "Indicatori"}
        </button>
      </div>
      <div
        ref={widgetRef}
        className="tradingview-widget-container relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/5"
      />
    </div>
  );
}
