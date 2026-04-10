import { NextRequest, NextResponse } from "next/server";

import { getPaymentById } from "@/lib/payments/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const identifier = user.id ?? request.headers.get("x-forwarded-for") ?? "anon";
    const { allowed } = await checkRateLimit(`status:${identifier}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const paymentId = request.nextUrl.searchParams.get("id");
    if (!paymentId) {
      return NextResponse.json({ error: "ID plată lipsă." }, { status: 400 });
    }

    const payment = await getPaymentById(paymentId, user.id);

    if (!payment) {
      return NextResponse.json({ error: "Plata nu a fost găsită." }, { status: 404 });
    }

    return NextResponse.json({
      payment_id: payment.id,
      status: payment.status,
      amount: payment.reference_amount,
      wallet_address: payment.wallet_address,
      currency: payment.currency,
      chain: payment.chain,
      tx_hash: payment.tx_hash,
      confirmed_at: payment.confirmed_at,
      expires_at: payment.expires_at,
      created_at: payment.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
