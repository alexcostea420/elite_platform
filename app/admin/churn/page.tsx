import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { getChurnRiskDashboard, type ChurnRiskRow } from "@/lib/admin/churn";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Churn risk",
  description: "Score de risc agregat: expiry + login + video activity.",
  keywords: ["admin churn"],
  path: "/admin/churn",
  host: "admin",
  index: false,
});

const BAND_TONE: Record<ChurnRiskRow["band"], string> = {
  high: "border-red-500/40 bg-red-500/15 text-red-300",
  medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

const BAND_LABEL: Record<ChurnRiskRow["band"], string> = {
  high: "Risc mare",
  medium: "Risc mediu",
  low: "Risc mic",
};

function fmtDays(n: number | null) {
  if (n === null) return "-";
  if (n === 0) return "azi";
  if (n < 0) return `${Math.abs(n)}z trecut`;
  return `${n}z`;
}

type SearchParams = { band?: string };

export default async function AdminChurnPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/churn");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const dashboard = await getChurnRiskDashboard();

  const activeBand = (["high", "medium", "low"] as const).includes(
    (params.band ?? "") as ChurnRiskRow["band"],
  )
    ? (params.band as ChurnRiskRow["band"])
    : null;

  const rows = activeBand ? dashboard.rows.filter((r) => r.band === activeBand) : dashboard.rows;

  function chipHref(band: ChurnRiskRow["band"] | null) {
    return band ? `/admin/churn?band=${band}` : "/admin/churn";
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
              Admin · Customer Success
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Churn risk
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Score 0-100 per membru Elite activ. Combină expirare + login + activitate video.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Risc mare
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-red-400">
                {dashboard.totals.high}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">score ≥ 60</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Risc mediu
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-amber-400">
                {dashboard.totals.medium}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">30-59</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Risc mic
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-emerald-400">
                {dashboard.totals.low}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">sub 30</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Score mediu
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-slate-200">
                {dashboard.totals.avgScore}
              </p>
            </div>
          </div>

          <section className="glass-card mb-6 p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Listă
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  {activeBand ? BAND_LABEL[activeBand] : "Toți Elite activi"} · {rows.length}
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Link
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeBand === null
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                  href={chipHref(null)}
                >
                  Toți · {dashboard.rows.length}
                </Link>
                {(["high", "medium", "low"] as const).map((b) => (
                  <Link
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeBand === b
                        ? BAND_TONE[b]
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                    href={chipHref(b)}
                    key={b}
                  >
                    {BAND_LABEL[b]} · {dashboard.totals[b]}
                  </Link>
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nu există membri în această categorie.
              </p>
            ) : (
              <div className="mt-5 space-y-2">
                {rows.map((r) => {
                  const display = r.full_name || r.discord_username || r.email || "-";
                  return (
                    <Link
                      className="block rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                      href={`/admin/members/${r.user_id}`}
                      key={r.user_id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-white">{display}</p>
                            {r.is_veteran && (
                              <span className="rounded-full bg-yellow-400/15 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                                VET
                              </span>
                            )}
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BAND_TONE[r.band]}`}
                            >
                              {BAND_LABEL[r.band]}
                            </span>
                          </div>
                          {r.discord_username && (
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              @{r.discord_username}
                            </p>
                          )}
                          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                            <div>
                              <p className="text-slate-600">Expiră în</p>
                              <p
                                className={`font-data font-bold tabular-nums ${
                                  r.days_to_expiry !== null && r.days_to_expiry <= 7
                                    ? "text-amber-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {fmtDays(r.days_to_expiry)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Ultim login</p>
                              <p
                                className={`font-data font-bold tabular-nums ${
                                  r.days_since_login !== null && r.days_since_login >= 14
                                    ? "text-amber-400"
                                    : "text-slate-300"
                                }`}
                              >
                                {r.days_since_login === null
                                  ? "niciodată"
                                  : `acum ${r.days_since_login}z`}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600">Video în 30z</p>
                              <p
                                className={`font-data font-bold tabular-nums ${
                                  r.videos_30d === 0
                                    ? "text-red-400"
                                    : r.videos_30d < 3
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {r.videos_30d}
                              </p>
                            </div>
                          </div>
                          {r.reasons.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {r.reasons.map((reason) => (
                                <span
                                  className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                                    reason.points > 0
                                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  }`}
                                  key={reason.code}
                                >
                                  {reason.label}
                                  {reason.points > 0 ? ` +${reason.points}` : ` ${reason.points}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`font-data text-2xl font-bold tabular-nums ${
                              r.band === "high"
                                ? "text-red-400"
                                : r.band === "medium"
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {r.score}
                          </p>
                          <p className="text-[9px] text-slate-600">/ 100</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="glass-card p-5 md:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
              Cum se calculează
            </p>
            <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Componente score</h2>
            <ul className="mt-4 space-y-2 text-xs text-slate-400">
              <li>
                <strong className="text-slate-200">Expirare:</strong> ≤3z = +30, 4-7z = +20, 8-14z = +10
              </li>
              <li>
                <strong className="text-slate-200">Inactivitate login:</strong> 21+ zile = +25, 14-20z = +15, 7-13z = +5
              </li>
              <li>
                <strong className="text-slate-200">Activitate video (30z):</strong> 0 = +25, 1-2 = +15, 3+ = 0
              </li>
              <li>
                <strong className="text-slate-200">Discord neconectat:</strong> +10
              </li>
              <li>
                <strong className="text-slate-200">Veteran:</strong> -5 (loialitate dovedită)
              </li>
              <li className="pt-2 text-slate-500">
                Score se evaluează doar pentru membri Elite activi cu abonament valid. Banding: ≥60 risc mare, 30-59 mediu, sub 30 mic.
              </li>
            </ul>
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
