"use client";

import { useState } from "react";

import { fmtQty, fmtUsd, type Transaction } from "./portfolio-dashboard";
import { getAsset } from "@/lib/portfolio/assets";

function formatDateRo(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransactionsList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (transactions.length === 0) return null;

  const recent = transactions.slice(0, 12);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-sm font-bold text-white">Tranzacții recente</h2>
        <p className="text-[11px] text-slate-500">
          Ultimele {recent.length} din {transactions.length}
        </p>
      </header>
      <ul className="divide-y divide-white/5">
        {recent.map((tx) => {
          const a = getAsset(tx.asset_key);
          const total = tx.quantity * tx.price_usd;
          const isBuy = tx.side === "BUY";
          return (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    isBuy
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                  title={isBuy ? "Cumpărare" : "Vânzare"}
                >
                  {isBuy ? "B" : "S"}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {a?.symbol ?? tx.asset_key}{" "}
                    <span className="text-slate-500">·</span>{" "}
                    <span className="font-data tabular-nums text-slate-300">
                      {fmtQty(tx.quantity)}
                    </span>
                    <span className="text-slate-500"> @ </span>
                    <span className="font-data tabular-nums text-slate-300">
                      {fmtUsd(tx.price_usd)}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {formatDateRo(tx.occurred_on)} · Total {fmtUsd(total)}
                    {tx.notes ? ` · ${tx.notes}` : ""}
                  </p>
                </div>
              </div>
              {confirmId === tx.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(tx.id);
                      setConfirmId(null);
                    }}
                    className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white"
                  >
                    Șterge
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400"
                  >
                    Anulează
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(tx.id)}
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] text-slate-500 transition hover:border-rose-400/30 hover:text-rose-300"
                >
                  Șterge
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
