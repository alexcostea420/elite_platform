import "server-only";

import { readFile } from "fs/promises";
import { join } from "path";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const TRADING_BOT_DIR = join(process.env.HOME ?? "/Users/server", "trading-bot");
const ELITE_PLATFORM_DIR = process.cwd();

/**
 * Read trading data from Supabase first, fallback to local file.
 * Supabase is used in production (Vercel), local files in dev.
 * Local fallback tries elite_platform first, then trading-bot for legacy paths.
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

  // Fallback A: elite_platform local path
  try {
    const raw = await readFile(join(ELITE_PLATFORM_DIR, localPath), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    // not found here, try legacy
  }

  // Fallback B: legacy trading-bot path
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

// ── Macro Dashboard ────────────────────────────────────────

export type MacroMetric = {
  value: number;
  date?: string;
  source?: string;
  change_3m?: number;
  change_1y?: number;
  label?: string;
};

export type MacroLayer = {
  signal: "supportive" | "neutral" | "restrictive";
  score: number;
  metrics: string[];
};

export type MacroDashboardData = {
  timestamp: string;
  metrics: Record<string, MacroMetric>;
  timeseries: Record<string, Array<{ date: string; value: number }>>;
  regime: {
    regime: string;
    label: string;
    color: string;
    modifier: number;
  };
  layers: Record<string, MacroLayer>;
};

export function getMacroDashboard() {
  return readTradingData<MacroDashboardData>("macro_dashboard", "data/macro_dashboard.json");
}

// ── Intraday Signal ────────────────────────────────────────

export type IntradayComponent = {
  raw: number | null;
  weight: number;
  contribution: number | null;
};

export type IntradayMacd = {
  macd: number;
  signal: number;
  hist: number;
  hist_prev: number;
};

export type IntradayBollinger = {
  upper: number;
  lower: number;
  sma: number;
  width_pct: number;
};

export type IntradayPivots = {
  pivot: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
  y_high: number;
  y_low: number;
  y_close: number;
};

export type IntradaySetupCondition = { text: string; met: boolean };
export type IntradaySetup = {
  conditions: IntradaySetupCondition[];
  met: number;
  total: number;
};

export type IntradayAlert = {
  text: string;
  severity: "red" | "amber" | "green";
};

export type IntradaySignalData = {
  version: string;
  timestamp: string;
  btc_price: number | null;
  btc_change_24h: number;
  btc_high_24h: number | null;
  btc_low_24h: number | null;
  btc_volume_24h_usd: number | null;
  score: number;
  bias: "LONG" | "SHORT" | "NEUTRU";
  bias_text: string;
  conviction: "HIGH" | "MEDIUM" | "LOW";
  components: Record<string, IntradayComponent>;
  indicators: {
    rsi_15m: number | null;
    rsi_1h: number | null;
    rsi_4h: number | null;
    rsi_1d: number | null;
    macd_1h: IntradayMacd | null;
    atr_1h: number | null;
    bb_1h: IntradayBollinger | null;
    vwap: number | null;
    pivots: IntradayPivots | null;
  };
  crowd: {
    funding_pct: number | null;
    funding_8h_avg: number | null;
    oi_value_usd: number | null;
    oi_delta_pct_12h: number;
    global_ls: { long_pct: number; short_pct: number; ratio: number } | null;
    top_trader_ls: { long_pct: number; short_pct: number; ratio: number } | null;
    taker_ratio: { buy_vol: number; sell_vol: number; ratio: number } | null;
  };
  whale_flow_6h: {
    long_usd: number;
    short_usd: number;
    net_usd: number;
    fill_count: number;
    smart_long_pct?: number;
    signal?: string;
  } | null;
  macro_context: {
    risk_v2_score: number | null;
    risk_v2_decision: string | null;
    risk_v2_conviction: string | null;
  };
  volatility: {
    label: string;
    atr_pct: number | null;
    level: "high" | "normal" | "low" | "unknown";
  };
  session: {
    active: string;
    next: string;
    minutes_to_next: number;
  };
  setups: {
    long: IntradaySetup;
    short: IntradaySetup;
    squeeze: IntradaySetup;
  };
  alerts: IntradayAlert[];
};

export function getIntradaySignal() {
  return readTradingData<IntradaySignalData>("intraday_signal", "scripts/intraday/intraday_signal.json");
}
