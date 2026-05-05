import { NextResponse } from "next/server";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Auth check - elite only
    const authSupabase = createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await authSupabase
      .from("profiles")
      .select(ELITE_PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (!hasEliteAccess(profile)) {
      return NextResponse.json({ error: "Elite required" }, { status: 403 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Fetch all data in parallel
    const [walletsRes, positionsRes, activityFillsRes, allFillsRes, consensusRes, flow7dRes, favoritesRes] = await Promise.all([
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
      supabase
        .from("whale_fills")
        .select("asset,direction,action_type,notional_usd,filled_at")
        .gte("filled_at", sevenDaysAgo)
        .order("filled_at", { ascending: false })
        .limit(5000),
      authSupabase
        .from("whale_favorites")
        .select("address")
        .eq("user_id", user.id),
    ]);

    // Aggregate 7-day flow per asset: net OPEN long minus OPEN short notional.
    const flowByAsset = new Map<string, { open_long: number; open_short: number; close_count: number }>();
    for (const f of flow7dRes.data ?? []) {
      const cur = flowByAsset.get(f.asset) ?? { open_long: 0, open_short: 0, close_count: 0 };
      const n = Number(f.notional_usd) || 0;
      if (f.action_type === "OPEN") {
        if (f.direction === "LONG") cur.open_long += n;
        else if (f.direction === "SHORT") cur.open_short += n;
      } else {
        cur.close_count += 1;
      }
      flowByAsset.set(f.asset, cur);
    }
    const flow_7d = Array.from(flowByAsset.entries())
      .map(([asset, v]) => ({
        asset,
        open_long_usd: Math.round(v.open_long),
        open_short_usd: Math.round(v.open_short),
        net_open_usd: Math.round(v.open_long - v.open_short),
        total_open_usd: Math.round(v.open_long + v.open_short),
      }))
      .filter((r) => r.total_open_usd >= 100_000)
      .sort((a, b) => b.total_open_usd - a.total_open_usd)
      .slice(0, 10);

    return NextResponse.json({
      wallets: walletsRes.data ?? [],
      positions: positionsRes.data ?? [],
      activity_fills: activityFillsRes.data ?? [],
      all_fills: allFillsRes.data ?? [],
      consensus: consensusRes.data ?? [],
      flow_7d,
      favorites: (favoritesRes.data ?? []).map((f) => f.address),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Whale tracker API error:", error);
    return NextResponse.json({ wallets: [], positions: [], fills: [], consensus: [], flow_7d: [], favorites: [], error: "Error" });
  }
}
