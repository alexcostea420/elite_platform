"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getTimeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "acum";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function TrialButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [nextReset, setNextReset] = useState<string>("");
  const [, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/trial/status")
      .then((r) => r.json())
      .then((d) => {
        setAvailable(d.available);
        setNextReset(d.next_reset ?? "");
      })
      .catch(() => setAvailable(true));
  }, []);

  // Update countdown every minute
  useEffect(() => {
    if (!nextReset || available) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, [nextReset, available]);

  async function handleActivate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        router.refresh();
        return;
      }

      setError(data.error ?? "Eroare la activare.");

      if (data.reason === "taken" || res.status === 429) {
        setAvailable(false);
        if (data.next_reset) setNextReset(data.next_reset);
      } else if (res.status >= 500) {
        // Server error: re-sync the global slot state so the UI is honest
        try {
          const s = await fetch("/api/trial/status").then((r) => r.json());
          setAvailable(s.available);
          if (s.next_reset) setNextReset(s.next_reset);
        } catch {
          // ignore
        }
      }
    } catch {
      setError("Eroare de rețea. Verifică conexiunea și încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }

  if (available === null) {
    return (
      <div className="animate-pulse rounded-xl bg-white/5 px-8 py-4 text-lg font-bold text-slate-600">
        Se verifică...
      </div>
    );
  }

  if (!available) {
    return (
      <div className="text-center">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4">
          <p className="text-sm font-semibold text-amber-400">
            Trial-ul de azi a fost deja luat
          </p>
          {nextReset && (
            <p className="mt-1 text-xs text-slate-500">
              Următorul trial disponibil în <span className="font-mono text-white">{getTimeUntil(nextReset)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <button
          className="accent-button whitespace-nowrap px-8 py-4 text-lg font-bold disabled:opacity-50"
          disabled={loading}
          onClick={handleActivate}
          type="button"
        >
          {loading ? "Se activează..." : "Activează 7 Zile Gratuit →"}
        </button>
        <span className="absolute -right-2 -top-2 flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">1</span>
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-slate-600">Un singur trial disponibil pe zi</p>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
