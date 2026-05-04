import "server-only";

import { headers } from "next/headers";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

// Action types we currently log. Add to this union when wiring a new admin
// mutation — keeps grep-ability and prevents typos diverging the audit trail.
export type AdminActionType =
  | "invite_create"
  | "invite_revoke"
  | "invite_delete"
  | "video_create"
  | "video_update"
  | "video_delete"
  | "payment_confirm_manual"
  | "payment_refund"
  | "profile_tier_change"
  | "profile_role_change"
  | "profile_discord_link"
  | "subscription_extend"
  | "subscription_cancel"
  | "feedback_status_change";

export type AdminTargetType =
  | "invite"
  | "video"
  | "payment"
  | "profile"
  | "subscription"
  | "feedback";

type LogAdminActionInput = {
  adminId: string;
  actionType: AdminActionType;
  targetType: AdminTargetType;
  targetId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

function readClientMeta() {
  try {
    const h = headers();
    const forwarded = h.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    const userAgent = h.get("user-agent") || null;
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/**
 * Insert an audit log entry. Never throws — a logging failure should not
 * cancel the underlying admin mutation. Errors land in the server log only.
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  const { ip, userAgent } = readClientMeta();

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      admin_user_id: input.adminId,
      action_type: input.actionType,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      before_jsonb: input.before ?? null,
      after_jsonb: input.after ?? null,
      reason: input.reason ?? null,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[audit] insert failed", {
        action: input.actionType,
        target: input.targetType,
        error: error.message,
      });
    }
  } catch (err) {
    console.error("[audit] unexpected error", err);
  }
}
