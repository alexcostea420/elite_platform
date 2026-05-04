import "server-only";

import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type PaymentRow = {
  id: string;
  user_id: string | null;
  plan_duration: string | null;
  amount_received: number | null;
  refunded_amount: number | null;
  currency: string | null;
  chain: string | null;
  status: string;
  confirmed_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

export type RevenuePoint = {
  monthKey: string; // YYYY-MM
  gross: number;
  refunds: number;
  net: number;
  count: number;
};

export type SourceBreakdown = {
  source: "crypto" | "stripe" | "other";
  gross: number;
  refunds: number;
  net: number;
  count: number;
};

export type PlanBreakdown = {
  plan: string;
  gross: number;
  net: number;
  count: number;
};

export type TopPayer = {
  userId: string;
  fullName: string | null;
  discordUsername: string | null;
  totalNet: number;
  paymentCount: number;
};

export type RevenueDashboard = {
  totals: {
    grossAllTime: number;
    refundsAllTime: number;
    netAllTime: number;
    paymentCount: number;
    refundCount: number;
  };
  thisMonth: { gross: number; net: number; count: number };
  lastMonth: { gross: number; net: number; count: number };
  monthlySeries: RevenuePoint[]; // last 12 months ascending
  bySource: SourceBreakdown[];
  byPlan: PlanBreakdown[];
  topPayers: TopPayer[];
  refundRate: number; // refunded gross / total gross (0..1)
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function classifySource(chain: string | null): SourceBreakdown["source"] {
  if (!chain) return "other";
  if (chain === "STRIPE") return "stripe";
  if (["ARB", "TRC-20", "ERC-20", "SOL"].includes(chain)) return "crypto";
  return "other";
}

export async function getRevenueDashboard(): Promise<RevenueDashboard> {
  const supabase = createServiceRoleSupabaseClient();

  // Pull every confirmed-or-refunded row. Cheap at our scale (~few hundred rows
  // total). When we cross 10k payments we should bucket server-side instead.
  const { data } = await supabase
    .from("payments")
    .select(
      "id, user_id, plan_duration, amount_received, refunded_amount, currency, chain, status, confirmed_at, refunded_at, created_at",
    )
    .in("status", ["confirmed", "refunded"]);

  const rows = (data ?? []) as PaymentRow[];

  let grossAllTime = 0;
  let refundsAllTime = 0;
  let refundCount = 0;
  const sourceMap = new Map<SourceBreakdown["source"], SourceBreakdown>();
  const planMap = new Map<string, PlanBreakdown>();
  const monthMap = new Map<string, RevenuePoint>();
  const userMap = new Map<string, TopPayer>();

  const now = new Date();
  const thisMonthKey = monthKey(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthDate);

  // Pre-seed last 12 months so the chart shows zero-months too.
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    monthMap.set(k, { monthKey: k, gross: 0, refunds: 0, net: 0, count: 0 });
  }

  for (const r of rows) {
    const gross = Number(r.amount_received ?? 0);
    const refund = r.status === "refunded" ? Number(r.refunded_amount ?? gross) : 0;
    const net = gross - refund;

    grossAllTime += gross;
    refundsAllTime += refund;
    if (refund > 0) refundCount += 1;

    const source = classifySource(r.chain);
    const sourceEntry = sourceMap.get(source) ?? {
      source,
      gross: 0,
      refunds: 0,
      net: 0,
      count: 0,
    };
    sourceEntry.gross += gross;
    sourceEntry.refunds += refund;
    sourceEntry.net += net;
    sourceEntry.count += 1;
    sourceMap.set(source, sourceEntry);

    const planKey = r.plan_duration ?? "unknown";
    const planEntry = planMap.get(planKey) ?? { plan: planKey, gross: 0, net: 0, count: 0 };
    planEntry.gross += gross;
    planEntry.net += net;
    planEntry.count += 1;
    planMap.set(planKey, planEntry);

    // Bucket monthly by confirmed_at (or created_at fallback).
    const dateForBucket = r.confirmed_at ? new Date(r.confirmed_at) : new Date(r.created_at);
    const k = monthKey(dateForBucket);
    const monthEntry = monthMap.get(k);
    if (monthEntry) {
      monthEntry.gross += gross;
      monthEntry.net += net;
      monthEntry.count += 1;
    }

    if (r.refunded_at) {
      const refK = monthKey(new Date(r.refunded_at));
      const m = monthMap.get(refK);
      if (m) m.refunds += refund;
    }

    if (r.user_id) {
      const u = userMap.get(r.user_id) ?? {
        userId: r.user_id,
        fullName: null,
        discordUsername: null,
        totalNet: 0,
        paymentCount: 0,
      };
      u.totalNet += net;
      u.paymentCount += 1;
      userMap.set(r.user_id, u);
    }
  }

  // Hydrate top-payer names with one query.
  const topUserIds = Array.from(userMap.values())
    .sort((a, b) => b.totalNet - a.totalNet)
    .slice(0, 10)
    .map((u) => u.userId);

  if (topUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, discord_username")
      .in("id", topUserIds);
    for (const p of profiles ?? []) {
      const u = userMap.get(p.id as string);
      if (u) {
        u.fullName = (p.full_name as string) ?? null;
        u.discordUsername = (p.discord_username as string) ?? null;
      }
    }
  }

  const thisMonth = monthMap.get(thisMonthKey) ?? { monthKey: thisMonthKey, gross: 0, refunds: 0, net: 0, count: 0 };
  const lastMonth = monthMap.get(lastMonthKey) ?? { monthKey: lastMonthKey, gross: 0, refunds: 0, net: 0, count: 0 };

  return {
    totals: {
      grossAllTime: round(grossAllTime),
      refundsAllTime: round(refundsAllTime),
      netAllTime: round(grossAllTime - refundsAllTime),
      paymentCount: rows.length,
      refundCount,
    },
    thisMonth: { gross: round(thisMonth.gross), net: round(thisMonth.net), count: thisMonth.count },
    lastMonth: { gross: round(lastMonth.gross), net: round(lastMonth.net), count: lastMonth.count },
    monthlySeries: Array.from(monthMap.values())
      .sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1))
      .map((m) => ({ ...m, gross: round(m.gross), refunds: round(m.refunds), net: round(m.net) })),
    bySource: Array.from(sourceMap.values())
      .sort((a, b) => b.net - a.net)
      .map((s) => ({ ...s, gross: round(s.gross), refunds: round(s.refunds), net: round(s.net) })),
    byPlan: Array.from(planMap.values())
      .sort((a, b) => b.net - a.net)
      .map((p) => ({ ...p, gross: round(p.gross), net: round(p.net) })),
    topPayers: Array.from(userMap.values())
      .sort((a, b) => b.totalNet - a.totalNet)
      .slice(0, 10)
      .map((u) => ({ ...u, totalNet: round(u.totalNet) })),
    refundRate: grossAllTime > 0 ? round(refundsAllTime / grossAllTime, 4) : 0,
  };
}

function round(n: number, decimals = 2) {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}
