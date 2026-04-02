"use server";

import { redirect } from "next/navigation";

import { redeemInvite, validateInviteToken } from "@/lib/invites/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function upsertProfile(userId: string, fullName: string, discordUsername: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        discord_username: discordUsername,
      },
      { onConflict: "id" },
    );

  return error;
}

export async function loginAction(formData: FormData) {
  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");
  const rawNextPath = getTrimmedValue(formData, "next") || "/dashboard";
  // Validate redirect path: must be a safe relative path (no protocol-relative //evil.com)
  const isSafePath = /^\/[a-zA-Z0-9\-_\/?.&=%]*$/.test(rawNextPath);
  const nextPath = isSafePath ? rawNextPath : "/dashboard";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Completează email-ul și parola.")}`);
  }

  if (password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Parola trebuie să aibă minim 8 caractere.")}`);
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email sau parolă incorectă.")}`);
  }

  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  const fullName = getTrimmedValue(formData, "full_name");
  const discordUsername = getTrimmedValue(formData, "discord_username");
  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");

  if (!fullName || !discordUsername || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Completează toate câmpurile obligatorii.")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Parola trebuie să aibă minim 8 caractere.")}`);
  }

  if (fullName.length > 100) {
    redirect(`/signup?error=${encodeURIComponent("Numele este prea lung (maxim 100 caractere).")}`);
  }

  if (discordUsername.length > 50) {
    redirect(`/signup?error=${encodeURIComponent("Username-ul Discord este prea lung (maxim 50 caractere).")}`);
  }

  const supabase = createServerSupabaseClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent("Înregistrarea a eșuat. Verifică datele și încearcă din nou.")}`);
  }

  if (data.user) {
    const profileError = await upsertProfile(data.user.id, fullName, discordUsername);

    if (profileError) {
      redirect(
        `/login?message=${encodeURIComponent(
          "Contul a fost creat, dar profilul nu a fost complet salvat. Verifică dacă există coloanele full_name și discord_username în profiles.",
        )}`,
      );
    }
  }

  if (data.user && data.session) {
    redirect("/dashboard");
  }

  redirect(
    `/login?message=${encodeURIComponent("Cont creat. Verifică email-ul pentru confirmare, apoi autentifică-te.")}`,
  );
}

export async function signupWithInviteAction(formData: FormData) {
  const inviteToken = getTrimmedValue(formData, "invite_token");
  const fullName = getTrimmedValue(formData, "full_name");
  const discordUsername = getTrimmedValue(formData, "discord_username");
  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");

  if (!inviteToken) {
    redirect(`/signup?error=${encodeURIComponent("Link de invitație lipsă.")}`);
  }

  // Validate invite before creating account
  const { valid, error: inviteError } = await validateInviteToken(inviteToken);
  if (!valid) {
    redirect(`/invite/${inviteToken}?error=${encodeURIComponent(inviteError ?? "Invitație invalidă.")}`);
  }

  if (!fullName || !discordUsername || !email || !password) {
    redirect(`/invite/${inviteToken}?error=${encodeURIComponent("Completează toate câmpurile obligatorii.")}`);
  }

  if (password.length < 8) {
    redirect(`/invite/${inviteToken}?error=${encodeURIComponent("Parola trebuie să aibă minim 8 caractere.")}`);
  }

  const supabase = createServerSupabaseClient();
  const { error, data } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(
      `/invite/${inviteToken}?error=${encodeURIComponent("Înregistrarea a eșuat. Verifică datele și încearcă din nou.")}`,
    );
  }

  if (data.user) {
    await upsertProfile(data.user.id, fullName, discordUsername);

    // Redeem invite — activate Elite subscription
    const redeemResult = await redeemInvite(inviteToken, data.user.id);

    if (redeemResult.error) {
      // Account created but invite failed — they can try redeem later
      redirect(`/dashboard?invite_error=${encodeURIComponent(redeemResult.error)}`);
    }
  }

  if (data.user && data.session) {
    redirect("/dashboard?invite=activated");
  }

  redirect(
    `/login?message=${encodeURIComponent("Cont creat cu acces Elite. Verifică email-ul pentru confirmare.")}`,
  );
}

export async function logoutAction() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Te-ai delogat cu succes."));
}
