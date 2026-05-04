"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function TrialActivateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
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
      if (data.reason === "taken" || res.status === 429) {
        setAvailable(false);
      } else if (res.status >= 500) {
        try {
          const s = await fetch("/api/trial/status").then((r) => r.json());
          setAvailable(s.available);
        } catch {
          // ignore
        }
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
