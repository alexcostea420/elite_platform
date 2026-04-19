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

/** Find a user by email using admin API (paginated) */
async function findUserByEmail(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  email: string,
) {
  let page = 1;
  while (true) {
    const { data: userList } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
    if (!userList?.users?.length) break;
    const found = userList.users.find((u) => u.email === email);
    if (found) return found;
    if (userList.users.length < 500) break;
    page++;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-patreon-signature") ?? "";
    const event = request.headers.get("x-patreon-event") ?? "";

    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error(`Patreon webhook: sig mismatch. bodyLen=${rawBody.length}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const memberData = payload.data?.attributes;
    const email = memberData?.email;
    const patronStatus = memberData?.patron_status;
    const lastChargeStatus = memberData?.last_charge_status;
    const pledgeAmountCents = memberData?.currently_entitled_amount_cents ?? 0;

    console.log(`Patreon webhook: ${event} | email=${email} | status=${patronStatus} | charge=${lastChargeStatus} | cents=${pledgeAmountCents}`);

    const supabase = createServiceRoleSupabaseClient();

    // ─── members:create ────────────────────────────────────────
    if (event === "members:create" || event === "members:pledge:create") {
      if (!email) {
        console.error("Patreon webhook: no email in payload");
        return NextResponse.json({ ok: true, note: "No email" });
      }

      const user = await findUserByEmail(supabase, email);
      const isVeteran = pledgeAmountCents <= 3300;

      if (user) {
        // User already has account → activate Elite
        const now = new Date();
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

        await supabase.from("profiles").update({
          subscription_tier: "elite",
          subscription_status: "active",
          subscription_expires_at: finalExpiry.toISOString(),
          is_veteran: isVeteran,
          // Set elite_since only on first activation (32 days ago to bypass time-gate)
          ...(profile?.subscription_expires_at
            ? {}
            : { elite_since: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000).toISOString() }),
        }).eq("id", user.id);

        console.log(`Patreon: activated Elite for ${email}, expires ${finalExpiry.toISOString()}`);
      } else {
        // User doesn't have account → create invite + send email
        // DEDUP: check if an active invite already exists for this email
        const { data: existingInvites } = await supabase
          .from("invite_links")
          .select("token")
          .ilike("notes", `%${email}%`)
          .eq("used_count", 0)
          .gt("expires_at", new Date().toISOString())
          .limit(1);

        if (existingInvites && existingInvites.length > 0) {
          console.log(`Patreon: invite already exists for ${email}, skipping duplicate`);
          return NextResponse.json({ ok: true, note: "Invite already exists" });
        }

        const token = crypto.randomBytes(16).toString("hex");

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

        // Queue welcome email (invite link is looked up at send time from invite_links)
        await supabase.from("email_drip_queue").insert({
          user_id: null,
          email,
          template: "patreon_welcome",
          subject: "Bine ai venit in Armata de Traderi - activeaza-ti contul",
          scheduled_at: new Date().toISOString(),
        });

        console.log(`Patreon: new member ${email}, invite ${token} created`);
      }

      return NextResponse.json({ ok: true });
    }

    // ─── members:update ────────────────────────────────────────
    if (event === "members:update" || event === "members:pledge:update") {
      if (!email) return NextResponse.json({ ok: true });

      if (patronStatus === "declined_patron" || patronStatus === "former_patron") {
        // Don't immediately downgrade → let cron handle expiry naturally
        console.log(`Patreon: ${email} → ${patronStatus}, will expire naturally`);
      } else if (patronStatus === "active_patron" && lastChargeStatus === "Paid") {
        // Recurring payment success → extend by 30 days
        const user = await findUserByEmail(supabase, email);

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

          console.log(`Patreon: ${email} renewed, expires ${expiresAt.toISOString()}`);
        } else {
          // Paying but no account — same logic as create: make invite if none exists
          const { data: existingInvites } = await supabase
            .from("invite_links")
            .select("token")
            .ilike("notes", `%${email}%`)
            .eq("used_count", 0)
            .gt("expires_at", new Date().toISOString())
            .limit(1);

          if (!existingInvites?.length) {
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

            console.log(`Patreon: ${email} paying but no account, invite created`);
          }
        }
      }

      return NextResponse.json({ ok: true });
    }

    // ─── members:delete ────────────────────────────────────────
    if (event === "members:delete" || event === "members:pledge:delete") {
      console.log(`Patreon: member ${email ?? "unknown"} deleted`);
      // Don't downgrade immediately. Cron expiry will handle it when subscription_expires_at passes.
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, event });
  } catch (error) {
    console.error("Patreon webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
