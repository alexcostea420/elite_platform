import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Resend webhook receiver.
 *
 * Resend signs payloads via Svix; we verify using RESEND_WEBHOOK_SECRET
 * (the value Resend shows when you create the endpoint). Without a valid
 * signature we reject with 401 — never trust the body.
 *
 * Events we care about: email.delivered, email.opened, email.clicked,
 * email.bounced, email.complained. We update the matching email_drip_queue
 * row by message_id (set when the cron sent the email).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers." }, { status: 400 });
  }

  const body = await request.text();

  let event: { type: string; data: { email_id?: string; created_at?: string } };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch (err) {
    console.error("[resend webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const messageId = event.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ ok: true, skipped: "no email_id" });
  }

  const eventTime = event.data?.created_at ?? new Date().toISOString();
  const supabase = createServiceRoleSupabaseClient();

  const { data: row } = await supabase
    .from("email_drip_queue")
    .select("id, opened_at, clicked_at, open_count, click_count")
    .eq("message_id", messageId)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ ok: true, skipped: "message_id not in queue" });
  }

  const update: Record<string, unknown> = {};

  switch (event.type) {
    case "email.delivered":
      update.delivered_at = eventTime;
      break;
    case "email.opened":
      // Only set opened_at on first open; always increment count.
      if (!row.opened_at) update.opened_at = eventTime;
      update.open_count = (row.open_count ?? 0) + 1;
      break;
    case "email.clicked":
      if (!row.clicked_at) update.clicked_at = eventTime;
      update.click_count = (row.click_count ?? 0) + 1;
      break;
    case "email.bounced":
      update.bounced_at = eventTime;
      update.status = "failed";
      break;
    case "email.complained":
      update.complained_at = eventTime;
      break;
    default:
      return NextResponse.json({ ok: true, skipped: `event type ${event.type}` });
  }

  const { error } = await supabase
    .from("email_drip_queue")
    .update(update)
    .eq("id", row.id);

  if (error) {
    console.error("[resend webhook] update failed", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
