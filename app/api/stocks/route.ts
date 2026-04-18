import { NextResponse } from "next/server";

export const revalidate = 300; // Cache 5 minutes

const TICKERS = [
  "TSLA", "COIN", "HOOD", "MSTR", "MARA", "CRCL",
  "GOOG", "META", "NVDA", "AAPL", "MSFT", "AMZN",
  "PYPL", "SHOP", "PLTR", "ORCL",
];

type StockData = {
  ticker: string;
  price: number;
  change: string;
  changePct: number;
  marketCap: string;
  pe: string;
  volume: string;
  w52High: number;
  w52Low: number;
  pctFromATH: number;
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
      marketCap: getField("Market Cap"),
      pe: getField("P/E"),
      volume: getField("Volume"),
      w52High,
      w52Low,
      pctFromATH: w52High > 0 ? ((price - w52High) / w52High) * 100 : 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
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
    return NextResponse.json({ stocks, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Stocks fetch error:", error);
    return NextResponse.json({ stocks: [], error: "Date indisponibile" });
  }
}
