import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache 1 hour (weekly RSI doesn't change fast)

// Yahoo Finance symbols for our coins
const YAHOO_SYMBOLS: Record<string, string> = {
  BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", XRP: "XRP-USD",
  DOGE: "DOGE-USD", ADA: "ADA-USD", AVAX: "AVAX-USD", LINK: "LINK-USD",
  SUI: "SUI20947-USD", TAO: "TAO22974-USD", BNB: "BNB-USD", DOT: "DOT-USD",
  NEAR: "NEAR-USD", LTC: "LTC-USD", UNI: "UNI7083-USD", RENDER: "RNDR-USD",
  INJ: "INJ-USD", HYPE: "HYPE-USD", CRV: "CRV-USD", CVX: "CVX-USD",
  SEI: "SEI-USD", ALGO: "ALGO-USD", ENA: "ENA-USD", FIL: "FIL-USD",
  IOTA: "IOTA-USD",
};

function calcRSI(closes: (number | null)[], period = 14): number | null {
  const valid = closes.filter((c): c is number => c !== null && c > 0);
  if (valid.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = valid[i] - valid[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < valid.length; i++) {
    const change = valid[i] - valid[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

async function fetchWeeklyCloses(yahooSymbol: string): Promise<(number | null)[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=6mo&interval=1wk`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
          next: { revalidate: 3600 },
        }
      );
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) return [];
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      return result?.indicators?.quote?.[0]?.close ?? [];
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return [];
}

export async function GET() {
  try {
    const entries = Object.entries(YAHOO_SYMBOLS);
    const rsiMap: Record<string, number | null> = {};

    // Fetch in batches of 3 with delays to avoid Yahoo 429
    for (let i = 0; i < entries.length; i += 3) {
      const batch = entries.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async ([symbol, yahooSym]) => {
          const closes = await fetchWeeklyCloses(yahooSym);
          const rsi = calcRSI(closes);
          return [symbol, rsi] as const;
        })
      );
      for (const [symbol, rsi] of results) {
        rsiMap[symbol] = rsi;
      }
      // Delay between batches
      if (i + 3 < entries.length) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    return NextResponse.json({ rsi: rsiMap, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("RSI fetch error:", error);
    return NextResponse.json({ rsi: {}, error: "RSI unavailable" });
  }
}
