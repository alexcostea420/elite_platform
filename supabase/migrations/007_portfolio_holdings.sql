-- ============================================================
-- 007: user portfolio holdings (member-tracked positions)
-- ============================================================
-- Allows Elite members to track their own positions on the
-- platform. Each row is one holding (ticker + qty + entry_price).
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type    text NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'cash')),
  ticker        text NOT NULL,
  quantity      numeric(20, 8) NOT NULL CHECK (quantity > 0),
  entry_price   numeric(20, 8) NOT NULL CHECK (entry_price >= 0),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_holdings_user_idx
  ON portfolio_holdings (user_id, created_at DESC);

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own holdings" ON portfolio_holdings;
CREATE POLICY "Users manage own holdings"
  ON portfolio_holdings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access portfolio_holdings" ON portfolio_holdings;
CREATE POLICY "Admin full access portfolio_holdings"
  ON portfolio_holdings
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION portfolio_holdings_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS portfolio_holdings_updated_at ON portfolio_holdings;
CREATE TRIGGER portfolio_holdings_updated_at
  BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW
  EXECUTE FUNCTION portfolio_holdings_set_updated_at();
