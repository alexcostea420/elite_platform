"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAdminAction } from "@/lib/admin/audit";
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

function validateVideoPayload(payload: VideoPayload): string | null {
  if (!payload.title || payload.title.length > 200) {
    return "Titlul este obligatoriu și nu poate depăși 200 caractere.";
  }

  if (!payload.youtube_id || !/^[a-zA-Z0-9_-]{6,15}$/.test(payload.youtube_id)) {
    return "YouTube ID-ul trebuie să fie un identificator valid (6-15 caractere alfanumerice).";
  }

  if (!payload.category || payload.category.length > 100) {
    return "Categoria este obligatorie și nu poate depăși 100 caractere.";
  }

  if (payload.thumbnail_url && !/^https:\/\/.+/.test(payload.thumbnail_url)) {
    return "URL-ul thumbnail trebuie să fie un link HTTPS valid.";
  }

  if (payload.description && payload.description.length > 5000) {
    return "Descrierea nu poate depăși 5000 caractere.";
  }

  return null;
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
  const admin = await requireAdmin();

  const payload = getVideoPayload(formData);
  const validationError = validateVideoPayload(payload);
  if (validationError) {
    redirect(`/admin/videos?error=${encodeURIComponent(validationError)}`);
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: created, error } = await supabase
    .from("videos")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("Video create error:", error);
    redirect(`/admin/videos?error=${encodeURIComponent("Nu s-a putut adăuga video-ul. Verifică datele și încearcă din nou.")}`);
  }

  await logAdminAction({
    adminId: admin.id,
    actionType: "video_create",
    targetType: "video",
    targetId: created?.id ?? null,
    after: payload as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost adăugat."));
}

export async function updateVideoAction(formData: FormData) {
  const admin = await requireAdmin();

  const videoId = getTrimmedValue(formData, "id");

  if (!videoId) {
    redirect("/admin/videos?error=" + encodeURIComponent("Lipsește identificatorul video-ului."));
  }

  const payload = getVideoPayload(formData);
  const validationError = validateVideoPayload(payload);
  if (validationError) {
    redirect(`/admin/videos?error=${encodeURIComponent(validationError)}`);
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: before } = await supabase
    .from("videos")
    .select("youtube_id, title, description, category, tier_required, duration_seconds, thumbnail_url, is_published")
    .eq("id", videoId)
    .maybeSingle();

  const { error } = await supabase.from("videos").update(payload).eq("id", videoId);

  if (error) {
    console.error("Video update error:", error);
    redirect(`/admin/videos?error=${encodeURIComponent("Nu s-a putut actualiza video-ul. Încearcă din nou.")}`);
  }

  await logAdminAction({
    adminId: admin.id,
    actionType: "video_update",
    targetType: "video",
    targetId: videoId,
    before: before ?? null,
    after: payload as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost actualizat."));
}

export async function deleteVideoAction(formData: FormData) {
  const admin = await requireAdmin();

  const videoId = getTrimmedValue(formData, "id");

  if (!videoId) {
    redirect("/admin/videos?error=" + encodeURIComponent("Lipsește identificatorul video-ului."));
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: before } = await supabase
    .from("videos")
    .select("youtube_id, title, category, tier_required, is_published")
    .eq("id", videoId)
    .maybeSingle();

  const { error } = await supabase.from("videos").delete().eq("id", videoId);

  if (error) {
    console.error("Video delete error:", error);
    redirect(`/admin/videos?error=${encodeURIComponent("Nu s-a putut șterge video-ul. Încearcă din nou.")}`);
  }

  await logAdminAction({
    adminId: admin.id,
    actionType: "video_delete",
    targetType: "video",
    targetId: videoId,
    before: before ?? null,
  });

  revalidatePath("/admin/videos");
  redirect("/admin/videos?message=" + encodeURIComponent("Video-ul a fost șters."));
}
