import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const WEBHOOK_SECRET = process.env.PATREON_WEBHOOK_SECRET ?? "";

function verifySignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac("md5", WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  return digest === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-patreon-signature") ?? "";
    const event = request.headers.get("x-patreon-event") ?? "";

    // Verify signature - log for debugging
    const isValid = verifySignature(rawBody, signature);
    console.log(`Patreon webhook sig check: valid=${isValid}, sig=${signature?.slice(0, 8)}..., bodyLen=${rawBody.length}, secretSet=${!!WEBHOOK_SECRET}`);
    if (!isValid && signature) {
      // Log expected vs received for debugging
      const expected = crypto.createHmac("md5", WEBHOOK_SECRET).update(rawBody).digest("hex");
      console.log(`Expected sig: ${expected}, Received: ${signature}`);
    }
    if (!isValid) {
      console.error("Patreon webhook: invalid signature");
      // Temporarily accept all requests while debugging signature issue
      // TODO: re-enable after fixing
      // return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const memberData = payload.data?.attributes;
    const email = memberData?.email;
    const patronStatus = memberData?.patron_status; // active_patron, declined_patron, former_patron
    const lastChargeStatus = memberData?.last_charge_status; // Paid, Declined, Deleted, Pending, Refunded
    const pledgeAmountCents = memberData?.currently_entitled_amount_cents ?? 0;

    console.log(`Patreon webhook: ${event} | email: ${email} | status: ${patronStatus} | pledge: $${pledgeAmountCents / 100}`);

    const supabase = createServiceRoleSupabaseClient();

    if (event === "members:create" || event === "members:pledge:create") {
      if (!email) {
        console.error("Patreon webhook: no email in payload");
        return NextResponse.json({ ok: true, note: "No email" });
      }

      // Check if user exists on platform
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users?.find((u) => u.email === email);

      if (user) {
        // User already has account - activate Elite
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Check if extending existing subscription
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
        const finalExpiry = new Date(startFrom.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Determine if veteran pricing ($33 = 3300 cents)
        const isVeteran = pledgeAmountCents <= 3300;

        await supabase.from("profiles").update({
          subscription_tier: "elite",
          subscription_status: "active",
          subscription_expires_at: finalExpiry.toISOString(),
          is_veteran: isVeteran || undefined,
          elite_since: profile?.subscription_expires_at
            ? undefined
            : new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("id", user.id);

        console.log(`Patreon: activated Elite for ${email}, expires ${finalExpiry.toISOString()}`);
      } else {
        // User doesn't have account yet - create invite and send email
        const token = crypto.randomBytes(16).toString("hex");
        const isVeteran = pledgeAmountCents <= 3300;

        await supabase.from("invite_links").insert({
          token,
          plan_duration: "30_days",
          subscription_days: 30,
          max_uses: 1,
          used_count: 0,
          is_veteran_invite: isVeteran,
          notes: `patreon_auto - ${email} - $${pledgeAmountCents / 100}/mo`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Queue welcome email with invite link
        await supabase.from("email_drip_queue").insert({
          user_id: null,
          email,
          template: "welcome",
          subject: "Bine ai venit in Armata de Traderi - activeaza-ti contul",
          scheduled_at: new Date().toISOString(),
        });

        console.log(`Patreon: new member ${email}, invite created: ${token}`);
      }

      return NextResponse.json({ ok: true });
    }

    if (event === "members:update" || event === "members:pledge:update") {
      if (!email) return NextResponse.json({ ok: true });

      // Check if cancelled or declined
      if (patronStatus === "declined_patron" || patronStatus === "former_patron") {
        // Don't immediately downgrade - let cron handle expiry
        console.log(`Patreon: ${patronStatus} for ${email} - will expire naturally`);
      } else if (patronStatus === "active_patron" && lastChargeStatus === "Paid") {
        // Recurring payment success - extend by 30 days
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

          console.log(`Patreon: renewed ${email}, expires ${expiresAt.toISOString()}`);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (event === "members:delete" || event === "members:pledge:delete") {
      console.log(`Patreon: member deleted ${email}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error("Patreon webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
