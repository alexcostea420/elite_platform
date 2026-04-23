export type EliteProfile = {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  role?: string | null;
};

export function hasEliteAccess(profile: EliteProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.subscription_tier !== "elite") return false;
  if (!profile.subscription_expires_at) return false;
  return new Date(profile.subscription_expires_at).getTime() > Date.now();
}

export const ELITE_PROFILE_COLUMNS =
  "subscription_tier, subscription_status, subscription_expires_at, role";
