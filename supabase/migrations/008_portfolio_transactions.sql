-- ============================================================
-- 008: portfolio transactions + price cache
-- ============================================================
-- Transaction-level history (BUY/SELL with cost basis), feeds
-- holdings, allocation, PnL, and the "what-if" counterfactual
-- comparator. Replaces the simpler portfolio_holdings flow.
--
-- Admin-gate the page initially (lib/portfolio + page.tsx);
-- RLS still scopes data per-user so we can flip the gate later.
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_key     text NOT NULL,
  side          text NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity      numeric(20, 8) NOT NULL CHECK (quantity > 0),
  price_usd     numeric(20, 8) NOT NULL CHECK (price_usd >= 0),
  occurred_on   date NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_transactions_user_idx
  ON portfolio_transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS portfolio_transactions_asset_idx
  ON portfolio_transactions (user_id, asset_key);

ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own transactions" ON portfolio_transactions;
CREATE POLICY "Users manage own transactions"
  ON portfolio_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access portfolio_transactions" ON portfolio_transactions;
CREATE POLICY "Admin full access portfolio_transactions"
  ON portfolio_transactions
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- Price cache: shared across users to minimize external API hits.
-- Keyed by (asset_key, on_date). on_date = NULL means "current".
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_price_cache (
  asset_key     text NOT NULL,
  on_date       date,
  price_usd     numeric(20, 8) NOT NULL,
  source        text NOT NULL,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_key, COALESCE(on_date, '1900-01-01'::date))
);

CREATE INDEX IF NOT EXISTS portfolio_price_cache_recent_idx
  ON portfolio_price_cache (asset_key, fetched_at DESC);

ALTER TABLE portfolio_price_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read prices" ON portfolio_price_cache;
CREATE POLICY "Anyone can read prices"
  ON portfolio_price_cache
  FOR SELECT
  TO authenticated
  USING (true);
