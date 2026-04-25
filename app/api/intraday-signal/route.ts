import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getIntradaySignal } from "@/lib/trading-data";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return NextResponse.json({ error: "Elite required" }, { status: 403 });
  }

  const data = await getIntradaySignal();
  if (!data) {
    return NextResponse.json({ error: "Data unavailable" }, { status: 503 });
  }
  return NextResponse.json(data);
}
