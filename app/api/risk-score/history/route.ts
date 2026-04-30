import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_DAYS = 365;
const MAX_DAYS = 4000;

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const daysParam = Number.parseInt(url.searchParams.get("days") ?? "", 10);
  const days = Number.isFinite(daysParam) && daysParam > 0
    ? Math.min(daysParam, MAX_DAYS)
    : DEFAULT_DAYS;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  // Supabase caps single requests at 1000 rows. Paginate when the requested
  // window exceeds that, otherwise long-range views silently truncate.
  const PAGE = 1000;
  const rows: Array<{ date: string; total_score: number; level: string; btc_price: number | null }> = [];
  for (let offset = 0; offset < MAX_DAYS; offset += PAGE) {
    const { data, error } = await supabase
      .from("risk_score_history")
      .select("date, total_score, level, btc_price")
      .gte("date", sinceStr)
      .order("date", { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) {
      console.error("[risk-score/history]", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  return NextResponse.json({
    days,
    rows,
  });
}
