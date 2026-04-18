import { NextResponse } from "next/server";

export const revalidate = 120; // Cache 2 minutes

const COIN_IDS = [
  "bitcoin", "ethereum", "solana", "ripple", "dogecoin",
  "cardano", "avalanche-2", "chainlink", "sui", "tao",
  "binancecoin", "polkadot", "near",
  "litecoin", "uniswap", "render-token",
  "injective-protocol", "hyperliquid",
  "curve-dao-token", "convex-finance", "sei-network",
  "algorand", "ethena", "filecoin", "iota",
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
  cyclePeak: number;
  pctFromCyclePeak: number;
  sparkline: number[];
  image: string;
};

// Cycle peaks: highest price in March 2024 or December 2024
// These are the two major cycle tops for altcoins
const CYCLE_PEAKS: Record<string, number> = {
  bitcoin: 73750,
  ethereum: 4090,
  solana: 210,
  ripple: 2.90,
  dogecoin: 0.48,
  cardano: 1.33,
  "avalanche-2": 65,
  chainlink: 30,
  sui: 5.35,
  tao: 730,
  binancecoin: 793,
  polkadot: 11.60,
  near: 9.00,
  litecoin: 130,
  uniswap: 17.50,
  "render-token": 13.60,
  "injective-protocol": 52,
  hyperliquid: 35,
  "curve-dao-token": 2.30,
  "convex-finance": 7.50,
  "sei-network": 1.15,
  algorand: 0.62,
  ethena: 1.52,
  filecoin: 12.50,
  iota: 0.65,
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

    const coins: CryptoData[] = raw.map((c: Record<string, unknown>) => {
      const id = c.id as string;
      const price = (c.current_price as number) ?? 0;
      const cyclePeak = CYCLE_PEAKS[id] ?? (c.ath as number) ?? 0;
      const pctFromCyclePeak = cyclePeak > 0 ? ((price - cyclePeak) / cyclePeak) * 100 : 0;

      return {
        id,
        symbol: (c.symbol as string)?.toUpperCase() ?? "",
        name: c.name as string,
        price,
        change24h: (c.price_change_percentage_24h as number) ?? 0,
        change7d: (c.price_change_percentage_7d_in_currency as number) ?? 0,
        marketCap: (c.market_cap as number) ?? 0,
        volume24h: (c.total_volume as number) ?? 0,
        ath: (c.ath as number) ?? 0,
        pctFromATH: (c.ath_change_percentage as number) ?? 0,
        cyclePeak,
        pctFromCyclePeak,
        sparkline: (c.sparkline_in_7d as { price: number[] })?.price?.slice(-24) ?? [],
        image: (c.image as string) ?? "",
      };
    });

    return NextResponse.json({ coins, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Crypto fetch error:", error);
    return NextResponse.json({ coins: [], error: "Eroare la încărcarea datelor" });
  }
}
