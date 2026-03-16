"use server";

import { redirect } from "next/navigation";

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
  const nextPath = getTrimmedValue(formData, "next") || "/dashboard";

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Completează email-ul și parola.")}`);
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(nextPath.startsWith("/") ? nextPath : "/dashboard");
}

export async function signupAction(formData: FormData) {
  const fullName = getTrimmedValue(formData, "full_name");
  const discordUsername = getTrimmedValue(formData, "discord_username");
  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");

  if (!fullName || !discordUsername || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Completează toate câmpurile obligatorii.")}`);
  }

  const supabase = createServerSupabaseClient();
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
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

export async function logoutAction() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login?message=" + encodeURIComponent("Te-ai delogat cu succes."));
}
