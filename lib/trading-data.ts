import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const TRADING_BOT_DIR = join(process.env.HOME ?? "/Users/server", "trading-bot");

/**
 * Read trading data from Supabase first, fallback to local file.
 * Supabase is used in production (Vercel), local files in dev.
 */
async function readTradingData<T>(dataType: string, localPath: string): Promise<T | null> {
  // Try Supabase first
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("trading_data")
      .select("data")
      .eq("data_type", dataType)
      .maybeSingle();

    if (data?.data) {
      return data.data as T;
    }
  } catch {
    // Supabase unavailable, try local
  }

  // Fallback to local file (works on Mac Mini dev)
  try {
    const raw = await readFile(join(TRADING_BOT_DIR, localPath), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── Risk Score ──────────────────────────────────────────────

export type RiskScoreComponent = {
  raw?: number | null;
  norm: number;
  weight: number;
  why?: string;
  signal?: string;
  explanation?: string;
  phase?: string;
  [key: string]: unknown;
};

export type RiskScoreData = {
  timestamp: string;
  score: number;
  internal_score?: number;
  decision: "BUY" | "SELL" | "HOLD";
  decision_text: string;
  conviction: "HIGH" | "MEDIUM" | "LOW";
  conviction_detail: string;
  overrides: string[];
  btc_price: number;
  btc_price_live: number;
  btc_ath: number;
  pct_from_ath: number;
  btc_market_cap?: number;
  btc_24h_change?: number;
  components: Record<string, RiskScoreComponent>;
  derivatives: {
    funding_rate: number;
    funding_pct: number;
    oi_value: number;
    oi_delta_pct: number;
    ls_ratio: number;
    long_pct: number;
    short_pct: number;
    taker_buy_vol: number;
    taker_sell_vol: number;
    taker_ratio: number;
    basis_pct: number;
    spot_price: number;
    futures_price: number;
  };
  indicators: Record<string, unknown>;
  fear_greed: { value: number; label: string };
  coingecko: {
    total_mcap: number;
    btc_dominance: number;
    eth_dominance: number;
    mcap_change_24h: number;
  };
  macro: {
    vix: number;
    dxy: number;
    us10y: number;
    m2: number;
    unemployment: number;
    fed_funds_rate: number;
  };
  analysis: string;
  version?: string;
  // V2 fields
  layer_scores?: {
    onchain: number;
    technical: number;
    macro: number;
    derivatives: number;
    cycle: number;
  };
  regime_info?: {
    regime: string;
    modifier: number;
  };
  flags?: string[];
  dca_mult?: number;
};

export function getRiskScore() {
  return readTradingData<RiskScoreData>("risk_score", "reports/risk_score.json");
}

export function getRiskScoreV2() {
  return readTradingData<RiskScoreData>("risk_score_v2", "scripts/v2/risk_score_v2.json");
}

// ── Fleet Status ────────────────────────────────────────────

export type Strategy = {
  name: string;
  strategy: string;
  timeframe: string;
  type: "ml" | "rule-based";
  risk: string;
  validation: string;
};

export type RegimeData = {
  regime: "bull" | "bear" | "chop" | "unknown";
  sizing_multiplier: number;
  confidence: number;
  bull_prob?: number;
  bear_prob?: number;
  chop_prob?: number;
  updated: string;
};

export type FleetStatus = {
  updated: string;
  active_strategies: Strategy[];
  disabled_strategies: Strategy[];
  regime: Record<string, RegimeData>;
};

export function getFleetStatus() {
  return readTradingData<FleetStatus>("fleet_status", "data/fleet_status.json");
}

// ── Dynamic Limits ──────────────────────────────────────────

export type DynamicLimits = {
  equity: number;
  equity_long: number;
  equity_short: number;
  equity_master: number;
  daily_loss: number;
  per_asset_dd: number;
  portfolio_dd: number;
  sizing_cap: number;
  risk_floor: number;
  circuit_breaker: number;
  high_conviction: string[];
  recommended_disable: string[];
  updated_at: string;
};

export function getDynamicLimits() {
  return readTradingData<DynamicLimits>("dynamic_limits", "data/dynamic_limits.json");
}

// ── Whale Tracker ──────────────────────────────────────────

export type WhaleData = {
  timestamp: string;
  positioning: Array<{
    asset: string;
    price: number;
    funding: number;
    open_interest: number;
    smart_net_pct: number;
    smart_long_pct: number;
    divergence_score: number;
    signal: string;
    [key: string]: unknown;
  }>;
  sentiment: {
    net_sentiment: number;
    sentiment_label: string;
    total_smart_long_usd: number;
    total_smart_short_usd: number;
    [key: string]: unknown;
  };
  wallet_count: number;
  scan_duration_s: number;
};

export function getWhaleData() {
  return readTradingData<WhaleData>("whale_tracker", "scripts/v2/whale_data.json");
}
