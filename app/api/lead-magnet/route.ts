import { NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = await checkRateLimit(`lead:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Prea multe incercari. Asteapta un minut." }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
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

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
