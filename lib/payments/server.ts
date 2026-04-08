import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  generateReferenceAmount,
  getPaymentConfig,
  getWalletForChain,
  CHAIN_CONFIG,
  planDurations,
  type PaymentChain,
  type PaymentStatus,
  type PlanDuration,
} from "@/lib/payments/config";

export type PaymentRow = {
  id: string;
  user_id: string;
  plan_duration: PlanDuration;
  amount_expected: number;
  amount_received: number | null;
  currency: string;
  chain: string;
  wallet_address: string;
  tx_hash: string | null;
  reference_amount: number;
  status: PaymentStatus;
  created_at: string;
  confirmed_at: string | null;
  expires_at: string | null;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  payment_id: string;
  tier: "elite";
  starts_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
};

/**
 * Create a new pending payment request for a user.
 */
export async function createPaymentRequest(
  userId: string,
  planDuration: PlanDuration,
  chain: PaymentChain = "TRC-20",
): Promise<{ payment: PaymentRow | null; error: string | null }> {
  // Validate chain
  const chainCfg = CHAIN_CONFIG[chain];
  if (!chainCfg || !chainCfg.enabled) {
    return { payment: null, error: "Rețeaua selectată nu este disponibilă." };
  }

  const wallet = getWalletForChain(chain);
  if (!wallet) {
    return { payment: null, error: "Rețeaua selectată nu este configurată." };
  }

  const config = getPaymentConfig(chain);
  const planConfig = planDurations[planDuration];

  if (!planConfig) {
    return { payment: null, error: "Plan invalid." };
  }

  const supabase = createServiceRoleSupabaseClient();

  // Check veteran pricing
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("is_veteran")
    .eq("id", userId)
    .maybeSingle();

  const isVeteran = userProfile?.is_veteran ?? false;
  const basePrice = isVeteran && config.veteranPrices[planDuration]
    ? config.veteranPrices[planDuration]
    : config.basePrices[planDuration];

  if (!basePrice) {
    return { payment: null, error: "Prețul nu este configurat pentru acest plan." };
  }

  // Check for existing pending payment
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, created_at, status")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment) {
    const createdAt = new Date(existingPayment.created_at).getTime();
    const timeoutMs = config.paymentTimeoutMinutes * 60 * 1000;
    if (Date.now() - createdAt < timeoutMs) {
      // Return existing pending payment
      const { data: fullPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("id", existingPayment.id)
        .maybeSingle();

      return { payment: fullPayment as PaymentRow, error: null };
    }
    // Expire the old payment
    await supabase
      .from("payments")
      .update({ status: "expired" })
      .eq("id", existingPayment.id);
  }

  // Generate reference amount with collision retry (up to 3 attempts)
  const tempId = `${userId}-${Date.now()}`;
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const referenceAmount = generateReferenceAmount(basePrice, tempId, attempt);

    // Check for collision: existing pending payment on same chain with same reference amount
    const { data: collision } = await supabase
      .from("payments")
      .select("id")
      .eq("chain", chain)
      .eq("reference_amount", referenceAmount)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (collision) {
      if (attempt < MAX_ATTEMPTS - 1) continue;
      return { payment: null, error: "Nu s-a putut genera o sumă unică. Încearcă din nou." };
    }

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        plan_duration: planDuration,
        amount_expected: basePrice,
        currency: config.currency,
        chain,
        wallet_address: wallet,
        reference_amount: referenceAmount,
        status: "pending" as PaymentStatus,
      })
      .select()
      .single();

    if (error) {
      // Unique index violation — retry with next attempt
      if (error.code === "23505" && attempt < MAX_ATTEMPTS - 1) continue;
      console.error("Payment creation error:", error);
      return { payment: null, error: "Nu s-a putut crea cererea de plată." };
    }

    return { payment: payment as PaymentRow, error: null };
  }

  return { payment: null, error: "Nu s-a putut crea cererea de plată." };
}

/**
 * Get a payment by ID (for status checks).
 */
export async function getPaymentById(
  paymentId: string,
  userId: string,
): Promise<PaymentRow | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .single();

  return (data as PaymentRow) ?? null;
}

/**
 * Confirm a payment: mark as confirmed, create subscription, update user tier.
 */
export async function confirmPayment(
  paymentId: string,
  txHash: string,
  amountReceived: number,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createServiceRoleSupabaseClient();

  // Get the payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("status", "pending")
    .single();

  if (!payment) {
    return { success: false, error: "Payment not found or already processed." };
  }

  const planConfig = planDurations[payment.plan_duration as PlanDuration];
  if (!planConfig) {
    return { success: false, error: "Invalid plan duration." };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + planConfig.days * 24 * 60 * 60 * 1000);

  // Update payment status
  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      tx_hash: txHash,
      amount_received: amountReceived,
      confirmed_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", paymentId);

  if (paymentError) {
    console.error("Payment confirm error:", paymentError);
    return { success: false, error: "Failed to update payment." };
  }

  // Create subscription
  const { error: subError } = await supabase.from("subscriptions").insert({
    user_id: payment.user_id,
    payment_id: paymentId,
    tier: "elite",
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "active",
  });

  if (subError) {
    console.error("Subscription creation error:", subError);
    return { success: false, error: "Failed to create subscription." };
  }

  // Check if first-time Elite (for time-gate tracking)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("elite_since")
    .eq("id", payment.user_id)
    .maybeSingle();

  // Update user profile to Elite
  const profileUpdate: Record<string, string> = {
    subscription_tier: "elite",
    subscription_status: "active",
    subscription_expires_at: expiresAt.toISOString(),
  };

  if (!existingProfile?.elite_since) {
    // Longer plans bypass the 31-day time-gate:
    // 90_days → indicators unlocked instantly (set elite_since 32 days ago)
    // 365_days → full dashboard unlocked instantly (set elite_since 32 days ago)
    // 30_days → normal time-gate (elite_since = now)
    const bypassTimeGate = payment.plan_duration === "90_days" || payment.plan_duration === "365_days";
    const eliteSince = bypassTimeGate
      ? new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString()
      : now.toISOString();
    profileUpdate.elite_since = eliteSince;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", payment.user_id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return { success: false, error: "Failed to update profile." };
  }

  // Queue expiry reminder emails (7 days + 1 day before expiry)
  try {
    const { data: userData } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", payment.user_id)
      .maybeSingle();

    const { data: authUser } = await supabase.auth.admin.getUserById(payment.user_id);
    const email = authUser?.user?.email;

    if (email) {
      const reminderEmails = [
        {
          user_id: payment.user_id,
          email,
          template: "expiry_7d",
          subject: "Abonamentul tau Elite expira in 7 zile",
          scheduled_at: new Date(expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: payment.user_id,
          email,
          template: "expiry_1d",
          subject: "Abonamentul tau Elite expira maine",
          scheduled_at: new Date(expiresAt.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      await supabase.from("email_drip_queue").insert(reminderEmails);
    }
  } catch {
    // Non-critical - don't fail payment over email queue
  }

  return { success: true, error: null };
}

/**
 * Get user's current active subscription.
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionRow | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SubscriptionRow) ?? null;
}

/**
 * Expire subscriptions that have passed their expiry date.
 * Called by cron or admin action.
 */
export async function expireOverdueSubscriptions(): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  // Get active subscriptions past their expiry
  const { data: expired } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lt("expires_at", now);

  if (!expired || expired.length === 0) {
    return 0;
  }

  // Update subscriptions to expired
  const expiredIds = expired.map((s) => s.id);
  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .in("id", expiredIds);

  // Downgrade user profiles
  const userIds = [...new Set(expired.map((s) => s.user_id))];
  for (const userId of userIds) {
    // Check if user has any other active subscription
    const { data: otherActive } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!otherActive) {
      await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: "expired",
        })
        .eq("id", userId);
    }
  }

  return expired.length;
}

/**
 * Expire profiles that have subscription_expires_at in the past but still show as active.
 * This catches invite-based subscriptions that don't have a subscriptions table row.
 */
export async function expireOverdueProfiles(): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const { data: expired } = await supabase
    .from("profiles")
    .select("id, discord_user_id")
    .eq("subscription_tier", "elite")
    .in("subscription_status", ["active", "trial"])
    .lt("subscription_expires_at", now);

  if (!expired || expired.length === 0) {
    return 0;
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const eliteRoleId = process.env.DISCORD_ROLE_ELITE_ID;
  const soldatRoleId = process.env.DISCORD_ROLE_SOLDAT_ID;

  for (const profile of expired) {
    await supabase
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "expired",
      })
      .eq("id", profile.id);

    // Discord: remove Elite role, add Soldat, send DM
    if (profile.discord_user_id && botToken && guildId) {
      try {
        const headers = { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" };
        const baseUrl = "https://discord.com/api/v10";

        // Remove Elite role
        if (eliteRoleId) {
          await fetch(`${baseUrl}/guilds/${guildId}/members/${profile.discord_user_id}/roles/${eliteRoleId}`, {
            method: "DELETE", headers,
          });
        }

        // Add Soldat role
        if (soldatRoleId) {
          await fetch(`${baseUrl}/guilds/${guildId}/members/${profile.discord_user_id}/roles/${soldatRoleId}`, {
            method: "PUT", headers,
          });
        }

        // Send DM
        const dmChannel = await fetch(`${baseUrl}/users/@me/channels`, {
          method: "POST", headers,
          body: JSON.stringify({ recipient_id: profile.discord_user_id }),
        }).then((r) => r.json());

        if (dmChannel?.id) {
          await fetch(`${baseUrl}/channels/${dmChannel.id}/messages`, {
            method: "POST", headers,
            body: JSON.stringify({
              content: "⏰ Abonamentul tău Elite a expirat.\nReînnoiește pe https://app.armatadetraderi.com/upgrade pentru a păstra accesul.",
            }),
          });
        }
      } catch {
        // Discord notification failed, but profile is already expired
      }
    }
  }

  return expired.length;
}

/**
 * Expire pending payments that are older than the timeout.
 */
export async function expireOldPendingPayments(): Promise<number> {
  const PAYMENT_TIMEOUT_MINUTES = 30;
  const supabase = createServiceRoleSupabaseClient();
  const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("payments")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("id");

  return data?.length ?? 0;
}

/**
 * Get all payments for admin dashboard.
 */
export async function getAllPayments(filters?: {
  status?: PaymentStatus;
  limit?: number;
  offset?: number;
}): Promise<{ payments: PaymentRow[]; total: number }> {
  const supabase = createServiceRoleSupabaseClient();

  let query = supabase
    .from("payments")
    .select("*, profiles!payments_user_id_fkey(full_name, discord_username)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters?.limit ?? 50) - 1);
  }

  const { data, count } = await query;

  return {
    payments: (data ?? []) as PaymentRow[],
    total: count ?? 0,
  };
}

/**
 * Get subscription metrics for admin dashboard.
 */
export async function getSubscriptionMetrics(): Promise<{
  activeSubscribers: number;
  totalRevenue: number;
  expiringSoon: number;
}> {
  const supabase = createServiceRoleSupabaseClient();

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [activeResult, revenueResult, expiringResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("payments")
      .select("amount_received")
      .eq("status", "confirmed"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gt("expires_at", now)
      .lt("expires_at", sevenDaysFromNow),
  ]);

  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, p) => sum + (Number(p.amount_received) || 0),
    0,
  );

  return {
    activeSubscribers: activeResult.count ?? 0,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    expiringSoon: expiringResult.count ?? 0,
  };
}

/**
 * Expire bot subscriptions that have passed their expiry date.
 * Called by cron alongside elite subscription expiry.
 */
export async function expireBotSubscriptions(): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  // Find active bot subscriptions past expiry
  const { data: expired } = await supabase
    .from("bot_subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lt("expires_at", now);

  if (!expired || expired.length === 0) {
    return 0;
  }

  // Mark subscriptions as expired
  const expiredIds = expired.map((s) => s.id);
  await supabase
    .from("bot_subscriptions")
    .update({ status: "expired" })
    .in("id", expiredIds);

  // Deactivate bot on profiles
  const userIds = [...new Set(expired.map((s) => s.user_id))];
  for (const userId of userIds) {
    // Check if user has any other active bot subscription
    const { data: otherActive } = await supabase
      .from("bot_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!otherActive) {
      await supabase
        .from("profiles")
        .update({ bot_active: false })
        .eq("id", userId);
    }
  }

  return expired.length;
}
