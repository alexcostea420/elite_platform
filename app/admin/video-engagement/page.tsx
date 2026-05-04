import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { getVideoEngagementDashboard } from "@/lib/admin/video-stats";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin · Video engagement",
  description: "Cine vizionează ce video și care sunt cele mai populare.",
  keywords: ["admin video"],
  path: "/admin/video-engagement",
  host: "admin",
  index: false,
});

function fmtRoDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export default async function AdminVideoEngagementPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/video-engagement");

  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (meProfile?.role !== "admin") redirect("/dashboard");

  const identity = getDisplayIdentity(meProfile?.full_name ?? null, user.email);

  const dashboard = await getVideoEngagementDashboard();

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
              Admin · Engagement
            </p>
            <h1 className="gradient-text mt-2 font-display text-3xl font-bold md:text-4xl">
              Video engagement
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Cine vizionează ce video, care sunt cele mai populare, ultima activitate.
            </p>
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Vizualizări totale
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-white">
                {dashboard.totals.totalViews}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Membri unici
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-emerald-400">
                {dashboard.totals.uniqueViewers}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Video-uri publicate
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-slate-200">
                {dashboard.totals.publishedVideos}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Medie per membru
              </p>
              <p className="mt-1 font-data text-2xl font-bold tabular-nums text-blue-400">
                {dashboard.totals.avgVideosPerViewer}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">video-uri urmărite</p>
            </div>
          </div>

          <section className="glass-card mb-6 p-5 md:p-7">
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                Cele mai vizionate
              </p>
              <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Top videoclipuri</h2>
            </div>
            {dashboard.perVideo.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                Nu există vizionări încă. Tracking-ul se activează la prima deschidere de video.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      <th className="py-2 pr-3">Titlu</th>
                      <th className="py-2 pr-3">Tier</th>
                      <th className="py-2 pr-3 text-right">Membri</th>
                      <th className="py-2 pr-3 text-right">Total views</th>
                      <th className="py-2 text-right">Ultima vizionare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.perVideo.slice(0, 50).map((row) => (
                      <tr className="border-b border-white/5" key={row.video_id}>
                        <td className="py-2.5 pr-3">
                          <Link
                            className="line-clamp-1 text-sm font-semibold text-white transition-colors hover:text-accent-emerald"
                            href={`/dashboard/videos?video=${row.video_id}`}
                          >
                            {row.title}
                          </Link>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            uploadat {fmtRoDateTime(row.upload_date).split(",")[0]}
                          </p>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${
                              row.tier_required === "elite"
                                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {row.tier_required}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-emerald-400">
                          {row.unique_viewers}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-data tabular-nums text-slate-300">
                          {row.total_views}
                        </td>
                        <td className="py-2.5 text-right font-data tabular-nums text-slate-500">
                          {row.last_view_at ? relTime(row.last_view_at) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Top 25
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  Cei mai activi membri
                </h2>
              </div>
              {dashboard.topViewers.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Niciun membru încă.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.topViewers.map((v) => {
                    const display = v.full_name || v.discord_username || v.email || "-";
                    return (
                      <Link
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                        href={`/admin/members/${v.user_id}`}
                        key={v.user_id}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{display}</p>
                          {v.discord_username ? (
                            <p className="truncate text-[10px] text-slate-500">
                              @{v.discord_username}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-data text-sm font-bold tabular-nums text-emerald-400">
                            {v.videos_watched} video
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {v.total_views} views · {relTime(v.last_viewed_at)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="glass-card p-5 md:p-7">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
                  Activitate recentă
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">Ultimele 50 vizionări</h2>
              </div>
              {dashboard.recent.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Nicio activitate recentă.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.recent.map((r, idx) => {
                    const display = r.full_name || r.discord_username || "-";
                    return (
                      <div
                        className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                        key={`${r.user_id}-${r.video_id}-${idx}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            className="truncate text-xs font-semibold text-emerald-400 hover:underline"
                            href={`/admin/members/${r.user_id}`}
                          >
                            {display}
                          </Link>
                          <span className="font-data text-[10px] text-slate-500">
                            {relTime(r.last_viewed_at)}
                          </span>
                        </div>
                        <Link
                          className="mt-0.5 line-clamp-1 text-xs text-slate-300 transition-colors hover:text-white"
                          href={`/dashboard/videos?video=${r.video_id}`}
                        >
                          → {r.video_title}
                        </Link>
                        {r.view_count > 1 && (
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            vizionat de {r.view_count} ori
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <p className="mt-4 text-[10px] text-slate-600">
            Tracking-ul se face server-side când membrul deschide playerul. O nouă deschidere a
            aceluiași video crește view_count și actualizează last_viewed_at.
          </p>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
