import { NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 1 minute

export async function GET() {
  try {
    // Auth check - elite only
    const authSupabase = createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await authSupabase
      .from("profiles")
      .select("subscription_tier, subscription_status, role")
      .eq("id", user.id)
      .maybeSingle();

    const isElite = profile?.role === "admin" ||
      (profile?.subscription_tier === "elite" && profile?.subscription_status === "active");
    if (!isElite) return NextResponse.json({ error: "Elite required" }, { status: 403 });

    const supabase = createServiceRoleSupabaseClient();

    // Fetch all data in parallel
    const [walletsRes, positionsRes, activityFillsRes, allFillsRes, consensusRes] = await Promise.all([
      supabase
        .from("whale_wallets")
        .select("address,rank,previous_rank,display_name,account_value,pnl_90d,last_activity,updated_at")
        .order("rank", { ascending: true }),
      supabase
        .from("whale_positions")
        .select("address,asset,direction,size,entry_price,leverage,unrealized_pnl,margin_used,notional_usd,snapshot_at")
        .eq("is_current", true)
        .order("notional_usd", { ascending: false }),
      supabase
        .from("whale_fills")
        .select("address,asset,direction,price,size,notional_usd,closed_pnl,action_type,filled_at,tid")
        .gte("notional_usd", 25000)
        .order("filled_at", { ascending: false })
        .limit(50),
      supabase
        .from("whale_fills")
        .select("address,asset,direction,price,size,notional_usd,closed_pnl,action_type,filled_at,tid")
        .order("filled_at", { ascending: false })
        .limit(300),
      supabase
        .from("whale_consensus")
        .select("asset,long_count,short_count,net_long_notional_usd,avg_long_leverage,avg_short_leverage,dominant_side")
        .order("long_count", { ascending: false }),
    ]);

    return NextResponse.json({
      wallets: walletsRes.data ?? [],
      positions: positionsRes.data ?? [],
      activity_fills: activityFillsRes.data ?? [],
      all_fills: allFillsRes.data ?? [],
      consensus: consensusRes.data ?? [],
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Whale tracker API error:", error);
    return NextResponse.json({ wallets: [], positions: [], fills: [], consensus: [], error: "Error" });
  }
}
