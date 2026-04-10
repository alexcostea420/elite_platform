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

    // Queue email drip sequence
    await serviceSupabase.from("email_drip_queue").insert([
      { user_id: user.id, email: user.email, template: "welcome", subject: "Contul tau Elite e activ - uite ce sa faci prima data", scheduled_at: now.toISOString() },
      { user_id: user.id, email: user.email, template: "value_day1", subject: "Greseala #1 care costa bani pe 90% din traderi", scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() },
      { user_id: user.id, email: user.email, template: "social_proof", subject: "\"De cand am intrat in Elite, sunt pe plus\" - Daniel", scheduled_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString() },
      { user_id: user.id, email: user.email, template: "trial_expiry", subject: "Accesul tau Elite se inchide in cateva ore", scheduled_at: new Date(now.getTime() + 65 * 60 * 60 * 1000).toISOString() },
    ]);

    return NextResponse.json({ ok: true, expires_at: trialExpires.toISOString() });
  } catch {
    return NextResponse.json({ error: "Eroare interna." }, { status: 500 });
  }
}
