"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrialButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  async function handleActivate() {
    setLoading(true);
    setError(null);
    setReason(null);

    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        router.refresh();
        return;
      }

      setError(data.error ?? "Eroare la activare.");
      if (data.reason) setReason(data.reason);
    } catch {
      setError("Eroare de rețea. Verifică conexiunea și încearcă din nou.");
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
      {error && (
        <div className="mt-2">
          <p className="text-sm text-red-400">{error}</p>
          {reason === "discord_required" && (
            <a
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4752C4]"
              href="/auth/discord/start"
            >
              Conectează Discord →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
