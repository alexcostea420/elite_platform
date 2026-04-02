import { NextResponse } from "next/server";

import { getEnabledChains } from "@/lib/payments/config";

export async function GET() {
  try {
    const chains = getEnabledChains();
    return NextResponse.json({
      chains: chains.map((c) => ({ chain: c.chain, label: c.label })),
    });
  } catch {
    return NextResponse.json({ chains: [] });
  }
}
