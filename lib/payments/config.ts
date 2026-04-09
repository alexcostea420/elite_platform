import "server-only";

export type PaymentChain = "TRC-20" | "ARB" | "SOL" | "ERC-20";
export type PaymentCurrency = "USDT";
export type PaymentStatus = "pending" | "confirmed" | "expired" | "failed";

export type PlanDuration = "30_days" | "90_days" | "365_days" | "bot_monthly" | "bot_monthly_elite";

export const CHAIN_CONFIG: Record<
  PaymentChain,
  { label: string; envKey: string; enabled: boolean }
> = {
  "TRC-20": { label: "Tron (TRC-20)", envKey: "PAYMENT_WALLET_ADDRESS_TRC20", enabled: false },
  ARB: { label: "Arbitrum", envKey: "PAYMENT_WALLET_ADDRESS_ARB", enabled: true },
  SOL: { label: "Solana", envKey: "PAYMENT_WALLET_ADDRESS_SOL", enabled: false },
  "ERC-20": { label: "Ethereum (ERC-20)", envKey: "PAYMENT_WALLET_ADDRESS_ERC20", enabled: false },
};

export function getEnabledChains(): { chain: PaymentChain; label: string; wallet: string }[] {
  return (Object.entries(CHAIN_CONFIG) as [PaymentChain, (typeof CHAIN_CONFIG)[PaymentChain]][])
    .filter(([, cfg]) => cfg.enabled && process.env[cfg.envKey])
    .map(([chain, cfg]) => ({
      chain,
      label: cfg.label,
      wallet: process.env[cfg.envKey]!,
    }));
}

export function getWalletForChain(chain: PaymentChain): string | null {
  const cfg = CHAIN_CONFIG[chain];
  if (!cfg || !cfg.enabled) return null;
  return process.env[cfg.envKey] ?? null;
}

export function getPaymentConfig(chain: PaymentChain = "TRC-20") {
  const wallet = getWalletForChain(chain);

  if (!wallet) {
    throw new Error(
      `Payment config is missing for chain ${chain}. Set ${CHAIN_CONFIG[chain]?.envKey} environment variable.`,
    );
  }

  return {
    walletAddress: wallet,
    chain,
    currency: "USDT" as PaymentCurrency,
    paymentTimeoutMinutes: 30,
    basePrices: {
      "30_days": 49,
      "90_days": 137,
      "365_days": 497,
      "bot_monthly": 98,
      "bot_monthly_elite": 45,
    } as Record<string, number>,
    veteranPrices: {
      "30_days": 33,
      "90_days": 100,
      "365_days": 300,
      "bot_monthly": 98,
      "bot_monthly_elite": 45,
    } as Record<string, number>,
    toleranceUsd: 0.2,
  };
}

export const planDurations: Record<PlanDuration, { days: number; label: string }> = {
  "30_days": { days: 30, label: "30 Zile" },
  "90_days": { days: 90, label: "3 Luni" },
  "365_days": { days: 365, label: "12 Luni" },
  "bot_monthly": { days: 30, label: "Bot AI Trading — 30 Zile" },
  "bot_monthly_elite": { days: 30, label: "Bot AI Trading (Elite) — 30 Zile" },
};

/**
 * Generate a unique reference amount by adding a single decimal (0.1 - 0.9)
 * derived from a hash of the payment ID. Simple and easy to send.
 * 99 unique values per plan — two decimal places for better collision avoidance.
 */
export function generateReferenceAmount(
  basePrice: number,
  paymentId: string,
  attempt: number = 0,
): number {
  const input = attempt > 0 ? `${paymentId}-${attempt}` : paymentId;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Generate two decimal places between 0.01 and 0.99
  const uniqueCents = (Math.abs(hash) % 99) + 1;
  return Number((basePrice + uniqueCents / 100).toFixed(2));
}
