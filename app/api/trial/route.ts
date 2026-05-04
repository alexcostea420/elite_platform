import { NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

type ClaimResult =
  | { ok: true; expires_at: string }
  | { ok: false; reason: "already_used" | "already_elite" | "no_profile" | "discord_required" | "email_duplicate" };

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    // Rate limit: 3 trial attempts per user per 24h (was 1 — too strict if first attempt errored)
    const { allowed } = await checkRateLimit(`trial:${user.id}`, 3, 24 * 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Prea multe încercări. Încearcă mâine." }, { status: 429 });
    }

    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: "Verifică email-ul înainte de a activa trial-ul." }, { status: 400 });
    }

    const serviceSupabase = createServiceRoleSupabaseClient();

    // Discord username uniqueness check (cross-account abuse guard)
    // Done outside the RPC because it queries other rows.
    const { data: meRow } = await serviceSupabase
      .from("profiles")
      .select("discord_username")
      .eq("id", user.id)
      .maybeSingle();

    if (meRow?.discord_username) {
      const { data: existing } = await serviceSupabase
        .from("profiles")
        .select("id")
        .eq("discord_username", meRow.discord_username)
        .neq("id", user.id)
        .not("trial_used_at", "is", null)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Acest username Discord a fost deja folosit." }, { status: 400 });
      }
    }

    // Atomic claim + activate (single transaction; rolls back on any failure)
    const { data: rpcData, error: rpcError } = await serviceSupabase
      .rpc("claim_and_activate_trial", { p_user_id: user.id });

    if (rpcError) {
      console.error("claim_and_activate_trial RPC failed:", rpcError);
      return NextResponse.json({ error: "Eroare internă. Încearcă din nou peste un minut." }, { status: 500 });
    }

    const result = rpcData as ClaimResult | null;
    if (!result || result.ok === false) {
      const reason = result?.reason ?? "unknown";
      const message = (() => {
        switch (reason) {
          case "already_used": return "Ai folosit deja perioada de probă.";
          case "already_elite": return "Ai deja acces Elite.";
          case "no_profile": return "Profil inexistent.";
          case "discord_required": return "Conectează contul de Discord înainte să activezi trial-ul.";
          case "email_duplicate": return "Acest email a fost deja folosit pentru trial pe alt cont.";
          default: return "Activarea trial-ului a eșuat.";
        }
      })();
      return NextResponse.json({ error: message, reason }, { status: 400 });
    }

    // Queue email drip (idempotent: skip if already queued for this user)
    const now = new Date();
    const h = 60 * 60 * 1000;
    const { data: existingDrip } = await serviceSupabase
      .from("email_drip_queue")
      .select("id")
      .eq("user_id", user.id)
      .eq("template", "welcome")
      .limit(1);

    if (!existingDrip || existingDrip.length === 0) {
      const { error: dripError } = await serviceSupabase.from("email_drip_queue").insert([
        { user_id: user.id, email: user.email, template: "welcome", subject: "Contul tău Elite e activ - uite ce să faci prima dată", scheduled_at: now.toISOString() },
        { user_id: user.id, email: user.email, template: "value_day1", subject: "Greșeala #1 care costă bani pe 90% din traderi", scheduled_at: new Date(now.getTime() + 48 * h).toISOString() },
        { user_id: user.id, email: user.email, template: "social_proof", subject: "\"De când am intrat în Elite, sunt pe plus\" - Daniel", scheduled_at: new Date(now.getTime() + 120 * h).toISOString() },
        { user_id: user.id, email: user.email, template: "trial_expiry", subject: "Accesul tău Elite se închide mâine", scheduled_at: new Date(now.getTime() + 144 * h).toISOString() },
      ]);
      if (dripError) console.error("Trial drip enqueue failed:", dripError);
    }

    return NextResponse.json({ ok: true, expires_at: result.expires_at });
  } catch (err) {
    console.error("Trial route exception:", err);
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
