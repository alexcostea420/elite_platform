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

    // Verify signature
    const isValid = verifySignature(rawBody, signature);
    if (!isValid) {
      console.error(`Patreon webhook: sig mismatch. bodyLen=${rawBody.length}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const memberData = payload.data?.attributes;
    const email = memberData?.email;
    const patronStatus = memberData?.patron_status; // active_patron, declined_patron, former_patron
    const lastChargeStatus = memberData?.last_charge_status; // Paid, Declined, Deleted, Pending, Refunded
    const pledgeAmountCents = memberData?.currently_entitled_amount_cents ?? 0;

    console.log(`Patreon webhook: ${event} | status: ${patronStatus}`);

    const supabase = createServiceRoleSupabaseClient();

    if (event === "members:create" || event === "members:pledge:create") {
      if (!email) {
        console.error("Patreon webhook: no email in payload");
        return NextResponse.json({ ok: true, note: "No email" });
      }

      // Find user by email using admin API with page iteration
      let user: { id: string; email?: string } | undefined;
      let page = 1;
      while (!user) {
        const { data: userList } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
        if (!userList?.users?.length) break;
        user = userList.users.find((u) => u.email === email);
        if (userList.users.length < 500) break;
        page++;
      }

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
          is_veteran: isVeteran,
          elite_since: profile?.subscription_expires_at
            ? undefined
            : new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("id", user.id);

        console.log(`Patreon: activated Elite, expires ${finalExpiry.toISOString()}`);
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

        console.log(`Patreon: new member, invite created`);
      }

      return NextResponse.json({ ok: true });
    }

    if (event === "members:update" || event === "members:pledge:update") {
      if (!email) return NextResponse.json({ ok: true });

      // Check if cancelled or declined
      if (patronStatus === "declined_patron" || patronStatus === "former_patron") {
        // Don't immediately downgrade - let cron handle expiry
        console.log(`Patreon: ${patronStatus} - will expire naturally`);
      } else if (patronStatus === "active_patron" && lastChargeStatus === "Paid") {
        // Recurring payment success - extend by 30 days
        let user: { id: string; email?: string } | undefined;
        let pg = 1;
        while (!user) {
          const { data: uList } = await supabase.auth.admin.listUsers({ page: pg, perPage: 500 });
          if (!uList?.users?.length) break;
          user = uList.users.find((u) => u.email === email);
          if (uList.users.length < 500) break;
          pg++;
        }

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

          console.log(`Patreon: renewed, expires ${expiresAt.toISOString()}`);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (event === "members:delete" || event === "members:pledge:delete") {
      console.log(`Patreon: member deleted`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error("Patreon webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
