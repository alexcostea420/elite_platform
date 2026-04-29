"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AddTransactionModal } from "./add-transaction-modal";
import { AllocationChart } from "./allocation-chart";
import { HoldingsTable } from "./holdings-table";
import { TransactionsList } from "./transactions-list";
import { WhatIfModal, type WhatIfSeed } from "./what-if-modal";

export type Transaction = {
  id: string;
  asset_key: string;
  side: "BUY" | "SELL";
  quantity: number;
  price_usd: number;
  occurred_on: string;
  notes: string | null;
  created_at: string;
};

export type Holding = {
  asset: {
    key: string;
    type: "crypto" | "stock" | "index";
    name: string;
    symbol: string;
    group?: string;
  };
  qty: number;
  avgCostUsd: number;
  costBasisUsd: number;
  currentPriceUsd: number | null;
  currentValueUsd: number | null;
  pnlUsd: number | null;
  pnlPct: number | null;
  allocationPct: number | null;
  buyCount: number;
  sellCount: number;
  firstBuyOn: string | null;
  lastTxOn: string | null;
};

export type HoldingsResponse = {
  holdings: Holding[];
  totalValueUsd: number;
  totalCostUsd: number;
  totalPnlUsd: number;
  totalPnlPct: number;
};

export function fmtUsd(n: number, opts?: { compact?: boolean }): string {
  if (!Number.isFinite(n)) return "—";
  if (opts?.compact && Math.abs(n) >= 10000) {
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(n) < 1 ? 4 : 2,
  });
}

export function fmtPct(n: number, withSign = true): string {
  if (!Number.isFinite(n)) return "—";
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtQty(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

export function PortfolioDashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totals, setTotals] = useState({
    totalValueUsd: 0,
    totalCostUsd: 0,
    totalPnlUsd: 0,
    totalPnlPct: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [whatIfSeed, setWhatIfSeed] = useState<WhatIfSeed | null>(null);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [hRes, tRes] = await Promise.all([
        fetch("/api/portfolio/holdings", { cache: "no-store" }),
        fetch("/api/portfolio/transactions", { cache: "no-store" }),
      ]);
      if (!hRes.ok || !tRes.ok) {
        const j = await hRes.json().catch(() => ({}));
        throw new Error(j?.error || "load_failed");
      }
      const h: HoldingsResponse = await hRes.json();
      const t = await tRes.json();
      setHoldings(h.holdings ?? []);
      setTotals({
        totalValueUsd: h.totalValueUsd ?? 0,
        totalCostUsd: h.totalCostUsd ?? 0,
        totalPnlUsd: h.totalPnlUsd ?? 0,
        totalPnlPct: h.totalPnlPct ?? 0,
      });
      setTransactions(t.transactions ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Eroare la încărcare";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onAdded = useCallback(() => {
    setAddOpen(false);
    void loadAll();
  }, [loadAll]);

  const onDeleteTx = useCallback(
    async (id: string) => {
      const prev = transactions;
      setTransactions((cur) => cur.filter((t) => t.id !== id));
      try {
        const r = await fetch(`/api/portfolio/transactions/${id}`, { method: "DELETE" });
        if (!r.ok) throw new Error("delete_failed");
        void loadAll();
      } catch {
        setTransactions(prev);
        setError("Nu am putut șterge tranzacția");
      }
    },
    [transactions, loadAll],
  );

  const stats = useMemo(
    () => [
      {
        label: "Investit",
        value: fmtUsd(totals.totalCostUsd, { compact: true }),
        tone: "neutral" as const,
      },
      {
        label: "Valoare curentă",
        value: loading ? "…" : fmtUsd(totals.totalValueUsd, { compact: true }),
        tone: "neutral" as const,
      },
      {
        label: "P&L total",
        value: loading ? "…" : fmtUsd(totals.totalPnlUsd, { compact: true }),
        tone: (totals.totalPnlUsd > 0
          ? "pos"
          : totals.totalPnlUsd < 0
            ? "neg"
            : "neutral") as "pos" | "neg" | "neutral",
      },
      {
        label: "Randament",
        value: loading ? "…" : fmtPct(totals.totalPnlPct),
        tone: (totals.totalPnlPct > 0
          ? "pos"
          : totals.totalPnlPct < 0
            ? "neg"
            : "neutral") as "pos" | "neg" | "neutral",
      },
    ],
    [totals, loading],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {transactions.length === 0
            ? "Niciun istoric încă"
            : `${transactions.length} tranzacții · ${holdings.length} pozitii active`}
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
        >
          + Adaugă tranzacție
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      ) : null}

      {holdings.length === 0 && !loading ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <HoldingsTable
              holdings={holdings}
              loading={loading}
              onWhatIf={(h) => {
                const tx = transactions.find(
                  (t) => t.asset_key === h.asset.key && t.side === "BUY",
                );
                if (!tx) return;
                setWhatIfSeed({
                  originalAssetKey: h.asset.key,
                  originalAssetName: h.asset.name,
                  originalQty: tx.quantity,
                  originalPriceUsd: tx.price_usd,
                  originalDate: tx.occurred_on,
                });
              }}
            />
            <AllocationChart holdings={holdings} />
          </div>

          <TransactionsList transactions={transactions} onDelete={onDeleteTx} />
        </>
      )}

      <p className="pt-4 text-center text-xs text-slate-600">
        Tracker educațional. Performanțele trecute nu garantează rezultate viitoare.
        Datele sunt private — doar tu le vezi.
      </p>

      {addOpen ? (
        <AddTransactionModal onClose={() => setAddOpen(false)} onAdded={onAdded} />
      ) : null}
      {whatIfSeed ? (
        <WhatIfModal seed={whatIfSeed} onClose={() => setWhatIfSeed(null)} />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "pos" | "neg" | "neutral";
}) {
  const color =
    tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-data text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl">
        💼
      </div>
      <h3 className="text-lg font-bold text-white">Începe cu prima tranzacție</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Introdu o cumpărare reală — asset, cantitate, preț, dată. De acolo vezi
        cost mediu, P&amp;L, și poți compara cu &ldquo;ce-ar fi fost dacă luam altceva&rdquo;.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-400"
      >
        + Adaugă prima tranzacție
      </button>
    </div>
  );
}
