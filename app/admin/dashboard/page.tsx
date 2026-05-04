import { redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  // Fetch all data
  const [
    { data: allProfiles },
    { data: payments },
    { data: recentSignups },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, discord_username, subscription_tier, subscription_status, subscription_expires_at, is_veteran, created_at")
      .order("subscription_expires_at", { ascending: true }),
    supabase
      .from("payments")
      .select("amount_received, status, plan_duration, confirmed_at")
      .eq("status", "confirmed"),
    supabase
      .from("profiles")
      .select("full_name, discord_username, subscription_tier, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profiles = allProfiles ?? [];
  const confirmedPayments = payments ?? [];
  const recent = recentSignups ?? [];

  const now = new Date();
  const eliteMembers = profiles.filter((p) => p.subscription_tier === "elite");
  const veterans = eliteMembers.filter((p) => p.is_veteran);
  const expiringSoon = eliteMembers.filter((p) => {
    if (!p.subscription_expires_at) return false;
    const exp = new Date(p.subscription_expires_at);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  });
  const expiring30 = eliteMembers.filter((p) => {
    if (!p.subscription_expires_at) return false;
    const diff = (new Date(p.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  });

  const totalRevenue = confirmedPayments.reduce((sum, p) => sum + (Number(p.amount_received) || 0), 0);
  const monthlyRevenue = confirmedPayments
    .filter((p) => p.confirmed_at && new Date(p.confirmed_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, p) => sum + (Number(p.amount_received) || 0), 0);

  // MRR estimate: monthly payers * avg price
  const monthlyPayers = eliteMembers.filter((p) => {
    if (!p.subscription_expires_at) return false;
    const diff = (new Date(p.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 35;
  });
  const veteranMonthly = monthlyPayers.filter((p) => p.is_veteran).length;
  const normalMonthly = monthlyPayers.length - veteranMonthly;
  const estimatedMRR = veteranMonthly * 33 + normalMonthly * 49;

  return (
    <>
      <Navbar mode="dashboard" isAdmin={true} userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-slate-400">Statistici si membrii platitori</p>
          </div>

          {/* CRM Quick Links */}
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <a className="glass-card flex items-center justify-between p-4 transition-colors hover:bg-white/[0.04]" href="/admin/members">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400">Customer 360</p>
                <p className="mt-1 text-base font-bold text-white">Membri</p>
                <p className="text-xs text-slate-500">Listă cu căutare + filtre</p>
              </div>
              <span className="text-2xl">→</span>
            </a>
            <a className="glass-card flex items-center justify-between p-4 transition-colors hover:bg-white/[0.04]" href="/admin/retention">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400">Retenție</p>
                <p className="mt-1 text-base font-bold text-white">Cine expiră</p>
                <p className="text-xs text-slate-500">7/14/30 zile + cohorte</p>
              </div>
              <span className="text-2xl">→</span>
            </a>
            <a className="glass-card flex items-center justify-between p-4 transition-colors hover:bg-white/[0.04]" href="/admin/funnel">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-400">Funnel</p>
                <p className="mt-1 text-base font-bold text-white">Conversie</p>
                <p className="text-xs text-slate-500">Signup → Trial → Plătit</p>
              </div>
              <span className="text-2xl">→</span>
            </a>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">MRR Estimat</p>
              <p className="mt-2 text-3xl font-bold text-accent-emerald">${estimatedMRR}</p>
              <p className="mt-1 text-xs text-slate-500">{veteranMonthly} veterani + {normalMonthly} normali</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Elite</p>
              <p className="mt-2 text-3xl font-bold text-white">{eliteMembers.length}</p>
              <p className="mt-1 text-xs text-slate-500">{veterans.length} veterani</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue Total</p>
              <p className="mt-2 text-3xl font-bold text-white">${totalRevenue.toFixed(0)}</p>
              <p className="mt-1 text-xs text-slate-500">${monthlyRevenue.toFixed(0)} ultima luna</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expira Curand</p>
              <p className="mt-2 text-3xl font-bold text-amber-400">{expiringSoon.length}</p>
              <p className="mt-1 text-xs text-slate-500">{expiring30.length} in 30 zile</p>
            </div>
          </div>

          {/* Expiring Soon Alert */}
          {expiringSoon.length > 0 && (
            <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h2 className="text-lg font-bold text-amber-400">Expira in 7 zile</h2>
              <div className="mt-3 space-y-2">
                {expiringSoon.map((m) => {
                  const days = Math.ceil((new Date(m.subscription_expires_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
                      <div>
                        <span className="font-medium text-white">{m.discord_username || m.full_name || "?"}</span>
                        {m.is_veteran && <span className="ml-2 rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400">Veteran</span>}
                      </div>
                      <span className="text-sm font-bold text-amber-400">{days} zile</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Activitate Recenta</h2>
            <div className="mt-3 space-y-2">
              {recent.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${m.subscription_tier === "elite" ? "bg-green-500" : "bg-slate-500"}`} />
                    <span className="text-sm text-white">{m.discord_username || m.full_name || "?"}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${m.subscription_tier === "elite" ? "text-accent-emerald" : "text-slate-500"}`}>
                      {m.subscription_tier === "elite" ? "Elite" : "Free"}
                    </span>
                    <p className="text-xs text-slate-600">
                      {new Date(m.created_at).toLocaleDateString("ro-RO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Members Table */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-bold text-white">Toti Membrii Elite ({eliteMembers.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4">Nume/Discord</th>
                    <th className="pb-3 pr-4">Veteran</th>
                    <th className="pb-3 pr-4">Zile</th>
                    <th className="pb-3 pr-4">Expira</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eliteMembers
                    .sort((a, b) => {
                      const da = a.subscription_expires_at ? new Date(a.subscription_expires_at).getTime() : 0;
                      const db = b.subscription_expires_at ? new Date(b.subscription_expires_at).getTime() : 0;
                      return da - db;
                    })
                    .map((m) => {
                      const days = m.subscription_expires_at
                        ? Math.max(0, Math.ceil((new Date(m.subscription_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                        : 0;
                      const urgent = days <= 7;
                      const warning = days <= 30;
                      return (
                        <tr key={m.id} className="border-b border-white/5">
                          <td className="py-3 pr-4">
                            <span className="font-medium text-white">{m.discord_username || m.full_name || "?"}</span>
                          </td>
                          <td className="py-3 pr-4">
                            {m.is_veteran ? (
                              <span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs font-semibold text-yellow-400">DA</span>
                            ) : (
                              <span className="text-xs text-slate-600">NU</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-white"}`}>
                              {days}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-400">
                            {m.subscription_expires_at
                              ? new Date(m.subscription_expires_at).toLocaleDateString("ro-RO")
                              : "-"}
                          </td>
                          <td className="py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              m.subscription_status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {m.subscription_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
