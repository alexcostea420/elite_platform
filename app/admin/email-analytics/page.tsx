import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Email Analytics",
  description: "Open rate, click rate, bounce rate per template.",
  keywords: ["admin email"],
  path: "/admin/email-analytics",
  host: "admin",
  index: false,
});

type EmailRow = {
  id: string;
  email: string;
  template: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  open_count: number;
  click_count: number;
};

type TemplateStats = {
  template: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  ctr: number; // click / open
};

function pct(num: number, denom: number) {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 1000) / 10;
}

export default async function AdminEmailAnalyticsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/email-analytics");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const service = createServiceRoleSupabaseClient();
  const { data } = await service
    .from("email_drip_queue")
    .select(
      "id, email, template, status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, complained_at, open_count, click_count",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  const rows = (data ?? []) as EmailRow[];

  const templateMap = new Map<string, TemplateStats>();
  for (const r of rows) {
    const t =
      templateMap.get(r.template) ??
      ({
        template: r.template,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        ctr: 0,
      } satisfies TemplateStats);

    if (r.sent_at) t.sent += 1;
    if (r.delivered_at) t.delivered += 1;
    if (r.opened_at) t.opened += 1;
    if (r.clicked_at) t.clicked += 1;
    if (r.bounced_at) t.bounced += 1;
    if (r.complained_at) t.complained += 1;
    if (r.status === "failed") t.failed += 1;

    templateMap.set(r.template, t);
  }

  const templates = Array.from(templateMap.values())
    .map((t) => ({
      ...t,
      openRate: pct(t.opened, t.delivered || t.sent),
      clickRate: pct(t.clicked, t.delivered || t.sent),
      bounceRate: pct(t.bounced, t.sent),
      ctr: pct(t.clicked, t.opened),
    }))
    .sort((a, b) => b.sent - a.sent);

  const totals = templates.reduce(
    (acc, t) => ({
      sent: acc.sent + t.sent,
      delivered: acc.delivered + t.delivered,
      opened: acc.opened + t.opened,
      clicked: acc.clicked + t.clicked,
      bounced: acc.bounced + t.bounced,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 },
  );

  const overallOpenRate = pct(totals.opened, totals.delivered || totals.sent);
  const overallClickRate = pct(totals.clicked, totals.delivered || totals.sent);
  const overallBounceRate = pct(totals.bounced, totals.sent);

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
              Admin · Email
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Email Analytics
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Open rate și click rate per template, ultimele 2000 trimiteri.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trimise</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white">{totals.sent}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{totals.delivered} livrate</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Open rate</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-emerald-400">
                {overallOpenRate}%
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">{totals.opened} deschise</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Click rate</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-blue-400">
                {overallClickRate}%
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">{totals.clicked} click-uri</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Bounce rate</p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-red-400">
                {overallBounceRate}%
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">{totals.bounced} bounce-uri</p>
            </div>
          </div>

          <section className="glass-card p-5 md:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Per template
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Performanță detaliată</h2>
            </div>
            {templates.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nu există emailuri încă. Webhook-ul Resend trebuie conectat la /api/webhooks/resend.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <th className="py-2 pr-3">Template</th>
                      <th className="py-2 pr-3 text-right">Trimise</th>
                      <th className="py-2 pr-3 text-right">Open %</th>
                      <th className="py-2 pr-3 text-right">Click %</th>
                      <th className="py-2 pr-3 text-right">CTR</th>
                      <th className="py-2 pr-3 text-right">Bounce</th>
                      <th className="py-2 text-right">Eșuate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t.template} className="border-b border-white/5">
                        <td className="py-2.5 pr-3">
                          <p className="font-mono text-xs text-white">{t.template}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-slate-300">
                          {t.sent}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-emerald-400">
                          {t.openRate}%
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-blue-400">
                          {t.clickRate}%
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-slate-400">
                          {t.ctr}%
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-red-400">
                          {t.bounceRate}%
                        </td>
                        <td className="py-2.5 text-right font-data tabular-nums text-slate-500">
                          {t.failed}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-[10px] text-slate-600">
              Setup webhook: în dashboard-ul Resend → Webhooks → adaugă{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5">https://app.armatadetraderi.com/api/webhooks/resend</code>{" "}
              cu evenimentele delivered, opened, clicked, bounced, complained. Setează{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5">RESEND_WEBHOOK_SECRET</code> în Vercel.
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
