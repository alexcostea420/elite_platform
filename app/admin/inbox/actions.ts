"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/admin/audit";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") throw new Error("forbidden");

  return user.id;
}

export async function setFeedbackStatusAction(formData: FormData) {
  const adminId = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!id || !["open", "responded", "archived"].includes(status)) {
    throw new Error("invalid_input");
  }

  const service = createServiceRoleSupabaseClient();

  const { data: before } = await service
    .from("feedback")
    .select("id, status, admin_notes, responded_at, user_id, type, message")
    .eq("id", id)
    .maybeSingle();

  if (!before) throw new Error("not_found");

  const update: Record<string, unknown> = {
    status,
    admin_notes: notes,
  };
  if (status === "responded" && !before.responded_at) {
    update.responded_at = new Date().toISOString();
    update.responded_by = adminId;
  }
  if (status === "open") {
    update.responded_at = null;
    update.responded_by = null;
  }

  const { error } = await service.from("feedback").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  await logAdminAction({
    adminId,
    actionType: "feedback_status_change",
    targetType: "feedback",
    targetId: id,
    reason: `${before.status} → ${status}`,
    before: before as Record<string, unknown>,
    after: { ...before, ...update },
  });

  revalidatePath("/admin/inbox");
}
