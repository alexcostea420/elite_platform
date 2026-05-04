import { NextRequest, NextResponse } from "next/server";

import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { encrypt } from "@/lib/utils/encryption";

/**
 * POST /api/bots/connect
 * Save MEXC API credentials (encrypted) and create a pending bot subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Neautentificat." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const apiKey = (body?.api_key ?? "").trim();
    const apiSecret = (body?.api_secret ?? "").trim();
    const passphrase = (body?.passphrase ?? "").trim();
    const riskLevel = parseFloat(body?.risk_level ?? "1.0");
    const exchange = "MEXC";

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json(
        { error: "API Key invalid. Verifică cheia și încearcă din nou." },
        { status: 400 },
      );
    }

    if (!apiSecret || apiSecret.length < 10) {
      return NextResponse.json(
        { error: "Secret Key invalid. Verifică cheia și încearcă din nou." },
        { status: 400 },
      );
    }

    if (isNaN(riskLevel) || riskLevel < 0.5 || riskLevel > 5.0) {
      return NextResponse.json(
        { error: "Nivelul de risc trebuie să fie între 0.5% și 5.0%." },
        { status: 400 },
      );
    }

    const serviceSupabase = createServiceRoleSupabaseClient();

    // Encrypt and store credentials
    const { error: walletError } = await serviceSupabase
      .from("bot_wallets")
      .upsert(
        {
          user_id: user.id,
          hl_address: `mexc_${user.id.slice(0, 8)}`,
          hl_api_private_key_encrypted: encrypt(`${apiKey}:${apiSecret}${passphrase ? `:${passphrase}` : ""}`),
          max_risk_pct: riskLevel,
          auto_sizing: true,
          paused: false,
          is_verified: false,
        },
        { onConflict: "user_id" },
      );

    if (walletError) {
      console.error("bot_wallets upsert error:", walletError);
      return NextResponse.json(
        { error: "Nu s-au putut salva cheile API." },
        { status: 500 },
      );
    }

    // Determine pricing based on Elite status
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .maybeSingle();

    const plan =
      profile?.subscription_tier === "elite" ? "elite_tier" : "free_tier";
    const priceUsd = plan === "elite_tier" ? 45 : 98;

    // Create bot subscription if none exists
    const { data: existingSub } = await serviceSupabase
      .from("bot_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (!existingSub) {
      // Create pending subscription - requires payment before activation
      const { error: subError } = await serviceSupabase
        .from("bot_subscriptions")
        .insert({
          user_id: user.id,
          plan,
          price_usd: priceUsd,
          status: "pending",
          started_at: new Date().toISOString(),
        });

      if (subError) {
        console.error("bot_subscriptions insert error:", subError);
      }
    }

    return NextResponse.json({
      success: true,
      exchange,
      plan,
      price_usd: priceUsd,
    });
  } catch (err) {
    console.error("POST /api/bots/connect error:", err);
    return NextResponse.json(
      { error: "Eroare internă." },
      { status: 500 },
    );
  }
}
