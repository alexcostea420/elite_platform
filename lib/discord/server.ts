import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type DiscordSubscriptionTier = "free" | "elite" | null;

type DiscordOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type DiscordGuildConfig = {
  botToken: string;
  guildId: string;
  eliteRoleId: string;
  soldatRoleId: string;
};

type DiscordUser = {
  id: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
};

type SyncDiscordRoleInput = {
  profileId: string;
  discordUserId: string;
  subscriptionTier: DiscordSubscriptionTier;
  userAccessToken?: string | null;
};

export function getDiscordOAuthConfig(): DiscordOAuthConfig {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Discord OAuth config is missing. Set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_REDIRECT_URI.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

function getDiscordGuildConfig(): DiscordGuildConfig {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const eliteRoleId = process.env.DISCORD_ROLE_ELITE_ID;
  const soldatRoleId = process.env.DISCORD_ROLE_SOLDAT_ID;

  if (!botToken || !guildId || !eliteRoleId || !soldatRoleId) {
    throw new Error(
      "Discord guild config is missing. Set DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_ROLE_ELITE_ID, and DISCORD_ROLE_SOLDAT_ID.",
    );
  }

  return {
    botToken,
    guildId,
    eliteRoleId,
    soldatRoleId,
  };
}

export function getDiscordRoleLabel(subscriptionTier: DiscordSubscriptionTier) {
  return subscriptionTier === "elite" ? "Elite" : "Soldat";
}

export function getDiscordAvatarUrl(discordUser: DiscordUser) {
  if (!discordUser.avatar) {
    return null;
  }

  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
}

export function getDiscordUsername(discordUser: DiscordUser) {
  if (discordUser.discriminator && discordUser.discriminator !== "0") {
    return `${discordUser.username}#${discordUser.discriminator}`;
  }

  return discordUser.username;
}

async function joinDiscordGuild(discordUserId: string, userAccessToken: string) {
  const { botToken, guildId } = getDiscordGuildConfig();
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: userAccessToken,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Discord guild join failed with status ${response.status}.`);
  }
}

async function addDiscordRole(discordUserId: string, roleId: string) {
  const { botToken, guildId } = getDiscordGuildConfig();
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Discord role add failed with status ${response.status}.`);
  }
}

async function removeDiscordRole(discordUserId: string, roleId: string) {
  const { botToken, guildId } = getDiscordGuildConfig();
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Discord role remove failed with status ${response.status}.`);
  }
}

async function markDiscordRoleSynced(profileId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      discord_role_synced_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    throw error;
  }
}

export async function saveDiscordIdentityForProfile(
  profileId: string,
  discordUser: DiscordUser,
) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: profileId,
      discord_user_id: discordUser.id,
      discord_username: getDiscordUsername(discordUser),
      discord_avatar: getDiscordAvatarUrl(discordUser),
      discord_connected_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export async function exchangeDiscordCodeForAccessToken(code: string) {
  const { clientId, clientSecret, redirectUri } = getDiscordOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: string;
  };

  if (!data.access_token || data.token_type !== "Bearer") {
    throw new Error("Discord token response did not include a usable Bearer token.");
  }

  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string) {
  const response = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord user fetch failed with status ${response.status}.`);
  }

  return (await response.json()) as DiscordUser;
}

export async function syncDiscordRole({
  profileId,
  discordUserId,
  subscriptionTier,
  userAccessToken,
}: SyncDiscordRoleInput) {
  const { eliteRoleId, soldatRoleId } = getDiscordGuildConfig();
  const desiredRoleId = subscriptionTier === "elite" ? eliteRoleId : soldatRoleId;
  const roleToRemove = subscriptionTier === "elite" ? soldatRoleId : eliteRoleId;

  if (userAccessToken) {
    await joinDiscordGuild(discordUserId, userAccessToken);
  }

  await Promise.all([
    addDiscordRole(discordUserId, desiredRoleId),
    removeDiscordRole(discordUserId, roleToRemove),
  ]);
  await markDiscordRoleSynced(profileId);
}

/**
 * Queue Discord DM drip messages for a newly connected user.
 * Messages are sent by a cron/script that processes the queue.
 */
export async function queueDiscordDripMessages(userId: string, discordUserId: string, isElite: boolean) {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date();

  const messages = [
    {
      type: "welcome",
      text: "👋 Bine ai venit în Armata de Traderi!\n\nAi conectat Discord cu succes. Aici câteva resurse pentru a începe:\n\n📊 Indicatori Elite: app.armatadetraderi.com/dashboard/indicators\n🎥 Video-uri: app.armatadetraderi.com/dashboard/videos\n💬 Pune întrebări oricând pe server!",
      delay: 0,
    },
    {
      type: "day1_indicator",
      text: "📊 Ai instalat indicatorii Elite pe TradingView?\n\nSunt 4 indicatori exclusivi care te ajută să identifici intrări și ieșiri:\n• Elite Bands\n• Elite Momentum\n• Elite Levels\n• Elite Fib Zones\n\nInstalează-i aici: app.armatadetraderi.com/dashboard/indicators",
      delay: 24 * 60 * 60 * 1000,
    },
    {
      type: "day2_video",
      text: "🎥 Ai văzut video-ul despre Lot Size?\n\nEste CEL MAI IMPORTANT concept în trading. Fără lot size corect, poți avea 70% win rate și tot să pierzi bani.\n\nUită-te aici: youtu.be/4tNSs6egoM0\n\nDupă ce îl vezi, aplică metoda pe următorul trade.",
      delay: 2 * 24 * 60 * 60 * 1000,
    },
  ];

  // Add trial expiry reminder only for trial users
  if (isElite) {
    messages.push({
      type: "day3_trial",
      text: "⏰ Trial-ul tău de 3 zile se termină curând!\n\nDacă ți-a plăcut experiența, alege un plan și păstrează accesul:\n\n👉 app.armatadetraderi.com/upgrade\n\nPlanul de 3 luni e cel mai popular — deblochezi instant indicatorii.",
      delay: 2.5 * 24 * 60 * 60 * 1000,
    });
  }

  const rows = messages.map((msg) => ({
    user_id: userId,
    discord_user_id: discordUserId,
    message_type: msg.type,
    message_text: msg.text,
    send_at: new Date(now.getTime() + msg.delay).toISOString(),
  }));

  await supabase.from("discord_drip_queue").insert(rows);
}
