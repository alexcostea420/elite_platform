import { NextResponse } from "next/server";

import { getActiveSubscription } from "@/lib/payments/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        tier: "free",
      });
    }

    const expiresAt = new Date(subscription.expires_at);
    const remainingDays = Math.max(
      0,
      Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );

    return NextResponse.json({
      has_subscription: true,
      tier: "elite",
      starts_at: subscription.starts_at,
      expires_at: subscription.expires_at,
      remaining_days: remainingDays,
      status: subscription.status,
    });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
