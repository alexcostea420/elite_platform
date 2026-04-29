-- ============================================================
-- 010: risk_score_history — daily snapshots of the V2 risk score
-- ============================================================
-- The trading_data table holds only the latest risk_score_v2 row
-- (overwritten every 8h). To plot a year of history we need a
-- separate append-only table. Forward-sync writes one row per day;
-- a one-shot backfill script seeds the past 365 days from
-- bitcoin-data.com / alternative.me / Yahoo (no derivatives).
-- ============================================================

CREATE TABLE IF NOT EXISTS risk_score_history (
  date DATE PRIMARY KEY,
  total_score NUMERIC(5, 2) NOT NULL,
  level TEXT NOT NULL,
  btc_price NUMERIC(12, 2),
  components JSONB,
  source TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-range queries (chart fetches last 365 days)
CREATE INDEX IF NOT EXISTS idx_risk_score_history_date
  ON risk_score_history (date DESC);

-- RLS: read-only for any authenticated user (Elite gate enforced
-- in the page server component, same pattern as whale_consensus).
ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "risk_score_history_admin_all" ON risk_score_history;
CREATE POLICY "risk_score_history_admin_all"
  ON risk_score_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "risk_score_history_authenticated_select" ON risk_score_history;
CREATE POLICY "risk_score_history_authenticated_select"
  ON risk_score_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypasses RLS by default — used by sync_v2.py and the
-- backfill script.

COMMENT ON TABLE risk_score_history IS
  'Daily snapshots of V2 risk score for historical chart on /dashboard/risk-score. Forward-sync writes daily; backfill seeds past 365d.';
COMMENT ON COLUMN risk_score_history.source IS
  '"live" = written by sync_v2.py from current API data. "backfill" = computed retroactively from historical APIs (no derivatives).';
