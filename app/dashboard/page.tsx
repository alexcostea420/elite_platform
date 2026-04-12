import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DiscordConnectPrompt } from "@/components/dashboard/discord-connect-prompt";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { TrialButton } from "@/components/dashboard/trial-button";
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

function getRemainingDays(expiresAt: string | null) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / (24 * 60 * 60 * 1000)) : 0;
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

  const [{ data: profile }, { data: latestVideos }, { count: videoCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, role, subscription_tier, subscription_status, subscription_expires_at, trial_used_at, discord_user_id, discord_username, discord_avatar, discord_connected_at, discord_role_synced_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("videos")
      .select("id, title, category, tier_required, thumbnail_url, youtube_id, upload_date")
      .eq("is_published", true)
      .order("upload_date", { ascending: false })
      .limit(3),
    supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
  ]);

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isAdmin = profile?.role === "admin";
  const isEliteUser = profile?.subscription_tier === "elite";
  const canActivateTrial = !isEliteUser && !profile?.trial_used_at;
  const desiredDiscordRole = getDiscordRoleLabel(profile?.subscription_tier ?? null);
  const daysLeft = getRemainingDays(profile?.subscription_expires_at ?? null);
  const featuredVideos: VideoPreview[] = latestVideos ?? [];

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

  return (
    <>
      <Navbar
        mode="dashboard"
        isAdmin={isAdmin}
        userIdentity={{
          displayName: identity.displayName,
          initials: identity.initials,
        }}
      />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* Compact greeting */}
          <div className="mb-6 flex items-center justify-between animate-fade-in-up stagger-1">
            <p className="text-sm text-slate-400">
              Bine ai venit, <span className="font-medium text-white">{identity.firstName}</span>
            </p>
            {isEliteUser && daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs text-slate-500">
                Elite · <span className="font-mono text-slate-400">{daysLeft}</span> zile rămase
                {profile?.discord_user_id && <span className="ml-2 text-green-400">· Discord sincronizat</span>}
              </p>
            )}
          </div>

          {/* Expiry warning */}
          {daysLeft !== null && daysLeft <= 0 && isEliteUser && (
            <section className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 animate-fade-in-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-red-400">Abonamentul tău a expirat</p>
                  <p className="mt-1 text-sm text-slate-400">Reînnoiește pentru a păstra accesul la conținutul Elite.</p>
                </div>
                <Link className="accent-button whitespace-nowrap" href="/upgrade">Reînnoiește</Link>
              </div>
            </section>
          )}
          {daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && (
            <section className="mb-6 rounded-xl border border-warning/20 bg-warning/5 px-5 py-4 animate-fade-in-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-yellow-400">Abonamentul tău expiră în {daysLeft} {daysLeft === 1 ? "zi" : "zile"}</p>
                  <p className="mt-1 text-sm text-slate-400">Reînnoiește acum ca să nu pierzi accesul.</p>
                </div>
                <Link className="accent-button whitespace-nowrap" href="/upgrade">Reînnoiește</Link>
              </div>
            </section>
          )}

          {isEliteUser ? (
            /* ═══ ELITE DASHBOARD ═══ */
            <>
              {/* Discord connect prompt for users without Discord */}
              {!profile?.discord_user_id && <DiscordConnectPrompt />}

              {/* Onboarding checklist for new users */}
              <OnboardingChecklist />

              {/* Quick access grid */}
              <section className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-4 animate-fade-in-up stagger-2">
                {[
                  { href: "/dashboard/videos", icon: "🎥", title: "Video-uri", desc: `${videoCount ?? 55}+ analize video` },
                  { href: "/dashboard/stocks", icon: "💹", title: "Stocks", desc: "16 acțiuni Buy/Sell" },
                  { href: "/dashboard/indicators", icon: "📊", title: "Indicatori", desc: "TradingView Elite" },
                  { href: "/dashboard/risk-score", icon: "🎯", title: "Risk Score", desc: "Scor săptămânal" },
                ].map((link) => (
                  <Link key={link.title} className="glass-card group p-5" href={link.href}>
                    <div className="text-2xl">{link.icon}</div>
                    <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-accent-emerald">{link.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{link.desc}</p>
                  </Link>
                ))}
              </section>

              {/* Recent videos */}
              <section className="mb-8 animate-fade-in-up stagger-3">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Noutăți</p>
                    <h2 className="text-xl font-semibold text-white">Cele mai recente video-uri</h2>
                  </div>
                  <Link className="ghost-button text-xs" href="/dashboard/videos">
                    Vezi biblioteca
                  </Link>
                </div>
                {featuredVideos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {featuredVideos.map((video) => (
                      <Link key={video.id} className="glass-card group overflow-hidden p-0" href={`/dashboard/videos?video=${video.id}`}>
                        <div className="relative">
                          <VideoTemplateThumbnail
                            date={video.upload_date}
                            tag={video.category}
                            thumbnailUrl={video.thumbnail_url}
                          />
                          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-crypto-ink/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            {video.category}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="line-clamp-2 text-sm font-medium text-white group-hover:text-accent-emerald">{video.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <p className="text-sm text-slate-400">
                      Nu avem materiale recente. Intră direct în <Link className="text-accent-emerald hover:underline" href="/dashboard/videos">bibliotecă</Link>.
                    </p>
                  </div>
                )}
              </section>

              {/* More tools */}
              <section className="mb-8 grid gap-3 grid-cols-2 md:grid-cols-3 animate-fade-in-up stagger-4">
                {[
                  { href: "/dashboard/pivots", icon: "🔮", title: "Pivoți BTC", desc: "Timing research" },
                  { href: "/dashboard/countertrade", icon: "📺", title: "Countertrade", desc: "Sentiment YouTube" },
                  { href: "/dashboard/resurse", icon: "📚", title: "Resurse", desc: "Ghiduri și materiale" },
                ].map((link) => (
                  <Link key={link.title} className="glass-card group p-5" href={link.href}>
                    <div className="text-2xl">{link.icon}</div>
                    <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-accent-emerald">{link.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{link.desc}</p>
                  </Link>
                ))}
              </section>

              {/* Discord section */}
              <section className="glass-card p-5 animate-fade-in-up stagger-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {profile?.discord_user_id ? (
                      <>
                        {profile.discord_avatar ? (
                          <img alt={profile.discord_username ?? "Discord"} className="h-10 w-10 rounded-full" src={profile.discord_avatar} />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2] text-sm font-bold text-white">
                            {(profile.discord_username ?? "D")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{profile.discord_username}</p>
                          <p className="text-xs text-slate-500">Rol: {desiredDiscordRole} · sincronizat</p>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2]/20 text-lg">💬</div>
                        <div>
                          <p className="text-sm font-medium text-white">Discord neconectat</p>
                          <p className="text-xs text-slate-400">Conectează pentru rolul Elite</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!profile?.discord_user_id && (
                      <a className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4752C4]" href="/auth/discord/start">
                        Conectează
                      </a>
                    )}
                    <a className="ghost-button text-xs" href="https://discord.gg/ecNNcV5GD9" rel="noreferrer" target="_blank">
                      Deschide Discord
                    </a>
                  </div>
                </div>
                {searchParams?.discord === "connected" && (
                  <p className="mt-3 text-xs text-green-400">Discord conectat și rolul {searchParams.discord_role ?? desiredDiscordRole} sincronizat.</p>
                )}
                {searchParams?.discord_error && (
                  <p className="mt-3 text-xs text-red-400">{searchParams.discord_error}</p>
                )}
              </section>
            </>
          ) : (
            /* ═══ FREE USER DASHBOARD ═══ */
            <>
              {/* Trial CTA or Free upsell */}
              {canActivateTrial ? (
                <section className="mb-8 rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 px-6 py-8 animate-fade-in-up stagger-2">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="section-label mb-2">Free Trial</p>
                      <h2 className="text-2xl font-bold text-white">Testează TOTUL gratuit. <span className="text-accent-emerald">7 zile</span>. Zero obligații.</h2>
                      <p className="mt-3 max-w-xl text-sm text-slate-300">
                        Vei debloca: <span className="font-semibold text-white">Risk Score</span>, <span className="font-semibold text-white">Should I Trade</span>, {videoCount ?? 55}+ video-uri, <span className="font-semibold text-white">Discord Elite</span>, Indicatori TradingView.
                        <span className="font-semibold text-white">Fără card</span> - se dezactivează automat.
                      </p>
                    </div>
                    <TrialButton />
                  </div>
                </section>
              ) : (
                <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-8 animate-fade-in-up stagger-2">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-400">Membru Free</span>
                      <h2 className="mt-3 text-2xl font-bold text-white">Ai acces la conținutul gratuit</h2>
                      <p className="mt-2 text-sm text-slate-400">
                        Explorează resursele gratuite și vezi ce deblochezi cu Elite.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link className="accent-button" href="/upgrade">Upgrade la Elite</Link>
                      <Link className="ghost-button" href="/dashboard/videos">Vezi preview-urile</Link>
                    </div>
                  </div>
                </section>
              )}

              {/* Blurred Risk Score preview */}
              <section className="mb-8 animate-fade-in-up stagger-3">
                <div className="glass-card relative p-6 select-none text-center">
                  <p className="text-xs text-slate-500 mb-2">Risk Score Săptămânal</p>
                  <p className="font-mono text-5xl font-bold text-white blur-sm">67</p>
                  <p className="mt-2 text-sm text-accent-emerald blur-sm">CUMPĂRĂ</p>
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-crypto-ink/40">
                    <Link className="text-sm font-medium text-accent-emerald hover:underline" href="/upgrade">Upgrade la Elite pentru analiza completă →</Link>
                  </div>
                </div>
              </section>

              {/* Videos section */}
              <section className="mb-8 animate-fade-in-up stagger-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Biblioteca Video</h2>
                  <Link className="ghost-button text-xs" href="/dashboard/videos">Vezi toată biblioteca</Link>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {featuredVideos.map((video) => {
                    const isLocked = video.tier_required === "elite";
                    return (
                      <div key={video.id} className="glass-card overflow-hidden p-0">
                        <div className="relative">
                          <VideoTemplateThumbnail
                            className={isLocked ? "opacity-40" : ""}
                            date={video.upload_date}
                            tag={video.category}
                            thumbnailUrl={video.thumbnail_url}
                          />
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/50">
                              <Link className="accent-button text-xs" href="/upgrade">Deblochează cu Elite</Link>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{video.category}</p>
                          <h3 className="mt-1.5 line-clamp-2 text-sm font-medium text-white">{video.title}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* What you unlock */}
              <section className="mb-8 glass-card p-6 animate-fade-in-up stagger-5">
                <p className="section-label mb-3">Preview Elite</p>
                <h3 className="text-lg font-semibold text-white">Ce deblochezi cu accesul premium</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    "Biblioteca video completă ({videoCount}+ analize)",
                    "Risk Score, Should I Trade, Indicatori TradingView",
                    "Discord Elite, sesiuni live, suport prioritar",
                  ].map((item) => (
                    <div key={item} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="text-xs text-slate-400">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
