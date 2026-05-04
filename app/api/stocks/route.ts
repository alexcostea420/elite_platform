import { NextResponse } from "next/server";

import { ELITE_PROFILE_COLUMNS, hasEliteAccess } from "@/lib/auth/elite-gate";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TICKERS = [
  "TSLA", "COIN", "HOOD", "MSTR", "MARA", "CRCL",
  "GOOG", "META", "NVDA", "AAPL", "MSFT", "AMZN",
  "PYPL", "SHOP", "PLTR", "ORCL",
];

type ScoreData = {
  score: number | null;
  scoreQuality: number | null;
  scoreValue: number | null;
  scoreBalance: number | null;
  isBtcDriven: boolean;
  grossMargin: number | null;
  fcfMargin: number | null;
  roe: number | null;
  fcfYield: number | null;
  pFcf: number | null;
  evEbit: number | null;
  netDebtToMarketCap: number | null;
  asOf: string | null;
};

type StockData = {
  ticker: string;
  price: number;
  change: string;
  changePct: number;
  marketCap: string;
  pe: string;
  volume: string;
  avgVolume: string;
  sector: string;
  w52High: number;
  w52Low: number;
  pctFromATH: number;
  sparkline: number[];
  scoreData?: ScoreData;
};

async function fetchFinviz(ticker: string): Promise<StockData | null> {
  try {
    const res = await fetch(
      `https://finviz.com/quote.ashx?t=${ticker}&ty=c&p=d&b=1`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return null;
    const html = await res.text();

    // Extract price
    const priceMatch = html.match(/quote-price_wrapper_price">([0-9.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Extract snapshot fields
    function getField(label: string): string {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const m = html.match(
        new RegExp(
          `snapshot-td-label">${escaped}</div></td><td[^>]*><div class="snapshot-td-content"><b>(?:<[^>]*>)?([^<]+)`
        )
      );
      return m ? m[1].trim() : "-";
    }

    const changeStr = getField("Change");
    const changePct = parseFloat(changeStr.replace("%", "")) || 0;
    const w52HighStr = getField("52W High");
    const w52LowStr = getField("52W Low");
    const w52High = parseFloat(w52HighStr) || 0;
    const w52Low = parseFloat(w52LowStr) || 0;

    return {
      ticker,
      price,
      change: changeStr,
      changePct,
      marketCap: getField("Market Cap").replace(/\.$/, ""),
      pe: getField("P/E"),
      volume: getField("Volume"),
      avgVolume: getField("Avg Volume"),
      sector: getField("Sector"),
      w52High,
      w52Low,
      pctFromATH: w52High > 0 ? ((price - w52High) / w52High) * 100 : 0,
      sparkline: [],
    };
  } catch {
    return null;
  }
}

/** Fetch 5-day sparkline from Yahoo Finance chart API */
async function fetchSparklines(tickers: string[]): Promise<Record<string, number[]>> {
  const result: Record<string, number[]> = {};
  try {
    const symbols = tickers.join(",");
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=5d&interval=1h`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return result;
    const data = await res.json();
    for (const ticker of tickers) {
      const spark = data[ticker];
      const closes = spark?.close ?? [];
      // Filter out nulls and take every other point to reduce density
      const filtered = closes.filter((v: number | null) => v !== null) as number[];
      result[ticker] = filtered;
    }
  } catch {
    // Sparklines are optional - don't fail the whole request
  }
  return result;
}

async function fetchScores(): Promise<Record<string, ScoreData>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("stocks_fundamentals")
      .select(
        "ticker, score, score_quality, score_value, score_balance, is_btc_driven, gross_margin, fcf_margin, roe, fcf_yield, p_fcf, ev_ebit, net_debt_to_market_cap, as_of",
      );
    const map: Record<string, ScoreData> = {};
    for (const r of data ?? []) {
      map[r.ticker as string] = {
        score: r.score === null ? null : Number(r.score),
        scoreQuality: r.score_quality === null ? null : Number(r.score_quality),
        scoreValue: r.score_value === null ? null : Number(r.score_value),
        scoreBalance: r.score_balance === null ? null : Number(r.score_balance),
        isBtcDriven: Boolean(r.is_btc_driven),
        grossMargin: r.gross_margin === null ? null : Number(r.gross_margin),
        fcfMargin: r.fcf_margin === null ? null : Number(r.fcf_margin),
        roe: r.roe === null ? null : Number(r.roe),
        fcfYield: r.fcf_yield === null ? null : Number(r.fcf_yield),
        pFcf: r.p_fcf === null ? null : Number(r.p_fcf),
        evEbit: r.ev_ebit === null ? null : Number(r.ev_ebit),
        netDebtToMarketCap: r.net_debt_to_market_cap === null ? null : Number(r.net_debt_to_market_cap),
        asOf: (r.as_of as string | null) ?? null,
      };
    }
    return map;
  } catch (error) {
    console.error("Stocks score fetch error:", error);
    return {};
  }
}

export async function GET() {
  try {
    // Elite-only: zones + proprietary scoring are members-only data.
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

    // Fetch in batches of 4 with delays to avoid rate limiting
    const results: (StockData | null)[] = [];

    for (let i = 0; i < TICKERS.length; i += 4) {
      const batch = TICKERS.slice(i, i + 4);
      const batchResults = await Promise.all(batch.map(fetchFinviz));
      results.push(...batchResults);

      // Small delay between batches
      if (i + 4 < TICKERS.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const stocks = results.filter(Boolean) as StockData[];

    // Fetch sparklines + scores in parallel
    const [sparklines, scores] = await Promise.all([
      fetchSparklines(TICKERS),
      fetchScores(),
    ]);
    for (const stock of stocks) {
      stock.sparkline = sparklines[stock.ticker] ?? [];
      stock.scoreData = scores[stock.ticker];
    }

    return NextResponse.json({ stocks, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Stocks fetch error:", error);
    return NextResponse.json({ stocks: [], error: "Date indisponibile" });
  }
}
