import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type FeedbackStatus = "open" | "responded" | "archived";

export type FeedbackItem = {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  page_url: string | null;
  created_at: string;
  status: FeedbackStatus;
  responded_at: string | null;
  admin_notes: string | null;
  user: {
    full_name: string | null;
    discord_username: string | null;
    email: string | null;
    subscription_tier: string | null;
  } | null;
};

export type AlertItem = {
  kind: "bounced_email" | "stuck_payment" | "failed_email";
  title: string;
  detail: string;
  href: string | null;
  at: string;
  tone: "red" | "amber";
};

export type InboxDashboard = {
  feedback: FeedbackItem[];
  counts: {
    open: number;
    responded: number;
    archived: number;
  };
  alerts: AlertItem[];
};

const STUCK_PAYMENT_HOURS = 24;
const ALERT_WINDOW_DAYS = 30;

export async function getInbox(filter: FeedbackStatus | "all"): Promise<InboxDashboard> {
  const supabase = createServiceRoleSupabaseClient();

  const baseFeedback = supabase
    .from("feedback")
    .select(
      "id, user_id, type, message, page_url, created_at, status, responded_at, admin_notes",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const feedbackQuery = filter === "all" ? baseFeedback : baseFeedback.eq("status", filter);

  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 86_400_000).toISOString();
  const stuckCutoff = new Date(Date.now() - STUCK_PAYMENT_HOURS * 3_600_000).toISOString();

  const [
    { data: feedbackRows },
    { data: countsAll },
    { data: bouncedRows },
    { data: failedRows },
    { data: stuckPayments },
  ] = await Promise.all([
    feedbackQuery,
    supabase.from("feedback").select("status"),
    supabase
      .from("email_drip_queue")
      .select("id, email, template, bounced_at")
      .gte("bounced_at", since)
      .order("bounced_at", { ascending: false })
      .limit(15),
    supabase
      .from("email_drip_queue")
      .select("id, email, template, status, created_at")
      .eq("status", "failed")
      .is("bounced_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("payments")
      .select("id, user_id, amount, currency, status, created_at")
      .eq("status", "pending")
      .lte("created_at", stuckCutoff)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const userIds = Array.from(
    new Set(
      ((feedbackRows ?? []) as Array<{ user_id: string | null }>)
        .map((r) => r.user_id)
        .filter((v): v is string => !!v),
    ),
  );

  const profileMap = new Map<
    string,
    {
      full_name: string | null;
      discord_username: string | null;
      subscription_tier: string | null;
    }
  >();
  const emailMap = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, discord_username, subscription_tier")
      .in("id", userIds);
    for (const p of (profiles ?? []) as Array<{
      id: string;
      full_name: string | null;
      discord_username: string | null;
      subscription_tier: string | null;
    }>) {
      profileMap.set(p.id, {
        full_name: p.full_name,
        discord_username: p.discord_username,
        subscription_tier: p.subscription_tier,
      });
    }

    const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of authUsers?.users ?? []) {
      if (userIds.includes(u.id)) emailMap.set(u.id, u.email ?? null);
    }
  }

  const feedback: FeedbackItem[] = ((feedbackRows ?? []) as Array<{
    id: string;
    user_id: string | null;
    type: string;
    message: string;
    page_url: string | null;
    created_at: string;
    status: FeedbackStatus;
    responded_at: string | null;
    admin_notes: string | null;
  }>).map((r) => ({
    ...r,
    user: r.user_id
      ? {
          full_name: profileMap.get(r.user_id)?.full_name ?? null,
          discord_username: profileMap.get(r.user_id)?.discord_username ?? null,
          subscription_tier: profileMap.get(r.user_id)?.subscription_tier ?? null,
          email: emailMap.get(r.user_id) ?? null,
        }
      : null,
  }));

  const counts = { open: 0, responded: 0, archived: 0 };
  for (const c of (countsAll ?? []) as Array<{ status: FeedbackStatus }>) {
    if (c.status in counts) counts[c.status] += 1;
  }

  const alerts: AlertItem[] = [];

  for (const b of (bouncedRows ?? []) as Array<{
    id: string;
    email: string;
    template: string;
    bounced_at: string;
  }>) {
    alerts.push({
      kind: "bounced_email",
      title: `Bounce: ${b.email}`,
      detail: `Template ${b.template}`,
      href: "/admin/email-analytics",
      at: b.bounced_at,
      tone: "red",
    });
  }

  for (const f of (failedRows ?? []) as Array<{
    id: string;
    email: string;
    template: string;
    created_at: string;
  }>) {
    alerts.push({
      kind: "failed_email",
      title: `Email eșuat: ${f.email}`,
      detail: `Template ${f.template}`,
      href: "/admin/email-analytics",
      at: f.created_at,
      tone: "amber",
    });
  }

  for (const p of (stuckPayments ?? []) as Array<{
    id: string;
    user_id: string | null;
    amount: number;
    currency: string;
    created_at: string;
  }>) {
    alerts.push({
      kind: "stuck_payment",
      title: `Plată pending de >24h`,
      detail: `${p.amount} ${p.currency}`,
      href: p.user_id ? `/admin/members/${p.user_id}` : "/admin/payments",
      at: p.created_at,
      tone: "amber",
    });
  }

  alerts.sort((a, b) => (b.at > a.at ? 1 : -1));

  return { feedback, counts, alerts };
}
