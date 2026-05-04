import { NextResponse } from "next/server";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TICKERS = [
  "TSLA", "COIN", "HOOD", "MSTR", "MARA", "CRCL",
  "GOOG", "META", "NVDA", "AAPL", "MSFT", "AMZN",
  "PYPL", "SHOP", "PLTR", "ORCL",
];

const ZONES: Record<string, { buy1: number; buy2: number; sell1: number; sell2: number }> = {
  TSLA: { buy1: 350, buy2: 280, sell1: 580, sell2: 677 },
  COIN: { buy1: 118, buy2: 86, sell1: 450, sell2: 690 },
  HOOD: { buy1: 33, buy2: 23, sell1: 150, sell2: 250 },
  MSTR: { buy1: 105, buy2: 75, sell1: 800, sell2: 1150 },
  MARA: { buy1: 7, buy2: 5, sell1: 22, sell2: 56 },
  CRCL: { buy1: 45, buy2: 31, sell1: 230, sell2: 350 },
  GOOG: { buy1: 240, buy2: 210, sell1: 275, sell2: 410 },
  META: { buy1: 550, buy2: 350, sell1: 850, sell2: 1000 },
  NVDA: { buy1: 150, buy2: 130, sell1: 250, sell2: 300 },
  AAPL: { buy1: 205, buy2: 170, sell1: 300, sell2: 350 },
  MSFT: { buy1: 390, buy2: 345, sell1: 650, sell2: 700 },
  AMZN: { buy1: 184, buy2: 167, sell1: 350, sell2: 400 },
  PYPL: { buy1: 33, buy2: 30, sell1: 80, sell2: 180 },
  SHOP: { buy1: 110, buy2: 70, sell1: 180, sell2: 360 },
  PLTR: { buy1: 63, buy2: 45, sell1: 400, sell2: 500 },
  ORCL: { buy1: 150, buy2: 110, sell1: 260, sell2: 440 },
};

type ZoneHit = {
  zone: string;
  price: number;
  date: string;
  hit: boolean;
};

type TickerHistory = {
  ticker: string;
  zones: ZoneHit[];
  low3m: number;
  high3m: number;
};

async function fetchYahooHistory(ticker: string): Promise<{ date: string; low: number; high: number }[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const threeMonthsAgo = now - 90 * 24 * 60 * 60;

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${threeMonthsAgo}&period2=${now}&interval=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp as number[];
    const lows = result.indicators?.quote?.[0]?.low as number[];
    const highs = result.indicators?.quote?.[0]?.high as number[];

    if (!timestamps || !lows || !highs) return [];

    return timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().split("T")[0],
      low: lows[i] ?? 0,
      high: highs[i] ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const auth = createServerSupabaseClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: profile } = await auth
      .from("profiles")
      .select(ELITE_PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();
    if (!hasEliteAccess(profile)) {
      return NextResponse.json({ error: "Elite required" }, { status: 403 });
    }

    const results: TickerHistory[] = [];

    // Process in batches of 4
    for (let i = 0; i < TICKERS.length; i += 4) {
      const batch = TICKERS.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (ticker) => {
          const history = await fetchYahooHistory(ticker);
          const zones = ZONES[ticker];
          if (!zones || history.length === 0) {
            return { ticker, zones: [], low3m: 0, high3m: 0 };
          }

          const allLows = history.map((d) => d.low).filter((v) => v > 0);
          const allHighs = history.map((d) => d.high).filter((v) => v > 0);
          const low3m = allLows.length > 0 ? Math.min(...allLows) : 0;
          const high3m = allHighs.length > 0 ? Math.max(...allHighs) : 0;

          // Check each zone
          const zoneChecks: ZoneHit[] = [
            { zone: "Buy 1", price: zones.buy1, date: "", hit: false },
            { zone: "Buy 2", price: zones.buy2, date: "", hit: false },
            { zone: "Sell 1", price: zones.sell1, date: "", hit: false },
            { zone: "Sell 2", price: zones.sell2, date: "", hit: false },
          ];

          for (const day of history) {
            // Buy zones: check if low went below
            if (day.low <= zones.buy1 && !zoneChecks[0].hit) {
              zoneChecks[0].hit = true;
              zoneChecks[0].date = day.date;
            }
            if (day.low <= zones.buy2 && !zoneChecks[1].hit) {
              zoneChecks[1].hit = true;
              zoneChecks[1].date = day.date;
            }
            // Sell zones: check if high went above
            if (day.high >= zones.sell1 && !zoneChecks[2].hit) {
              zoneChecks[2].hit = true;
              zoneChecks[2].date = day.date;
            }
            if (day.high >= zones.sell2 && !zoneChecks[3].hit) {
              zoneChecks[3].hit = true;
              zoneChecks[3].date = day.date;
            }
          }

          return { ticker, zones: zoneChecks, low3m, high3m };
        })
      );
      results.push(...batchResults);

      if (i + 4 < TICKERS.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({ history: results });
  } catch (error) {
    console.error("Stocks history error:", error);
    return NextResponse.json({ history: [], error: "Date indisponibile" });
  }
}
