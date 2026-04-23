import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 300; // Cache 5 minutes

export async function GET(request: NextRequest) {
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

  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("whale_pnl_daily")
      .select("date, cumulative_pnl, daily_pnl")
      .eq("address", address)
      .order("date", { ascending: true });

    return NextResponse.json({ pnl: data ?? [] });
  } catch {
    return NextResponse.json({ pnl: [] });
  }
}
