const TIME_GATE_DAYS = 31;

/**
 * Calculate how many days since the user first became Elite.
 * Returns null if elite_since is not set.
 */
export function getEliteDays(eliteSince: string | null): number | null {
  if (!eliteSince) return null;
  const since = new Date(eliteSince);
  const now = new Date();
  return Math.floor((now.getTime() - since.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Check if a user has passed the time gate (31+ days as Elite).
 * Features gated behind this require at least 2 months of payment.
 */
export function hasPassedTimeGate(eliteSince: string | null): boolean {
  const days = getEliteDays(eliteSince);
  if (days === null) return false;
  return days >= TIME_GATE_DAYS;
}

/**
 * Get remaining days until time gate unlocks.
 */
export function getDaysUntilUnlock(eliteSince: string | null): number {
  const days = getEliteDays(eliteSince);
  if (days === null) return TIME_GATE_DAYS;
  return Math.max(0, TIME_GATE_DAYS - days);
}
