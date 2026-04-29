import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await serviceSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { action, user_id, days } = body;

  if (!action || !user_id) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  if (action === "extend") {
    const parsedDays = parseInt(days);
    const daysToAdd = Number.isFinite(parsedDays) && parsedDays >= 1 && parsedDays <= 365 ? parsedDays : 30;

    // Find the latest subscription for this user
    const { data: sub } = await serviceSupabase
      .from("bot_subscriptions")
      .select("id, expires_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return NextResponse.json({ error: "No subscription found" }, { status: 404 });

    const now = new Date();
    const currentExpiry = sub.expires_at ? new Date(sub.expires_at) : now;
    const startFrom = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(startFrom.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    await serviceSupabase
      .from("bot_subscriptions")
      .update({ expires_at: newExpiry.toISOString(), status: "active" })
      .eq("id", sub.id);

    await serviceSupabase
      .from("profiles")
      .update({ bot_active: true })
      .eq("id", user_id);

    return NextResponse.json({ ok: true, expires_at: newExpiry.toISOString() });
  }

  if (action === "disable") {
    // Find the latest subscription for this user
    const { data: sub } = await serviceSupabase
      .from("bot_subscriptions")
      .select("id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub) {
      await serviceSupabase
        .from("bot_subscriptions")
        .update({ status: "disabled" })
        .eq("id", sub.id);
    }

    await serviceSupabase
      .from("profiles")
      .update({ bot_active: false })
      .eq("id", user_id);

    await serviceSupabase
      .from("bot_wallets")
      .update({ paused: true })
      .eq("user_id", user_id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
