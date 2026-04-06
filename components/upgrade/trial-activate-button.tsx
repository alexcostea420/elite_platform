"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrialActivateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      }
    } catch {
      setError("Eroare de conexiune.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="inline-flex items-center gap-2 rounded-xl bg-accent-emerald px-8 py-4 text-lg font-bold text-crypto-dark transition-colors hover:bg-accent-soft disabled:opacity-50"
        disabled={loading}
        onClick={activate}
        type="button"
      >
        {loading ? "Se activeaza..." : "Activeaza Trial Gratuit →"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
