import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getDiscordOAuthConfig } from "@/lib/discord/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", "/dashboard");
    return NextResponse.redirect(redirectUrl);
  }

  const { clientId, redirectUri } = getDiscordOAuthConfig();
  const state = randomUUID();
  const authUrl = new URL("https://discord.com/oauth2/authorize");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "identify guilds.join");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "consent");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
