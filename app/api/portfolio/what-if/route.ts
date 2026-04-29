import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";
import { computeWhatIf } from "@/lib/portfolio/what-if";

export async function POST(req: Request) {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const result = await computeWhatIf({
    originalAssetKey: String(b.original_asset_key ?? ""),
    originalQty: Number(b.original_qty),
    originalPriceUsd: Number(b.original_price_usd),
    originalDate: String(b.original_date ?? ""),
    alternativeAssetKey: String(b.alternative_asset_key ?? ""),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json(result);
}
