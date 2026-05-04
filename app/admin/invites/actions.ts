"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { logAdminAction } from "@/lib/admin/audit";
import { createInviteLink } from "@/lib/invites/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/invites");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function createInviteAction(formData: FormData) {
  const admin = await requireAdmin();

  const planDuration = String(formData.get("plan_duration") ?? "").trim();
  const customDaysRaw = String(formData.get("custom_days") ?? "").trim();
  const maxUsesRaw = String(formData.get("max_uses") ?? "1").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const count = Number.parseInt(String(formData.get("count") ?? "1").trim(), 10) || 1;

  if (!["30_days", "90_days", "365_days", "custom"].includes(planDuration)) {
    redirect("/admin/invites?error=" + encodeURIComponent("Plan invalid."));
  }

  const customDays = planDuration === "custom" ? Number.parseInt(customDaysRaw, 10) : undefined;

  if (planDuration === "custom" && (!customDays || customDays < 1)) {
    redirect("/admin/invites?error=" + encodeURIComponent("Specifică un număr valid de zile."));
  }

  const maxUses = Number.parseInt(maxUsesRaw, 10) || 1;

  const tokens: { id: string; token: string }[] = [];

  for (let i = 0; i < Math.min(count, 100); i++) {
    const result = await createInviteLink({
      planDuration,
      customDays,
      maxUses,
      notes: count > 1 ? `${notes ?? "Batch"} (${i + 1}/${count})` : notes,
    });

    if (result.error) {
      redirect("/admin/invites?error=" + encodeURIComponent(result.error));
    }

    if (result.data) {
      tokens.push({ id: result.data.id, token: result.data.token });
    }
  }

  for (const t of tokens) {
    await logAdminAction({
      adminId: admin.id,
      actionType: "invite_create",
      targetType: "invite",
      targetId: t.id,
      after: { token: t.token, plan_duration: planDuration, custom_days: customDays ?? null, max_uses: maxUses, notes },
    });
  }

  revalidatePath("/admin/invites");
  redirect(
    "/admin/invites?message=" +
      encodeURIComponent(`${tokens.length} invitație(i) create.`) +
      "&tokens=" +
      encodeURIComponent(tokens.map((t) => t.token).join(",")),
  );
}

export async function deleteInviteAction(formData: FormData) {
  const admin = await requireAdmin();

  const inviteId = String(formData.get("id") ?? "").trim();

  if (!inviteId) {
    redirect("/admin/invites?error=" + encodeURIComponent("ID lipsă."));
  }

  const supabase = createServiceRoleSupabaseClient();

  const { data: before } = await supabase
    .from("invite_links")
    .select("id, token, plan_duration, custom_days, max_uses, used_count, notes")
    .eq("id", inviteId)
    .maybeSingle();

  const { error } = await supabase.from("invite_links").delete().eq("id", inviteId);

  if (error) {
    redirect("/admin/invites?error=" + encodeURIComponent("Nu s-a putut șterge invitația."));
  }

  await logAdminAction({
    adminId: admin.id,
    actionType: "invite_delete",
    targetType: "invite",
    targetId: inviteId,
    before: before ?? null,
  });

  revalidatePath("/admin/invites");
  redirect("/admin/invites?message=" + encodeURIComponent("Invitația a fost ștearsă."));
}
