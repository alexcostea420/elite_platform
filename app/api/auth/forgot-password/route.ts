import { NextRequest, NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { allowed } = await checkRateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Prea multe încercări. Așteaptă 15 minute." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email invalid" }, { status: 400 });
    }

    const supabase = createServiceRoleSupabaseClient();

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://app.armatadetraderi.com/reset-password",
    });

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
