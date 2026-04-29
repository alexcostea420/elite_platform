import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Admin gate for the portfolio tracker v1.
 *
 * v1 is admin-only — we flip to Elite-wide once the UX is validated.
 * Until then, the page redirects non-admins and the API returns 403.
 */
export async function gateAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { supabase, userId: user.id };
}
