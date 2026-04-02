"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  await requireAdmin();

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

  const tokens: string[] = [];

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
      tokens.push(result.data.token);
    }
  }

  revalidatePath("/admin/invites");
  redirect(
    "/admin/invites?message=" +
      encodeURIComponent(`${tokens.length} invitație(i) create.`) +
      "&tokens=" +
      encodeURIComponent(tokens.join(",")),
  );
}

export async function deleteInviteAction(formData: FormData) {
  await requireAdmin();

  const inviteId = String(formData.get("id") ?? "").trim();

  if (!inviteId) {
    redirect("/admin/invites?error=" + encodeURIComponent("ID lipsă."));
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("invite_links").delete().eq("id", inviteId);

  if (error) {
    redirect("/admin/invites?error=" + encodeURIComponent("Nu s-a putut șterge invitația."));
  }

  revalidatePath("/admin/invites");
  redirect("/admin/invites?message=" + encodeURIComponent("Invitația a fost ștearsă."));
}
