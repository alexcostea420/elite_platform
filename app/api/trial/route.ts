import { NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const serviceSupabase = createServiceRoleSupabaseClient();

    // Check if user already had a trial or subscription
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("subscription_status, subscription_tier, discord_username")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profil inexistent." }, { status: 404 });
    }

    // Don't allow trial if they already have elite access or used trial before
    if (profile.subscription_tier === "elite") {
      return NextResponse.json({ error: "Ai deja acces Elite." }, { status: 400 });
    }

    if (profile.subscription_status === "trial" || profile.subscription_status === "expired") {
      return NextResponse.json({ error: "Ai folosit deja perioada de proba." }, { status: 400 });
    }

    // Check Discord username uniqueness
    if (profile.discord_username) {
      const { data: existing } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("discord_username", profile.discord_username)
        .neq("id", user.id)
        .not("subscription_status", "is", null)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Acest username Discord a fost deja folosit." }, { status: 400 });
      }
    }

    // Activate 3-day trial
    const trialExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await serviceSupabase.from("profiles").update({
      subscription_tier: "elite",
      subscription_status: "trial",
      subscription_expires_at: trialExpires.toISOString(),
      elite_since: new Date().toISOString(),
    }).eq("id", user.id);

    // Queue email drip sequence
    const now = new Date();
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
