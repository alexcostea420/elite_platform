import { NextRequest, NextResponse } from "next/server";

import { confirmPayment } from "@/lib/payments/server";

/**
 * Internal-only endpoint to confirm a payment.
 * Secured via PAYMENT_WEBHOOK_SECRET header.
 * Called by the blockchain monitoring service or admin.
 */
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
    }

    const authHeader = request.headers.get("x-webhook-secret");
    if (authHeader !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const paymentId = body?.payment_id as string;
    const txHash = body?.tx_hash as string;
    const amountReceived = Number(body?.amount_received);

    if (!paymentId || !txHash || !amountReceived || isNaN(amountReceived)) {
      return NextResponse.json(
        { error: "Missing required fields: payment_id, tx_hash, amount_received." },
        { status: 400 },
      );
    }

    const { success, error } = await confirmPayment(paymentId, txHash, amountReceived);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Payment confirmed." });
  } catch {
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
