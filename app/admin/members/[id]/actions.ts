"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAdminAction } from "@/lib/admin/audit";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return user.id;
}

export async function extendEliteAction(formData: FormData) {
  const adminId = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const days = Number(formData.get("days") ?? 0);
  if (!userId || !Number.isFinite(days) || days <= 0 || days > 730) return;

  const service = createServiceRoleSupabaseClient();
  const { data: current } = await service
    .from("profiles")
    .select("subscription_expires_at, elite_since")
    .eq("id", userId)
    .maybeSingle();

  const now = new Date();
  const base = current?.subscription_expires_at && new Date(current.subscription_expires_at) > now
    ? new Date(current.subscription_expires_at)
    : now;
  const next = new Date(base.getTime() + days * 86_400_000);

  await service
    .from("profiles")
    .update({
      subscription_tier: "elite",
      subscription_status: "active",
      subscription_expires_at: next.toISOString(),
      elite_since: current?.elite_since ?? now.toISOString(),
    })
    .eq("id", userId);

  await logAdminAction({
    adminId,
    actionType: "subscription_extend",
    targetType: "profile",
    targetId: userId,
    before: { subscription_expires_at: current?.subscription_expires_at ?? null },
    after: { subscription_expires_at: next.toISOString(), days_added: days },
  });

  revalidatePath(`/admin/members/${userId}`);
}

export async function setVeteranAction(formData: FormData) {
  const adminId = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const value = formData.get("value") === "true";
  if (!userId) return;

  const service = createServiceRoleSupabaseClient();
  const { data: before } = await service
    .from("profiles")
    .select("is_veteran")
    .eq("id", userId)
    .maybeSingle();

  await service.from("profiles").update({ is_veteran: value }).eq("id", userId);

  await logAdminAction({
    adminId,
    actionType: "profile_tier_change",
    targetType: "profile",
    targetId: userId,
    before: { is_veteran: before?.is_veteran ?? null },
    after: { is_veteran: value },
    reason: "veteran flag toggle",
  });

  revalidatePath(`/admin/members/${userId}`);
}

export async function resetTrialAction(formData: FormData) {
  const adminId = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const service = createServiceRoleSupabaseClient();
  const { data: before } = await service
    .from("profiles")
    .select("trial_used_at")
    .eq("id", userId)
    .maybeSingle();

  await service.from("profiles").update({ trial_used_at: null }).eq("id", userId);

  await logAdminAction({
    adminId,
    actionType: "profile_tier_change",
    targetType: "profile",
    targetId: userId,
    before: { trial_used_at: before?.trial_used_at ?? null },
    after: { trial_used_at: null },
    reason: "trial reset",
  });

  revalidatePath(`/admin/members/${userId}`);
}

export async function downgradeToFreeAction(formData: FormData) {
  const adminId = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const service = createServiceRoleSupabaseClient();
  const { data: before } = await service
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  await service
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "expired",
      subscription_expires_at: null,
    })
    .eq("id", userId);

  await logAdminAction({
    adminId,
    actionType: "subscription_cancel",
    targetType: "profile",
    targetId: userId,
    before: before ?? null,
    after: { subscription_tier: "free", subscription_status: "expired", subscription_expires_at: null },
    reason: "manual downgrade to free",
  });

  revalidatePath(`/admin/members/${userId}`);
}
