import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    .select("subscription_tier, subscription_status, role")
    .eq("id", user.id)
    .maybeSingle();

  const isElite =
    profile?.role === "admin" ||
    (profile?.subscription_tier === "elite" && profile?.subscription_status === "active");

  if (!isElite) {
    redirect("/upgrade?from=whale-tracker");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <WhaleTrackerClient />
    </div>
  );
}
