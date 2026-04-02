import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createInviteAction, deleteInviteAction } from "@/app/admin/invites/actions";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin Invitații | Gestionare Link-uri",
  description: "Generează și gestionează link-uri de invitație pentru membrii Elite.",
  keywords: ["admin invites", "invite links", "elite platform admin"],
  path: "/admin/invites",
  host: "admin",
  index: false,
});

type InviteRow = {
  id: string;
  token: string;
  plan_duration: string;
  subscription_days: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
};

type AdminInvitesPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
    tokens?: string;
    confirmDelete?: string;
  };
};

const planLabels: Record<string, string> = {
  "30_days": "30 zile ($49)",
  "90_days": "90 zile ($137)",
  "365_days": "365 zile ($497)",
  "custom": "Custom",
};

function formatDays(invite: InviteRow) {
  const label = planLabels[invite.plan_duration];
  if (invite.plan_duration === "custom") {
    return `${invite.subscription_days} zile (custom)`;
  }
  return label ?? `${invite.subscription_days} zile`;
}

const baseUrl = process.env.NODE_ENV === "production"
  ? "https://app.armatadetraderi.com"
  : "http://localhost:3000";

export default async function AdminInvitesPage({ searchParams }: AdminInvitesPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/invites");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: invites } = await serviceSupabase
    .from("invite_links")
    .select("*")
    .order("created_at", { ascending: false });

  const allInvites: InviteRow[] = invites ?? [];
  const activeInvites = allInvites.filter((i) => i.used_count < i.max_uses);
  const usedInvites = allInvites.filter((i) => i.used_count >= i.max_uses);

  const newTokens = searchParams?.tokens?.split(",").filter(Boolean) ?? [];

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Header */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <Link className="text-sm text-slate-500 hover:text-accent-emerald" href="/admin/videos">
                Admin
              </Link>
              <span className="text-slate-600">/</span>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Invitații</p>
            </div>
            <h1 className="text-4xl font-bold text-white">
              Link-uri de <span className="gradient-text">Invitație</span>
            </h1>
            <p className="mt-3 text-slate-400">
              Generează link-uri unice pentru migrarea membrilor de pe Patreon. Fiecare link activează automat
              abonamentul Elite la signup.
            </p>
          </section>

          {/* Flash messages */}
          {searchParams?.message && (
            <div className="mb-6 rounded-xl border border-crypto-green/30 bg-crypto-green/10 px-4 py-3 text-sm text-slate-100">
              {searchParams.message}
            </div>
          )}
          {searchParams?.error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {searchParams.error}
            </div>
          )}

          {/* New tokens display */}
          {newTokens.length > 0 && (
            <section className="panel mb-8 border-accent-emerald/30 p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Link-uri generate
              </p>
              <div className="space-y-2">
                {newTokens.map((token) => (
                  <div
                    key={token}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white"
                  >
                    <span className="flex-1 select-all">{baseUrl}/invite/{token}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Copiază link-urile și trimite-le membrilor pe Discord/Patreon.</p>
            </section>
          )}

          {/* Stats */}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{allInvites.length}</h3>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Active</p>
              <h3 className="mt-3 text-2xl font-bold text-green-400">{activeInvites.length}</h3>
            </article>
            <article className="panel px-5 py-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Folosite</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-500">{usedInvites.length}</h3>
            </article>
          </section>

          {/* Create form */}
          <section className="panel mb-8 p-6 md:p-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Generează</p>
            <h2 className="mb-5 text-2xl font-bold text-white">Invitații noi</h2>
            <form action={createInviteAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="plan_duration">
                  Plan
                </label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none focus:border-accent-emerald"
                  id="plan_duration"
                  name="plan_duration"
                  required
                >
                  <option value="30_days">30 zile ($49)</option>
                  <option value="90_days">90 zile ($137)</option>
                  <option value="365_days">365 zile ($497)</option>
                  <option value="custom">Custom (alegi tu zilele)</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="custom_days">
                  Zile custom (doar pt Custom)
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none focus:border-accent-emerald"
                  id="custom_days"
                  min="1"
                  max="3650"
                  name="custom_days"
                  placeholder="Ex: 14, 45, 60..."
                  type="number"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="count">
                  Câte link-uri
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none focus:border-accent-emerald"
                  defaultValue="1"
                  id="count"
                  max="100"
                  min="1"
                  name="count"
                  type="number"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="max_uses">
                  Max folosiri/link
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none focus:border-accent-emerald"
                  defaultValue="1"
                  id="max_uses"
                  min="1"
                  name="max_uses"
                  type="number"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="notes">
                  Notă (opțional)
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none focus:border-accent-emerald"
                  id="notes"
                  name="notes"
                  placeholder="Ex: Migrare Patreon"
                  type="text"
                />
              </div>
              <div className="flex items-end md:col-span-2 lg:col-span-3">
                <button className="accent-button" type="submit">
                  Generează invitații
                </button>
              </div>
            </form>
          </section>

          {/* Active invites list */}
          {activeInvites.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-white">Invitații active ({activeInvites.length})</h2>
              <div className="space-y-3">
                {activeInvites.map((invite) => (
                  <article key={invite.id} className="panel flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-white select-all">
                          {baseUrl}/invite/{invite.token}
                        </span>
                        <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-0.5 text-xs font-semibold text-accent-emerald">
                          {formatDays(invite)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {invite.used_count}/{invite.max_uses} folosit
                        </span>
                      </div>
                      {invite.notes && <p className="mt-1 text-xs text-slate-500">{invite.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {searchParams?.confirmDelete === invite.id ? (
                        <form action={deleteInviteAction}>
                          <input name="id" type="hidden" value={invite.id} />
                          <button className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20" type="submit">
                            Confirmă ștergerea
                          </button>
                        </form>
                      ) : (
                        <Link
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:border-red-500/30 hover:text-red-400"
                          href={`/admin/invites?confirmDelete=${invite.id}`}
                        >
                          Șterge
                        </Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Used invites */}
          {usedInvites.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-500">Folosite ({usedInvites.length})</h2>
              <div className="space-y-2">
                {usedInvites.map((invite) => (
                  <article key={invite.id} className="panel flex items-center justify-between px-5 py-3 opacity-60">
                    <div>
                      <span className="font-mono text-sm text-slate-400">{invite.token}</span>
                      <span className="ml-3 text-xs text-slate-600">
                        {planLabels[invite.plan_duration]} &middot; {invite.used_count}/{invite.max_uses}
                      </span>
                      {invite.notes && <span className="ml-2 text-xs text-slate-600">&middot; {invite.notes}</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
