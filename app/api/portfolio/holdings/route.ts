import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";
import { computeHoldings, enrichHoldings, type Transaction } from "@/lib/portfolio/holdings";
import { getCurrentPricesUsd } from "@/lib/portfolio/prices";

export async function GET() {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  const { data, error } = await supabase
    .from("portfolio_transactions")
    .select("id, asset_key, side, quantity, price_usd, occurred_on, notes, created_at")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const transactions: Transaction[] = (data ?? []).map((t) => ({
    id: t.id,
    asset_key: t.asset_key,
    side: t.side,
    quantity: Number(t.quantity),
    price_usd: Number(t.price_usd),
    occurred_on: t.occurred_on,
    notes: t.notes,
    created_at: t.created_at,
  }));

  const baseHoldings = computeHoldings(transactions);
  const prices = await getCurrentPricesUsd(baseHoldings.map((h) => h.asset.key));
  const { holdings, totalValueUsd, totalCostUsd } = enrichHoldings(baseHoldings, prices);

  return NextResponse.json({
    holdings,
    totalValueUsd,
    totalCostUsd,
    totalPnlUsd: totalValueUsd - totalCostUsd,
    totalPnlPct: totalCostUsd > 0 ? ((totalValueUsd - totalCostUsd) / totalCostUsd) * 100 : 0,
  });
}
