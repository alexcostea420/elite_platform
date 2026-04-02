import { NextRequest, NextResponse } from "next/server";

import { redeemInvite } from "@/lib/invites/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `/invite/${params.token}/redeem`);
    return NextResponse.redirect(url);
  }

  const result = await redeemInvite(params.token, user.id);

  const url = request.nextUrl.clone();

  if (result.error) {
    url.pathname = "/dashboard";
    url.searchParams.set("invite_error", result.error);
    return NextResponse.redirect(url);
  }

  url.pathname = "/dashboard";
  url.searchParams.set("invite", "activated");
  return NextResponse.redirect(url);
}
