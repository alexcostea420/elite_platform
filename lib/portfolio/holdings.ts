/**
 * Compute holdings from a list of transactions using weighted-average
 * cost basis. SELL reduces qty but not avg cost. v1 doesn't track
 * realized PnL — that's a v2 concern.
 */

import { getAsset, type Asset } from "./assets";

export type Transaction = {
  id: string;
  asset_key: string;
  side: "BUY" | "SELL";
  quantity: number;
  price_usd: number;
  occurred_on: string;
  notes: string | null;
  created_at: string;
};

export type Holding = {
  asset: Asset;
  qty: number;
  avgCostUsd: number;
  costBasisUsd: number;
  buyCount: number;
  sellCount: number;
  firstBuyOn: string | null;
  lastTxOn: string | null;
};

export type EnrichedHolding = Holding & {
  currentPriceUsd: number | null;
  currentValueUsd: number | null;
  pnlUsd: number | null;
  pnlPct: number | null;
  allocationPct: number | null;
};

export function computeHoldings(transactions: Transaction[]): Holding[] {
  type Bucket = {
    buyQty: number;
    buyCost: number;
    sellQty: number;
    buyCount: number;
    sellCount: number;
    firstBuyOn: string | null;
    lastTxOn: string | null;
  };
  const buckets = new Map<string, Bucket>();

  for (const tx of transactions) {
    let b = buckets.get(tx.asset_key);
    if (!b) {
      b = {
        buyQty: 0,
        buyCost: 0,
        sellQty: 0,
        buyCount: 0,
        sellCount: 0,
        firstBuyOn: null,
        lastTxOn: null,
      };
      buckets.set(tx.asset_key, b);
    }
    if (tx.side === "BUY") {
      b.buyQty += tx.quantity;
      b.buyCost += tx.quantity * tx.price_usd;
      b.buyCount += 1;
      if (!b.firstBuyOn || tx.occurred_on < b.firstBuyOn) b.firstBuyOn = tx.occurred_on;
    } else {
      b.sellQty += tx.quantity;
      b.sellCount += 1;
    }
    if (!b.lastTxOn || tx.occurred_on > b.lastTxOn) b.lastTxOn = tx.occurred_on;
  }

  const holdings: Holding[] = [];
  for (const [assetKey, b] of buckets) {
    const asset = getAsset(assetKey);
    if (!asset) continue;
    const netQty = Math.max(0, b.buyQty - b.sellQty);
    if (netQty <= 0) continue;
    const avgCostUsd = b.buyQty > 0 ? b.buyCost / b.buyQty : 0;
    holdings.push({
      asset,
      qty: netQty,
      avgCostUsd,
      costBasisUsd: netQty * avgCostUsd,
      buyCount: b.buyCount,
      sellCount: b.sellCount,
      firstBuyOn: b.firstBuyOn,
      lastTxOn: b.lastTxOn,
    });
  }

  holdings.sort((a, b) => b.costBasisUsd - a.costBasisUsd);
  return holdings;
}

export function enrichHoldings(
  holdings: Holding[],
  prices: Record<string, number | null>,
): { holdings: EnrichedHolding[]; totalValueUsd: number; totalCostUsd: number } {
  const enriched: EnrichedHolding[] = holdings.map((h) => {
    const cur = prices[h.asset.key] ?? null;
    const value = cur != null ? cur * h.qty : null;
    const pnl = value != null ? value - h.costBasisUsd : null;
    const pnlPct =
      pnl != null && h.costBasisUsd > 0 ? (pnl / h.costBasisUsd) * 100 : null;
    return {
      ...h,
      currentPriceUsd: cur,
      currentValueUsd: value,
      pnlUsd: pnl,
      pnlPct,
      allocationPct: null,
    };
  });

  const totalValueUsd = enriched.reduce((s, h) => s + (h.currentValueUsd ?? 0), 0);
  const totalCostUsd = enriched.reduce((s, h) => s + h.costBasisUsd, 0);

  if (totalValueUsd > 0) {
    for (const h of enriched) {
      h.allocationPct =
        h.currentValueUsd != null ? (h.currentValueUsd / totalValueUsd) * 100 : null;
    }
  }

  return { holdings: enriched, totalValueUsd, totalCostUsd };
}
