import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 300; // Cache 5 minutes

export async function GET(request: NextRequest) {
  // Auth check
  const authSupabase = createServerSupabaseClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
