import { NextResponse } from "next/server";

import { gateAdmin } from "@/lib/portfolio/gate";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const gate = await gateAdmin();
  if ("error" in gate) return gate.error;
  const { supabase, userId } = gate;

  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("portfolio_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
