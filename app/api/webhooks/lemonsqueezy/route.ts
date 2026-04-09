import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const SIGNING_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

// Product ID → plan mapping
const PRODUCT_PLAN_MAP: Record<string, { duration: string; days: number; isVeteran: boolean }> = {
  // Normal
  "959502": { duration: "30_days", days: 30, isVeteran: false },
  "959517": { duration: "90_days", days: 90, isVeteran: false },
  "959538": { duration: "365_days", days: 365, isVeteran: false },
  // Veteran
  "959519": { duration: "30_days", days: 30, isVeteran: true },
  "959520": { duration: "90_days", days: 90, isVeteran: true },
  "959537": { duration: "365_days", days: 365, isVeteran: true },
};

function verifySignature(rawBody: string, signature: string): boolean {
  if (!SIGNING_SECRET) return false;
  const hmac = crypto.createHmac("sha256", SIGNING_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") ?? "";

    if (!verifySignature(rawBody, signature)) {
      console.error("LemonSqueezy webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const email = payload.data?.attributes?.user_email;
    const productId = String(payload.data?.attributes?.first_order_item?.product_id ?? payload.data?.attributes?.product_id ?? "");
    const orderId = payload.data?.id;

    console.log(`LemonSqueezy webhook: ${eventName} | email: ${email} | product: ${productId}`);

    const supabase = createServiceRoleSupabaseClient();

    if (eventName === "order_created") {
      const plan = PRODUCT_PLAN_MAP[productId];
      if (!plan) {
        console.error(`LemonSqueezy: unknown product ID ${productId}`);
        return NextResponse.json({ error: "Unknown product" }, { status: 400 });
      }

      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users?.find((u) => u.email === email);

      if (!user) {
        console.error(`LemonSqueezy: user not found for email ${email}`);
        // Store the order for manual processing
        await supabase.from("payments").insert({
          user_id: null,
          plan_duration: plan.duration,
          amount_expected: payload.data?.attributes?.total / 100,
          amount_received: payload.data?.attributes?.total / 100,
          currency: "USD",
          chain: "LEMON",
          wallet_address: "lemonsqueezy",
          reference_amount: payload.data?.attributes?.total / 100,
          tx_hash: `lemon_${orderId}`,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        });
        return NextResponse.json({ ok: true, note: "User not found, payment stored for manual processing" });
      }

      const now = new Date();

      // Check if user has active subscription - extend from current expiry
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_expires_at, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      const hasActive =
        profile?.subscription_status === "active" &&
        profile?.subscription_expires_at &&
        new Date(profile.subscription_expires_at) > now;

      const startFrom = hasActive ? new Date(profile.subscription_expires_at) : now;
      const expiresAt = new Date(startFrom.getTime() + plan.days * 24 * 60 * 60 * 1000);

      // Create payment record
      await supabase.from("payments").insert({
        user_id: user.id,
        plan_duration: plan.duration,
        amount_expected: payload.data?.attributes?.total / 100,
        amount_received: payload.data?.attributes?.total / 100,
        currency: "USD",
        chain: "LEMON",
        wallet_address: "lemonsqueezy",
        reference_amount: payload.data?.attributes?.total / 100,
        tx_hash: `lemon_${orderId}`,
        status: "confirmed",
        confirmed_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      // Update profile
      const profileUpdate: Record<string, string | boolean> = {
        subscription_tier: "elite",
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString(),
      };

      // Set elite_since for time-gate bypass on longer plans
      if (!profile?.subscription_expires_at) {
        const bypassTimeGate = plan.duration === "90_days" || plan.duration === "365_days";
        profileUpdate.elite_since = bypassTimeGate
          ? new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString()
          : now.toISOString();
      }

      await supabase.from("profiles").update(profileUpdate).eq("id", user.id);

      // Queue expiry reminder emails
      try {
        const reminderEmails = [
          {
            user_id: user.id,
            email,
            template: "expiry_7d",
            subject: "Abonamentul tau Elite expira in 7 zile",
            scheduled_at: new Date(expiresAt.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            user_id: user.id,
            email,
            template: "expiry_1d",
            subject: "Abonamentul tau Elite expira maine",
            scheduled_at: new Date(expiresAt.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        await supabase.from("email_drip_queue").insert(reminderEmails);
      } catch {
        // Non-critical
      }

      console.log(`LemonSqueezy: activated Elite for ${email}, expires ${expiresAt.toISOString()}`);
      return NextResponse.json({ ok: true });
    }

    if (eventName === "subscription_payment_success") {
      // Recurring payment - extend subscription by 30 days
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users?.find((u) => u.email === email);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        const now = new Date();
        const currentExpiry = profile?.subscription_expires_at
          ? new Date(profile.subscription_expires_at)
          : now;
        const startFrom = currentExpiry > now ? currentExpiry : now;
        const expiresAt = new Date(startFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

        await supabase.from("profiles").update({
          subscription_tier: "elite",
          subscription_status: "active",
          subscription_expires_at: expiresAt.toISOString(),
        }).eq("id", user.id);

        console.log(`LemonSqueezy: renewed subscription for ${email}, expires ${expiresAt.toISOString()}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      // Don't immediately downgrade - let the cron handle expiry based on date
      console.log(`LemonSqueezy: ${eventName} for ${email}`);
      return NextResponse.json({ ok: true });
    }

    if (eventName === "subscription_payment_failed") {
      console.log(`LemonSqueezy: payment failed for ${email}`);
      return NextResponse.json({ ok: true });
    }

    if (eventName === "order_refunded") {
      // Downgrade user
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users?.find((u) => u.email === email);

      if (user) {
        await supabase.from("profiles").update({
          subscription_tier: "free",
          subscription_status: "cancelled",
        }).eq("id", user.id);
        console.log(`LemonSqueezy: refunded and downgraded ${email}`);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, event: eventName });
  } catch (error) {
    console.error("LemonSqueezy webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
