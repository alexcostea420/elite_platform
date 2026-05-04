import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type ChurnReason =
  | "expiry_imminent"
  | "expiry_soon"
  | "expiry_pipeline"
  | "no_login_3w"
  | "no_login_2w"
  | "no_login_1w"
  | "no_videos_30d"
  | "low_videos_30d"
  | "no_discord"
  | "veteran_bonus";

export type ChurnRiskRow = {
  user_id: string;
  full_name: string | null;
  discord_username: string | null;
  email: string | null;
  is_veteran: boolean;
  subscription_expires_at: string | null;
  elite_since: string | null;
  last_sign_in_at: string | null;
  days_to_expiry: number | null;
  days_since_login: number | null;
  videos_30d: number;
  score: number;
  band: "low" | "medium" | "high";
  reasons: { code: ChurnReason; label: string; points: number }[];
};

export type ChurnDashboard = {
  rows: ChurnRiskRow[];
  totals: {
    high: number;
    medium: number;
    low: number;
    avgScore: number;
  };
};

const REASON_LABELS: Record<ChurnReason, string> = {
  expiry_imminent: "Expiră în ≤3 zile",
  expiry_soon: "Expiră în 4-7 zile",
  expiry_pipeline: "Expiră în 8-14 zile",
  no_login_3w: "Fără login de 3+ săpt",
  no_login_2w: "Fără login de 2 săpt",
  no_login_1w: "Fără login de 7-13 zile",
  no_videos_30d: "Zero video în 30 zile",
  low_videos_30d: "Sub 3 video în 30 zile",
  no_discord: "Fără Discord conectat",
  veteran_bonus: "Veteran (loialitate)",
};

function bandFor(score: number): "low" | "medium" | "high" {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

export async function getChurnRiskDashboard(): Promise<ChurnDashboard> {
  const supabase = createServiceRoleSupabaseClient();

  const [{ data: profiles }, { data: views }, authResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, discord_username, discord_user_id, subscription_tier, subscription_status, subscription_expires_at, is_veteran, elite_since",
      )
      .eq("subscription_tier", "elite")
      .eq("subscription_status", "active"),
    supabase
      .from("video_views")
      .select("user_id, last_viewed_at"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const now = Date.now();
  const dayMs = 86_400_000;
  const thirtyDaysAgo = now - 30 * dayMs;

  const videoCountMap = new Map<string, number>();
  for (const v of (views ?? []) as Array<{ user_id: string; last_viewed_at: string }>) {
    if (new Date(v.last_viewed_at).getTime() >= thirtyDaysAgo) {
      videoCountMap.set(v.user_id, (videoCountMap.get(v.user_id) ?? 0) + 1);
    }
  }

  const authMap = new Map<string, { email: string | null; last_sign_in_at: string | null }>();
  for (const u of authResult.data?.users ?? []) {
    authMap.set(u.id, { email: u.email ?? null, last_sign_in_at: u.last_sign_in_at ?? null });
  }

  const rows: ChurnRiskRow[] = ((profiles ?? []) as Array<{
    id: string;
    full_name: string | null;
    discord_username: string | null;
    discord_user_id: string | null;
    subscription_tier: string;
    subscription_status: string;
    subscription_expires_at: string | null;
    is_veteran: boolean;
    elite_since: string | null;
  }>)
    .filter(
      (p) =>
        p.subscription_expires_at !== null &&
        new Date(p.subscription_expires_at).getTime() > now,
    )
    .map((p) => {
      const auth = authMap.get(p.id);
      const expiry = p.subscription_expires_at ? new Date(p.subscription_expires_at).getTime() : null;
      const lastLogin = auth?.last_sign_in_at ? new Date(auth.last_sign_in_at).getTime() : null;
      const days_to_expiry = expiry !== null ? Math.ceil((expiry - now) / dayMs) : null;
      const days_since_login = lastLogin !== null ? Math.floor((now - lastLogin) / dayMs) : null;
      const videos_30d = videoCountMap.get(p.id) ?? 0;

      const reasons: ChurnRiskRow["reasons"] = [];
      let score = 0;

      if (days_to_expiry !== null) {
        if (days_to_expiry <= 3) {
          reasons.push({ code: "expiry_imminent", label: REASON_LABELS.expiry_imminent, points: 30 });
          score += 30;
        } else if (days_to_expiry <= 7) {
          reasons.push({ code: "expiry_soon", label: REASON_LABELS.expiry_soon, points: 20 });
          score += 20;
        } else if (days_to_expiry <= 14) {
          reasons.push({ code: "expiry_pipeline", label: REASON_LABELS.expiry_pipeline, points: 10 });
          score += 10;
        }
      }

      if (days_since_login !== null) {
        if (days_since_login >= 21) {
          reasons.push({ code: "no_login_3w", label: REASON_LABELS.no_login_3w, points: 25 });
          score += 25;
        } else if (days_since_login >= 14) {
          reasons.push({ code: "no_login_2w", label: REASON_LABELS.no_login_2w, points: 15 });
          score += 15;
        } else if (days_since_login >= 7) {
          reasons.push({ code: "no_login_1w", label: REASON_LABELS.no_login_1w, points: 5 });
          score += 5;
        }
      } else {
        // Never signed in or no record — treat as 3w+ inactive.
        reasons.push({ code: "no_login_3w", label: REASON_LABELS.no_login_3w, points: 25 });
        score += 25;
      }

      if (videos_30d === 0) {
        reasons.push({ code: "no_videos_30d", label: REASON_LABELS.no_videos_30d, points: 25 });
        score += 25;
      } else if (videos_30d < 3) {
        reasons.push({ code: "low_videos_30d", label: REASON_LABELS.low_videos_30d, points: 15 });
        score += 15;
      }

      if (!p.discord_user_id) {
        reasons.push({ code: "no_discord", label: REASON_LABELS.no_discord, points: 10 });
        score += 10;
      }

      if (p.is_veteran) {
        reasons.push({ code: "veteran_bonus", label: REASON_LABELS.veteran_bonus, points: -5 });
        score -= 5;
      }

      score = Math.max(0, Math.min(100, score));

      return {
        user_id: p.id,
        full_name: p.full_name,
        discord_username: p.discord_username,
        email: auth?.email ?? null,
        is_veteran: p.is_veteran,
        subscription_expires_at: p.subscription_expires_at,
        elite_since: p.elite_since,
        last_sign_in_at: auth?.last_sign_in_at ?? null,
        days_to_expiry,
        days_since_login,
        videos_30d,
        score,
        band: bandFor(score),
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  const high = rows.filter((r) => r.band === "high").length;
  const medium = rows.filter((r) => r.band === "medium").length;
  const low = rows.filter((r) => r.band === "low").length;
  const avgScore = rows.length === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);

  return {
    rows,
    totals: { high, medium, low, avgScore },
  };
}
