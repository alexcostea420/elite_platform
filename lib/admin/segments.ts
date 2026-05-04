import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type ProfileLifecycleTag =
  | "elite_active"
  | "elite_veteran"
  | "trial_active"
  | "trial_expired_no_pay"
  | "churned"
  | "free_signup_no_trial"
  | "refunded"
  | "high_value";

export type ProfileWithTags = {
  id: string;
  full_name: string | null;
  discord_username: string | null;
  email: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  is_veteran: boolean;
  elite_since: string | null;
  trial_used_at: string | null;
  created_at: string;
  total_paid_net: number;
  payment_count: number;
  has_refund: boolean;
  tags: ProfileLifecycleTag[];
};

const HIGH_VALUE_THRESHOLD = 200;

function isActiveElite(p: {
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}, now: number) {
  return (
    p.subscription_tier === "elite" &&
    p.subscription_status === "active" &&
    p.subscription_expires_at !== null &&
    new Date(p.subscription_expires_at).getTime() > now
  );
}

export async function getProfilesWithTags(): Promise<ProfileWithTags[]> {
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: profiles }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, discord_username, email, subscription_tier, subscription_status, subscription_expires_at, is_veteran, elite_since, trial_used_at, created_at",
      ),
    supabase
      .from("payments")
      .select("user_id, amount_received, refunded_amount, status")
      .in("status", ["confirmed", "refunded"]),
  ]);

  const paymentAgg = new Map<string, { totalNet: number; count: number; hasRefund: boolean }>();
  for (const pay of (payments ?? []) as Array<{
    user_id: string | null;
    amount_received: number | null;
    refunded_amount: number | null;
    status: string;
  }>) {
    if (!pay.user_id) continue;
    const cur = paymentAgg.get(pay.user_id) ?? { totalNet: 0, count: 0, hasRefund: false };
    const gross = Number(pay.amount_received ?? 0);
    const refund =
      pay.status === "refunded" ? Number(pay.refunded_amount ?? gross) : 0;
    cur.totalNet += gross - refund;
    cur.count += 1;
    if (pay.status === "refunded") cur.hasRefund = true;
    paymentAgg.set(pay.user_id, cur);
  }

  const now = Date.now();

  return ((profiles ?? []) as Array<Omit<ProfileWithTags, "total_paid_net" | "payment_count" | "has_refund" | "tags">>).map(
    (p) => {
      const agg = paymentAgg.get(p.id) ?? { totalNet: 0, count: 0, hasRefund: false };
      const tags: ProfileLifecycleTag[] = [];
      const active = isActiveElite(p, now);

      if (active) {
        tags.push("elite_active");
        if (p.is_veteran) tags.push("elite_veteran");
      } else if (p.elite_since) {
        // Was Elite at some point, no longer active.
        tags.push("churned");
      } else if (p.trial_used_at && !p.elite_since) {
        const trialMs = new Date(p.trial_used_at).getTime();
        const trialActive = now - trialMs < 7 * 86_400_000;
        if (trialActive) tags.push("trial_active");
        else tags.push("trial_expired_no_pay");
      } else {
        tags.push("free_signup_no_trial");
      }

      if (agg.hasRefund) tags.push("refunded");
      if (agg.totalNet >= HIGH_VALUE_THRESHOLD) tags.push("high_value");

      return {
        ...p,
        total_paid_net: Math.round(agg.totalNet * 100) / 100,
        payment_count: agg.count,
        has_refund: agg.hasRefund,
        tags,
      };
    },
  );
}

export const TAG_LABELS: Record<ProfileLifecycleTag, string> = {
  elite_active: "Elite activ",
  elite_veteran: "Veteran",
  trial_active: "Trial activ",
  trial_expired_no_pay: "Trial expirat (n-a plătit)",
  churned: "Churned",
  free_signup_no_trial: "Free, fără trial",
  refunded: "A primit refund",
  high_value: `High value (≥${HIGH_VALUE_THRESHOLD}€ net)`,
};

export const TAG_BADGE: Record<ProfileLifecycleTag, string> = {
  elite_active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  elite_veteran: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  trial_active: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  trial_expired_no_pay: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  churned: "border-red-500/30 bg-red-500/10 text-red-400",
  free_signup_no_trial: "border-white/10 bg-white/[0.04] text-slate-400",
  refunded: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  high_value: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
};
