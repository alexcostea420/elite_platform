import { NextRequest, NextResponse } from "next/server";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { verifyUnsubToken } from "@/lib/utils/unsubscribe";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const token = request.nextUrl.searchParams.get("token");

  if (!email || !token) {
    return new NextResponse(html("Link invalid", "Link-ul de dezabonare nu este valid."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Verify signed token with expiry
  if (!verifyUnsubToken(email, token)) {
    return new NextResponse(html("Link invalid", "Link-ul de dezabonare nu este valid sau a expirat."), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const supabase = createServiceRoleSupabaseClient();

  // Find user by email — paginate through all users
  let user: { id: string; email?: string } | undefined;
  let page = 1;
  while (!user) {
    const { data: batch } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (!batch?.users?.length) break;
    user = batch.users.find((u) => u.email === email);
    page++;
  }

  if (user) {
    await supabase
      .from("profiles")
      .update({ email_unsubscribed: true })
      .eq("id", user.id);
  }

  // Cancel all pending emails
  await supabase
    .from("email_drip_queue")
    .update({ status: "cancelled" })
    .eq("email", email)
    .eq("status", "pending");

  return new NextResponse(
    html(
      "Te-ai dezabonat cu succes",
      "Nu vei mai primi emailuri automate de la Armata de Traderi.<br>Daca te-ai dezabonat din greseala, scrie-i lui Alex pe Discord.",
    ),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function html(title: string, message: string) {
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;padding:0;background:#06110D;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;"><div style="max-width:400px;text-align:center;padding:40px;background:#0D1F18;border-radius:16px;border:1px solid rgba(11,102,35,0.25);"><div style="font-size:28px;font-weight:800;color:#0B6623;margin-bottom:20px;">🪖 Armata de Traderi</div><h1 style="font-size:22px;color:#fff;margin:0 0 16px;">${title}</h1><p style="font-size:15px;color:#A3B8B0;line-height:1.7;">${message}</p><a href="https://app.armatadetraderi.com" style="display:inline-block;margin-top:24px;padding:12px 32px;background:#0B6623;color:#06110D;font-weight:700;text-decoration:none;border-radius:10px;">Inapoi la platforma</a></div></body></html>`;
}
