import { NextRequest, NextResponse } from "next/server";

import { getStripeConfig, STRIPE_PLANS } from "@/lib/payments/stripe";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const stripeConfig = getStripeConfig();
    if (!stripeConfig) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !stripeConfig.webhookSecret) {
      console.error("Stripe webhook: missing signature or webhook secret");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeConfig.secretKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        metadata?: Record<string, string>;
        payment_intent?: string;
        amount_total?: number;
        currency?: string;
        customer_email?: string;
      };

      const userId = session.metadata?.user_id;
      const planDuration = session.metadata?.plan_duration;
      const planDays = parseInt(session.metadata?.plan_days ?? "30", 10);

      if (!userId || !planDuration) {
        console.error("Stripe webhook: missing metadata", session.metadata);
        return NextResponse.json({ ok: true, note: "Missing metadata" });
      }

      const supabase = createServiceRoleSupabaseClient();

      // Get current profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at, subscription_status, elite_since")
        .eq("id", userId)
        .maybeSingle();

      const now = new Date();
      const hasActive =
        profile?.subscription_status === "active" &&
        profile?.subscription_expires_at &&
        new Date(profile.subscription_expires_at) > now;

      const startFrom = hasActive ? new Date(profile.subscription_expires_at) : now;
      const expiresAt = new Date(startFrom.getTime() + planDays * 24 * 60 * 60 * 1000);

      // Create payment record
      const amountEur = (session.amount_total ?? 0) / 100;
      await supabase.from("payments").insert({
        user_id: userId,
        plan_duration: planDuration,
        amount_expected: amountEur,
        amount_received: amountEur,
        currency: "EUR",
        chain: "STRIPE",
        wallet_address: "stripe",
        tx_hash: (session.payment_intent as string) ?? session.id,
        status: "confirmed",
        confirmed_at: now.toISOString(),
        reference_amount: amountEur,
      });

      // Create subscription record
      await supabase.from("subscriptions").insert({
        user_id: userId,
        tier: "elite",
        starts_at: (hasActive ? new Date(profile.subscription_expires_at) : now).toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      });

      // Upgrade profile
      await supabase
        .from("profiles")
        .update({
          subscription_tier: "elite",
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
          elite_since: profile?.elite_since ?? now.toISOString(),
        })
        .eq("id", userId);

      console.log(`Stripe: activated Elite, plan ${planDuration}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
