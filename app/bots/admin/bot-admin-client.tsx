"use client";

import { useState } from "react";

type Subscriber = {
  id: string;
  user_id: string;
  name: string;
  exchange: string;
  risk: number;
  paused: boolean;
  verified: boolean;
  bot_active: boolean;
  plan: string;
  status: string;
  daysLeft: number;
  isExpired: boolean;
  expiresAt: string;
};

async function adminAction(action: string, userId: string, days?: number) {
  const res = await fetch("/api/admin/bot-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, user_id: userId, days }),
  });
  return res.ok;
}

export function BotAdminClient({ subscribers }: { subscribers: Subscriber[] }) {
  const [subs, setSubs] = useState(subscribers);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExtend(userId: string) {
    const days = prompt("Câte zile să adaugi?", "30");
    if (!days) return;
    setLoading(userId);
    const ok = await adminAction("extend", userId, parseInt(days));
    if (ok) {
      setSubs(prev => prev.map(s => s.user_id === userId ? { ...s, daysLeft: s.daysLeft + parseInt(days), isExpired: false, status: "active" } : s));
    }
    setLoading(null);
  }

  async function handleDisable(userId: string) {
    if (!confirm("Sigur vrei să dezactivezi acest subscriber?")) return;
    setLoading(userId);
    const ok = await adminAction("disable", userId);
    if (ok) {
      setSubs(prev => prev.map(s => s.user_id === userId ? { ...s, bot_active: false, status: "disabled" } : s));
    }
    setLoading(null);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="pb-3 pr-4">User</th>
              <th className="pb-3 pr-4">Exchange</th>
              <th className="pb-3 pr-4">Risk</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Zile</th>
              <th className="pb-3 pr-4">Expiră</th>
              <th className="pb-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">Niciun subscriber încă</td>
              </tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-medium text-white">{s.name}</td>
                  <td className="py-3 pr-4 text-slate-400">{s.exchange}</td>
                  <td className="py-3 pr-4 text-slate-400">{s.risk}%</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.isExpired ? "bg-red-500/10 text-red-400"
                      : s.bot_active ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {s.isExpired ? "Expirat" : s.bot_active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`font-bold ${s.daysLeft <= 7 ? "text-red-400" : s.daysLeft <= 30 ? "text-amber-400" : "text-white"}`}>
                      {s.daysLeft}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{s.expiresAt}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-accent-emerald/10 px-3 py-1.5 text-xs font-semibold text-accent-emerald hover:bg-accent-emerald/20 disabled:opacity-50"
                        onClick={() => handleExtend(s.user_id)}
                        disabled={loading === s.user_id}
                      >
                        +Zile
                      </button>
                      <button
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                        onClick={() => handleDisable(s.user_id)}
                        disabled={loading === s.user_id}
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
