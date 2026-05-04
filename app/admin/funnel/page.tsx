import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Funnel",
  description: "Conversie semnături → trial → plătit.",
  keywords: ["admin funnel"],
  path: "/admin/funnel",
  host: "admin",
  index: false,
});

type ProfileRow = {
  id: string;
  subscription_tier: string;
  subscription_status: string;
  trial_used_at: string | null;
  elite_since: string | null;
  created_at: string;
  is_veteran: boolean;
};

type PaymentRow = {
  user_id: string;
  status: string;
  amount_received: number | null;
  confirmed_at: string | null;
  created_at: string;
};

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pct(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

// Free trial real a fost lansat pe 1 mai 2026. Înainte, trial_used_at a fost setat
// pe migrări Patreon și veterani — acelea nu sunt trial-uri reale.
const TRIAL_LAUNCH_DATE = "2026-05-01T00:00:00Z";

function isRealTrial(trialIso: string | null): trialIso is string {
  if (!trialIso) return false;
  return trialIso >= TRIAL_LAUNCH_DATE;
}

export default async function AdminFunnelPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/funnel");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const service = createServiceRoleSupabaseClient();
  const [profilesRes, paymentsRes] = await Promise.all([
    service
      .from("profiles")
      .select("id, subscription_tier, subscription_status, trial_used_at, elite_since, created_at, is_veteran"),
    service
      .from("payments")
      .select("user_id, status, amount_received, confirmed_at, created_at"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  const paidUserIds = new Set(
    payments.filter((p) => p.status === "confirmed").map((p) => p.user_id),
  );

  const totalSignups = profiles.length;
  const trialActivated = profiles.filter((p) => isRealTrial(p.trial_used_at)).length;
  const becameElite = profiles.filter((p) => p.subscription_tier === "elite").length;
  const paidViaCrypto = paidUserIds.size;
  const trialAndPaid = profiles.filter((p) => isRealTrial(p.trial_used_at) && paidUserIds.has(p.id)).length;
  const eliteNoPayment = profiles.filter(
    (p) => p.subscription_tier === "elite" && !paidUserIds.has(p.id),
  ).length;

  const trialActivationRate = pct(trialActivated, totalSignups);
  const trialToEliteRate = pct(trialAndPaid, trialActivated);
  const overallConversion = pct(becameElite, totalSignups);

  const monthly = new Map<string, { signups: number; trials: number; elite: number; paid: number }>();
  for (const p of profiles) {
    const key = monthKey(p.created_at);
    const cur = monthly.get(key) ?? { signups: 0, trials: 0, elite: 0, paid: 0 };
    cur.signups += 1;
    if (isRealTrial(p.trial_used_at) && monthKey(p.trial_used_at) === key) cur.trials += 1;
    if (p.elite_since && monthKey(p.elite_since) === key) cur.elite += 1;
    monthly.set(key, cur);
  }
  for (const pay of payments) {
    if (pay.status !== "confirmed" || !pay.confirmed_at) continue;
    const key = monthKey(pay.confirmed_at);
    const cur = monthly.get(key) ?? { signups: 0, trials: 0, elite: 0, paid: 0 };
    cur.paid += 1;
    monthly.set(key, cur);
  }

  const monthlyRows = Array.from(monthly.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12);

  const stages = [
    { label: "Înregistrări", count: totalSignups, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
    { label: "Trial activat", count: trialActivated, color: "bg-purple-500/10 text-purple-400 border-purple-500/30", percent: trialActivationRate },
    { label: "Elite (orice sursă)", count: becameElite, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", percent: overallConversion },
    { label: "Plătit cripto", count: paidViaCrypto, color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/30", percent: pct(paidViaCrypto, totalSignups) },
  ];

  return (
    <>
      <Navbar mode="dashboard" isAdmin userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="min-h-screen bg-surface-night pb-16 pt-24">
        <Container className="max-w-6xl">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Admin · Customer Success
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Funnel de conversie
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              De la înregistrare la plată. Tot drumul pe etape, lună de lună.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Trial-urile sunt numărate doar de la 1 mai 2026 (lansare reală).
              Migrările de la Patreon și veterani din aprilie sunt excluse.
            </p>
          </header>

          <section className="glass-card mb-6 p-5 md:p-7">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Pipeline
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Etape (cumulativ, all-time)</h2>
            </div>

            <div className="space-y-3">
              {stages.map((s, i) => {
                const widthPct = totalSignups > 0 ? Math.round((s.count / totalSignups) * 100) : 0;
                return (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-data text-xs font-bold tabular-nums text-slate-500">{i + 1}.</span>
                        <span className="text-sm font-semibold text-white">{s.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-data text-xl font-bold tabular-nums text-white">{s.count}</span>
                        {typeof s.percent === "number" && (
                          <span className="text-xs text-slate-500">({s.percent}% din pasul anterior)</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.03]">
                      <div
                        className={`h-full rounded-full border ${s.color}`}
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Activare Trial</p>
                <p className="mt-0.5 font-data text-lg font-bold tabular-nums text-purple-400">{trialActivationRate}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trial → Plătit</p>
                <p className="mt-0.5 font-data text-lg font-bold tabular-nums text-emerald-400">{trialToEliteRate}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Conversie Totală</p>
                <p className="mt-0.5 font-data text-lg font-bold tabular-nums text-amber-400">{overallConversion}%</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Elite fără plată</p>
                <p className="mt-0.5 font-data text-lg font-bold tabular-nums text-slate-200">{eliteNoPayment}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">invitați + Patreon</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-5 md:p-7">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Pe luni
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Funnel lunar</h2>
              <p className="mt-1 text-xs text-slate-500">
                Etapele se atribuie lunii în care s-au întâmplat. &quot;Trial&quot; și &quot;Elite&quot; arată membrii care au făcut acel pas în acea lună (nu doar cei care s-au înregistrat atunci).
              </p>
            </div>

            {monthlyRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Nu există date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Lună</th>
                      <th className="py-2 pr-4 text-right font-semibold">Înregistr.</th>
                      <th className="py-2 pr-4 text-right font-semibold">Trial</th>
                      <th className="py-2 pr-4 text-right font-semibold">Elite</th>
                      <th className="py-2 pr-4 text-right font-semibold">Plăți</th>
                      <th className="py-2 text-right font-semibold">Trial%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRows.map(([key, c]) => {
                      const trialPct = pct(c.trials, c.signups);
                      return (
                        <tr className="border-b border-white/5" key={key}>
                          <td className="py-3 pr-4 font-mono text-slate-300">{key}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-slate-200">{c.signups}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-purple-400">{c.trials}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-emerald-400">{c.elite}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-yellow-400">{c.paid}</td>
                          <td className="py-3 text-right font-data font-bold tabular-nums text-slate-300">
                            {c.signups > 0 ? `${trialPct}%` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
