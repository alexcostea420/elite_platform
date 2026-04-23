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

  const [{ data: profile }, { data: latestVideos }, { count: videoCount }, { data: riskScoreRow }] = await Promise.all([
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
    supabase
      .from("trading_data")
      .select("data, updated_at")
      .eq("data_type", "risk_score_v2")
      .maybeSingle(),
  ]);

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const isAdmin = profile?.role === "admin";
  const isEliteUser = profile?.subscription_tier === "elite";
  const isTrial = isEliteUser && profile?.subscription_status === "trial";
  const canActivateTrial = !isEliteUser && !profile?.trial_used_at;
  const desiredDiscordRole = getDiscordRoleLabel(profile?.subscription_tier ?? null);
  const daysLeft = getRemainingDays(profile?.subscription_expires_at ?? null);
  const featuredVideos: VideoPreview[] = latestVideos ?? [];
  const totalVideos = videoCount ?? 68;

  const riskScoreData = (riskScoreRow?.data ?? null) as {
    score?: number;
    decision?: "BUY" | "SELL" | "HOLD";
    decision_text?: string;
  } | null;
  const riskScore = typeof riskScoreData?.score === "number" ? Math.round(riskScoreData.score) : null;
  const riskDecision = riskScoreData?.decision ?? null;
  const riskDecisionLabel =
    riskDecision === "BUY" ? "CUMPĂRĂ" : riskDecision === "SELL" ? "VINDE" : riskDecision === "HOLD" ? "HOLD" : null;
  const riskDecisionColor =
    riskDecision === "BUY" ? "text-accent-emerald" : riskDecision === "SELL" ? "text-red-400" : "text-amber-400";

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

  const eliteLiveTools = [
    { href: "/dashboard/stocks", icon: "💹", title: "Stocks", desc: "16 acțiuni cu zone Buy/Sell" },
    { href: "/dashboard/crypto", icon: "🪙", title: "Crypto", desc: "25 monede, Fib zones, RSI" },
    { href: "/dashboard/risk-score", icon: "🎯", title: "Risk Score", desc: "Scor BTC săptămânal" },
    { href: "/dashboard/macro", icon: "🌐", title: "Macro", desc: "21 metrici globale" },
  ];

  const eliteTimingTools = [
    { href: "/tools/whale-tracker", icon: "🐋", title: "Whale Tracker", desc: "Top 20 portofele Hyperliquid" },
    { href: "/dashboard/calendar", icon: "📅", title: "Calendar", desc: "Evenimente economice live" },
    { href: "/dashboard/news", icon: "📰", title: "Știri Crypto", desc: "Feed agregat 5 surse" },
    { href: "/dashboard/indicators", icon: "📊", title: "Indicatori", desc: "TradingView Elite" },
  ];

  const eliteLearnTools = [
    { href: "/dashboard/videos", icon: "🎥", title: "Biblioteca Video", desc: `${totalVideos}+ analize` },
    { href: "/dashboard/ask-alex", icon: "🧠", title: "Alex's Brain", desc: "Asistent AI de trading" },
    { href: "/dashboard/resurse", icon: "📚", title: "Resurse", desc: "Ghiduri și materiale" },
  ];

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
            {isEliteUser && daysLeft !== null && daysLeft > 0 && !isTrial && (
              <p className="text-xs text-slate-500">
                Elite · <span className="font-mono text-slate-400">{daysLeft}</span> zile rămase
                {profile?.discord_user_id && <span className="ml-2 text-green-400">· Discord sincronizat</span>}
              </p>
            )}
            {isTrial && daysLeft !== null && daysLeft > 0 && (
              <p className="text-xs text-amber-400">
                🎁 Trial gratuit · <span className="font-mono">{daysLeft}</span> {daysLeft === 1 ? "zi" : "zile"} rămase
                <a href="/upgrade" className="ml-2 text-accent-emerald hover:underline">Upgrade</a>
              </p>
            )}
          </div>

          {/* Expiry warning */}
          {daysLeft !== null && daysLeft <= 0 && isEliteUser && (
            <section className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 animate-fade-in-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-red-400">
                    {isTrial ? "Trial-ul tău a expirat" : "Abonamentul tău a expirat"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {isTrial ? "Spune-ne cum a fost experiența și alege un plan." : "Reînnoiește pentru a păstra accesul la conținutul Elite."}
                  </p>
                </div>
                <Link className="accent-button whitespace-nowrap" href={isTrial ? "/dashboard/trial-feedback" : "/upgrade"}>
                  {isTrial ? "Spune-ne părerea" : "Reînnoiește"}
                </Link>
              </div>
            </section>
          )}
          {daysLeft !== null && daysLeft > 0 && daysLeft <= (isTrial ? 3 : 7) && (
            <section className="mb-6 rounded-xl border border-warning/20 bg-warning/5 px-5 py-4 animate-fade-in-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-yellow-400">
                    {isTrial ? "Trial-ul tău" : "Abonamentul tău"} expiră în {daysLeft} {daysLeft === 1 ? "zi" : "zile"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {isTrial ? "Alege un plan ca să păstrezi accesul Elite." : "Reînnoiește acum ca să nu pierzi accesul."}
                  </p>
                </div>
                <Link className="accent-button whitespace-nowrap" href="/upgrade">
                  {isTrial ? "Alege un plan" : "Reînnoiește"}
                </Link>
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

              {/* Live market snapshot */}
              {riskScore !== null && (
                <section className="mb-8 animate-fade-in-up stagger-2">
                  <Link
                    className="glass-card group flex items-center justify-between gap-4 p-5 transition-all hover:border-accent-emerald/30"
                    href="/dashboard/risk-score"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-emerald/10 text-2xl">
                        🎯
                      </div>
                      <div>
                        <p className="section-label mb-1">Risk Score BTC · Live</p>
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-3xl font-bold text-white tabular-nums">{riskScore}</span>
                          {riskDecisionLabel && (
                            <span className={`text-sm font-semibold uppercase tracking-wider ${riskDecisionColor}`}>
                              {riskDecisionLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 group-hover:text-accent-emerald">Vezi analiza →</span>
                  </Link>
                </section>
              )}

              {/* Analiză Live */}
              <section className="mb-8 animate-fade-in-up stagger-3">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Analiză Live</p>
                    <h2 className="text-lg font-semibold text-white">Monitorizare piață în timp real</h2>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  {eliteLiveTools.map((tool) => (
                    <Link key={tool.title} className="glass-card group p-5 transition-all hover:border-accent-emerald/30" href={tool.href}>
                      <div className="text-2xl">{tool.icon}</div>
                      <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-accent-emerald">{tool.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Timing & Semnale */}
              <section className="mb-8 animate-fade-in-up stagger-4">
                <div className="mb-4">
                  <p className="section-label mb-1">Timing & Semnale</p>
                  <h2 className="text-lg font-semibold text-white">Informații la minut pentru decizii</h2>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  {eliteTimingTools.map((tool) => (
                    <Link key={tool.title} className="glass-card group p-5 transition-all hover:border-accent-emerald/30" href={tool.href}>
                      <div className="text-2xl">{tool.icon}</div>
                      <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-accent-emerald">{tool.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Recent videos */}
              <section className="mb-8 animate-fade-in-up stagger-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Noutăți</p>
                    <h2 className="text-lg font-semibold text-white">Cele mai recente video-uri</h2>
                  </div>
                  <Link className="ghost-button text-xs" href="/dashboard/videos">
                    Vezi biblioteca
                  </Link>
                </div>
                {featuredVideos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {featuredVideos.map((video) => (
                      <Link key={video.id} className="glass-card group overflow-hidden p-0 transition-all hover:border-accent-emerald/30" href={`/dashboard/videos?video=${video.id}`}>
                        <div className="relative">
                          <VideoTemplateThumbnail
                            date={video.upload_date}
                            tag={video.category}
                            thumbnailUrl={video.thumbnail_url}
                            youtubeId={video.youtube_id}
                            title={video.title}
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

              {/* Educație & Comunitate */}
              <section className="mb-8 animate-fade-in-up stagger-5">
                <div className="mb-4">
                  <p className="section-label mb-1">Educație & Comunitate</p>
                  <h2 className="text-lg font-semibold text-white">Resurse pentru înțelegere în profunzime</h2>
                </div>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                  {eliteLearnTools.map((tool) => (
                    <Link key={tool.title} className="glass-card group p-5 transition-all hover:border-accent-emerald/30" href={tool.href}>
                      <div className="text-2xl">{tool.icon}</div>
                      <h3 className="mt-2 text-sm font-semibold text-white group-hover:text-accent-emerald">{tool.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>
                    </Link>
                  ))}
                </div>
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
                <section className="mb-8 rounded-xl border border-accent-emerald/20 bg-gradient-to-br from-accent-emerald/10 via-accent-emerald/5 to-transparent px-6 py-8 animate-fade-in-up stagger-2">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="section-label mb-2">Free Trial · 7 zile</p>
                      <h2 className="text-2xl font-bold text-white md:text-3xl">
                        Testează <span className="text-accent-emerald">TOTUL</span> gratuit
                      </h2>
                      <p className="mt-3 max-w-xl text-sm text-slate-300">
                        Deblochezi {totalVideos}+ video-uri, <span className="font-semibold text-white">Risk Score</span>, <span className="font-semibold text-white">Whale Tracker</span>, <span className="font-semibold text-white">Macro Dashboard</span>, indicatori TradingView și Discord Elite.
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Fără card. Se dezactivează automat.</p>
                    </div>
                    <TrialButton />
                  </div>
                </section>
              ) : (
                <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-8 animate-fade-in-up stagger-2">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-400">Membru Free</span>
                      <h2 className="mt-3 text-2xl font-bold text-white">Bine ai venit în Armata de Traderi</h2>
                      <p className="mt-2 max-w-xl text-sm text-slate-400">
                        Ai acces la preview-uri limitate. Upgrade la Elite pentru toate tool-urile, biblioteca completă și Discord privat.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link className="accent-button" href="/upgrade">Upgrade la Elite</Link>
                    </div>
                  </div>
                </section>
              )}

              {/* Blurred Elite tools preview */}
              <section className="mb-8 animate-fade-in-up stagger-3">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Ce conține Elite</p>
                    <h2 className="text-lg font-semibold text-white">Tool-urile pe care le deblochezi</h2>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                  {eliteLiveTools.map((tool) => (
                    <div key={tool.title} className="glass-card relative overflow-hidden p-5">
                      <div className="select-none blur-[3px]">
                        <div className="text-2xl">{tool.icon}</div>
                        <h3 className="mt-2 text-sm font-semibold text-white">{tool.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-crypto-ink/40">
                        <span className="text-lg">🔒</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Blurred Risk Score preview */}
              <section className="mb-8 animate-fade-in-up stagger-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass-card relative select-none p-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Risk Score BTC</p>
                    <p className="font-mono text-5xl font-bold text-white blur-sm">67</p>
                    <p className="mt-2 text-sm text-accent-emerald blur-sm">CUMPĂRĂ</p>
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-crypto-ink/40">
                      <Link className="text-sm font-medium text-accent-emerald hover:underline" href="/upgrade">
                        Deblochează scorul live →
                      </Link>
                    </div>
                  </div>
                  <div className="glass-card relative select-none p-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Whale Tracker Hyperliquid</p>
                    <p className="font-mono text-5xl font-bold text-white blur-sm">$142M</p>
                    <p className="mt-2 text-sm text-accent-emerald blur-sm">Top 20 portofele</p>
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-crypto-ink/40">
                      <Link className="text-sm font-medium text-accent-emerald hover:underline" href="/upgrade">
                        Vezi ce cumpără whale-ii →
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Videos section */}
              <section className="mb-8 animate-fade-in-up stagger-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="section-label mb-1">Biblioteca Video</p>
                    <h2 className="text-lg font-semibold text-white">Analize de la Alex · {totalVideos}+ video-uri</h2>
                  </div>
                  <Link className="ghost-button text-xs" href="/dashboard/videos">Explorează</Link>
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
                            youtubeId={video.youtube_id}
                            title={video.title}
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
                <h3 className="text-lg font-semibold text-white">Totul inclus în abonament</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { icon: "🎥", title: "Biblioteca video completă", desc: `${totalVideos}+ analize tactice` },
                    { icon: "💹", title: "Stocks & Crypto zones", desc: "41 active cu Buy/Sell" },
                    { icon: "🎯", title: "Risk Score & Macro", desc: "22+ metrici globale" },
                    { icon: "🐋", title: "Whale Tracker", desc: "Top 20 portofele Hyperliquid" },
                    { icon: "📊", title: "Indicatori TradingView", desc: "Acces Elite privat" },
                    { icon: "💬", title: "Discord Elite", desc: "Comunitate, Q&A, suport" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Link className="accent-button" href="/upgrade">Vezi planurile</Link>
                  {canActivateTrial && <TrialButton />}
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
