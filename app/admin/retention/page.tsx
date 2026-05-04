import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Retenție",
  description: "Cine expiră curând și cohortele de reînnoire.",
  keywords: ["admin retentie"],
  path: "/admin/retention",
  host: "admin",
  index: false,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  discord_username: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  is_veteran: boolean;
  elite_since: string | null;
  created_at: string;
};

function fmtRoDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminRetentionPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/retention");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const service = createServiceRoleSupabaseClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, discord_username, subscription_tier, subscription_status, subscription_expires_at, is_veteran, elite_since, created_at");

  const all = (profiles ?? []) as ProfileRow[];
  const elite = all.filter((p) => p.subscription_tier === "elite");

  const now = Date.now();
  const dayMs = 86_400_000;

  function bucketByDays(min: number, max: number) {
    return elite
      .filter((p) => {
        if (!p.subscription_expires_at) return false;
        const days = (new Date(p.subscription_expires_at).getTime() - now) / dayMs;
        return days > min && days <= max;
      })
      .sort((a, b) => new Date(a.subscription_expires_at!).getTime() - new Date(b.subscription_expires_at!).getTime());
  }

  const expiring7 = bucketByDays(0, 7);
  const expiring14 = bucketByDays(7, 14);
  const expiring30 = bucketByDays(14, 30);
  const expired = elite
    .filter((p) => p.subscription_expires_at && new Date(p.subscription_expires_at).getTime() <= now)
    .sort((a, b) => new Date(b.subscription_expires_at!).getTime() - new Date(a.subscription_expires_at!).getTime())
    .slice(0, 20);

  const cohorts = new Map<string, { joined: number; stillActive: number }>();
  for (const p of elite) {
    if (!p.elite_since) continue;
    const d = new Date(p.elite_since);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = cohorts.get(key) ?? { joined: 0, stillActive: 0 };
    cur.joined += 1;
    if (
      p.subscription_status === "active" &&
      p.subscription_expires_at &&
      new Date(p.subscription_expires_at).getTime() > now
    ) {
      cur.stillActive += 1;
    }
    cohorts.set(key, cur);
  }
  const cohortRows = Array.from(cohorts.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 12);

  const totalAtRisk = expiring7.length + expiring14.length;
  const veteranAtRisk = [...expiring7, ...expiring14].filter((p) => p.is_veteran).length;

  function MemberLine({ p, urgent }: { p: ProfileRow; urgent: boolean }) {
    const days = p.subscription_expires_at
      ? Math.ceil((new Date(p.subscription_expires_at).getTime() - now) / dayMs)
      : 0;
    const display = p.full_name || p.discord_username || "-";
    return (
      <Link
        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
        href={`/admin/members/${p.id}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{display}</p>
          {p.discord_username && (
            <p className="truncate text-xs text-slate-500">@{p.discord_username}</p>
          )}
        </div>
        <div className="ml-3 flex items-center gap-2 text-right">
          {p.is_veteran && (
            <span className="rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">VET</span>
          )}
          <div>
            <p className={`font-data text-sm font-bold tabular-nums ${urgent ? "text-amber-400" : "text-slate-300"}`}>
              {days > 0 ? `${days}z` : "expirat"}
            </p>
            <p className="text-[10px] text-slate-600">{fmtRoDate(p.subscription_expires_at)}</p>
          </div>
        </div>
      </Link>
    );
  }

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
              Retenție
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Cine expiră în următoarele 30 zile și cum se reînnoiește pe cohorte lunare.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">≤ 7 zile</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-amber-400">{expiring7.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">8–14 zile</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-amber-300">{expiring14.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">15–30 zile</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-slate-200">{expiring30.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Risc total ≤14z</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-red-400">{totalAtRisk}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{veteranAtRisk} veterani</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Urgent
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Expiră în ≤ 7 zile</h2>
              </div>
              {expiring7.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Niciun membru în această fereastră. 👌</p>
              ) : (
                <div className="space-y-2">
                  {expiring7.map((p) => <MemberLine key={p.id} p={p} urgent />)}
                </div>
              )}
            </section>

            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Atenție
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">8 – 14 zile</h2>
              </div>
              {expiring14.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Nimeni în acest interval.</p>
              ) : (
                <div className="space-y-2">
                  {expiring14.map((p) => <MemberLine key={p.id} p={p} urgent={false} />)}
                </div>
              )}
            </section>

            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Pipeline
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">15 – 30 zile</h2>
              </div>
              {expiring30.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Nimeni în acest interval.</p>
              ) : (
                <div className="space-y-2">
                  {expiring30.map((p) => <MemberLine key={p.id} p={p} urgent={false} />)}
                </div>
              )}
            </section>
          </div>

          <section className="glass-card mt-6 p-5 md:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Cohorte
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Reținere pe luna primei activări</h2>
              <p className="mt-1 text-xs text-slate-500">
                Membrii sunt grupați după luna în care au devenit Elite prima dată. Coloana &quot;activ&quot; arată câți încă au abonament valid acum.
              </p>
            </div>

            {cohortRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Nu există date de cohortă încă.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Lună</th>
                      <th className="py-2 pr-4 text-right font-semibold">Activați</th>
                      <th className="py-2 pr-4 text-right font-semibold">Încă activi</th>
                      <th className="py-2 text-right font-semibold">Retenție</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortRows.map(([key, c]) => {
                      const pct = c.joined > 0 ? Math.round((c.stillActive / c.joined) * 100) : 0;
                      const tone = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400";
                      return (
                        <tr className="border-b border-white/5" key={key}>
                          <td className="py-3 pr-4 font-mono text-slate-300">{key}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-slate-200">{c.joined}</td>
                          <td className="py-3 pr-4 text-right font-data tabular-nums text-slate-200">{c.stillActive}</td>
                          <td className={`py-3 text-right font-data font-bold tabular-nums ${tone}`}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {expired.length > 0 && (
            <section className="glass-card mt-6 p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Win-back
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Recent expirați (top 20)</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {expired.map((p) => <MemberLine key={p.id} p={p} urgent={false} />)}
              </div>
            </section>
          )}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
