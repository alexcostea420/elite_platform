import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 1 minute

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();

    // Fetch all data in parallel
    const [walletsRes, positionsRes, activityFillsRes, allFillsRes, consensusRes] = await Promise.all([
      supabase
        .from("whale_wallets")
        .select("*")
        .order("rank", { ascending: true }),
      supabase
        .from("whale_positions")
        .select("*")
        .eq("is_current", true)
        .order("notional_usd", { ascending: false }),
      // Activity feed: big trades only
      supabase
        .from("whale_fills")
        .select("*")
        .gte("notional_usd", 25000)
        .order("filled_at", { ascending: false })
        .limit(50),
      // All recent fills for wallet detail (last 500)
      supabase
        .from("whale_fills")
        .select("*")
        .order("filled_at", { ascending: false })
        .limit(500),
      supabase
        .from("whale_consensus")
        .select("*")
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
