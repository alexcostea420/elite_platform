"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrialButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error ?? "Eroare la activare.");
      }
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="accent-button whitespace-nowrap px-8 py-4 text-lg font-bold disabled:opacity-50"
        disabled={loading}
        onClick={handleActivate}
        type="button"
      >
        {loading ? "Se activează..." : "Activează 7 Zile Gratuit →"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
