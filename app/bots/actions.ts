"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/utils/encryption";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAuth() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/bots");
  }

  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export async function createBotSubscriptionAction(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.subscription_tier === "elite" ? "elite_tier" : "free_tier";
  const priceUsd = plan === "elite_tier" ? 45 : 98;

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: subscription, error } = await serviceSupabase
    .from("bot_subscriptions")
    .insert({
      user_id: user.id,
      plan,
      price_usd: priceUsd,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !subscription) {
    redirect("/bots/subscribe?error=" + encodeURIComponent("Nu s-a putut crea abonamentul. Încearcă din nou."));
  }

  redirect(`/bots/subscribe?step=payment&subscription_id=${subscription.id}`);
}

export async function connectWalletAction(formData: FormData) {
  const { user } = await requireAuth();

  const hlAddress = getTrimmedValue(formData, "hl_address");
  const hlApiKey = getTrimmedValue(formData, "hl_api_key");
  const hlApiSecret = getTrimmedValue(formData, "hl_api_secret");

  if (!hlAddress.startsWith("0x") || hlAddress.length !== 42) {
    redirect("/bots/subscribe?step=wallet&error=" + encodeURIComponent("Adresa wallet trebuie să fie validă (0x... 42 caractere)."));
  }

  if (!hlApiKey) {
    redirect("/bots/subscribe?step=wallet&error=" + encodeURIComponent("API Key este obligatoriu."));
  }

  if (!hlApiSecret) {
    redirect("/bots/subscribe?step=wallet&error=" + encodeURIComponent("API Secret este obligatoriu."));
  }

  // Store keys as-is for now — encryption will be added later in production
  const serviceSupabase = createServiceRoleSupabaseClient();
  const { error } = await serviceSupabase
    .from("bot_wallets")
    .upsert(
      {
        user_id: user.id,
        hl_address: hlAddress,
        hl_api_key_encrypted: encrypt(hlApiKey),
        hl_api_secret_encrypted: encrypt(hlApiSecret),
        is_verified: false,
      },
      { onConflict: "user_id" },
    );

  if (error) {
    redirect("/bots/subscribe?step=wallet&error=" + encodeURIComponent("Nu s-a putut salva wallet-ul. Încearcă din nou."));
  }

  redirect("/bots/subscribe?step=configure");
}

export async function updateBotSettingsAction(formData: FormData) {
  const { user } = await requireAuth();

  const autoSizing = formData.get("auto_sizing") === "on";
  const maxRiskPctRaw = getTrimmedValue(formData, "max_risk_pct");
  const maxRiskPct = Number.parseFloat(maxRiskPctRaw);

  if (Number.isNaN(maxRiskPct) || maxRiskPct < 0.5 || maxRiskPct > 5.0) {
    redirect("/bots/dashboard?error=" + encodeURIComponent("Riscul maxim trebuie să fie între 0.5% și 5.0%."));
  }

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { error } = await serviceSupabase
    .from("bot_wallets")
    .update({
      auto_sizing: autoSizing,
      max_risk_pct: maxRiskPct,
    })
    .eq("user_id", user.id);

  if (error) {
    redirect("/bots/dashboard?error=" + encodeURIComponent("Nu s-au putut actualiza setările. Încearcă din nou."));
  }

  redirect("/bots/dashboard?message=" + encodeURIComponent("Setările au fost actualizate."));
}

export async function pauseBotAction() {
  const { user } = await requireAuth();

  const serviceSupabase = createServiceRoleSupabaseClient();

  // Fetch current paused state
  const { data: wallet, error: fetchError } = await serviceSupabase
    .from("bot_wallets")
    .select("paused")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !wallet) {
    redirect("/bots/dashboard?error=" + encodeURIComponent("Nu s-a găsit wallet-ul. Conectează-l mai întâi."));
  }

  const newPaused = !wallet.paused;

  const { error } = await serviceSupabase
    .from("bot_wallets")
    .update({ paused: newPaused })
    .eq("user_id", user.id);

  if (error) {
    redirect("/bots/dashboard?error=" + encodeURIComponent("Nu s-a putut schimba starea botului."));
  }

  const message = newPaused ? "Botul a fost pus pe pauză." : "Botul a fost reactivat.";
  redirect("/bots/dashboard?message=" + encodeURIComponent(message));
}

export async function activateBotSubscriptionAction(formData: FormData) {
  await requireAdmin();

  const userId = getTrimmedValue(formData, "user_id");
  const subscriptionId = getTrimmedValue(formData, "subscription_id");

  if (!userId || !subscriptionId) {
    redirect("/bots/admin?error=" + encodeURIComponent("ID utilizator sau abonament lipsă."));
  }

  const serviceSupabase = createServiceRoleSupabaseClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Activate bot subscription
  const { error: subError } = await serviceSupabase
    .from("bot_subscriptions")
    .update({
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", subscriptionId);

  if (subError) {
    redirect("/bots/admin?error=" + encodeURIComponent("Nu s-a putut activa abonamentul."));
  }

  // Update profile — set bot_since only if not already set
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("bot_since")
    .eq("id", userId)
    .maybeSingle();

  const profileUpdate: Record<string, unknown> = {
    bot_active: true,
    bot_expires_at: expiresAt.toISOString(),
  };

  if (!profile?.bot_since) {
    profileUpdate.bot_since = now.toISOString();
  }

  const { error: profileError } = await serviceSupabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    redirect("/bots/admin?error=" + encodeURIComponent("Abonament activat, dar profilul nu a fost actualizat."));
  }

  redirect("/bots/admin?message=" + encodeURIComponent("Abonament activat."));
}
