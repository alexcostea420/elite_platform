import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";
import { ASSETS, searchAssets } from "@/lib/portfolio/assets";

export async function GET(req: Request) {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const list = q ? searchAssets(q, 50) : ASSETS;
  return NextResponse.json({
    assets: list.map((a) => ({
      key: a.key,
      type: a.type,
      name: a.name,
      symbol: a.symbol,
      group: a.group ?? "Other",
    })),
  });
}
