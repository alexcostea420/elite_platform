import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";
import { getCurrentPriceUsd, getHistoricalPriceUsd } from "@/lib/portfolio/prices";
import { getAsset } from "@/lib/portfolio/assets";

export async function GET(req: Request) {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const assetKey = searchParams.get("asset") ?? "";
  const date = searchParams.get("date");

  if (!getAsset(assetKey)) {
    return NextResponse.json({ error: "invalid_asset" }, { status: 400 });
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const price = date
    ? await getHistoricalPriceUsd(assetKey, date)
    : await getCurrentPriceUsd(assetKey);

  if (price == null) {
    return NextResponse.json({ error: "price_unavailable" }, { status: 404 });
  }
  return NextResponse.json({ price_usd: price });
}
