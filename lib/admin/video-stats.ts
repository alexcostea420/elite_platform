import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type VideoStatsRow = {
  video_id: string;
  title: string;
  tier_required: "free" | "elite";
  upload_date: string;
  unique_viewers: number;
  total_views: number;
  last_view_at: string | null;
};

export type RecentViewerRow = {
  user_id: string;
  full_name: string | null;
  discord_username: string | null;
  email: string | null;
  videos_watched: number;
  total_views: number;
  last_viewed_at: string;
};

export type RecentVideoActivity = {
  user_id: string;
  full_name: string | null;
  discord_username: string | null;
  video_id: string;
  video_title: string;
  view_count: number;
  last_viewed_at: string;
};

export type VideoEngagementDashboard = {
  totals: {
    totalViews: number;
    uniqueViewers: number;
    publishedVideos: number;
    avgVideosPerViewer: number;
  };
  perVideo: VideoStatsRow[];
  topViewers: RecentViewerRow[];
  recent: RecentVideoActivity[];
};

export async function getVideoEngagementDashboard(): Promise<VideoEngagementDashboard> {
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: videos }, { data: views }, { data: profiles }] = await Promise.all([
    supabase
      .from("videos")
      .select("id, title, tier_required, upload_date, is_published")
      .eq("is_published", true),
    supabase
      .from("video_views")
      .select("user_id, video_id, view_count, last_viewed_at, first_viewed_at"),
    supabase.from("profiles").select("id, full_name, discord_username, email"),
  ]);

  const videoMap = new Map<string, { title: string; tier_required: "free" | "elite"; upload_date: string }>(
    ((videos ?? []) as Array<{
      id: string;
      title: string;
      tier_required: "free" | "elite";
      upload_date: string;
    }>).map((v) => [v.id, v]),
  );

  const profileMap = new Map<
    string,
    { full_name: string | null; discord_username: string | null; email: string | null }
  >(
    ((profiles ?? []) as Array<{
      id: string;
      full_name: string | null;
      discord_username: string | null;
      email: string | null;
    }>).map((p) => [p.id, p]),
  );

  type VideoAgg = {
    unique_viewers: number;
    total_views: number;
    last_view_at: string | null;
  };
  const perVideoAgg = new Map<string, VideoAgg>();

  type ViewerAgg = {
    videos_watched: number;
    total_views: number;
    last_viewed_at: string;
  };
  const perViewerAgg = new Map<string, ViewerAgg>();

  const allViews = ((views ?? []) as Array<{
    user_id: string;
    video_id: string;
    view_count: number;
    last_viewed_at: string;
    first_viewed_at: string;
  }>);

  for (const v of allViews) {
    const cur = perVideoAgg.get(v.video_id) ?? {
      unique_viewers: 0,
      total_views: 0,
      last_view_at: null,
    };
    cur.unique_viewers += 1;
    cur.total_views += v.view_count ?? 0;
    if (!cur.last_view_at || v.last_viewed_at > cur.last_view_at) {
      cur.last_view_at = v.last_viewed_at;
    }
    perVideoAgg.set(v.video_id, cur);

    const vu = perViewerAgg.get(v.user_id) ?? {
      videos_watched: 0,
      total_views: 0,
      last_viewed_at: v.last_viewed_at,
    };
    vu.videos_watched += 1;
    vu.total_views += v.view_count ?? 0;
    if (v.last_viewed_at > vu.last_viewed_at) vu.last_viewed_at = v.last_viewed_at;
    perViewerAgg.set(v.user_id, vu);
  }

  const perVideo: VideoStatsRow[] = Array.from(perVideoAgg.entries())
    .map(([video_id, agg]) => {
      const meta = videoMap.get(video_id);
      if (!meta) return null;
      return {
        video_id,
        title: meta.title,
        tier_required: meta.tier_required,
        upload_date: meta.upload_date,
        ...agg,
      } satisfies VideoStatsRow;
    })
    .filter((r): r is VideoStatsRow => r !== null)
    .sort((a, b) => b.unique_viewers - a.unique_viewers);

  const topViewers: RecentViewerRow[] = Array.from(perViewerAgg.entries())
    .map(([user_id, agg]) => {
      const profile = profileMap.get(user_id);
      return {
        user_id,
        full_name: profile?.full_name ?? null,
        discord_username: profile?.discord_username ?? null,
        email: profile?.email ?? null,
        ...agg,
      } satisfies RecentViewerRow;
    })
    .sort((a, b) => b.videos_watched - a.videos_watched)
    .slice(0, 25);

  const recent: RecentVideoActivity[] = allViews
    .slice()
    .sort((a, b) => (b.last_viewed_at > a.last_viewed_at ? 1 : -1))
    .slice(0, 50)
    .map((v) => {
      const profile = profileMap.get(v.user_id);
      const meta = videoMap.get(v.video_id);
      return {
        user_id: v.user_id,
        full_name: profile?.full_name ?? null,
        discord_username: profile?.discord_username ?? null,
        video_id: v.video_id,
        video_title: meta?.title ?? "(șters)",
        view_count: v.view_count ?? 0,
        last_viewed_at: v.last_viewed_at,
      } satisfies RecentVideoActivity;
    });

  const totalViews = allViews.reduce((s, v) => s + (v.view_count ?? 0), 0);
  const uniqueViewers = perViewerAgg.size;
  const publishedVideos = videoMap.size;
  const avgVideosPerViewer =
    uniqueViewers === 0 ? 0 : Math.round((allViews.length / uniqueViewers) * 10) / 10;

  return {
    totals: {
      totalViews,
      uniqueViewers,
      publishedVideos,
      avgVideosPerViewer,
    },
    perVideo,
    topViewers,
    recent,
  };
}
