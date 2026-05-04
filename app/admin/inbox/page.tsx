import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { getInbox, type FeedbackStatus } from "@/lib/admin/inbox";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

import { setFeedbackStatusAction } from "./actions";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Inbox",
  description: "Feedback, alerte de email și plăți blocate într-un singur loc.",
  keywords: ["admin inbox"],
  path: "/admin/inbox",
  host: "admin",
  index: false,
});

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "Deschis",
  responded: "Răspuns",
  archived: "Arhivat",
};

const STATUS_TONE: Record<FeedbackStatus, string> = {
  open: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  responded: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  archived: "border-white/10 bg-white/[0.04] text-slate-500",
};

function fmtRoDateTime(iso: string) {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "acum";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}z`;
}

type SearchParams = { filter?: string };

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/inbox");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const filter: FeedbackStatus | "all" = (
    ["open", "responded", "archived"] as const
  ).includes((params.filter ?? "open") as FeedbackStatus)
    ? (params.filter as FeedbackStatus)
    : "open";
  const activeFilter = (params.filter as string | undefined) === "all" ? "all" : filter;

  const inbox = await getInbox(activeFilter);

  function chipHref(f: "open" | "responded" | "archived" | "all") {
    return f === "open" ? "/admin/inbox" : `/admin/inbox?filter=${f}`;
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
              Admin · Support
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Inbox
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Feedback de la membri, bounce-uri de email și plăți blocate de peste 24h.
            </p>
          </header>

          {inbox.alerts.length > 0 && (
            <section className="glass-card mb-6 p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400 sm:text-xs">
                  Alerte sistem
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  Atenție · {inbox.alerts.length}
                </h2>
              </div>
              <div className="space-y-2">
                {inbox.alerts.slice(0, 20).map((a, idx) => {
                  const tone =
                    a.tone === "red"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-amber-500/30 bg-amber-500/5";
                  const inner = (
                    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${tone}`}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{a.title}</p>
                        <p className="truncate text-[10px] text-slate-400">{a.detail}</p>
                      </div>
                      <span className="font-data text-[10px] text-slate-500">{relTime(a.at)}</span>
                    </div>
                  );
                  return a.href ? (
                    <Link href={a.href} key={`${a.kind}-${idx}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={`${a.kind}-${idx}`}>{inner}</div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="glass-card p-5 md:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Feedback
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  Mesaje de la membri · {inbox.feedback.length}
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["open", "responded", "archived", "all"] as const).map((f) => {
                  const count =
                    f === "all"
                      ? inbox.counts.open + inbox.counts.responded + inbox.counts.archived
                      : inbox.counts[f];
                  const isActive = activeFilter === f;
                  const label = f === "all" ? "Toate" : STATUS_LABEL[f];
                  return (
                    <Link
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? f === "all"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : STATUS_TONE[f]
                          : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                      }`}
                      href={chipHref(f)}
                      key={f}
                    >
                      {label} · {count}
                    </Link>
                  );
                })}
              </div>
            </div>

            {inbox.feedback.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Niciun mesaj în această categorie. 👌
              </p>
            ) : (
              <div className="space-y-3">
                {inbox.feedback.map((item) => {
                  const display =
                    item.user?.full_name ||
                    item.user?.discord_username ||
                    item.user?.email ||
                    "Utilizator necunoscut";
                  return (
                    <article
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                      key={item.id}
                    >
                      <header className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.user_id ? (
                              <Link
                                className="truncate text-sm font-semibold text-white hover:text-accent-emerald"
                                href={`/admin/members/${item.user_id}`}
                              >
                                {display}
                              </Link>
                            ) : (
                              <span className="text-sm font-semibold text-slate-400">{display}</span>
                            )}
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_TONE[item.status]}`}
                            >
                              {STATUS_LABEL[item.status]}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                              {item.type}
                            </span>
                            {item.user?.subscription_tier === "elite" && (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                                elite
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {fmtRoDateTime(item.created_at)} · {relTime(item.created_at)}
                          </p>
                        </div>
                      </header>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                        {item.message}
                      </p>
                      {item.page_url && (
                        <p className="mt-2 truncate font-mono text-[10px] text-slate-600">
                          ↳ {item.page_url}
                        </p>
                      )}
                      {item.admin_notes && item.status !== "open" && (
                        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                            Note admin
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">
                            {item.admin_notes}
                          </p>
                          {item.responded_at && (
                            <p className="mt-1 text-[10px] text-slate-600">
                              {fmtRoDateTime(item.responded_at)}
                            </p>
                          )}
                        </div>
                      )}

                      <details className="mt-3">
                        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-300">
                          Acțiuni admin
                        </summary>
                        <form action={setFeedbackStatusAction} className="mt-3 space-y-2">
                          <input name="id" type="hidden" value={item.id} />
                          <textarea
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
                            defaultValue={item.admin_notes ?? ""}
                            name="notes"
                            placeholder="Note interne (opțional)..."
                            rows={2}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
                              name="status"
                              type="submit"
                              value="responded"
                            >
                              Marchează răspuns
                            </button>
                            <button
                              className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/[0.04]"
                              name="status"
                              type="submit"
                              value="archived"
                            >
                              Arhivează
                            </button>
                            {item.status !== "open" && (
                              <button
                                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/15"
                                name="status"
                                type="submit"
                                value="open"
                              >
                                Redeschide
                              </button>
                            )}
                          </div>
                        </form>
                      </details>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <p className="mt-4 text-[10px] text-slate-600">
            Inbox unificat: feedback prin /api/feedback + bounce/failed din email_drip_queue +
            payments cu status=pending mai vechi de 24h. Discord DMs nu sunt incluse, ar necesita
            gateway always-on.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
