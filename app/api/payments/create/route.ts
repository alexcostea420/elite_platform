import { NextRequest, NextResponse } from "next/server";

import { createPaymentRequest } from "@/lib/payments/server";
import { type PlanDuration, type PaymentChain, CHAIN_CONFIG } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";

const validDurations: PlanDuration[] = ["30_days", "90_days", "365_days", "bot_monthly", "bot_monthly_elite"];
const validChains = Object.keys(CHAIN_CONFIG) as PaymentChain[];

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
    }

    const { allowed } = checkRateLimit(`create:${user.id}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const planDuration = body?.plan_duration as string;
    const chain = (body?.chain as string) || "ARB";

    if (!planDuration || !validDurations.includes(planDuration as PlanDuration)) {
      return NextResponse.json(
        { error: "Plan invalid. Opțiuni: 30_days, 90_days, 365_days, bot_monthly, bot_monthly_elite." },
        { status: 400 },
      );
    }

    if (!validChains.includes(chain as PaymentChain)) {
      return NextResponse.json(
        { error: "Rețea invalidă." },
        { status: 400 },
      );
    }

    const { payment, error } = await createPaymentRequest(
      user.id,
      planDuration as PlanDuration,
      chain as PaymentChain,
    );

    if (error || !payment) {
      return NextResponse.json({ error: error ?? "Eroare la creare." }, { status: 500 });
    }

    return NextResponse.json({
      payment_id: payment.id,
      wallet_address: payment.wallet_address,
      amount: payment.reference_amount,
      currency: payment.currency,
      chain: payment.chain,
      expires_in_minutes: 30,
      status: payment.status,
    });
  } catch {
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 });
  }
}
