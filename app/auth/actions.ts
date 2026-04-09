"use server";

import { redirect } from "next/navigation";

import { redeemInvite, validateInviteToken } from "@/lib/invites/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

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
  const isSafePath = /^\/[a-zA-Z0-9\-_\/?.&=%]*$/.test(rawNextPath);
  const nextPath = isSafePath ? rawNextPath : "/dashboard";

  // Rate limit: 10 login attempts per minute per email
  const { allowed } = checkRateLimit(`login:${email}`, 10, 60_000);
  if (!allowed) {
    redirect(`/login?error=${encodeURIComponent("Prea multe încercări. Așteaptă un minut.")}&next=${encodeURIComponent(nextPath)}`);
  }

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Completează email-ul și parola.")}&next=${encodeURIComponent(nextPath)}`);
  }

  if (password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Parola trebuie să aibă minim 8 caractere.")}&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message === "Invalid login credentials"
      ? "Email sau parolă incorectă."
      : error.message === "Email not confirmed"
        ? "Verifică email-ul pentru confirmare."
        : `Eroare la autentificare: ${error.message}`;
    redirect(`/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  const fullName = getTrimmedValue(formData, "full_name");
  const discordUsername = getTrimmedValue(formData, "discord_username");
  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");

  // Rate limit: 3 signups per hour per email
  const { allowed } = checkRateLimit(`signup:${email}`, 3, 3_600_000);
  if (!allowed) {
    redirect(`/signup?error=${encodeURIComponent("Prea multe încercări. Așteaptă o oră.")}`);
  }

  if (!fullName || !discordUsername || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Completează toate câmpurile obligatorii.")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Parola trebuie să aibă minim 8 caractere.")}`);
  }

  if (fullName.length > 100) {
    redirect(`/signup?error=${encodeURIComponent("Numele este prea lung (maxim 100 caractere).")}`);
  }

  if (discordUsername.length > 32 || discordUsername.length < 2) {
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

    // New accounts start as free - trial is opt-in from /upgrade
    // No auto-grant of trial
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

    // Small delay to ensure profile is created before redeeming
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Redeem invite - activate Elite subscription
    const redeemResult = await redeemInvite(inviteToken, data.user.id);

    if (redeemResult.error) {
      // Account created but invite failed - they can try redeem later
      redirect(`/dashboard?invite_error=${encodeURIComponent(redeemResult.error)}`);
    }

    // Verify subscription was set correctly (guard against race conditions)
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { data: verifyProfile } = await serviceSupabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", data.user.id)
      .maybeSingle();

    if (verifyProfile?.subscription_tier !== "elite" && !redeemResult.error) {
      // Race condition detected - force re-apply
      await redeemInvite(inviteToken, data.user.id);
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
