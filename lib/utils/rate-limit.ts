import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Atomic rate-limit check.
 * Counts recent attempts and inserts a new one in a single transaction via
 * the rate_limit_consume RPC, so two concurrent requests can't both pass
 * a check that should only let one through.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase.rpc("rate_limit_consume", {
    p_key: key,
    p_limit: limit,
    p_window_ms: windowMs,
  });

  if (error) {
    // Fail open on RPC error so a transient DB hiccup doesn't lock everyone out.
    // Logged so admin can spot if this becomes frequent.
    console.error(`rate_limit_consume RPC error for key=${key}:`, error.message);
    return { allowed: true, remaining: limit };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
  };
}
