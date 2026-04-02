import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { buildPageMetadata } from "@/lib/seo";
import { getAllPayments, getSubscriptionMetrics } from "@/lib/payments/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import type { PaymentStatus } from "@/lib/payments/config";
import { AdminPaymentActions } from "./admin-payment-actions";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin Plăți | Gestionare Abonamente",
  description: "Interfață administrativă pentru plăți și abonamente.",
  keywords: ["admin plati", "gestionare abonamente"],
  path: "/admin/payments",
  host: "admin",
  index: false,
});

type AdminPaymentsPageProps = {
  searchParams?: {
    status?: string;
    page?: string;
  };
};

const statusLabels: Record<string, string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  expired: "Expirată",
  failed: "Eșuată",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-300",
  confirmed: "bg-crypto-green/10 text-crypto-green",
  expired: "bg-slate-500/10 text-slate-400",
  failed: "bg-red-500/10 text-red-300",
};

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/payments");
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
  const statusFilter = (searchParams?.status as PaymentStatus) ?? undefined;
  const pageNum = Math.max(1, Number(searchParams?.page) || 1);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  const [{ payments, total }, metrics] = await Promise.all([
    getAllPayments({ status: statusFilter, limit, offset }),
    getSubscriptionMetrics(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Admin Plăți</p>
            <h1 className="text-4xl font-bold text-white">Plăți și Abonamente</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Monitorizează plățile crypto, abonamentele active și veniturile platformei.
            </p>
            <div className="mt-4">
              <Link className="ghost-button" href="/admin/videos">
                ← Admin Video-uri
              </Link>
            </div>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-4">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Abonați activi</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{metrics.activeSubscribers}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Venit total</p>
              <h3 className="mt-3 text-2xl font-bold text-accent-emerald">${metrics.totalRevenue}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Expiră în 7 zile</p>
              <h3 className="mt-3 text-2xl font-bold text-amber-300">{metrics.expiringSoon}</h3>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Total plăți</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{total}</h3>
            </article>
          </section>

          <section className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${!statusFilter ? "bg-accent-emerald text-crypto-dark" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                href="/admin/payments"
              >
                Toate
              </Link>
              {(["pending", "confirmed", "expired", "failed"] as const).map((s) => (
                <Link
                  key={s}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${statusFilter === s ? "bg-accent-emerald text-crypto-dark" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                  href={`/admin/payments?status=${s}`}
                >
                  {statusLabels[s]}
                </Link>
              ))}
              <a
                className="ml-auto rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10"
                href={`/api/admin/payments?format=csv${statusFilter ? `&status=${statusFilter}` : ""}`}
              >
                Export CSV
              </a>
            </div>
          </section>

          <section className="space-y-4">
            {payments.length > 0 ? (
              payments.map((payment) => {
                const p = payment as Record<string, unknown>;
                const profiles = p.profiles as Record<string, string> | null;
                return (
                  <article key={p.id as string} className="panel p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={`rounded-full px-3 py-1 font-semibold ${statusColors[p.status as string] ?? "bg-white/5 text-slate-300"}`}>
                            {statusLabels[p.status as string] ?? p.status}
                          </span>
                          <span className="text-slate-500">{p.plan_duration as string}</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-400">{profiles?.full_name ?? profiles?.discord_username ?? "—"}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                          <span>Sumă: <strong className="text-white">{p.reference_amount as number} {p.currency as string}</strong></span>
                          {p.amount_received ? (
                            <span>Primit: <strong className="text-accent-emerald">{p.amount_received as number} {p.currency as string}</strong></span>
                          ) : null}
                          <span>Rețea: {p.chain as string}</span>
                        </div>
                        {p.tx_hash ? (
                          <p className="mt-1 text-xs text-slate-500">
                            TX: {(p.tx_hash as string).slice(0, 20)}...{(p.tx_hash as string).slice(-10)}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{new Date(p.created_at as string).toLocaleString("ro-RO")}</p>
                        {p.confirmed_at ? (
                          <p className="text-crypto-green">Confirmat: {new Date(p.confirmed_at as string).toLocaleString("ro-RO")}</p>
                        ) : null}
                        {p.expires_at ? (
                          <p>Expiră: {new Date(p.expires_at as string).toLocaleDateString("ro-RO")}</p>
                        ) : null}
                        {p.status === "pending" ? (
                          <AdminPaymentActions paymentId={p.id as string} />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="panel p-8 text-center">
                <div className="text-5xl">📋</div>
                <h3 className="mt-4 text-2xl font-bold text-white">Nu există plăți{statusFilter ? ` cu statusul "${statusLabels[statusFilter]}"` : ""}</h3>
              </div>
            )}
          </section>

          {totalPages > 1 ? (
            <div className="mt-8 flex justify-center gap-2">
              {pageNum > 1 ? (
                <Link className="ghost-button" href={`/admin/payments?${statusFilter ? `status=${statusFilter}&` : ""}page=${pageNum - 1}`}>
                  ← Înapoi
                </Link>
              ) : null}
              <span className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-400">
                Pagina {pageNum} din {totalPages}
              </span>
              {pageNum < totalPages ? (
                <Link className="ghost-button" href={`/admin/payments?${statusFilter ? `status=${statusFilter}&` : ""}page=${pageNum + 1}`}>
                  Înainte →
                </Link>
              ) : null}
            </div>
          ) : null}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
