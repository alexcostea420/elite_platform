import { NextRequest, NextResponse } from "next/server";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireElite() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select(ELITE_PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return { error: NextResponse.json({ error: "Elite required" }, { status: 403 }) };
  }
  return { user, supabase };
}

export async function GET() {
  const auth = await requireElite();
  if ("error" in auth) return auth.error;

  const { data } = await auth.supabase
    .from("whale_favorites")
    .select("address, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ favorites: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireElite();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return NextResponse.json({ error: "Adresă invalidă" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("whale_favorites")
    .upsert({ user_id: auth.user.id, address }, { onConflict: "user_id,address" });

  if (error) return NextResponse.json({ error: "Salvare eșuată" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireElite();
  if ("error" in auth) return auth.error;

  const address = request.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  await auth.supabase
    .from("whale_favorites")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("address", address);

  return NextResponse.json({ ok: true });
}
