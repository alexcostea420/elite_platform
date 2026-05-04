import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import {
  downgradeToFreeAction,
  extendEliteAction,
  resetTrialAction,
  setVeteranAction,
} from "./actions";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Customer 360",
  description: "Profil membru complet cu timeline cronologic.",
  keywords: ["admin customer 360"],
  path: "/admin/members",
  host: "admin",
  index: false,
});

type TimelineEvent = {
  ts: string;
  kind: "signup" | "payment" | "subscription" | "email" | "invite" | "feedback" | "trial";
  title: string;
  detail?: string;
  meta?: string;
  tone?: "default" | "success" | "warning" | "info";
};

function fmtRoDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRoDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const PLAN_LABELS: Record<string, string> = {
  "30_days": "30 zile",
  "90_days": "90 zile",
  "365_days": "365 zile",
};

const TONE_DOT: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  default: "bg-slate-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

const KIND_LABEL: Record<TimelineEvent["kind"], string> = {
  signup: "Înregistrare",
  payment: "Plată",
  subscription: "Abonament",
  email: "Email",
  invite: "Invitație",
  feedback: "Feedback",
  trial: "Trial",
};

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);
  const userId = params.id;

  const service = createServiceRoleSupabaseClient();

  const [profileRes, paymentsRes, subsRes, emailsRes, redemptionsRes, feedbackRes] = await Promise.all([
    service.from("profiles").select("*").eq("id", userId).maybeSingle(),
    service.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    service.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    service.from("email_drip_queue").select("id, template, subject, scheduled_at, sent_at, status").eq("user_id", userId).order("created_at", { ascending: false }),
    service.from("invite_redemptions").select("id, invite_id, redeemed_at, invite_links(plan_duration, notes, is_veteran_invite)").eq("user_id", userId).order("redeemed_at", { ascending: false }),
    service.from("feedback").select("id, type, message, page_url, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  if (!profileRes.data) notFound();

  const target = profileRes.data;

  let email: string | null = null;
  try {
    const { data: authUser } = await service.auth.admin.getUserById(userId);
    email = authUser?.user?.email ?? null;
  } catch {
    email = null;
  }

  const display = target.full_name || target.discord_username || email?.split("@")[0] || "—";
  const targetIdentity = getDisplayIdentity(target.full_name ?? null, email);

  const now = Date.now();
  const expiresAt = target.subscription_expires_at ? new Date(target.subscription_expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - now) / 86_400_000) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isUrgent = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  const totalPaid = (paymentsRes.data ?? [])
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + Number(p.amount_received ?? 0), 0);

  const events: TimelineEvent[] = [];

  events.push({
    ts: target.created_at,
    kind: "signup",
    title: "Cont creat",
    detail: email ?? undefined,
    tone: "info",
  });

  if (target.elite_since) {
    events.push({
      ts: target.elite_since,
      kind: "subscription",
      title: "A devenit Elite",
      detail: target.is_veteran ? "Veteran" : undefined,
      tone: "success",
    });
  }

  if (target.trial_used_at) {
    events.push({
      ts: target.trial_used_at,
      kind: "trial",
      title: "Trial activat",
      detail: "7 zile gratuite",
      tone: "info",
    });
  }

  if (target.discord_connected_at) {
    events.push({
      ts: target.discord_connected_at,
      kind: "subscription",
      title: "Discord conectat",
      detail: target.discord_username ? `@${target.discord_username}` : undefined,
    });
  }

  for (const p of paymentsRes.data ?? []) {
    const planLabel = PLAN_LABELS[p.plan_duration as string] ?? p.plan_duration;
    events.push({
      ts: p.confirmed_at ?? p.created_at,
      kind: "payment",
      title: p.status === "confirmed" ? `Plată ${planLabel}` : `Plată ${p.status} · ${planLabel}`,
      detail: `${p.amount_received ?? p.reference_amount} ${p.currency} pe ${p.chain}`,
      meta: p.tx_hash ? `${(p.tx_hash as string).slice(0, 10)}…` : undefined,
      tone: p.status === "confirmed" ? "success" : p.status === "pending" ? "warning" : "default",
    });
  }

  for (const s of subsRes.data ?? []) {
    events.push({
      ts: s.starts_at ?? s.created_at,
      kind: "subscription",
      title: `Abonament ${s.tier} pornit`,
      detail: `Expiră ${fmtRoDate(s.expires_at)}`,
      tone: s.status === "active" ? "success" : "default",
    });
  }

  for (const e of emailsRes.data ?? []) {
    events.push({
      ts: e.sent_at ?? e.scheduled_at,
      kind: "email",
      title: `Email · ${e.subject}`,
      detail: e.template,
      meta: e.status,
      tone: e.status === "sent" ? "success" : e.status === "failed" ? "default" : "info",
    });
  }

  for (const r of redemptionsRes.data ?? []) {
    const link = (r as { invite_links?: { plan_duration?: string; notes?: string | null; is_veteran_invite?: boolean } }).invite_links;
    const plan = link?.plan_duration ? PLAN_LABELS[link.plan_duration] ?? link.plan_duration : "?";
    events.push({
      ts: r.redeemed_at,
      kind: "invite",
      title: `Invitație redempționată (${plan})`,
      detail: link?.notes ?? undefined,
      meta: link?.is_veteran_invite ? "veteran" : undefined,
      tone: "success",
    });
  }

  for (const f of feedbackRes.data ?? []) {
    events.push({
      ts: f.created_at,
      kind: "feedback",
      title: `Feedback (${f.type})`,
      detail: f.message?.slice(0, 200) ?? undefined,
      meta: f.page_url ?? undefined,
      tone: "info",
    });
  }

  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <>
      <Navbar mode="dashboard" isAdmin userIdentity={{ displayName: identity.displayName, initials: identity.initials }} />
      <main className="min-h-screen bg-surface-night pb-16 pt-24">
        <Container className="max-w-6xl">
          <div className="mb-4">
            <Link className="text-xs text-slate-500 transition-colors hover:text-accent-emerald" href="/admin/members">
              ← Înapoi la lista membrilor
            </Link>
          </div>

          <header className="glass-card mb-6 p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-emerald/10 font-data text-xl font-bold text-accent-emerald">
                  {targetIdentity.initials}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                    Customer 360
                  </p>
                  <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{display}</h1>
                  <p className="mt-1 text-sm text-slate-400">{email ?? "fără email"}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  target.subscription_tier === "elite"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/5 text-slate-400"
                }`}>
                  {target.subscription_tier === "elite" ? "Elite" : "Free"} · {target.subscription_status}
                  {target.is_veteran && (
                    <span className="rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[9px] text-yellow-400">VET</span>
                  )}
                </span>
                {expiresAt && (
                  <span className={`font-data text-xs tabular-nums ${
                    isExpired ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-400"
                  }`}>
                    {isExpired ? "expirat " : "expiră în "}{Math.abs(daysLeft!)}z · {fmtRoDate(target.subscription_expires_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Înregistrat</p>
                <p className="mt-0.5 text-sm font-bold text-slate-200">{fmtRoDate(target.created_at)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Elite Din</p>
                <p className="mt-0.5 text-sm font-bold text-slate-200">{fmtRoDate(target.elite_since)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Total Plătit</p>
                <p className="mt-0.5 font-data text-sm font-bold tabular-nums text-accent-emerald">${totalPaid.toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Discord</p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-200">
                  {target.discord_username ? `@${target.discord_username}` : "—"}
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <div className="glass-card p-5 md:p-7">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                      Cronologic
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Timeline ({events.length})</h2>
                  </div>
                </div>

                {events.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">Niciun eveniment înregistrat.</p>
                ) : (
                  <ol className="relative space-y-4 border-l border-white/5 pl-5">
                    {events.map((e, i) => {
                      const tone = e.tone ?? "default";
                      return (
                        <li key={i} className="relative">
                          <span
                            aria-hidden
                            className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface-night ${TONE_DOT[tone]}`}
                          />
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              {KIND_LABEL[e.kind]}
                            </span>
                            <span className="text-xs text-slate-600">{fmtRoDateTime(e.ts)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-white">{e.title}</p>
                          {e.detail && <p className="mt-0.5 text-xs text-slate-400">{e.detail}</p>}
                          {e.meta && (
                            <p className="mt-0.5 font-mono text-[10px] text-slate-600">{e.meta}</p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="glass-card p-5 md:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Acțiuni Rapide
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">Subscription</h2>

                <form action={extendEliteAction} className="mt-4 space-y-2">
                  <input name="user_id" type="hidden" value={userId} />
                  <p className="text-xs text-slate-400">Extinde Elite cu:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 30, 90].map((d) => (
                      <button
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-2 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/10"
                        formAction={extendEliteAction}
                        key={d}
                        name="days"
                        type="submit"
                        value={d}
                      >
                        +{d}z
                      </button>
                    ))}
                  </div>
                </form>

                <form action={resetTrialAction} className="mt-3">
                  <input name="user_id" type="hidden" value={userId} />
                  <button
                    className="w-full rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10 disabled:opacity-40"
                    disabled={!target.trial_used_at}
                    type="submit"
                  >
                    Resetează trial
                  </button>
                </form>

                <form action={setVeteranAction} className="mt-3">
                  <input name="user_id" type="hidden" value={userId} />
                  <input name="value" type="hidden" value={target.is_veteran ? "false" : "true"} />
                  <button
                    className="w-full rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-xs font-semibold text-yellow-400 transition-colors hover:bg-yellow-400/10"
                    type="submit"
                  >
                    {target.is_veteran ? "Anulează status veteran" : "Marchează ca veteran"}
                  </button>
                </form>

                <form action={downgradeToFreeAction} className="mt-3">
                  <input name="user_id" type="hidden" value={userId} />
                  <button
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                    type="submit"
                  >
                    Trece pe Free
                  </button>
                </form>
              </div>

              <div className="glass-card p-5 md:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Sumar
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">Date Brute</h2>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">User ID</dt>
                    <dd className="truncate font-mono text-slate-400">{userId.slice(0, 8)}…</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Discord ID</dt>
                    <dd className="font-mono text-slate-400">{target.discord_user_id ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Plăți</dt>
                    <dd className="font-data tabular-nums text-slate-300">{paymentsRes.data?.length ?? 0}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Email-uri</dt>
                    <dd className="font-data tabular-nums text-slate-300">{emailsRes.data?.length ?? 0}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Feedback</dt>
                    <dd className="font-data tabular-nums text-slate-300">{feedbackRes.data?.length ?? 0}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Email unsubscribed</dt>
                    <dd className="text-slate-300">{target.email_unsubscribed ? "da" : "nu"}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
