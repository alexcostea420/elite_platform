import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Records that the authenticated user opened a video.
 *
 * Upserts into video_views by (user_id, video_id) — first call creates the
 * row, subsequent calls bump view_count and last_viewed_at. Idempotent at
 * the row level, but we don't dedup within a session (the player's URL
 * param drives this, so a refresh = a new view; that's intentional for
 * activity-recency signal).
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { video_id?: string };
  try {
    body = (await request.json()) as { video_id?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const videoId = body.video_id;
  if (!videoId || typeof videoId !== "string") {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }

  const service = createServiceRoleSupabaseClient();

  // Verify the video exists + the user can access it (free vs elite gate).
  const { data: video } = await service
    .from("videos")
    .select("id, tier_required, is_published")
    .eq("id", videoId)
    .maybeSingle();

  if (!video || !video.is_published) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (video.tier_required === "elite") {
    const { data: profile } = await service
      .from("profiles")
      .select("subscription_tier, subscription_status, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();
    const isActiveElite =
      profile?.subscription_tier === "elite" &&
      profile?.subscription_status === "active" &&
      profile?.subscription_expires_at !== null &&
      new Date(profile.subscription_expires_at).getTime() > Date.now();
    if (!isActiveElite) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const now = new Date().toISOString();

  const { data: existing } = await service
    .from("video_views")
    .select("id, view_count")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

  if (existing) {
    await service
      .from("video_views")
      .update({
        last_viewed_at: now,
        view_count: (existing.view_count ?? 0) + 1,
      })
      .eq("id", existing.id);
  } else {
    await service.from("video_views").insert({
      user_id: user.id,
      video_id: videoId,
      first_viewed_at: now,
      last_viewed_at: now,
      view_count: 1,
    });
  }

  return NextResponse.json({ ok: true });
}
