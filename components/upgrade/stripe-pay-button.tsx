"use client";

import { useState } from "react";

type StripePayButtonProps = {
  plan: string;
  highlighted?: boolean;
};

export function StripePayButton({ plan, highlighted }: StripePayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Eroare la procesarea plății.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-colors ${
        highlighted
          ? "bg-accent-emerald text-crypto-dark hover:bg-accent-soft"
          : "bg-slate-700 text-white hover:bg-slate-600"
      } disabled:opacity-50`}
      disabled={loading}
      onClick={handleClick}
      type="button"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Se procesează...
        </>
      ) : (
        <>💳 Plătește cu cardul</>
      )}
    </button>
  );
}
