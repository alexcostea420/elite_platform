import { NextResponse } from "next/server";

import { hasEliteAccess } from "@/lib/auth/elite-gate";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOURS = 48;
const EXCHANGES = ["binance", "bybit", "okx", "bitget", "hyperliquid"] as const;

type Row = {
  ts: string;
  exchange: (typeof EXCHANGES)[number];
  volume_usd: number | null;
  oi_usd: number | null;
  funding_pct: number | null;
  price_close: number | null;
};

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, subscription_expires_at, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasEliteAccess(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - HOURS * 3600 * 1000).toISOString();
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("exchange_flows")
    .select("ts,exchange,volume_usd,oi_usd,funding_pct,price_close")
    .eq("asset", "BTC")
    .gte("ts", cutoff)
    .order("ts", { ascending: true });

  if (error) {
    console.error("[exchange-flows] supabase error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    return NextResponse.json({
      asset: "BTC",
      updated_at: null,
      hours: [],
      per_exchange: [],
      latest: [],
    });
  }

  // Build hour timeline (top of each hour, oldest → newest)
  const hourSet = new Set<string>();
  for (const r of rows) hourSet.add(r.ts);
  const hours = Array.from(hourSet).sort();
  const hourIdx = new Map(hours.map((h, i) => [h, i]));

  // Per-exchange volume series + price series (we use OKX price as canonical)
  const seriesByExchange = new Map<string, (number | null)[]>();
  for (const ex of EXCHANGES) {
    seriesByExchange.set(ex, new Array(hours.length).fill(null));
  }
  const priceSeries: (number | null)[] = new Array(hours.length).fill(null);

  for (const r of rows) {
    const i = hourIdx.get(r.ts);
    if (i === undefined) continue;
    const arr = seriesByExchange.get(r.exchange);
    if (arr) arr[i] = r.volume_usd ?? 0;
    // Prefer OKX for canonical price (covers full set, listed on TradingView etc)
    if (r.exchange === "okx" && r.price_close != null) priceSeries[i] = r.price_close;
  }

  // Fill missing canonical price from any other exchange
  for (let i = 0; i < hours.length; i++) {
    if (priceSeries[i] != null) continue;
    for (const ex of EXCHANGES) {
      const v = rows.find((r) => r.ts === hours[i] && r.exchange === ex)?.price_close;
      if (v != null) {
        priceSeries[i] = v;
        break;
      }
    }
  }

  // Latest snapshot per exchange (last row by ts)
  const latestByExchange = new Map<string, Row>();
  for (const r of rows) {
    const prev = latestByExchange.get(r.exchange);
    if (!prev || r.ts > prev.ts) latestByExchange.set(r.exchange, r);
  }

  const latest = EXCHANGES.map((ex) => {
    const r = latestByExchange.get(ex);
    return {
      exchange: ex,
      volume_usd: r?.volume_usd ?? null,
      oi_usd: r?.oi_usd ?? null,
      funding_pct: r?.funding_pct ?? null,
      price_close: r?.price_close ?? null,
      ts: r?.ts ?? null,
    };
  });

  const perExchange = EXCHANGES.map((ex) => ({
    exchange: ex,
    volume_series: seriesByExchange.get(ex) ?? [],
  }));

  const updatedAt = rows[rows.length - 1]?.ts ?? null;

  return NextResponse.json({
    asset: "BTC",
    updated_at: updatedAt,
    hours,
    price_series: priceSeries,
    per_exchange: perExchange,
    latest,
  });
}
