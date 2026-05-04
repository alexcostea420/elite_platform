"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrialActivateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const router = useRouter();

  async function activate() {
    setLoading(true);
    setError(null);
    setReason(null);
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setError(data.error ?? "Eroare la activare.");
      if (data.reason) setReason(data.reason);
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
        {loading ? "Se activează..." : "Activează Trial Gratuit →"}
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
