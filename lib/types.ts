export type SubscriptionTier = "free" | "elite" | null;
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "trial" | null;

export const tierLabel: Record<Exclude<SubscriptionTier, null>, string> = {
  free: "Free",
  elite: "Elite",
};

export const tierOrder: Record<Exclude<SubscriptionTier, null>, number> = {
  free: 1,
  elite: 2,
};
