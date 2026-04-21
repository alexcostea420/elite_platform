import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 60; // Cache 1 minute

export async function GET() {
  try {
    const supabase = createServiceRoleSupabaseClient();

    // Fetch all data in parallel
    const [walletsRes, positionsRes, fillsRes, consensusRes] = await Promise.all([
      supabase
        .from("whale_wallets")
        .select("*")
        .order("rank", { ascending: true }),
      supabase
        .from("whale_positions")
        .select("*")
        .eq("is_current", true)
        .order("notional_usd", { ascending: false }),
      supabase
        .from("whale_fills")
        .select("*")
        .gte("notional_usd", 25000)
        .order("filled_at", { ascending: false })
        .limit(50),
      supabase
        .from("whale_consensus")
        .select("*")
        .order("long_count", { ascending: false }),
    ]);

    return NextResponse.json({
      wallets: walletsRes.data ?? [],
      positions: positionsRes.data ?? [],
      fills: fillsRes.data ?? [],
      consensus: consensusRes.data ?? [],
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Whale tracker API error:", error);
    return NextResponse.json({ wallets: [], positions: [], fills: [], consensus: [], error: "Error" });
  }
}
