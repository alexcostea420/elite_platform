import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/utils/encryption";

/**
 * POST /api/bots/connect
 * Save wallet + API key, test connection by fetching HL balance.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const hlAddress = (body?.hl_address ?? "").trim();
    const hlApiKey = (body?.hl_api_key ?? "").trim();

    if (!hlAddress.startsWith("0x") || hlAddress.length !== 42) {
      return NextResponse.json({ error: "Adresa wallet invalidă (trebuie 0x... 42 caractere)." }, { status: 400 });
    }

    if (!hlApiKey) {
      return NextResponse.json({ error: "API key-ul este obligatoriu." }, { status: 400 });
    }

    // Test connection by fetching user state from Hyperliquid
    let balance = 0;
    let connected = false;

    try {
      const hlResponse = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: hlAddress,
        }),
      });

      if (hlResponse.ok) {
        const hlData = await hlResponse.json();
        const accountValue = hlData?.marginSummary?.accountValue;
        balance = accountValue ? parseFloat(accountValue) : 0;
        connected = true;
      }
    } catch {
      // HL API unreachable - still save wallet, mark as unverified
    }

    // Save to database
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { error } = await serviceSupabase
      .from("bot_wallets")
      .upsert(
        {
          user_id: user.id,
          hl_address: hlAddress,
          hl_api_private_key_encrypted: encrypt(hlApiKey),
          is_verified: connected,
        },
        { onConflict: "user_id" },
      );

    if (error) {
      return NextResponse.json({ error: "Nu s-a putut salva wallet-ul." }, { status: 500 });
    }

    // Activate bot on profile if not already
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("bot_active, subscription_tier")
      .eq("id", user.id)
      .maybeSingle();

    // Create/update bot subscription
    const plan = profile?.subscription_tier === "elite" ? "elite_tier" : "free_tier";
    const price = plan === "elite_tier" ? 45 : 98;

    const { data: existingSub } = await serviceSupabase
      .from("bot_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (!existingSub) {
      await serviceSupabase.from("bot_subscriptions").insert({
        user_id: user.id,
        plan,
        price_usd: price,
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      connected,
      balance: Math.round(balance * 100) / 100,
      address: hlAddress,
      verified: connected,
    });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
