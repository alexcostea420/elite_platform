"use client";

import { useEffect, useMemo, useState } from "react";

import { fmtPct, fmtUsd } from "./portfolio-dashboard";
import { ASSETS } from "@/lib/portfolio/assets";

const BENCHMARK_GROUPS: { label: string; items: { key: string; label: string; sub: string }[] }[] = [
  {
    label: "Crypto",
    items: [
      { key: "crypto:bitcoin", label: "BTC", sub: "Bitcoin" },
      { key: "crypto:ethereum", label: "ETH", sub: "Ethereum" },
      { key: "crypto:solana", label: "SOL", sub: "Solana" },
      { key: "crypto:usd-coin", label: "USDC", sub: "Cash echivalent" },
    ],
  },
  {
    label: "Stocks / ETFs",
    items: [
      { key: "stock:SPY", label: "SPY", sub: "S&P 500" },
      { key: "stock:QQQ", label: "QQQ", sub: "Nasdaq 100" },
      { key: "stock:GLD", label: "GLD", sub: "Gold" },
      { key: "stock:NVDA", label: "NVDA", sub: "Nvidia" },
      { key: "stock:MSTR", label: "MSTR", sub: "MicroStrategy" },
    ],
  },
];

const ALL_BENCHMARKS = BENCHMARK_GROUPS.flatMap((g) => g.items);

export type WhatIfSeed = {
  originalAssetKey: string;
  originalAssetName: string;
  originalQty: number;
  originalPriceUsd: number;
  originalDate: string;
};

type Result = {
  amountInvestedUsd: number;
  original: {
    assetKey: string;
    assetName: string;
    currentPriceUsd: number;
    currentValueUsd: number;
    pnlUsd: number;
    pnlPct: number;
  };
  alternative: {
    assetKey: string;
    assetName: string;
    priceOnDateUsd: number;
    qty: number;
    currentPriceUsd: number;
    currentValueUsd: number;
    pnlUsd: number;
    pnlPct: number;
  };
  delta: { valueUsd: number; pct: number; altOutperformed: boolean };
};

type CompareRow = {
  altKey: string;
  altLabel: string;
  altSub: string;
  ok: boolean;
  currentValueUsd?: number;
  pnlPct?: number;
  deltaValueUsd?: number;
  error?: string;
};

function formatDateRo(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function WhatIfModal({
  seed,
  onClose,
}: {
  seed: WhatIfSeed;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"single" | "compare-all">("single");
  const [altKey, setAltKey] = useState<string>(() =>
    seed.originalAssetKey === "crypto:bitcoin" ? "crypto:ethereum" : "crypto:bitcoin",
  );
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [compareRows, setCompareRows] = useState<CompareRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  const otherAssets = useMemo(
    () =>
      ASSETS.filter(
        (a) =>
          a.key !== seed.originalAssetKey &&
          !ALL_BENCHMARKS.find((b) => b.key === a.key),
      ),
    [seed.originalAssetKey],
  );

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Single comparison fetch
  useEffect(() => {
    if (mode !== "single") return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/portfolio/what-if", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            original_asset_key: seed.originalAssetKey,
            original_qty: seed.originalQty,
            original_price_usd: seed.originalPriceUsd,
            original_date: seed.originalDate,
            alternative_asset_key: altKey,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "what_if_failed");
        if (!cancelled) setResult(j);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Eroare";
          setError(msg);
          setResult(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, altKey, seed]);

  // Compare-all fetch
  useEffect(() => {
    if (mode !== "compare-all") return;
    let cancelled = false;
    async function runAll() {
      setCompareLoading(true);
      const candidates = ALL_BENCHMARKS.filter((b) => b.key !== seed.originalAssetKey);
      const results = await Promise.all(
        candidates.map(async (b): Promise<CompareRow> => {
          try {
            const r = await fetch("/api/portfolio/what-if", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                original_asset_key: seed.originalAssetKey,
                original_qty: seed.originalQty,
                original_price_usd: seed.originalPriceUsd,
                original_date: seed.originalDate,
                alternative_asset_key: b.key,
              }),
            });
            const j = await r.json();
            if (!r.ok) {
              return { altKey: b.key, altLabel: b.label, altSub: b.sub, ok: false, error: j?.error };
            }
            return {
              altKey: b.key,
              altLabel: b.label,
              altSub: b.sub,
              ok: true,
              currentValueUsd: j.alternative.currentValueUsd,
              pnlPct: j.alternative.pnlPct,
              deltaValueUsd: j.delta.valueUsd,
            };
          } catch {
            return { altKey: b.key, altLabel: b.label, altSub: b.sub, ok: false, error: "fetch_failed" };
          }
        }),
      );
      if (!cancelled) {
        // Sort by alternative pnlPct desc (ok rows first)
        results.sort((a, b) => {
          if (a.ok && !b.ok) return -1;
          if (!a.ok && b.ok) return 1;
          return (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity);
        });
        setCompareRows(results);
        setCompareLoading(false);
      }
    }
    void runAll();
    return () => {
      cancelled = true;
    };
  }, [mode, seed]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300">What if?</p>
            <h2 className="text-lg font-bold text-white">
              Cumpărarea ta de {seed.originalAssetName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {fmtUsd(seed.originalQty * seed.originalPriceUsd)} pe{" "}
              {formatDateRo(seed.originalDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Închide"
          >
            ✕
          </button>
        </header>

        <div className="border-b border-white/10 px-6 pt-3">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`rounded-t-lg px-3 py-2 font-semibold transition ${
                mode === "single"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Comparație 1-la-1
            </button>
            <button
              type="button"
              onClick={() => setMode("compare-all")}
              className={`rounded-t-lg px-3 py-2 font-semibold transition ${
                mode === "compare-all"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Compară toate
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {mode === "single" ? (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-300">Compară cu...</p>
                {BENCHMARK_GROUPS.map((group) => (
                  <div key={group.label} className="mb-3 last:mb-0">
                    <p className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items
                        .filter((b) => b.key !== seed.originalAssetKey)
                        .map((b) => (
                          <button
                            key={b.key}
                            type="button"
                            onClick={() => setAltKey(b.key)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                              altKey === b.key
                                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                                : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200"
                            }`}
                          >
                            <span>{b.label}</span>
                            <span className="text-[10px] font-normal opacity-70">{b.sub}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer hover:text-slate-300">
                    Sau alege alt asset
                  </summary>
                  <select
                    value={ALL_BENCHMARKS.find((b) => b.key === altKey) ? "" : altKey}
                    onChange={(e) => e.target.value && setAltKey(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-400/40 focus:outline-none"
                  >
                    <option value="">— alege —</option>
                    {otherAssets.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.symbol} — {a.name}
                      </option>
                    ))}
                  </select>
                </details>
              </div>

              {loading ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
                  Se calculează…
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error === "alternative_historical_price_unavailable"
                    ? "Nu am preț istoric pentru această alternativă. Încearcă altă opțiune."
                    : `Nu am putut calcula: ${error}`}
                </div>
              ) : result ? (
                <ResultCard result={result} />
              ) : null}
            </>
          ) : (
            <CompareAllTable
              rows={compareRows}
              loading={compareLoading}
              originalAssetName={seed.originalAssetName}
            />
          )}

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-[12px] text-amber-200/90">
            <p className="font-semibold text-amber-200">📚 Lecție, nu regret</p>
            <p className="mt-1 text-amber-100/70">
              Comparațiile sunt educaționale. La momentul deciziei nu știai cum vor evolua prețurile
              — asta e &ldquo;hindsight bias&rdquo;. Folosește datele pentru a-ți rafina procesul
              decizional, nu pentru a regreta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareAllTable({
  rows,
  loading,
  originalAssetName,
}: {
  rows: CompareRow[];
  loading: boolean;
  originalAssetName: string;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
        Se calculează toate alternativele…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
        Nicio alternativă disponibilă.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs text-slate-400">
          Față de {originalAssetName}, dacă ai fi pus aceiași bani în:
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2">Alternativă</th>
              <th className="px-4 py-2 text-right">Valoare azi</th>
              <th className="px-4 py-2 text-right">Randament</th>
              <th className="px-4 py-2 text-right">vs Alegere</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              if (!r.ok) {
                return (
                  <tr key={r.altKey} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-white">{r.altLabel}</span>
                      <span className="ml-2 text-[11px] text-slate-500">{r.altSub}</span>
                    </td>
                    <td colSpan={3} className="px-4 py-2.5 text-right text-[11px] text-slate-500">
                      Nu am preț istoric
                    </td>
                  </tr>
                );
              }
              const pct = r.pnlPct ?? 0;
              const delta = r.deltaValueUsd ?? 0;
              const pctColor = pct > 0 ? "text-emerald-400" : pct < 0 ? "text-rose-400" : "text-slate-300";
              const deltaColor = delta > 0 ? "text-rose-300" : delta < 0 ? "text-emerald-300" : "text-slate-400";
              return (
                <tr key={r.altKey} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-white">{r.altLabel}</span>
                    <span className="ml-2 text-[11px] text-slate-500">{r.altSub}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-data tabular-nums text-white">
                    {fmtUsd(r.currentValueUsd ?? 0)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-data tabular-nums ${pctColor}`}>
                    {fmtPct(pct)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-data tabular-nums ${deltaColor}`}>
                    {delta > 0 ? "+" : ""}
                    {fmtUsd(delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
        Verde la &ldquo;vs Alegere&rdquo; = ai bătut alternativa. Roșu = alternativa ar fi adus
        mai mult.
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const altOutperformed = result.delta.altOutperformed;
  const deltaColor = altOutperformed ? "text-rose-300" : "text-emerald-300";
  const deltaBg = altOutperformed
    ? "border-rose-400/30 bg-rose-400/5"
    : "border-emerald-400/30 bg-emerald-400/5";

  return (
    <>
      <div className={`rounded-2xl border p-5 ${deltaBg}`}>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">Verdictul</p>
        <p className="mt-2 text-lg leading-tight text-white">
          {altOutperformed ? (
            <>
              {result.alternative.assetName} ar fi adus{" "}
              <span className={`font-bold ${deltaColor}`}>
                {fmtUsd(result.delta.valueUsd)} mai mult
              </span>{" "}
              ({fmtPct(result.delta.pct)}).
            </>
          ) : (
            <>
              Alegerea ta a fost{" "}
              <span className={`font-bold ${deltaColor}`}>
                {fmtUsd(-result.delta.valueUsd)} mai bună
              </span>{" "}
              decât {result.alternative.assetName} ({fmtPct(-result.delta.pct)}).
            </>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          title="Alegerea ta"
          subtitle={result.original.assetName}
          value={fmtUsd(result.original.currentValueUsd)}
          delta={result.original.pnlUsd}
          deltaPct={result.original.pnlPct}
          accent="white"
        />
        <Card
          title="Alternativa"
          subtitle={result.alternative.assetName}
          value={fmtUsd(result.alternative.currentValueUsd)}
          delta={result.alternative.pnlUsd}
          deltaPct={result.alternative.pnlPct}
          accent={altOutperformed ? "rose" : "neutral"}
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Calculat pentru {fmtUsd(result.amountInvestedUsd)} investiți. Prețuri de la CoinGecko
        (crypto) și Yahoo Finance (stocks/ETFs).
      </p>
    </>
  );
}

function Card({
  title,
  subtitle,
  value,
  delta,
  deltaPct,
  accent,
}: {
  title: string;
  subtitle: string;
  value: string;
  delta: number;
  deltaPct: number;
  accent: "white" | "rose" | "neutral";
}) {
  const valueColor = accent === "rose" ? "text-slate-200" : "text-white";
  const pnlColor =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      <p className={`mt-2 font-data text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className={`text-xs font-data tabular-nums ${pnlColor}`}>
        {fmtUsd(delta)} ({fmtPct(deltaPct)})
      </p>
    </div>
  );
}
