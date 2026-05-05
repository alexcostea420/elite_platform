import { NextResponse } from "next/server";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Decision = "BUY" | "SELL" | "HOLD";

function alignment(decision: Decision, dominantSide: string | null | undefined, longPct: number) {
  if (decision === "BUY") {
    if (longPct >= 60) return "ALIGN";
    if (longPct <= 40) return "DIVERGE";
    return "MIXT";
  }
  if (decision === "SELL") {
    if (longPct <= 40) return "ALIGN";
    if (longPct >= 60) return "DIVERGE";
    return "MIXT";
  }
  return "MIXT";
}

export async function GET() {
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

  const [riskRes, consensusRes] = await Promise.all([
    supabase
      .from("trading_data")
      .select("data, updated_at")
      .eq("kind", "risk_score_v2")
      .maybeSingle(),
    supabase
      .from("whale_consensus")
      .select("asset, long_count, short_count, dominant_side")
      .in("asset", ["BTC", "ETH", "SOL"]),
  ]);

  const risk = (riskRes.data?.data ?? null) as null | {
    score?: number;
    decision?: Decision;
    decision_text?: string;
    conviction?: string;
  };

  if (!risk) {
    return NextResponse.json({ available: false });
  }

  const decision = (risk.decision ?? "HOLD") as Decision;
  const consensus = consensusRes.data ?? [];

  const matches = consensus.map((c) => {
    const total = c.long_count + c.short_count;
    const longPct = total > 0 ? (c.long_count / total) * 100 : 50;
    return {
      asset: c.asset,
      long_pct: Math.round(longPct),
      short_pct: Math.round(100 - longPct),
      dominant_side: c.dominant_side,
      total_whales: total,
      alignment: alignment(decision, c.dominant_side, longPct),
    };
  });

  return NextResponse.json({
    available: true,
    risk_score: {
      score: risk.score ?? null,
      decision,
      decision_text: risk.decision_text ?? "",
      conviction: risk.conviction ?? null,
    },
    matches,
    updated_at: riskRes.data?.updated_at ?? null,
  });
}
