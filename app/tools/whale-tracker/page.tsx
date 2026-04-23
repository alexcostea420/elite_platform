import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDisplayIdentity } from "@/lib/utils/identity";
import { WhaleTrackerClient } from "./whale-tracker-client";

export const metadata = {
  title: "Whale Tracker Hyperliquid | Armata de Traderi",
  description: "Top 20 cele mai profitabile portofele de pe Hyperliquid. Vezi ce cumpără și ce vând în timp real.",
};

export default async function WhaleTrackerPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?from=/tools/whale-tracker");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, subscription_tier, subscription_status, role")
    .eq("id", user.id)
    .maybeSingle();

  const isElite =
    profile?.role === "admin" ||
    (profile?.subscription_tier === "elite" && profile?.subscription_status === "active");

  if (!isElite) {
    redirect("/upgrade?from=whale-tracker");
  }

  const identity = getDisplayIdentity(profile?.full_name ?? null, user.email);

  return (
    <>
      <Navbar mode="dashboard" userIdentity={identity} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <WhaleTrackerClient />
      </main>
    </>
  );
}
