import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { syncDiscordRole } from "@/lib/discord/server";
import { buildPageMetadata } from "@/lib/seo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { VideoLibraryClient } from "./video-library-client";

type DashboardVideosPageProps = {
  searchParams?: {
    video?: string;
  };
};

export const metadata: Metadata = buildPageMetadata({
  title: "Bibliotecă Video Trading | Resurse Membru Crypto",
  description:
    "Accesează biblioteca video de trading crypto din platformă și vezi materialele disponibile pentru nivelul tău de membru.",
  keywords: [
    "biblioteca video trading",
    "resurse membru crypto",
    "video trading crypto",
    "educatie traderi romania",
    "platforma elite crypto",
  ],
  path: "/dashboard/videos",
  host: "app",
  index: false,
});

type SubscriptionTier = "free" | "elite" | null;

export default async function DashboardVideosPage({ searchParams }: DashboardVideosPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/videos");
  }

  const [{ data: profile }, { data: videos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, subscription_tier, discord_user_id, discord_role_synced_at, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("videos")
      .select("id, youtube_id, title, description, summary, tags, category, tier_required, duration_seconds, thumbnail_url, upload_date, r2_url")
      .eq("is_published", true)
      .order("upload_date", { ascending: false }),
  ]);

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);
  const rawUserTier = profile?.subscription_tier;
  const userTier: SubscriptionTier =
    rawUserTier === "free" || rawUserTier === "elite" ? rawUserTier : null;

  // Fire-and-forget Discord sync with 15-minute cooldown
  if (profile?.discord_user_id) {
    const lastSyncedAt = profile.discord_role_synced_at ? new Date(profile.discord_role_synced_at).getTime() : 0;
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (lastSyncedAt < fifteenMinutesAgo) {
      syncDiscordRole({
        profileId: user.id,
        discordUserId: profile.discord_user_id,
        subscriptionTier: userTier,
      }).catch(() => {});
    }
  }

  const allVideos = videos ?? [];
  const videoCount = allVideos.length;

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="pb-16 pt-24 md:pt-28">
        <Container>
          {/* HEADER */}
          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-300">Biblioteca Video</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Biblioteca <span className="gradient-text">Video</span>
              </h1>
              <span className="font-data rounded-lg border border-accent-emerald/20 bg-accent-emerald/10 px-3 py-1 text-sm font-semibold text-accent-emerald">
                {videoCount}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-slate-400">
              Toate materialele video disponibile pentru nivelul tau de acces.
            </p>
          </section>

          <VideoLibraryClient
            videos={allVideos}
            selectedVideoId={searchParams?.video ?? null}
            userTier={userTier}
            isAdmin={profile?.role === "admin"}
          />
        </Container>
      </main>
      <Footer compact />
    </>
  );
}
