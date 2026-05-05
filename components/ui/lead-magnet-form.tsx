"use client";

import { useState } from "react";

export function LeadMagnetForm({ source = "payment_help" }: { source?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      const res = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="mt-6 text-sm font-semibold text-accent-emerald">
        Mulțumesc! Te contactez în maxim 24h.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        aria-label="Adresa ta de email"
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-accent-emerald/50"
        name="email"
        placeholder="email@exemplu.com"
        required
        type="email"
      />
      <button
        className="accent-button whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-50"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading" ? "Se trimite..." : "Contactează-mă"}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-400">Eroare. Încearcă din nou.</p>
      )}
    </form>
  );
}
