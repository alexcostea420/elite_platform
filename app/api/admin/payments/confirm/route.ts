import { NextRequest, NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { confirmPayment } from "@/lib/payments/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Admin-only endpoint to manually confirm a payment.
 * Fallback for when the blockchain watcher misses a payment.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const paymentId = body?.payment_id as string;
    const txHash = body?.tx_hash as string;
    const amountReceived = Number(body?.amount_received);

    if (!paymentId || !txHash || !amountReceived || isNaN(amountReceived)) {
      return NextResponse.json(
        { error: "Câmpuri lipsă: payment_id, tx_hash, amount_received." },
        { status: 400 },
      );
    }

    const { success, error } = await confirmPayment(paymentId, txHash, amountReceived);

    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }

    await logAdminAction({
      adminId: user.id,
      actionType: "payment_confirm_manual",
      targetType: "payment",
      targetId: paymentId,
      after: { tx_hash: txHash, amount_received: amountReceived },
    });

    return NextResponse.json({ success: true, message: "Plata a fost confirmată manual." });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
