import { NextRequest, NextResponse } from "next/server";

import {
  expireBotSubscriptions,
  expireOldPendingPayments,
  expireOverdueProfiles,
  expireOverdueSubscriptions,
} from "@/lib/payments/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Cron endpoint to expire pending payments and overdue subscriptions.
 * Secured via CRON_SECRET header.
 * Call this via a cron service (Vercel Cron, external scheduler) every hour.
 */
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "Cron not configured." }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const [expiredPayments, expiredSubscriptions, expiredProfiles, expiredBotSubs] = await Promise.all([
      expireOldPendingPayments(),
      expireOverdueSubscriptions(),
      expireOverdueProfiles(),
      expireBotSubscriptions(),
    ]);

    // Trim rate_limits rows older than 24h. Cheap, prevents unbounded growth.
    const service = createServiceRoleSupabaseClient();
    await service.rpc("trim_rate_limits");

    return NextResponse.json({
      success: true,
      expired_payments: expiredPayments,
      expired_subscriptions: expiredSubscriptions,
      expired_profiles: expiredProfiles,
      expired_bot_subscriptions: expiredBotSubs,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
