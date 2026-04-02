"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPaymentActions({ paymentId }: { paymentId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = async () => {
    if (!txHash || !amountReceived) {
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
          amount_received: Number(amountReceived),
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

  if (!showForm) {
    return (
      <button
        className="mt-2 rounded-lg bg-accent-emerald/10 px-3 py-1 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald/20"
        onClick={() => setShowForm(true)}
        type="button"
      >
        Confirmă manual
      </button>
    );
  }

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
        onChange={(e) => setAmountReceived(e.target.value)}
        placeholder="Sumă primită (ex: 49.347)"
        type="number"
        step="0.001"
        value={amountReceived}
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
          onClick={() => setShowForm(false)}
          type="button"
        >
          Anulează
        </button>
      </div>
    </div>
  );
}
