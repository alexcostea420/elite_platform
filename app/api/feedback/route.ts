import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const type = body?.type || "general";
    const message = (body?.message ?? "").trim();
    const pageUrl = body?.page_url || "";

    if (!message || message.length < 5) {
      return NextResponse.json({ error: "Mesajul trebuie sa aiba minim 5 caractere." }, { status: 400 });
    }

    // 24h cooldown check
    const serviceSupabase = createServiceRoleSupabaseClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recent } = await serviceSupabase
      .from("feedback")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)
      .maybeSingle();

    if (recent) {
      return NextResponse.json({ error: "Ai trimis deja feedback in ultimele 24 ore." }, { status: 429 });
    }

    const { error } = await serviceSupabase.from("feedback").insert({
      user_id: user.id,
      type,
      message,
      page_url: pageUrl,
    });

    if (error) {
      return NextResponse.json({ error: "Nu s-a putut salva feedback-ul." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Eroare interna." }, { status: 500 });
  }
}
