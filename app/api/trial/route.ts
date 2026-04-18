import { NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    // Rate limit: 1 trial attempt per user per 24h
    const { allowed } = await checkRateLimit(`trial:${user.id}`, 1, 24 * 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Prea multe incercari. Incearca maine." }, { status: 429 });
    }

    // Require email verification
    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: "Verifica email-ul inainte de a activa trial-ul." }, { status: 400 });
    }

    const serviceSupabase = createServiceRoleSupabaseClient();

    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("subscription_status, subscription_tier, discord_username, trial_used_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profil inexistent." }, { status: 404 });
    }

    // CRITICAL: Check if trial was EVER used (not just current status)
    if (profile.trial_used_at) {
      return NextResponse.json({ error: "Ai folosit deja perioada de proba." }, { status: 400 });
    }

    // Don't allow trial if they already have elite access
    if (profile.subscription_tier === "elite") {
      return NextResponse.json({ error: "Ai deja acces Elite." }, { status: 400 });
    }

    // Check Discord username uniqueness across all accounts that ever had a subscription
    if (profile.discord_username) {
      const { data: existing } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("discord_username", profile.discord_username)
        .neq("id", user.id)
        .not("trial_used_at", "is", null)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Acest username Discord a fost deja folosit." }, { status: 400 });
      }
    }

    // Check global daily trial availability
    const { data: configRow } = await serviceSupabase
      .from("platform_config")
      .select("value")
      .eq("key", "trial_available")
      .maybeSingle();

    const trialConfig = configRow?.value as { available: boolean; reset_at: string | null } | null;

    if (trialConfig && !trialConfig.available) {
      // Check if it should have reset (reset daily at 08:00 UTC)
      const now08 = new Date();
      now08.setUTCHours(8, 0, 0, 0);
      if (now08.getTime() < Date.now()) {
        // Past 08:00 today - check if reset_at is before today's 08:00
        const resetAt = trialConfig.reset_at ? new Date(trialConfig.reset_at).getTime() : 0;
        if (resetAt < now08.getTime()) {
          // Should have reset - allow it
        } else {
          return NextResponse.json({ error: "Trial-ul de azi a fost deja luat. Revino mâine la 08:00." }, { status: 429 });
        }
      } else {
        return NextResponse.json({ error: "Trial-ul de azi a fost deja luat. Revino mâine la 08:00." }, { status: 429 });
      }
    }

    // Activate 7-day trial with trial_used_at timestamp
    const now = new Date();
    const trialExpires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { error: updateError } = await serviceSupabase.from("profiles").update({
      subscription_tier: "elite",
      subscription_status: "trial",
      subscription_expires_at: trialExpires.toISOString(),
      elite_since: now.toISOString(),
      trial_used_at: now.toISOString(),
    }).eq("id", user.id);

    if (updateError) {
      console.error("Trial activation failed:", updateError);
      return NextResponse.json({ error: "Activarea trial-ului a esuat. Incearca din nou." }, { status: 500 });
    }

    // Mark global trial as claimed for today
    await serviceSupabase.from("platform_config").update({
      value: {
        available: false,
        last_claimed_at: now.toISOString(),
        last_claimed_by: user.id,
        reset_at: now.toISOString(),
      },
      updated_at: now.toISOString(),
    }).eq("key", "trial_available");

    // Queue email drip sequence (timed for 7-day trial)
    const h = 60 * 60 * 1000;
    await serviceSupabase.from("email_drip_queue").insert([
      { user_id: user.id, email: user.email, template: "welcome", subject: "Contul tău Elite e activ - uite ce să faci prima dată", scheduled_at: now.toISOString() },
      { user_id: user.id, email: user.email, template: "value_day1", subject: "Greșeala #1 care costă bani pe 90% din traderi", scheduled_at: new Date(now.getTime() + 48 * h).toISOString() },
      { user_id: user.id, email: user.email, template: "social_proof", subject: "\"De când am intrat în Elite, sunt pe plus\" - Daniel", scheduled_at: new Date(now.getTime() + 120 * h).toISOString() },
      { user_id: user.id, email: user.email, template: "trial_expiry", subject: "Accesul tău Elite se închide mâine", scheduled_at: new Date(now.getTime() + 156 * h).toISOString() },
    ]);

    return NextResponse.json({ ok: true, expires_at: trialExpires.toISOString() });
  } catch {
    return NextResponse.json({ error: "Eroare interna." }, { status: 500 });
  }
}
