import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ConnectDiscordCard } from "@/components/dashboard/connect-discord-card";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { RecentContent } from "@/components/dashboard/recent-content";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { VideoTemplateThumbnail } from "@/components/ui/video-thumbnail";
import { getDiscordRoleLabel, syncDiscordRole } from "@/lib/discord/server";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";

type SubscriptionTier = "free" | "elite" | null;
type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial" | null;

type VideoPreview = {
  id: string;
  title: string;
  category: string;
  tier_required: Exclude<SubscriptionTier, null>;
  thumbnail_url: string | null;
  youtube_id: string;
  upload_date: string;
};

const tierLabel: Record<Exclude<SubscriptionTier, null>, string> = {
  free: "Free",
  elite: "Elite",
};

function getMembershipLabel(subscriptionTier: SubscriptionTier) {
  if (!subscriptionTier) {
    return "Membru fără nivel";
  }

  return `Plan ${tierLabel[subscriptionTier]}`;
}

function getStatusLabel(subscriptionStatus: SubscriptionStatus) {
  switch (subscriptionStatus) {
    case "active":
      return "Acces activ";
    case "trial":
      return "Perioadă de probă";
    case "cancelled":
      return "Acces închis";
    case "expired":
      return "Acces expirat";
    default:
      return "Status în curs de confirmare";
  }
}

type DashboardPageProps = {
  searchParams?: {
    discord?: string;
    discord_error?: string;
    discord_role?: string;
  };
};

export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard Elite Trading | Cont Membru Crypto",
  description:
    "Dashboard-ul tău pentru comunitatea crypto Elite: status abonament, video-uri recente și acces la resursele platformei.",
  keywords: [
    "dashboard elite trading",
    "cont membru crypto",
    "platforma traderi romania",
    "biblioteca video crypto",
    "comunitate traderi",
  ],
  path: "/dashboard",
  host: "app",
  index: false,
});

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: profile }, { data: latestVideos }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, subscription_tier, subscription_status, subscription_expires_at, discord_user_id, discord_username, discord_avatar, discord_connected_at, discord_role_synced_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("videos")
      .select("id, title, category, tier_required, thumbnail_url, youtube_id, upload_date")
      .eq("is_published", true)
      .order("upload_date", { ascending: false })
      .limit(3),
  ]);

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isEliteUser = profile?.subscription_tier === "elite";
  const membershipLabel = getMembershipLabel(profile?.subscription_tier ?? null);
  const statusLabel = getStatusLabel(profile?.subscription_status ?? null);
  const desiredDiscordRole = getDiscordRoleLabel(profile?.subscription_tier ?? null);

  // Fire-and-forget Discord sync with 15-minute cooldown
  if (profile?.discord_user_id) {
    const lastSyncedAt = profile.discord_role_synced_at ? new Date(profile.discord_role_synced_at).getTime() : 0;
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (lastSyncedAt < fifteenMinutesAgo) {
      syncDiscordRole({
        profileId: user.id,
        discordUserId: profile.discord_user_id,
        subscriptionTier: profile?.subscription_tier ?? null,
      }).catch(() => {});
    }
  }

  const featuredVideos: VideoPreview[] = latestVideos ?? [];

  return (
    <>
      <Navbar
        mode="dashboard"
        userIdentity={{
          displayName: identity.displayName,
          initials: identity.initials,
        }}
      />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          <DashboardHeader
            firstName={identity.firstName}
            membershipLabel={membershipLabel}
            statusLabel={statusLabel}
          />
          <SubscriptionCard
            subscriptionExpiresAt={profile?.subscription_expires_at ?? null}
            subscriptionStatus={profile?.subscription_status ?? null}
            subscriptionTier={profile?.subscription_tier ?? null}
            discordConnected={!!profile?.discord_user_id}
          />
          {/* Expiry warning */}
          {profile?.subscription_expires_at && (() => {
            const expiresAt = new Date(profile.subscription_expires_at);
            const now = new Date();
            const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
            if (daysLeft <= 0) {
              return (
                <section className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/5 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-red-400">Abonamentul tău a expirat</p>
                      <p className="mt-1 text-sm text-slate-400">Reînnoiește pentru a păstra accesul la conținutul Elite.</p>
                    </div>
                    <Link className="accent-button whitespace-nowrap" href="/upgrade">Reînnoiește</Link>
                  </div>
                </section>
              );
            }
            if (daysLeft <= 7) {
              return (
                <section className="mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-yellow-400">Abonamentul tău expiră în {daysLeft} {daysLeft === 1 ? 'zi' : 'zile'}</p>
                      <p className="mt-1 text-sm text-slate-400">Reînnoiește acum ca să nu pierzi accesul.</p>
                    </div>
                    <Link className="accent-button whitespace-nowrap" href="/upgrade">Reînnoiește</Link>
                  </div>
                </section>
              );
            }
            return null;
          })()}
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Acces curent</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{membershipLabel}</h3>
              <p className="mt-2 text-sm text-slate-400">{statusLabel}</p>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Noutăți în bibliotecă</p>
              <h3 className="mt-3 text-2xl font-bold text-white">{featuredVideos.length}</h3>
              <p className="mt-2 text-sm text-slate-400">materiale recente disponibile acum în platformă</p>
            </article>
            <article className="panel px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pasul următor</p>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {isEliteUser ? "Intră în biblioteca completă" : "Deblochează Elite"}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {isEliteUser
                  ? "Vezi cele mai noi materiale și continuă direct din dashboard."
                  : "Treci la planul premium pentru acces complet la conținut și context."}
              </p>
            </article>
          </section>

          <section className="mb-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">Noutăți</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Cele mai recente video-uri</h2>
              </div>
              <Link className="ghost-button" href="/dashboard/videos">
                Vezi toată biblioteca
              </Link>
            </div>
            {featuredVideos.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {featuredVideos.map((video) => {
                  const isLocked = !isEliteUser && video.tier_required === "elite";

                  return (
                    <article key={video.id} className="panel overflow-hidden p-0">
                      <div className="relative bg-crypto-ink">
                        <VideoTemplateThumbnail
                          className={isLocked ? "opacity-45" : ""}
                          date={video.upload_date}
                          tag={video.category}
                          thumbnailUrl={video.thumbnail_url}
                        />
                        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-crypto-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                          {video.tier_required === "elite" ? "Elite" : "Free"}
                        </div>
                        {isLocked ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/55 p-4">
                            <Link className="accent-button" href="/upgrade">
                              Deblochează cu Elite
                            </Link>
                          </div>
                        ) : null}
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{video.category}</p>
                        <h3 className="mt-3 line-clamp-2 text-lg font-bold text-white">{video.title}</h3>
                        <div className="mt-4">
                          <Link className="ghost-button" href={isLocked ? "/upgrade" : `/dashboard/videos?video=${video.id}`}>
                            {isLocked ? "Vezi accesul Elite" : "Deschide video-ul"}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <section className="panel p-8 text-center">
                <div className="text-5xl">🎬</div>
                <h3 className="mt-4 text-2xl font-bold text-white">Biblioteca se actualizează</h3>
                <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                  Nu avem încă materiale recente afișabile aici. Revino puțin mai târziu sau intră direct în bibliotecă.
                </p>
              </section>
            )}
          </section>
          {isEliteUser ? (
            <>
              <QuickLinks />
              <StatsOverview />
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <RecentAnalyses />
                <RecentContent />
              </div>
            </>
          ) : (
            <>
              <section className="panel mb-8 border border-accent-emerald/30 px-6 py-8 md:px-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                      Cont Free
                    </p>
                    <h2 className="text-3xl font-bold text-white">Ai acces la conținutul gratuit și la preview-urile premium</h2>
                    <p className="mt-3 max-w-2xl text-slate-300">
                      Explorează resursele gratuite disponibile acum și vezi exact ce deblochezi când treci la Elite.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link className="accent-button whitespace-nowrap" href="/upgrade">
                      Upgrade la Elite
                    </Link>
                    <Link className="ghost-button whitespace-nowrap" href="/dashboard/videos">
                      Vezi preview-urile
                    </Link>
                  </div>
                </div>
              </section>

              <section className="mb-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <article className="panel p-6 md:p-8">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                    Resursă Gratuită
                  </p>
                  <h3 className="text-2xl font-bold text-white">Start rapid în Armata de Traderi</h3>
                  <p className="mt-3 text-slate-300">
                    Începe cu materialele publice și construiește-ți baza: noțiuni de market structure, disciplină și execuție.
                  </p>
                  <div className="mt-5 rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 px-4 py-4 text-sm text-slate-200">
                    Începe cu biblioteca Free, apoi treci la Elite când vrei acces complet la analize, sesiuni live și context premium.
                  </div>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald text-2xl text-crypto-dark">
                        ▶
                      </div>
                      <div>
                        <h4 className="font-bold text-white">Video gratuit recomandat</h4>
                        <p className="text-sm text-slate-400">Bazele unui plan de trading clar</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">
                      Urmărește conținutul introductiv și intră în ritmul comunității înainte de upgrade.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <a
                        className="accent-button"
                        href="https://youtube.com/@AlexCostea03"
                        rel="noreferrer"
                        target="_blank"
                      >
                        Vezi resursele gratuite
                      </a>
                      <Link className="ghost-button" href="/dashboard/videos">
                        Deschide biblioteca
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="panel p-6 md:p-8">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                    Preview Elite
                  </p>
                  <h3 className="text-2xl font-bold text-white">Ce deblochezi cu accesul premium</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      "Biblioteca video completă, structurată pe setup-uri și execuție",
                      "Analize recurente cu context clar și niveluri importante",
                      "Sesiuni live și suport prioritar în comunitate",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 text-accent-emerald">🔒</span>
                          <p className="text-slate-300">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm text-slate-400">
                    Elite îți oferă acces complet la fluxul de lucru, conținutul premium și contextul folosit zilnic în comunitate.
                  </p>
                </article>
              </section>
            </>
          )}
          <section className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" id="setari">
            <ConnectDiscordCard
              discordAvatar={profile?.discord_avatar ?? null}
              discordConnectedAt={profile?.discord_connected_at ?? null}
              discordRoleLabel={desiredDiscordRole}
              discordRoleSyncedAt={profile?.discord_role_synced_at ?? null}
              discordUsername={profile?.discord_username ?? null}
              isConnected={Boolean(profile?.discord_user_id)}
              notice={
                searchParams?.discord_error
                  ? searchParams.discord_error
                  : searchParams?.discord === "connected"
                    ? `Discord a fost conectat și rolul ${searchParams.discord_role ?? desiredDiscordRole} a fost sincronizat.`
                    : null
              }
              noticeTone={searchParams?.discord_error ? "error" : searchParams?.discord === "connected" ? "success" : null}
            />
            <section className="panel px-6 py-8 text-center md:px-8">
              <h3 className="text-2xl font-bold text-white">Ai nevoie de ajutor? 💡</h3>
              <p className="mx-auto mt-4 max-w-2xl text-slate-300">
                Comunitatea noastră Discord este activă 24/7. Pune întrebări, schimbă idei și învață de la alți traderi.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <a className="accent-button" href="https://discord.gg/ecNNcV5GD9" rel="noreferrer" target="_blank">
                  Deschide Discord
                </a>
                <a className="ghost-button" href="https://discord.gg/ecNNcV5GD9" rel="noreferrer" target="_blank">
                  Contactează Suportul
                </a>
              </div>
            </section>
          </section>
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
