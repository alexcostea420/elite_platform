import { NextRequest, NextResponse } from "next/server";

import { logAdminAction } from "@/lib/admin/audit";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Mark a previously confirmed payment as refunded. Records refund metadata
 * (amount, tx hash, reason, who) and writes an audit log entry. Optionally
 * downgrades the user's subscription if `downgrade=true` is passed — useful
 * when the refund is full and the user shouldn't keep Elite access.
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
    const paymentId = String(body?.payment_id ?? "").trim();
    const refundedAmount = Number(body?.refunded_amount);
    const refundTxHash = body?.refund_tx_hash ? String(body.refund_tx_hash).trim() : null;
    const reason = body?.reason ? String(body.reason).trim() : null;
    const downgrade = Boolean(body?.downgrade);

    if (!paymentId) {
      return NextResponse.json({ error: "payment_id lipsă." }, { status: 400 });
    }

    if (!Number.isFinite(refundedAmount) || refundedAmount <= 0) {
      return NextResponse.json(
        { error: "refunded_amount trebuie să fie > 0." },
        { status: 400 },
      );
    }

    const service = createServiceRoleSupabaseClient();

    const { data: payment, error: fetchError } = await service
      .from("payments")
      .select("id, user_id, status, amount_received, currency, plan_duration, reference_amount")
      .eq("id", paymentId)
      .maybeSingle();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Plata nu a fost găsită." }, { status: 404 });
    }

    if (payment.status !== "confirmed") {
      return NextResponse.json(
        { error: `Doar plățile confirmate pot fi refundate (status curent: ${payment.status}).` },
        { status: 400 },
      );
    }

    const refundedAt = new Date().toISOString();

    const { error: updateError } = await service
      .from("payments")
      .update({
        status: "refunded",
        refunded_at: refundedAt,
        refunded_amount: refundedAmount,
        refund_tx_hash: refundTxHash,
        refund_reason: reason,
        refunded_by: user.id,
      })
      .eq("id", paymentId);

    if (updateError) {
      console.error("[refund] update failed", updateError);
      return NextResponse.json({ error: "Nu s-a putut marca refund-ul." }, { status: 500 });
    }

    let downgraded = false;
    if (downgrade && payment.user_id) {
      const { error: downgradeError } = await service
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: "expired",
          subscription_expires_at: null,
        })
        .eq("id", payment.user_id);

      if (downgradeError) {
        console.error("[refund] downgrade failed", downgradeError);
      } else {
        downgraded = true;
      }
    }

    await logAdminAction({
      adminId: user.id,
      actionType: "payment_refund",
      targetType: "payment",
      targetId: paymentId,
      before: {
        status: payment.status,
        amount_received: payment.amount_received,
        currency: payment.currency,
      },
      after: {
        status: "refunded",
        refunded_amount: refundedAmount,
        refund_tx_hash: refundTxHash,
        refunded_at: refundedAt,
        downgraded,
      },
      reason,
    });

    return NextResponse.json({ success: true, downgraded });
  } catch (err) {
    console.error("[refund] unexpected error", err);
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
