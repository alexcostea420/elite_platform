"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";

import {
  sentimentData,
  sentimentShifted,
  priceData,
  signalData,
  fngData,
  allChannels,
  sentAvg,
  rollingAvg,
  type SentimentEntry,
} from "@/lib/data/countertrade-data";

Chart.register(...registerables);

// ── Chart theme constants ──
const GRID = "#151520";
const TICK = "#2e2e42";
const TTIP = {
  backgroundColor: "#181820",
  borderColor: "#252535",
  borderWidth: 1,
  titleColor: "#c8c8d0",
  bodyColor: "#66667a",
  padding: 10,
};

const HM_PAGE = 15;

// ── Heatmap color helpers ──
function scoreColor(s: number | null | undefined): string {
  if (s == null || s === 0) return "#161620";
  if (s < 20) return "#7a1e1e";
  if (s < 30) return "#a02828";
  if (s < 40) return "#7a3a10";
  if (s < 50) return "#4a4010";
  if (s < 60) return "#1a3a2a";
  if (s < 70) return "#1a5235";
  return "#166b3a";
}

function textColor(s: number | null | undefined): string {
  if (s == null || s === 0) return "#252535";
  if (s < 45) return "#ffb3b3";
  if (s > 55) return "#b3ffd9";
  return "#e0d080";
}

function shortDate(d: string): string {
  const p = d.split("-");
  return p[1] + "/" + p[2];
}

// ── Stats Bar ──
function StatsBar() {
  const last = sentimentData[sentimentData.length - 1];
  const lp = priceData[priceData.length - 1];
  const lfng = fngData[fngData.length - 1];

  const avg = sentAvg(last) || 0;
  const cls = avg < 35 ? "bearish" : avg > 65 ? "bullish" : "neutral";
  const sig =
    avg < 35
      ? "LONG contra signal"
      : avg > 65
        ? "SHORT contra signal"
        : "No clear signal";

  const res = signalData.filter((s) =>
    ["CORRECT", "INCORRECT"].includes(s.outcome),
  );
  const acc = res.length
    ? Math.round(
        (res.filter((s) => s.outcome === "CORRECT").length / res.length) * 100,
      ) + "%"
    : "--";
  const pend = signalData.filter((s) => s.outcome === "PENDING").length;

  const fl = lfng
    ? lfng.value < 25
      ? "Extreme Fear"
      : lfng.value < 45
        ? "Fear"
        : lfng.value < 55
          ? "Neutral"
          : lfng.value < 75
            ? "Greed"
            : "Extreme Greed"
    : "";
  const fc = lfng
    ? lfng.value < 25
      ? "bearish"
      : lfng.value > 60
        ? "bullish"
        : ""
    : "";

  const valColor = (type: string) =>
    type === "bearish"
      ? "text-red-400"
      : type === "bullish"
        ? "text-emerald-400"
        : type === "neutral"
          ? "text-yellow-500"
          : "text-slate-100";

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-[10px] border border-white/10 bg-[#11111a] px-5 py-4">
        <div className="mb-1.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
          YouTube Sentiment
        </div>
        <div className={`text-[1.7em] font-bold leading-none ${valColor(cls)}`}>
          {avg}
          <span className="text-[.42em] font-normal text-slate-600">/100</span>
        </div>
        <div className="mt-1.5 text-[.7em] text-slate-600">{sig}</div>
      </div>

      <div className="rounded-[10px] border border-white/10 bg-[#11111a] px-5 py-4">
        <div className="mb-1.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
          BTC Price
        </div>
        <div className="text-[1.7em] font-bold leading-none text-slate-100">
          {lp ? "$" + Math.round(lp.btc).toLocaleString() : "--"}
        </div>
        <div className="mt-1.5 text-[.7em] text-slate-600">
          ETH ${lp ? Math.round(lp.eth).toLocaleString() : "--"}
        </div>
      </div>

      <div className="rounded-[10px] border border-white/10 bg-[#11111a] px-5 py-4">
        <div className="mb-1.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
          Fear &amp; Greed
        </div>
        <div className={`text-[1.7em] font-bold leading-none ${valColor(fc)}`}>
          {lfng ? lfng.value : "--"}
        </div>
        <div className="mt-1.5 text-[.7em] text-slate-600">{fl}</div>
      </div>

      <div className="rounded-[10px] border border-white/10 bg-[#11111a] px-5 py-4">
        <div className="mb-1.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
          Signal Accuracy
        </div>
        <div className="text-[1.7em] font-bold leading-none text-slate-100">
          {acc}
        </div>
        <div className="mt-1.5 text-[.7em] text-slate-600">
          {pend} pending &middot; {sentimentData.length} runs
        </div>
      </div>
    </div>
  );
}

// ── Heatmap ──
function Heatmap() {
  const allDates = useMemo(() => sentimentData.map((d) => d.date), []);
  const [hmOffset, setHmOffset] = useState(() =>
    Math.max(0, allDates.length - HM_PAGE),
  );

  const page = allDates.slice(hmOffset, hmOffset + HM_PAGE);
  const canPrev = hmOffset > 0;
  const canNext = hmOffset + HM_PAGE < allDates.length;

  const navigate = (dir: number) => {
    setHmOffset((prev) =>
      Math.max(0, Math.min(allDates.length - HM_PAGE, prev + dir * HM_PAGE)),
    );
  };

  return (
    <div className="rounded-[10px] border border-white/10 bg-[#11111a] p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
          Per-Channel Sentiment -- Heatmap
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={!canPrev}
            className="rounded-md border border-[#252535] bg-[#1c1c28] px-3 py-1 text-[.85em] text-slate-200 disabled:opacity-30"
          >
            &larr;
          </button>
          <span className="whitespace-nowrap text-[.68em] text-slate-600">
            {page.length
              ? shortDate(page[0]) + " \u2013 " + shortDate(page[page.length - 1])
              : ""}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={!canNext}
            className="rounded-md border border-[#252535] bg-[#1c1c28] px-3 py-1 text-[.85em] text-slate-200 disabled:opacity-30"
          >
            &rarr;
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[.72em]">
          <thead>
            <tr>
              <th className="border-none p-1 text-left text-[.7em] font-medium text-slate-600" />
              {page.map((d) => (
                <th
                  key={d}
                  className="whitespace-nowrap border-none p-1 text-[.7em] font-medium normal-case tracking-normal text-slate-600"
                >
                  {shortDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allChannels.map((ch) => (
              <tr key={ch}>
                <td className="whitespace-nowrap border-none bg-transparent pr-2.5 text-left font-medium text-slate-600">
                  {ch}
                </td>
                {page.map((d) => {
                  const e = sentimentData.find((x) => x.date === d);
                  const s = e?.scores?.[ch];
                  return (
                    <td
                      key={d}
                      className="rounded-[3px] border border-[#0d0d12] p-1 text-center font-semibold"
                      style={{
                        background: scoreColor(s),
                        color: textColor(s),
                      }}
                    >
                      {s != null && s > 0 ? s : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Scores Table ──
function ScoresTable() {
  const last = sentimentData[sentimentData.length - 1];
  const prev =
    sentimentData.length >= 2
      ? sentimentData[sentimentData.length - 2]
      : null;

  return (
    <div className="col-span-1 rounded-[10px] border border-white/10 bg-[#11111a] p-5 lg:col-span-2">
      <h2 className="mb-3.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
        Latest Channel Scores
      </h2>
      <table className="w-full border-collapse text-[.82em]">
        <thead>
          <tr>
            <th className="border-b border-[#171720] p-2.5 text-left text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
              Channel
            </th>
            <th className="border-b border-[#171720] p-2.5 text-left text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
              Score
            </th>
            <th className="w-[130px] border-b border-[#171720] p-2.5 text-left text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
              Bar
            </th>
            <th className="border-b border-[#171720] p-2.5 text-left text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
              vs Prev Run
            </th>
          </tr>
        </thead>
        <tbody>
          {allChannels.map((ch) => {
            const s = last?.scores?.[ch];
            const p = prev?.scores?.[ch];
            const barColor =
              s == null
                ? "#252535"
                : s < 35
                  ? "#d95555"
                  : s > 65
                    ? "#0B6623"
                    : "#c88c0a";

            let trend: React.ReactNode = (
              <span className="text-[#252535]">&mdash;</span>
            );
            if (s != null && p != null) {
              const d = s - p;
              const sign = d > 0 ? "+" : "";
              if (d > 5)
                trend = (
                  <span className="text-emerald-400">
                    {sign}
                    {d} &uarr;
                  </span>
                );
              else if (d < -5)
                trend = (
                  <span className="text-red-400">
                    {sign}
                    {d} &darr;
                  </span>
                );
              else
                trend = (
                  <span className="text-slate-700">
                    {sign}
                    {d} &rarr;
                  </span>
                );
            }

            if (s == null) {
              return (
                <tr key={ch} className="hover:bg-[#13131e]">
                  <td className="border-b border-[#171720] p-2.5 text-[#252535]">
                    {ch}
                  </td>
                  <td className="border-b border-[#171720] p-2.5 text-[#252535]">
                    &mdash;
                  </td>
                  <td className="border-b border-[#171720] p-2.5" />
                  <td className="border-b border-[#171720] p-2.5" />
                </tr>
              );
            }

            return (
              <tr key={ch} className="hover:bg-[#13131e]">
                <td className="border-b border-[#171720] p-2.5 font-medium text-slate-200">
                  {ch}
                </td>
                <td className="border-b border-[#171720] p-2.5 text-slate-200">
                  {s}
                  <span className="text-slate-600">/100</span>
                </td>
                <td className="border-b border-[#171720] p-2.5">
                  <div className="inline-block h-[5px] w-[110px] overflow-hidden rounded-[3px] bg-[#171720]">
                    <div
                      className="h-full rounded-[3px]"
                      style={{ width: `${s}%`, background: barColor }}
                    />
                  </div>
                </td>
                <td className="border-b border-[#171720] p-2.5">{trend}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Signal Table ──
function SignalTable() {
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const result: typeof signalData = [];
    [...signalData].reverse().forEach((s) => {
      const key = s.date + "-" + s.signal;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(s);
    });
    return result;
  }, []);

  return (
    <div className="col-span-1 rounded-[10px] border border-white/10 bg-[#11111a] p-5 lg:col-span-2">
      <h2 className="mb-3.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
        Signal History
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[.82em]">
          <thead>
            <tr>
              {["Date", "Consensus", "Signal", "BTC Entry", "Outcome", "P&L"].map(
                (h) => (
                  <th
                    key={h}
                    className="border-b border-[#171720] p-2.5 text-left text-[.68em] font-semibold uppercase tracking-wider text-slate-600"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const out = s.outcome || "PENDING";
              const sigLbl = (s.signal || "")
                .replace("_BTC_ETH", "")
                .replace(/_/g, " ");
              const sigCls = sigLbl.includes("LONG")
                ? "bg-emerald-500/[.13] text-emerald-400"
                : sigLbl.includes("SHORT")
                  ? "bg-red-500/[.13] text-red-400"
                  : "";
              const outCls =
                out === "CORRECT"
                  ? "bg-emerald-500/[.12] text-emerald-400"
                  : out === "PENDING"
                    ? "bg-slate-700/20 text-slate-600"
                    : "bg-red-500/[.12] text-red-400";

              return (
                <tr key={i} className="hover:bg-[#13131e]">
                  <td className="border-b border-[#171720] p-2.5 text-slate-500">
                    {s.date}
                  </td>
                  <td className="border-b border-[#171720] p-2.5">
                    {s.consensus}{" "}
                    <span className="text-slate-600">{s.strength}</span>
                  </td>
                  <td className="border-b border-[#171720] p-2.5">
                    <span
                      className={`inline-block rounded-[5px] px-2.5 py-0.5 text-[.78em] font-semibold ${sigCls}`}
                    >
                      {sigLbl}
                    </span>
                  </td>
                  <td className="border-b border-[#171720] p-2.5 text-slate-500">
                    {s.btc_at_signal
                      ? "$" + Number(s.btc_at_signal).toLocaleString()
                      : "\u2014"}
                  </td>
                  <td className="border-b border-[#171720] p-2.5">
                    <span
                      className={`inline-block rounded-[5px] px-2.5 py-0.5 text-[.78em] font-semibold ${outCls}`}
                    >
                      {out}
                    </span>
                  </td>
                  <td className="border-b border-[#171720] p-2.5">
                    {s.outcome_pct != null ? (
                      <span
                        className={
                          s.outcome_pct > 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {s.outcome_pct > 0 ? "+" : ""}
                        {s.outcome_pct}%
                      </span>
                    ) : (
                      <span className="text-[#252535]">&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Chart (Sentiment vs BTC Price) ──
function MainChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const allDates = [
      ...new Set([
        ...sentimentShifted.map((d) => d.date),
        ...priceData.map((d) => d.date),
      ]),
    ].sort();
    const pm = Object.fromEntries(priceData.map((d) => [d.date, d.btc]));
    const sm: Record<string, number | null> = {};
    sentimentShifted.forEach((d) => {
      sm[d.date] = sentAvg(d);
    });
    const raw = allDates.map((d) => sm[d] ?? null);
    const smooth = rollingAvg(raw, 3);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: allDates,
        datasets: [
          {
            label: "Sentiment (raw)",
            data: raw,
            borderColor: "rgba(217,85,85,.2)",
            borderWidth: 1,
            fill: false,
            pointRadius: raw.map((v) => (v != null ? 3 : 0)),
            pointBackgroundColor: "rgba(217,85,85,.45)",
            yAxisID: "y1",
            tension: 0.2,
            spanGaps: true,
          },
          {
            label: "Sentiment 3d avg",
            data: smooth,
            borderColor: "#d95555",
            borderWidth: 2.5,
            fill: false,
            pointRadius: 0,
            yAxisID: "y1",
            tension: 0.45,
            spanGaps: true,
          },
          {
            label: "BTC Price",
            data: allDates.map((d) => pm[d] ?? null),
            borderColor: "#0B6623",
            backgroundColor: "rgba(11,102,35,.04)",
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            yAxisID: "y2",
            tension: 0.3,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: "#44445a",
              font: { size: 11 },
              boxWidth: 22,
              padding: 14,
            },
          },
          tooltip: {
            ...TTIP,
            callbacks: {
              label: (c) =>
                c.datasetIndex < 2
                  ? "Sentiment: " + c.raw + "/100"
                  : "BTC: $" + (c.raw as number)?.toLocaleString(),
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: { unit: "day", tooltipFormat: "MMM d" },
            ticks: { color: TICK, maxTicksLimit: 14 },
            grid: { color: GRID },
          },
          y1: {
            position: "left",
            min: 0,
            max: 100,
            title: {
              display: true,
              text: "Sentiment",
              color: "#44445a",
              font: { size: 10 },
            },
            ticks: { color: TICK, stepSize: 25 },
            grid: { color: GRID },
          },
          y2: {
            position: "right",
            title: {
              display: true,
              text: "BTC USD",
              color: "#44445a",
              font: { size: 10 },
            },
            ticks: {
              color: TICK,
              callback: (v) => "$" + Math.round(Number(v) / 1000) + "k",
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="col-span-1 rounded-[10px] border border-white/10 bg-[#11111a] p-5 lg:col-span-2">
      <h2 className="mb-3.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
        YouTube Sentiment vs BTC Price
      </h2>
      <div className="relative h-[400px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ── Fear & Greed Chart ──
function FngChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const sentMap: Record<string, number | null> = {};
    sentimentShifted.forEach((d) => {
      sentMap[d.date] = sentAvg(d);
    });

    const allDates = [
      ...new Set([...fngData.map((d) => d.date), ...Object.keys(sentMap)]),
    ].sort();
    const fm = Object.fromEntries(fngData.map((d) => [d.date, d.value]));

    const sentVals = allDates.map((d) => sentMap[d] ?? null);
    const barColors = sentVals.map((v) => {
      if (v == null) return "transparent";
      if (v < 35) return "rgba(11,102,35,.55)";
      if (v > 65) return "rgba(217,85,85,.55)";
      return "rgba(200,140,10,.45)";
    });

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: allDates,
        datasets: [
          {
            label: "YouTube Sentiment",
            data: sentVals,
            backgroundColor: barColors,
            borderWidth: 0,
            borderRadius: 3,
            order: 2,
          },
          {
            label: "Fear & Greed",
            data: allDates.map((d) => fm[d] ?? null),
            borderColor: "#c88c0a",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            spanGaps: true,
            fill: false,
            type: "line" as const,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: "#44445a",
              font: { size: 11 },
              boxWidth: 14,
              padding: 12,
              usePointStyle: true,
            },
          },
          tooltip: { ...TTIP },
        },
        scales: {
          x: {
            type: "time",
            time: { unit: "day", tooltipFormat: "MMM d" },
            ticks: { color: TICK, maxTicksLimit: 12 },
            grid: { color: GRID },
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: TICK, stepSize: 25 },
            grid: { color: GRID },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-[10px] border border-white/10 bg-[#11111a] p-5">
      <h2 className="mb-3.5 text-[.68em] font-semibold uppercase tracking-wider text-slate-600">
        Fear &amp; Greed vs YouTube Sentiment
      </h2>
      <div className="relative h-[290px]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ── Main Dashboard Export ──
export function CountertradeDashboard() {
  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-baseline justify-between border-b border-white/10 pb-3.5">
        <h1 className="text-[.85em] font-semibold uppercase tracking-widest text-slate-200">
          Contrarian Signal Dashboard
        </h1>
        <span className="text-[.75em] text-slate-700">
          Updated 2026-04-03 14:09 &nbsp;&middot;&nbsp; Sentiment plotted at
          video date (scan date &minus; 1)
        </span>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Charts + Tables Grid */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <MainChart />

        <Heatmap />
        <FngChart />

        <ScoresTable />
        <SignalTable />
      </div>
    </div>
  );
}
