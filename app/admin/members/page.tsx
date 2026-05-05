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
  title: "Admin · Membri",
  description: "Lista membrilor cu filtre și căutare.",
  keywords: ["admin membri"],
  path: "/admin/members",
  host: "admin",
  index: false,
});

type Filter = "all" | "elite" | "trial" | "free" | "expiring" | "no-discord";

type MembersPageProps = {
  searchParams?: { q?: string; filter?: Filter };
};

type MemberRow = {
  id: string;
  full_name: string | null;
  discord_username: string | null;
  discord_user_id: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  is_veteran: boolean;
  elite_since: string | null;
  trial_used_at: string | null;
  created_at: string;
  email: string | null;
};

const FILTER_LABELS: Record<Filter, string> = {
  all: "Toți",
  elite: "Elite",
  trial: "Trial",
  free: "Free",
  expiring: "Expiră ≤7z",
  "no-discord": "Fără Discord",
};

export default async function AdminMembersPage({ searchParams }: MembersPageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/members");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const filter: Filter = (searchParams?.filter as Filter) ?? "all";
  const q = (searchParams?.q ?? "").trim().toLowerCase();

  const service = createServiceRoleSupabaseClient();
  const { data: profiles } = await service
    .from("profiles")
    .select("id, full_name, discord_username, discord_user_id, subscription_tier, subscription_status, subscription_expires_at, is_veteran, elite_since, trial_used_at, created_at")
    .order("created_at", { ascending: false });

  const ids = (profiles ?? []).map((p) => p.id);
  const emailMap = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: authUsers } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authUsers?.users ?? []) {
      emailMap.set(u.id, u.email ?? null);
    }
  }

  const now = Date.now();
  const rows: MemberRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    discord_username: p.discord_username,
    discord_user_id: p.discord_user_id,
    subscription_tier: p.subscription_tier,
    subscription_status: p.subscription_status,
    subscription_expires_at: p.subscription_expires_at,
    is_veteran: p.is_veteran,
    elite_since: p.elite_since,
    trial_used_at: p.trial_used_at,
    created_at: p.created_at,
    email: emailMap.get(p.id) ?? null,
  }));

  const filtered = rows.filter((r) => {
    if (filter === "elite" && r.subscription_tier !== "elite") return false;
    if (filter === "trial" && r.subscription_status !== "trial") return false;
    if (filter === "free" && r.subscription_tier !== "free") return false;
    if (filter === "expiring") {
      if (!r.subscription_expires_at) return false;
      const days = (new Date(r.subscription_expires_at).getTime() - now) / 86_400_000;
      if (!(days > 0 && days <= 7)) return false;
    }
    if (filter === "no-discord" && r.discord_user_id) return false;
    if (q) {
      const haystack = [r.full_name, r.discord_username, r.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalElite = rows.filter((r) => r.subscription_tier === "elite").length;
  const totalTrial = rows.filter((r) => r.subscription_status === "trial").length;
  const totalExpiring = rows.filter((r) => {
    if (!r.subscription_expires_at) return false;
    const days = (new Date(r.subscription_expires_at).getTime() - now) / 86_400_000;
    return days > 0 && days <= 7;
  }).length;

  function buildHref(nextFilter: Filter, nextQ?: string) {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  return (
    <>
      <Navbar mode="dashboard" isAdmin userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="min-h-screen bg-surface-night pb-16 pt-24">
        <Container className="max-w-7xl">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Admin · Customer Success
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Membri
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Toți cei {rows.length} membri ai platformei. Caută și filtrează rapid.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Total</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white">{rows.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Elite</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-accent-emerald">{totalElite}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">În Trial</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-blue-400">{totalTrial}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Expiră ≤7z</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-amber-400">{totalExpiring}</p>
            </div>
          </div>

          <form action="/admin/members" className="mb-4">
            <input type="hidden" name="filter" value={filter} />
            <input
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-accent-emerald/40 focus:outline-none"
              defaultValue={q}
              name="q"
              placeholder="Caută după nume, Discord username, email..."
              type="search"
            />
          </form>

          <div className="mb-6 flex flex-wrap gap-1.5">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => {
              const active = filter === f;
              return (
                <Link
                  key={f}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                  href={buildHref(f, q || undefined)}
                >
                  {FILTER_LABELS[f]}
                </Link>
              );
            })}
          </div>

          <section className="glass-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <th className="px-4 py-3 font-semibold">Membru</th>
                    <th className="px-4 py-3 font-semibold">Tier</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Expiră</th>
                    <th className="px-4 py-3 text-right font-semibold">Înregistrat</th>
                    <th className="px-4 py-3 font-semibold">Discord</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={6}>
                        Nu s-a găsit niciun membru cu acest filtru.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const days = m.subscription_expires_at
                        ? Math.ceil((new Date(m.subscription_expires_at).getTime() - now) / 86_400_000)
                        : null;
                      const expired = days !== null && days <= 0;
                      const urgent = days !== null && days > 0 && days <= 7;
                      const display = m.full_name || m.discord_username || m.email?.split("@")[0] || "-";
                      return (
                        <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.02]" key={m.id}>
                          <td className="px-4 py-3">
                            <Link className="block" href={`/admin/members/${m.id}`}>
                              <div className="font-semibold text-white">{display}</div>
                              <div className="text-xs text-slate-500">{m.email ?? "-"}</div>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                              m.subscription_tier === "elite"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-white/5 text-slate-500"
                            }`}>
                              {m.subscription_tier === "elite" ? "Elite" : "Free"}
                              {m.is_veteran && (
                                <span className="rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[9px] text-yellow-400">VET</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-semibold ${
                              m.subscription_status === "active" ? "text-emerald-400" :
                              m.subscription_status === "trial" ? "text-blue-400" :
                              "text-slate-500"
                            }`}>
                              {m.subscription_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {m.subscription_expires_at ? (
                              <div>
                                <div className={`font-data tabular-nums ${
                                  expired ? "text-red-400" : urgent ? "text-amber-400" : "text-slate-300"
                                }`}>
                                  {days! > 0 ? `${days}z` : "expirat"}
                                </div>
                                <div className="text-[10px] text-slate-600">
                                  {new Date(m.subscription_expires_at).toLocaleDateString("ro-RO")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-slate-400">
                            {new Date(m.created_at).toLocaleDateString("ro-RO")}
                          </td>
                          <td className="px-4 py-3">
                            {m.discord_username ? (
                              <span className="text-xs text-slate-300">@{m.discord_username}</span>
                            ) : (
                              <span className="text-xs text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-4 text-xs text-slate-500">
            Afișează {filtered.length} din {rows.length}. Click pe orice membru pentru Customer 360.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
