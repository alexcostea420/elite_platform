"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type AdminProfile = {
  role: "member" | "admin";
};

type VideoPayload = {
  youtube_id: string;
  title: string;
  description: string | null;
  category: string;
  tier_required: "free" | "elite";
  duration_seconds: number | null;
  thumbnail_url: string | null;
  is_published: boolean;
};

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableValue(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  return value ? value : null;
}

function getDurationValue(formData: FormData) {
  const rawValue = getTrimmedValue(formData, "duration_seconds");

  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/videos");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<AdminProfile>();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

function getVideoPayload(formData: FormData): VideoPayload {
  return {
    youtube_id: getTrimmedValue(formData, "youtube_id"),
    title: getTrimmedValue(formData, "title"),
    description: getNullableValue(formData, "description"),
    category: getTrimmedValue(formData, "category"),
    tier_required: getTrimmedValue(formData, "tier_required") === "elite" ? "elite" : "free",
    duration_seconds: getDurationValue(formData),
    thumbnail_url: getNullableValue(formData, "thumbnail_url"),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createVideoAction(formData: FormData) {
  await requireAdmin();

  const payload = getVideoPayload(formData);
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase.from("videos").insert(payload);

  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost adăugat."));
}

export async function updateVideoAction(formData: FormData) {
  await requireAdmin();

  const videoId = getTrimmedValue(formData, "id");

  if (!videoId) {
    redirect("/admin/videos?error=" + encodeURIComponent("Lipsește identificatorul video-ului."));
  }

  const payload = getVideoPayload(formData);
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase.from("videos").update(payload).eq("id", videoId);

  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost actualizat."));
}

export async function deleteVideoAction(formData: FormData) {
  await requireAdmin();

  const videoId = getTrimmedValue(formData, "id");

  if (!videoId) {
    redirect("/admin/videos?error=" + encodeURIComponent("Lipsește identificatorul video-ului."));
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("videos").delete().eq("id", videoId);

  if (error) {
    redirect(`/admin/videos?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost șters."));
}
