/**
 * Counterfactual: "If I had bought ___ instead on the same date, with
 * the same USD amount, what would I have today?"
 *
 * Inputs: original transaction (asset, qty, price, date) + alternative asset.
 * Outputs: deltas (USD + percent), plus a tiny "lesson" note used by the UI
 * to frame the comparison educationally rather than as regret.
 */

import { getAsset } from "./assets";
import { getCurrentPriceUsd, getHistoricalPriceUsd } from "./prices";

export type WhatIfInput = {
  originalAssetKey: string;
  originalQty: number;
  originalPriceUsd: number;
  originalDate: string;
  alternativeAssetKey: string;
};

export type WhatIfResult = {
  ok: true;
  amountInvestedUsd: number;
  original: {
    assetKey: string;
    assetName: string;
    qty: number;
    currentPriceUsd: number;
    currentValueUsd: number;
    pnlUsd: number;
    pnlPct: number;
  };
  alternative: {
    assetKey: string;
    assetName: string;
    priceOnDateUsd: number;
    qty: number;
    currentPriceUsd: number;
    currentValueUsd: number;
    pnlUsd: number;
    pnlPct: number;
  };
  delta: {
    valueUsd: number;
    pct: number;
    altOutperformed: boolean;
  };
};

export type WhatIfError = { ok: false; reason: string };

export async function computeWhatIf(
  input: WhatIfInput,
): Promise<WhatIfResult | WhatIfError> {
  const orig = getAsset(input.originalAssetKey);
  const alt = getAsset(input.alternativeAssetKey);
  if (!orig) return { ok: false, reason: "original_asset_not_found" };
  if (!alt) return { ok: false, reason: "alternative_asset_not_found" };
  if (input.originalAssetKey === input.alternativeAssetKey) {
    return { ok: false, reason: "same_asset" };
  }

  const amountInvestedUsd = input.originalQty * input.originalPriceUsd;
  if (amountInvestedUsd <= 0) return { ok: false, reason: "invalid_amount" };

  const [origNow, altOnDate, altNow] = await Promise.all([
    getCurrentPriceUsd(input.originalAssetKey),
    getHistoricalPriceUsd(input.alternativeAssetKey, input.originalDate),
    getCurrentPriceUsd(input.alternativeAssetKey),
  ]);

  if (origNow == null) return { ok: false, reason: "original_current_price_unavailable" };
  if (altOnDate == null) return { ok: false, reason: "alternative_historical_price_unavailable" };
  if (altNow == null) return { ok: false, reason: "alternative_current_price_unavailable" };

  const origCurrentValue = input.originalQty * origNow;
  const origPnl = origCurrentValue - amountInvestedUsd;
  const origPnlPct = (origPnl / amountInvestedUsd) * 100;

  const altQty = amountInvestedUsd / altOnDate;
  const altCurrentValue = altQty * altNow;
  const altPnl = altCurrentValue - amountInvestedUsd;
  const altPnlPct = (altPnl / amountInvestedUsd) * 100;

  const deltaValue = altCurrentValue - origCurrentValue;
  const deltaPct =
    origCurrentValue > 0 ? (deltaValue / origCurrentValue) * 100 : 0;

  return {
    ok: true,
    amountInvestedUsd,
    original: {
      assetKey: orig.key,
      assetName: orig.name,
      qty: input.originalQty,
      currentPriceUsd: origNow,
      currentValueUsd: origCurrentValue,
      pnlUsd: origPnl,
      pnlPct: origPnlPct,
    },
    alternative: {
      assetKey: alt.key,
      assetName: alt.name,
      priceOnDateUsd: altOnDate,
      qty: altQty,
      currentPriceUsd: altNow,
      currentValueUsd: altCurrentValue,
      pnlUsd: altPnl,
      pnlPct: altPnlPct,
    },
    delta: {
      valueUsd: deltaValue,
      pct: deltaPct,
      altOutperformed: deltaValue > 0,
    },
  };
}
