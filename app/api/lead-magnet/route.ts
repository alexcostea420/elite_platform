import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalid" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();

    // Store lead in leads table (upsert to avoid duplicates)
    const { error } = await supabase
      .from("leads")
      .upsert(
        { email: email.toLowerCase().trim(), source: "lead_magnet_risk_management", created_at: new Date().toISOString() },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Lead magnet save error:", error);
      // Still return success - don't expose DB errors
    }

    // TODO: Send email with PDF via Supabase Edge Function or email provider

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
