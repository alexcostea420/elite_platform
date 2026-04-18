"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TrialActivateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/trial/status")
      .then((r) => r.json())
      .then((d) => setAvailable(d.available))
      .catch(() => setAvailable(true));
  }, []);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error ?? "Eroare la activare.");
        if (res.status === 429) setAvailable(false);
      }
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  }

  if (available === false) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-3 text-center">
        <p className="text-sm font-semibold text-amber-400">Trial-ul de azi a fost luat</p>
        <p className="mt-1 text-xs text-slate-500">Revino mâine la 08:00</p>
      </div>
    );
  }

  return (
    <div>
      <button
        className="inline-flex items-center gap-2 rounded-xl bg-accent-emerald px-8 py-4 text-lg font-bold text-crypto-dark transition-colors hover:bg-accent-soft disabled:opacity-50"
        disabled={loading || available === null}
        onClick={activate}
        type="button"
      >
        {loading ? "Se activează..." : available === null ? "Se verifică..." : "Activează Trial Gratuit →"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
