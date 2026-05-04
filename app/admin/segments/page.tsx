import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import {
  getProfilesWithTags,
  TAG_BADGE,
  TAG_LABELS,
  type ProfileLifecycleTag,
  type ProfileWithTags,
} from "@/lib/admin/segments";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Segmente",
  description: "Profilele platformei grupate pe taguri de lifecycle.",
  keywords: ["admin segmente"],
  path: "/admin/segments",
  host: "admin",
  index: false,
});

const TAG_ORDER: ProfileLifecycleTag[] = [
  "elite_active",
  "elite_veteran",
  "high_value",
  "trial_active",
  "trial_expired_no_pay",
  "churned",
  "refunded",
  "free_signup_no_trial",
];

function fmtRoDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(v: number) {
  if (v === 0) return "-";
  return `${v.toFixed(2)} €`;
}

type SearchParams = { tag?: string; q?: string };

export default async function AdminSegmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/segments");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const all = await getProfilesWithTags();

  const counts = new Map<ProfileLifecycleTag, number>();
  for (const p of all) {
    for (const t of p.tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const activeTag = (TAG_ORDER as string[]).includes(params.tag ?? "")
    ? (params.tag as ProfileLifecycleTag)
    : null;

  const q = (params.q ?? "").trim().toLowerCase();

  let filtered = activeTag ? all.filter((p) => p.tags.includes(activeTag)) : all;
  if (q) {
    filtered = filtered.filter((p) => {
      const name = (p.full_name ?? "").toLowerCase();
      const discord = (p.discord_username ?? "").toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      return name.includes(q) || discord.includes(q) || email.includes(q);
    });
  }

  filtered = filtered
    .slice()
    .sort((a, b) => {
      if (b.total_paid_net !== a.total_paid_net) return b.total_paid_net - a.total_paid_net;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 500);

  function chipHref(tag: ProfileLifecycleTag | null) {
    const sp = new URLSearchParams();
    if (tag) sp.set("tag", tag);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/admin/segments?${qs}` : "/admin/segments";
  }

  function ProfileLine({ p }: { p: ProfileWithTags }) {
    const display = p.full_name || p.discord_username || p.email || "-";
    return (
      <Link
        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
        href={`/admin/members/${p.id}`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{display}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {p.discord_username ? (
              <span className="text-[10px] text-slate-500">@{p.discord_username}</span>
            ) : null}
            {p.email ? <span className="text-[10px] text-slate-600">· {p.email}</span> : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${TAG_BADGE[t]}`}
                key={t}
              >
                {TAG_LABELS[t]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <p className="font-data text-sm font-bold tabular-nums text-emerald-300">
            {fmtMoney(p.total_paid_net)}
          </p>
          <p className="text-[10px] text-slate-600">
            {p.payment_count > 0 ? `${p.payment_count} plăți` : "fără plăți"}
          </p>
          <p className="text-[10px] text-slate-600">creat {fmtRoDate(p.created_at)}</p>
        </div>
      </Link>
    );
  }

  return (
    <>
      <Navbar
        mode="dashboard"
        isAdmin
        userIdentity={{ displayName: identity.displayName, initials: identity.initials }}
      />
      <main className="min-h-screen bg-surface-night pb-16 pt-24">
        <Container className="max-w-6xl">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Admin · Segmentare
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Segmente
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Profilele grupate pe lifecycle: Elite activ, trial, churned, refund, high value.
            </p>
          </header>

          <section className="glass-card mb-6 p-5 md:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Filtre
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Link
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTag === null
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                }`}
                href={chipHref(null)}
              >
                Toți · {all.length}
              </Link>
              {TAG_ORDER.map((t) => {
                const c = counts.get(t) ?? 0;
                const isActive = activeTag === t;
                return (
                  <Link
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? TAG_BADGE[t]
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                    href={chipHref(t)}
                    key={t}
                  >
                    {TAG_LABELS[t]} · {c}
                  </Link>
                );
              })}
            </div>

            <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
              {activeTag ? <input name="tag" type="hidden" value={activeTag} /> : null}
              <input
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
                defaultValue={q}
                name="q"
                placeholder="Caută după nume, discord sau email..."
                type="text"
              />
              <button
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
                type="submit"
              >
                Caută
              </button>
              {(activeTag || q) && (
                <Link
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/[0.04]"
                  href="/admin/segments"
                >
                  Reset
                </Link>
              )}
            </form>
          </section>

          <section className="glass-card p-5 md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Rezultate
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  {activeTag ? TAG_LABELS[activeTag] : "Toți membrii"} · {filtered.length}
                </h2>
              </div>
              <p className="text-[10px] text-slate-600">
                Sortat după total plătit (net) desc · max 500
              </p>
            </div>

            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nu există profile pentru acest filtru.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filtered.map((p) => (
                  <ProfileLine key={p.id} p={p} />
                ))}
              </div>
            )}
          </section>

          <p className="mt-4 text-[10px] text-slate-600">
            Tagurile sunt derivate live din profiles + payments. High value = ≥200 € net plătit.
            Trial activ = sub 7 zile de la trial_used_at fără elite_since.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
