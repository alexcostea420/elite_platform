import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceRoleSupabaseClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Count recent attempts
  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", windowStart);

  const currentCount = count ?? 0;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Record this attempt
  await supabase.from("rate_limits").insert({ key });

  // Cleanup old entries (fire-and-forget, don't block)
  supabase
    .from("rate_limits")
    .delete()
    .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .then(() => {});

  return { allowed: true, remaining: limit - currentCount - 1 };
}
