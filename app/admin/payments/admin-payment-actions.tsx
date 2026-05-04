"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "idle" | "confirm" | "refund";

export function AdminPaymentActions({
  paymentId,
  status,
  amountReceived,
}: {
  paymentId: string;
  status?: string;
  amountReceived?: number | null;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [txHash, setTxHash] = useState("");
  const [amountInput, setAmountInput] = useState(amountReceived ? String(amountReceived) : "");
  const [refundTx, setRefundTx] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [downgrade, setDowngrade] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!txHash || !amountInput) {
      setError("Completează TX hash și suma primită.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: paymentId,
          tx_hash: txHash,
          amount_received: Number(amountInput),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la confirmare.");
        return;
      }

      router.refresh();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    const refundAmount = Number(amountInput);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setError("Sumă refund invalidă.");
      return;
    }

    if (!confirm(`Sigur vrei să marchezi refund de ${refundAmount}? Asta nu poate fi automat anulat.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id: paymentId,
          refunded_amount: refundAmount,
          refund_tx_hash: refundTx || null,
          reason: refundReason || null,
          downgrade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la refund.");
        return;
      }

      router.refresh();
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "idle") {
    return (
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        {status === "pending" && (
          <button
            className="rounded-lg bg-accent-emerald/10 px-3 py-1 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald/20"
            onClick={() => setMode("confirm")}
            type="button"
          >
            Confirmă manual
          </button>
        )}
        {status === "confirmed" && (
          <button
            className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20"
            onClick={() => setMode("refund")}
            type="button"
          >
            Marchează refund
          </button>
        )}
      </div>
    );
  }

  if (mode === "confirm") {
    return (
      <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500"
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="TX Hash"
          value={txHash}
        />
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500"
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder="Sumă primită (ex: 49.347)"
          type="number"
          step="0.001"
          value={amountInput}
        />
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-accent-emerald px-3 py-1.5 text-xs font-semibold text-crypto-dark hover:bg-accent-soft disabled:opacity-50"
            disabled={loading}
            onClick={handleConfirm}
            type="button"
          >
            {loading ? "Se confirmă..." : "Confirmă"}
          </button>
          <button
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
            onClick={() => setMode("idle")}
            type="button"
          >
            Anulează
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">Refund</p>
      <input
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500"
        onChange={(e) => setAmountInput(e.target.value)}
        placeholder="Sumă refundată"
        type="number"
        step="0.001"
        value={amountInput}
      />
      <input
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500"
        onChange={(e) => setRefundTx(e.target.value)}
        placeholder="TX hash refund (opțional)"
        value={refundTx}
      />
      <textarea
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-slate-500"
        onChange={(e) => setRefundReason(e.target.value)}
        placeholder="Motiv (opțional)"
        rows={2}
        value={refundReason}
      />
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input
          checked={downgrade}
          onChange={(e) => setDowngrade(e.target.checked)}
          type="checkbox"
        />
        Downgrade utilizator la free
      </label>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          disabled={loading}
          onClick={handleRefund}
          type="button"
        >
          {loading ? "Se procesează..." : "Confirmă refund"}
        </button>
        <button
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
          onClick={() => setMode("idle")}
          type="button"
        >
          Anulează
        </button>
      </div>
    </div>
  );
}
