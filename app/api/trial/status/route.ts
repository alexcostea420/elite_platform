import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 30; // Cache 30 seconds

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data: configRow } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", "trial_available")
      .maybeSingle();

    const config = configRow?.value as {
      available: boolean;
      last_claimed_at: string | null;
      reset_at: string | null;
    } | null;

    if (!config) {
      return NextResponse.json({ available: true });
    }

    // Check if should auto-reset (daily at 08:00 UTC)
    const now = new Date();
    const today08 = new Date(now);
    today08.setUTCHours(8, 0, 0, 0);

    // If we're past 08:00 UTC today and last reset was before today's 08:00
    const resetAt = config.reset_at ? new Date(config.reset_at).getTime() : 0;
    const shouldReset = now.getTime() >= today08.getTime() && resetAt < today08.getTime();

    if (shouldReset) {
      // Auto-reset
      await supabase.from("platform_config").update({
        value: { available: true, last_claimed_at: config.last_claimed_at, reset_at: now.toISOString() },
        updated_at: now.toISOString(),
      }).eq("key", "trial_available");

      return NextResponse.json({ available: true });
    }

    // Calculate next reset time
    let nextReset = today08;
    if (now.getTime() >= today08.getTime()) {
      nextReset = new Date(today08.getTime() + 24 * 60 * 60 * 1000);
    }

    return NextResponse.json({
      available: config.available || shouldReset,
      next_reset: nextReset.toISOString(),
    });
  } catch {
    return NextResponse.json({ available: true });
  }
}
