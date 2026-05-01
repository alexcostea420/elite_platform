"use client";

import { useState } from "react";

const TOPICS = [
  "TradingView de la zero",
  "Cum îți alegi monedele",
  "Cum îți urmărești portofoliul",
  "Risk management",
  "Cum filtrezi zgomotul",
  "Macro & ciclu Bitcoin",
  "Altele (descriu mai jos)",
];

const PACKAGES = [
  { value: "single", label: "1 oră · €75" },
  { value: "triple", label: "Pachet 3 ore · €197" },
];

const EXPERIENCE = [
  { value: "beginner", label: "Începător (sub 6 luni)" },
  { value: "intermediate", label: "Intermediar (6 luni - 2 ani)" },
  { value: "advanced", label: "Avansat (peste 2 ani, vreau coaching pe execuție)" },
];

export function BookingForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      package: formData.get("package") as string,
      topic: formData.get("topic") as string,
      experience: formData.get("experience") as string,
      details: formData.get("details") as string,
      preferred_time: formData.get("preferred_time") as string,
    };

    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Eroare. Încearcă din nou.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-emerald bg-accent-emerald/10">
          <span className="text-3xl text-accent-emerald">✓</span>
        </div>
        <h3 className="text-xl font-bold text-white">Cererea a fost trimisă</h3>
        <p className="mt-3 text-sm text-slate-300">
          Te contactez în maxim 24h pe email cu opțiuni de oră și instrucțiuni de plată.
        </p>
        <p className="mt-4 text-xs text-slate-500">Verifică și folder-ul de spam, te rog.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {/* Name */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="name">
          Nume
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          placeholder="Ion Popescu"
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        />
      </div>

      {/* Email */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="email@exemplu.com"
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        />
      </div>

      {/* Package */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
          Pachet
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          {PACKAGES.map((pkg, i) => (
            <label
              key={pkg.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 transition has-[:checked]:border-accent-emerald has-[:checked]:bg-accent-emerald/10"
            >
              <input
                type="radio"
                name="package"
                value={pkg.value}
                required
                defaultChecked={i === 1}
                className="accent-accent-emerald"
              />
              <span className="text-sm text-white">{pkg.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="experience">
          Nivel de experiență
        </label>
        <select
          id="experience"
          name="experience"
          required
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        >
          <option value="">Alege nivelul</option>
          {EXPERIENCE.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Topic */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="topic">
          Tema principală
        </label>
        <select
          id="topic"
          name="topic"
          required
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        >
          <option value="">Alege o temă</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Details */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="details">
          Spune-mi mai multe (opțional)
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          maxLength={1000}
          placeholder="Ce vrei să rezolvi? Ce ai încercat deja? Ce instrumente folosești? Cu cât mai concret, cu atât pot pregăti o ședință mai utilă."
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        />
      </div>

      {/* Preferred time */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald" htmlFor="preferred_time">
          Când îți convine? (opțional)
        </label>
        <input
          id="preferred_time"
          name="preferred_time"
          type="text"
          maxLength={200}
          placeholder="Ex: săptămâna viitoare seara după 19:00, sau weekend dimineața"
          className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="accent-button w-full py-3 text-base font-bold disabled:opacity-60"
      >
        {status === "loading" ? "Se trimite..." : "Trimite cererea"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Nu se face plată acum. Plata o discutăm pe email după ce confirmăm ora.
      </p>
    </form>
  );
}
