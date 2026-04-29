import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";
import { getAsset } from "@/lib/portfolio/assets";

export async function GET() {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  const { data, error } = await supabase
    .from("portfolio_transactions")
    .select("id, asset_key, side, quantity, price_usd, occurred_on, notes, created_at")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const asset_key = String(b.asset_key ?? "").trim();
  const side = String(b.side ?? "").toUpperCase();
  const quantity = Number(b.quantity);
  const price_usd = Number(b.price_usd);
  const occurred_on = String(b.occurred_on ?? "").trim();
  const notes = b.notes != null ? String(b.notes).slice(0, 300) : null;

  if (!getAsset(asset_key)) {
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 });
  }
  if (side !== "BUY" && side !== "SELL") {
    return NextResponse.json({ error: "invalid_side" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "invalid_quantity" }, { status: 400 });
  }
  if (!Number.isFinite(price_usd) || price_usd < 0) {
    return NextResponse.json({ error: "invalid_price" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  if (new Date(`${occurred_on}T00:00:00Z`).getTime() > today.getTime()) {
    return NextResponse.json({ error: "date_in_future" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("portfolio_transactions")
    .insert({
      user_id: userId,
      asset_key,
      side,
      quantity,
      price_usd,
      occurred_on,
      notes,
    })
    .select("id, asset_key, side, quantity, price_usd, occurred_on, notes, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}
