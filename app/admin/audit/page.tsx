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
  title: "Admin · Audit Log",
  description: "Istoric mutații admin.",
  keywords: ["admin audit"],
  path: "/admin/audit",
  host: "admin",
  index: false,
});

type AuditRow = {
  id: string;
  admin_user_id: string | null;
  action_type: string;
  target_type: string;
  target_id: string | null;
  before_jsonb: unknown;
  after_jsonb: unknown;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type ProfileLite = {
  id: string;
  full_name: string | null;
  discord_username: string | null;
};

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  "invite_create",
  "invite_revoke",
  "invite_delete",
  "video_create",
  "video_update",
  "video_delete",
  "payment_confirm_manual",
  "payment_refund",
  "profile_tier_change",
  "profile_role_change",
  "profile_discord_link",
  "subscription_extend",
  "subscription_cancel",
  "feedback_status_change",
];

const TARGET_OPTIONS = ["invite", "video", "payment", "profile", "subscription", "feedback"];

function fmtRoDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionBadge(action: string) {
  if (action.includes("delete") || action.includes("cancel") || action.includes("revoke")) {
    return "border-red-500/30 bg-red-500/10 text-red-400";
  }
  if (action.includes("create") || action.includes("extend")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }
  if (action.includes("update") || action.includes("change") || action.includes("link") || action.includes("confirm")) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

function shortId(id: string | null) {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: { action?: string; target?: string; page?: string };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/audit");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const action = searchParams?.action?.trim() || "";
  const target = searchParams?.target?.trim() || "";
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const service = createServiceRoleSupabaseClient();

  let query = service
    .from("admin_audit_log")
    .select(
      "id, admin_user_id, action_type, target_type, target_id, before_jsonb, after_jsonb, reason, ip_address, user_agent, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (action && ACTION_OPTIONS.includes(action)) query = query.eq("action_type", action);
  if (target && TARGET_OPTIONS.includes(target)) query = query.eq("target_type", target);

  const { data: rows, count } = await query;
  const auditRows = (rows ?? []) as AuditRow[];

  const adminIds = Array.from(
    new Set(auditRows.map((r) => r.admin_user_id).filter((id): id is string => Boolean(id))),
  );
  const adminLookup = new Map<string, ProfileLite>();
  if (adminIds.length > 0) {
    const { data: admins } = await service
      .from("profiles")
      .select("id, full_name, discord_username")
      .in("id", adminIds);
    for (const a of (admins ?? []) as ProfileLite[]) adminLookup.set(a.id, a);
  }

  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  function buildHref(overrides: Partial<{ action: string; target: string; page: number }>) {
    const params = new URLSearchParams();
    const a = overrides.action ?? action;
    const t = overrides.target ?? target;
    const p = overrides.page ?? page;
    if (a) params.set("action", a);
    if (t) params.set("target", t);
    if (p > 1) params.set("page", String(p));
    const q = params.toString();
    return q ? `/admin/audit?${q}` : "/admin/audit";
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
              Admin · Trasabilitate
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Audit Log
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Toate mutațiile admin: invitații, videoclipuri, plăți, profile.
            </p>
          </header>

          <section className="glass-card mb-6 p-5 md:p-7">
            <form action="/admin/audit" method="get" className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Tip acțiune
                </label>
                <select
                  name="action"
                  defaultValue={action}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Toate</option>
                  {ACTION_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Target
                </label>
                <select
                  name="target"
                  defaultValue={target}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-200"
                >
                  <option value="">Toate</option>
                  {TARGET_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="accent-button px-4 py-2 text-sm">
                Filtrează
              </button>
              {(action || target) && (
                <Link
                  href="/admin/audit"
                  className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04]"
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
                  {count ?? 0} înregistrări
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Istoric</h2>
              </div>
              <p className="text-xs text-slate-500">
                Pagina {page} / {totalPages}
              </p>
            </div>

            {auditRows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nu există înregistrări care să corespundă filtrelor.
              </p>
            ) : (
              <div className="space-y-2">
                {auditRows.map((r) => {
                  const admin = r.admin_user_id ? adminLookup.get(r.admin_user_id) : null;
                  const adminName = admin?.full_name || admin?.discord_username || shortId(r.admin_user_id);
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${actionBadge(r.action_type)}`}
                        >
                          {r.action_type}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] text-slate-400">
                          {r.target_type}
                          {r.target_id ? ` · ${shortId(r.target_id)}` : ""}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300">{adminName}</span>
                        <span className="ml-auto text-[10px] text-slate-500">
                          {fmtRoDateTime(r.created_at)}
                        </span>
                      </div>
                      {r.reason && (
                        <p className="mt-1.5 text-xs text-slate-400">
                          <span className="text-slate-500">motiv:</span> {r.reason}
                        </p>
                      )}
                      {Boolean(r.before_jsonb || r.after_jsonb) && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-slate-400">
                            Detalii payload
                          </summary>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {r.before_jsonb !== null && r.before_jsonb !== undefined ? (
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Înainte</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-2 text-[10px] text-slate-300">
                                  {JSON.stringify(r.before_jsonb, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                            {r.after_jsonb !== null && r.after_jsonb !== undefined ? (
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">După</p>
                                <pre className="mt-1 overflow-x-auto rounded-lg border border-white/5 bg-black/40 p-2 text-[10px] text-slate-300">
                                  {JSON.stringify(r.after_jsonb, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04]"
                  >
                    ← Anterior
                  </Link>
                ) : (
                  <span />
                )}
                {page < totalPages ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04]"
                  >
                    Următor →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
