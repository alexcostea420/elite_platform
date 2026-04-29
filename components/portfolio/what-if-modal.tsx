"use client";

import { useEffect, useMemo, useState } from "react";

import { fmtPct, fmtUsd } from "./portfolio-dashboard";
import { ASSETS } from "@/lib/portfolio/assets";

const BENCHMARKS: { key: string; label: string; sub: string }[] = [
  { key: "crypto:bitcoin", label: "BTC", sub: "Bitcoin" },
  { key: "crypto:ethereum", label: "ETH", sub: "Ethereum" },
  { key: "stock:SPY", label: "SPY", sub: "S&P 500" },
  { key: "stock:GLD", label: "GLD", sub: "Gold" },
  { key: "crypto:usd-coin", label: "USDC", sub: "Cash echivalent" },
];

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
  const [altKey, setAltKey] = useState<string>(() => {
    const candidate =
      seed.originalAssetKey === "crypto:bitcoin"
        ? "crypto:ethereum"
        : "crypto:bitcoin";
    return candidate;
  });
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benchmarks = useMemo(
    () => BENCHMARKS.filter((b) => b.key !== seed.originalAssetKey),
    [seed.originalAssetKey],
  );

  const otherAssets = useMemo(
    () =>
      ASSETS.filter(
        (a) =>
          a.key !== seed.originalAssetKey &&
          !benchmarks.find((b) => b.key === a.key),
      ),
    [seed.originalAssetKey, benchmarks],
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

  useEffect(() => {
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
  }, [altKey, seed]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300">
              What if?
            </p>
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

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-300">
              Compară cu...
            </p>
            <div className="flex flex-wrap gap-2">
              {benchmarks.map((b) => (
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
            <details className="mt-2 text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-300">
                Sau alege alt asset
              </summary>
              <select
                value={
                  benchmarks.find((b) => b.key === altKey) ? "" : altKey
                }
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

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-[12px] text-amber-200/90">
            <p className="font-semibold text-amber-200">📚 Lecție, nu regret</p>
            <p className="mt-1 text-amber-100/70">
              Comparațiile sunt educaționale. La momentul deciziei nu știai
              cum vor evolua prețurile — asta e &ldquo;hindsight bias&rdquo;. Folosește
              datele pentru a-ți rafina procesul decizional, nu pentru a regreta.
            </p>
          </div>
        </div>
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
        <p className="text-[11px] uppercase tracking-wider text-slate-400">
          Verdictul
        </p>
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
        Calculat pentru {fmtUsd(result.amountInvestedUsd)} investiți. Prețuri
        de la CoinGecko (crypto) și Yahoo Finance (stocks/ETFs).
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
  const valueColor =
    accent === "rose" ? "text-slate-200" : "text-white";
  const pnlColor =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      <p className={`mt-2 font-data text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
      <p className={`text-xs font-data tabular-nums ${pnlColor}`}>
        {fmtUsd(delta)} ({fmtPct(deltaPct)})
      </p>
    </div>
  );
}
