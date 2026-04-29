-- ============================================================
-- 011: exchange_flows — multi-exchange perp aggregation
-- ============================================================
-- Hourly snapshots of BTC perp volume + open interest + funding
-- across major venues. Used by /dashboard/macro to show what a
-- single-exchange chart misses (volume share, OI divergence,
-- funding spread). Mac Mini cron writes every 15 min; the latest
-- row per (ts, asset, exchange) is kept.
--
-- Vercel iad1 cannot reach Binance/Bybit directly — same pattern
-- as whale_tracker, the cron does the egress.
-- ============================================================

CREATE TABLE IF NOT EXISTS exchange_flows (
  ts TIMESTAMPTZ NOT NULL,
  asset TEXT NOT NULL,
  exchange TEXT NOT NULL,
  volume_usd NUMERIC,
  oi_usd NUMERIC,
  funding_pct NUMERIC,
  price_close NUMERIC,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ts, asset, exchange)
);

CREATE INDEX IF NOT EXISTS idx_exchange_flows_asset_ts
  ON exchange_flows (asset, ts DESC);

ALTER TABLE exchange_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_flows_admin_all" ON exchange_flows;
CREATE POLICY "exchange_flows_admin_all"
  ON exchange_flows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "exchange_flows_authenticated_select" ON exchange_flows;
CREATE POLICY "exchange_flows_authenticated_select"
  ON exchange_flows
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE exchange_flows IS
  'Hourly multi-exchange perp aggregation (Binance/Bybit/OKX/Bitget/Hyperliquid). Written by scripts/exchange_flows/fetch_flows.py every 15 min.';
