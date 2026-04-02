import { NextRequest, NextResponse } from "next/server";

import {
  exchangeDiscordCodeForAccessToken,
  fetchDiscordUser,
  getDiscordRoleLabel,
  saveDiscordIdentityForProfile,
  syncDiscordRole,
} from "@/lib/discord/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SubscriptionTier = "free" | "elite" | null;

function redirectWithDiscordState(request: NextRequest, params: Record<string, string>) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/dashboard";
  redirectUrl.search = "";

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const expectedState = request.cookies.get("discord_oauth_state")?.value;

  if (oauthError) {
    const response = redirectWithDiscordState(request, {
      discord_error: "Conectarea la Discord a fost anulată sau respinsă.",
    });
    response.cookies.delete("discord_oauth_state");
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = redirectWithDiscordState(request, {
      discord_error: "Sesiunea de conectare Discord nu a fost validă. Încearcă din nou.",
    });
    response.cookies.delete("discord_oauth_state");
    return response;
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithDiscordState(request, {
      discord_error: "Trebuie să fii autentificat înainte să conectezi Discord.",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .maybeSingle<{ subscription_tier: SubscriptionTier }>();

  try {
    const accessToken = await exchangeDiscordCodeForAccessToken(code);
    const discordUser = await fetchDiscordUser(accessToken);
    const subscriptionTier = profile?.subscription_tier ?? "free";

    await saveDiscordIdentityForProfile(user.id, discordUser);
    await syncDiscordRole({
      profileId: user.id,
      discordUserId: discordUser.id,
      subscriptionTier,
      userAccessToken: accessToken,
    });

    const response = redirectWithDiscordState(request, {
      discord: "connected",
      discord_role: getDiscordRoleLabel(subscriptionTier),
    });

    response.cookies.delete("discord_oauth_state");
    return response;
  } catch (error) {
    const response = redirectWithDiscordState(request, {
      discord_error:
        error instanceof Error
          ? error.message
          : "Conectarea Discord a eșuat înainte de sincronizarea rolului.",
    });

    response.cookies.delete("discord_oauth_state");
    return response;
  }
}
