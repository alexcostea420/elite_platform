"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "elite_onboarding_completed";

const checklistItems = [
  { id: "watch_video", label: "Uita-te la primul video", description: "Incepe cu o analiza recenta - dureaza 10 minute", link: "/dashboard/videos", icon: "▶" },
  { id: "check_risk", label: "Verifica Risk Score-ul BTC", description: "Vezi daca e moment bun de acumulare", link: "/dashboard/risk-score", icon: "📊" },
  { id: "explore_stocks", label: "Exploreaza Buy/Sell zones", description: "16 actiuni cu zone clare de intrare si iesire", link: "/dashboard/stocks", icon: "📈" },
  { id: "connect_discord", label: "Conecteaza-te pe Discord", description: "Intra in comunitate si pune prima intrebare", link: "/auth/discord/start", icon: "💬" },
  { id: "explore_resurse", label: "Citeste ghidul de start rapid", description: "Tot ce trebuie sa stii ca sa incepi", link: "/dashboard/resurse", icon: "📖" },
];

export function OnboardingChecklist() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCompleted(parsed);
        if (parsed.length >= 5) setDismissed(true);
      }
    } catch {}
  }, []);

  if (!mounted || dismissed) return null;

  const progress = Math.round((completed.length / checklistItems.length) * 100);

  function toggleItem(id: string) {
    const next = completed.includes(id)
      ? completed.filter((c) => c !== id)
      : [...completed, id];
    setCompleted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (next.length >= 5) {
      setTimeout(() => setDismissed(true), 2000);
    }
  }

  function dismissAll() {
    const all = checklistItems.map((i) => i.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setDismissed(true);
  }

  if (completed.length >= 5) {
    return (
      <section className="mb-6 glass-card p-6 text-center">
        <p className="text-lg font-semibold text-accent-emerald">Esti pregatit!</p>
        <p className="mt-1 text-sm text-slate-400">Exploreaza platforma in ritmul tau.</p>
      </section>
    );
  }

  return (
    <section className="mb-6 glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Primii pasi in Elite</h3>
          <p className="text-xs text-slate-500">{completed.length}/{checklistItems.length} completate</p>
        </div>
        <button
          className="text-xs text-slate-500 hover:text-slate-300"
          onClick={dismissAll}
          type="button"
        >
          Inchide
        </button>
      </div>
      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-accent-emerald transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="space-y-2">
        {checklistItems.map((item) => {
          const isDone = completed.includes(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                isDone
                  ? "border-accent-emerald/20 bg-accent-emerald/5 opacity-60"
                  : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
              }`}
            >
              <button
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs transition-all ${
                  isDone
                    ? "border-accent-emerald bg-accent-emerald text-crypto-dark"
                    : "border-white/20 text-slate-500 hover:border-accent-emerald/50"
                }`}
                onClick={() => toggleItem(item.id)}
                type="button"
              >
                {isDone ? "✓" : item.icon}
              </button>
              <Link className="flex-1 min-w-0" href={item.link}>
                <p className={`text-sm font-medium ${isDone ? "text-slate-400 line-through" : "text-white"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
