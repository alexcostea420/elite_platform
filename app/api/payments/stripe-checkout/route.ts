import { NextRequest, NextResponse } from "next/server";

import { getStripeConfig, STRIPE_PLANS } from "@/lib/payments/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const stripeConfig = getStripeConfig();
    if (!stripeConfig) {
      return NextResponse.json(
        { error: "Plățile cu cardul nu sunt disponibile momentan." },
        { status: 503 },
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }

    const body = await request.json();
    const planKey = body.plan as string;

    const plan = STRIPE_PLANS[planKey];
    if (!plan) {
      return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_veteran")
      .eq("id", user.id)
      .maybeSingle();

    const priceEur = profile?.is_veteran ? plan.veteranPriceEur : plan.priceEur;
    const amountCents = Math.round(priceEur * 100);

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeConfig.secretKey);

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: stripeConfig.currency,
            unit_amount: amountCents,
            product_data: {
              name: plan.label,
              description: `Acces Elite pentru ${plan.days} zile - Armata de Traderi`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        plan_duration: plan.duration,
        plan_days: String(plan.days),
        is_veteran: profile?.is_veteran ? "true" : "false",
      },
      return_url: `${stripeConfig.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Stripe checkout error:", detail, error);
    return NextResponse.json(
      { error: "Eroare la crearea sesiunii de plată.", detail },
      { status: 500 },
    );
  }
}
