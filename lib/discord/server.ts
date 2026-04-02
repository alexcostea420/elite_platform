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
