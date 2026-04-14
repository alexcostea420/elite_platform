import "server-only";

/**
 * Stripe configuration for card payments.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
 * Alex will set these after opening PFA and creating Stripe account.
 */

export type StripePlanConfig = {
  duration: string;
  days: number;
  priceEur: number;
  veteranPriceEur: number;
  label: string;
};

export const STRIPE_PLANS: Record<string, StripePlanConfig> = {
  elite_monthly: {
    duration: "30_days",
    days: 30,
    priceEur: 49,
    veteranPriceEur: 33,
    label: "Elite 30 Zile",
  },
  elite_3mo: {
    duration: "90_days",
    days: 90,
    priceEur: 137,
    veteranPriceEur: 100,
    label: "Elite 3 Luni",
  },
  elite_annual: {
    duration: "365_days",
    days: 365,
    priceEur: 497,
    veteranPriceEur: 300,
    label: "Elite 12 Luni",
  },
};

export function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    return null; // Stripe not configured yet
  }

  return {
    secretKey,
    webhookSecret: webhookSecret ?? "",
    currency: "eur" as const,
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.armatadetraderi.com"}/upgrade/success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.armatadetraderi.com"}/upgrade`,
  };
}

/**
 * Check if Stripe is configured and ready to accept payments.
 */
export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
