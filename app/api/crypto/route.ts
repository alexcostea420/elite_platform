import { NextResponse } from "next/server";

export const revalidate = 120; // Cache 2 minutes

const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "ripple", "dogecoin",
  "cardano", "avalanche-2", "chainlink", "sui", "tao",
  "binancecoin", "polkadot", "matic-network", "near",
  "litecoin", "uniswap", "internet-computer", "render-token",
  "injective-protocol", "hyperliquid",
];

type CryptoData = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  ath: number;
  pctFromATH: number;
  sparkline: number[];
  image: string;
};

export async function GET() {
  try {
    const ids = COIN_IDS.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=7d`,
      {
        headers: { accept: "application/json" },
        next: { revalidate: 120 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ coins: [], error: "Date indisponibile" });
    }

    const raw = await res.json();

    const coins: CryptoData[] = raw.map((c: Record<string, unknown>) => ({
      id: c.id,
      symbol: (c.symbol as string)?.toUpperCase() ?? "",
      name: c.name,
      price: c.current_price ?? 0,
      change24h: c.price_change_percentage_24h ?? 0,
      change7d: c.price_change_percentage_7d_in_currency ?? 0,
      marketCap: c.market_cap ?? 0,
      volume24h: c.total_volume ?? 0,
      ath: c.ath ?? 0,
      pctFromATH: c.ath_change_percentage ?? 0,
      sparkline: (c.sparkline_in_7d as { price: number[] })?.price?.slice(-24) ?? [],
      image: c.image ?? "",
    }));

    return NextResponse.json({ coins, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Crypto fetch error:", error);
    return NextResponse.json({ coins: [], error: "Eroare la încărcarea datelor" });
  }
}
