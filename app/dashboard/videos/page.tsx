import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { syncDiscordRole } from "@/lib/discord/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

type DashboardVideosPageProps = {
  searchParams?: {
    video?: string;
  };
};

type SubscriptionTier = "free" | "elite" | null;

type VideoRow = {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  category: string;
  tier_required: Exclude<SubscriptionTier, null>;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  upload_date: string;
};

const tierOrder: Record<Exclude<SubscriptionTier, null>, number> = {
  free: 1,
  elite: 2,
};

const tierLabel: Record<Exclude<SubscriptionTier, null>, string> = {
  free: "Free",
  elite: "Elite",
};

function getAccessSummaryLabel(userTier: SubscriptionTier) {
  if (userTier === "elite") {
    return "Ai acces complet la toată biblioteca video.";
  }

  if (userTier === "free") {
    return "Ai acces la materialele Free și preview la conținutul Elite.";
  }

  return "Accesul tău este în curs de confirmare.";
}

function canAccessVideo(userTier: SubscriptionTier, requiredTier: Exclude<SubscriptionTier, null>) {
  if (!userTier) {
    return false;
  }

  return tierOrder[userTier] >= tierOrder[requiredTier];
}

function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return "Durată indisponibilă";
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

export default async function DashboardVideosPage({ searchParams }: DashboardVideosPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/videos");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, discord_user_id")
    .eq("id", user.id)
    .maybeSingle();

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const rawUserTier = profile?.subscription_tier;
  const userTier: SubscriptionTier =
    rawUserTier === "free" || rawUserTier === "elite" ? rawUserTier : null;

  if (profile?.discord_user_id) {
    try {
      await syncDiscordRole({
        profileId: user.id,
        discordUserId: profile.discord_user_id,
        subscriptionTier: userTier,
      });
    } catch {
      // Biblioteca video rămâne accesibilă chiar dacă sincronizarea Discord e temporar indisponibilă.
    }
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("id, youtube_id, title, description, category, tier_required, duration_seconds, thumbnail_url, upload_date")
    .eq("is_published", true)
    .order("upload_date", { ascending: false });

  const visibleVideos: VideoRow[] = videos ?? [];
  const accessibleVideos = visibleVideos.filter((video) => canAccessVideo(userTier, video.tier_required));
  const lockedVideos = visibleVideos.filter((video) => !canAccessVideo(userTier, video.tier_required));
  const selectedVideo =
    accessibleVideos.find((video) => video.id === searchParams?.video) ?? accessibleVideos[0] ?? null;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <section className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Biblioteca Video</p>
            <h1 className="text-4xl font-bold text-white">
              Conținutul tău <span className="gradient-text">protejat</span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Ai acces la materialele disponibile pentru nivelul tău {userTier ? tierLabel[userTier] : "de membru"}. Alege un video și urmărește-l direct din dashboard.
            </p>
          </section>

          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Nivel curent</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{userTier ? tierLabel[userTier] : "Membru"}</h3>
              <p className="mt-2 text-sm text-slate-400">{getAccessSummaryLabel(userTier)}</p>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Accesibile acum</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{accessibleVideos.length}</h3>
              <p className="mt-2 text-sm text-slate-400">video-uri pe care le poți deschide imediat</p>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Preview premium</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{lockedVideos.length}</h3>
              <p className="mt-2 text-sm text-slate-400">
                {userTier === "elite" ? "Tot conținutul premium este deja deblocat." : "Materiale Elite disponibile pentru upgrade."}
              </p>
            </article>
          </section>

          {selectedVideo ? (
            <section className="panel mb-10 overflow-hidden p-4 md:p-6">
              <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-crypto-ink">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtube_id}`}
                  title={selectedVideo.title}
                />
              </div>
              <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 font-semibold text-accent-emerald">
                      {tierLabel[selectedVideo.tier_required]}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">{selectedVideo.category}</span>
                    <span className="text-slate-500">{formatDuration(selectedVideo.duration_seconds)}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
                  {selectedVideo.description ? <p className="mt-3 max-w-3xl text-slate-300">{selectedVideo.description}</p> : null}
                </div>
                <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 px-4 py-4 text-sm text-slate-200 md:max-w-xs">
                  <p className="font-semibold text-accent-emerald">Acces confirmat</p>
                  <p className="mt-2">
                    Acest material este disponibil în planul tău și poate fi urmărit direct din dashboard.
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="panel mb-10 p-8 text-center">
              <div className="text-5xl">🔒</div>
              <h2 className="mt-4 text-2xl font-bold text-white">Nu ai încă video-uri disponibile</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Nu există conținut publicat pentru nivelul tău de acces în acest moment.
              </p>
            </section>
          )}

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Video-uri disponibile</h2>
              <span className="text-sm text-slate-500">
                {accessibleVideos.length} accesibile din {visibleVideos.length} materiale
              </span>
            </div>
            {visibleVideos.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleVideos.map((video) => {
                  const isSelected = video.id === selectedVideo?.id;
                  const isLocked = !canAccessVideo(userTier, video.tier_required);

                  if (isLocked) {
                    return (
                      <article
                        key={video.id}
                        aria-label={`Video premium blocat: ${video.title}`}
                        className="panel overflow-hidden border-white/10 p-0 opacity-95"
                      >
                        <div className="relative aspect-video overflow-hidden bg-crypto-ink">
                          <img
                            alt={video.title}
                            className="h-full w-full object-cover opacity-35"
                            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                          />
                          <div className="absolute left-4 top-4 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                            Elite
                          </div>
                          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-crypto-ink via-crypto-ink/60 to-transparent p-6">
                            <div className="max-w-xs rounded-2xl border border-white/10 bg-crypto-ink/85 p-4">
                              <div className="mb-2 text-3xl">🔒</div>
                              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                                Preview premium
                              </p>
                              <p className="mt-2 text-sm text-slate-300">
                                Vezi ce urmează în biblioteca Elite și deblochează accesul complet.
                              </p>
                              <Link className="accent-button mt-4" href="/upgrade">
                                Upgrade la Elite
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                            <span className="rounded-full bg-accent-emerald/10 px-3 py-1 text-accent-emerald">{tierLabel[video.tier_required]}</span>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">{video.category}</span>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">Blocat</span>
                          </div>
                          <h3 className="line-clamp-2 text-lg font-bold text-white">{video.title}</h3>
                          <p className="mt-2 text-sm text-slate-400">{formatDuration(video.duration_seconds)}</p>
                          <div className="mt-4">
                            <Link className="ghost-button" href="/upgrade">
                              Vezi planul Elite
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return (
                    <Link
                      key={video.id}
                      className={`panel card-hover overflow-hidden p-0 ${isSelected ? "border-accent-emerald shadow-glow" : ""}`}
                      href={`/dashboard/videos?video=${video.id}`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-crypto-ink">
                        <img
                          alt={video.title}
                          className="h-full w-full object-cover"
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                        />
                        <div className="absolute left-4 top-4 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                          {tierLabel[video.tier_required]}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">{video.category}</span>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-slate-400">Acces activ</span>
                        </div>
                        <h3 className="line-clamp-2 text-lg font-bold text-white">{video.title}</h3>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-400">
                          <span>{formatDuration(video.duration_seconds)}</span>
                          <span className="text-accent-emerald">{isSelected ? "Se redă acum" : "Deschide"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
