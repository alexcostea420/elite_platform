import "server-only";

import { randomBytes } from "crypto";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const PLAN_DAYS: Record<string, number> = {
  "30_days": 30,
  "90_days": 90,
  "365_days": 365,
};

export function generateInviteToken() {
  return randomBytes(6).toString("hex"); // 12 char hex token
}

export async function createInviteLink(opts: {
  planDuration: string;
  customDays?: number;
  maxUses?: number;
  expiresAt?: string | null;
  notes?: string | null;
}) {
  const supabase = createServiceRoleSupabaseClient();

  // Support custom days or predefined plans
  const subscriptionDays = opts.planDuration === "custom"
    ? opts.customDays
    : PLAN_DAYS[opts.planDuration];

  if (!subscriptionDays || subscriptionDays < 1 || subscriptionDays > 3650) {
    return { error: "Durata trebuie să fie între 1 și 3650 zile." };
  }

  const token = generateInviteToken();

  const { data, error } = await supabase
    .from("invite_links")
    .insert({
      token,
      plan_duration: opts.planDuration === "custom" ? "custom" : opts.planDuration,
      subscription_days: subscriptionDays,
      max_uses: opts.maxUses ?? 1,
      expires_at: opts.expiresAt || null,
      notes: opts.notes || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function validateInviteToken(token: string) {
  const supabase = createServiceRoleSupabaseClient();

  const { data: invite, error } = await supabase
    .from("invite_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) {
    return { valid: false, error: "Invitație invalidă." };
  }

  if (invite.used_count >= invite.max_uses) {
    return { valid: false, error: "Această invitație a fost deja folosită." };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: "Această invitație a expirat." };
  }

  return { valid: true, invite };
}

export async function redeemInvite(token: string, userId: string) {
  const supabase = createServiceRoleSupabaseClient();

  // Validate again
  const { valid, invite, error } = await validateInviteToken(token);
  if (!valid || !invite) {
    return { error: error ?? "Invitație invalidă." };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + invite.subscription_days * 24 * 60 * 60 * 1000);

  // Record redemption
  const { error: redemptionError } = await supabase
    .from("invite_redemptions")
    .insert({ invite_id: invite.id, user_id: userId });

  if (redemptionError) {
    // Likely duplicate — user already redeemed this invite
    if (redemptionError.code === "23505") {
      return { error: "Ai folosit deja această invitație." };
    }
    return { error: redemptionError.message };
  }

  // Increment used_count (atomic check to prevent race condition)
  const { error: countError } = await supabase
    .from("invite_links")
    .update({ used_count: invite.used_count + 1 })
    .eq("id", invite.id)
    .eq("used_count", invite.used_count);

  if (countError) {
    return { error: "Invitația a fost deja folosită." };
  }

  // Check if this is their first time becoming Elite
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("elite_since")
    .eq("id", userId)
    .maybeSingle();

  const updateData: Record<string, string> = {
    subscription_tier: "elite",
    subscription_status: "active",
    subscription_expires_at: expiresAt.toISOString(),
  };

  // Only set elite_since on first activation (never reset)
  // Longer plans bypass the 31-day time-gate
  if (!existingProfile?.elite_since) {
    const bypassTimeGate = invite.subscription_days >= 90;
    const eliteSince = bypassTimeGate
      ? new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString()
      : now.toISOString();
    updateData.elite_since = eliteSince;
  }

  // Activate subscription
  const { error: profileError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (profileError) {
    return { error: "Profilul nu a putut fi actualizat." };
  }

  // Create subscription record
  await supabase.from("subscriptions").insert({
    user_id: userId,
    tier: "elite",
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "active",
  });

  return { success: true, expiresAt };
}
