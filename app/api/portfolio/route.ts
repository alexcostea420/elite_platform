import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ASSET_TYPES = ["crypto", "stock", "cash"] as const;
type AssetType = (typeof ASSET_TYPES)[number];

async function gateUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { supabase, userId: user.id };
}

export async function GET() {
  const gate = await gateUser();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("id, asset_type, ticker, quantity, entry_price, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holdings: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await gateUser();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const asset_type = String(b.asset_type ?? "").toLowerCase();
  const ticker = String(b.ticker ?? "").trim().toUpperCase();
  const quantity = Number(b.quantity);
  const entry_price = Number(b.entry_price);
  const note = b.note != null ? String(b.note).slice(0, 200) : null;

  if (!ASSET_TYPES.includes(asset_type as AssetType)) {
    return NextResponse.json({ error: "invalid_asset_type" }, { status: 400 });
  }
  if (!ticker || ticker.length > 16) {
    return NextResponse.json({ error: "invalid_ticker" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "invalid_quantity" }, { status: 400 });
  }
  if (!Number.isFinite(entry_price) || entry_price < 0) {
    return NextResponse.json({ error: "invalid_entry_price" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("portfolio_holdings")
    .insert({
      user_id: userId,
      asset_type,
      ticker,
      quantity,
      entry_price,
      note,
    })
    .select("id, asset_type, ticker, quantity, entry_price, note, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holding: data });
}

export async function DELETE(req: Request) {
  const gate = await gateUser();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const { error } = await supabase
    .from("portfolio_holdings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
