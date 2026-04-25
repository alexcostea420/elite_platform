-- ============================================================
-- 006: allow 'intraday_signal' data_type in trading_data
-- ============================================================
-- The trading_data table has a CHECK constraint whitelist on data_type.
-- This migration removes the restrictive constraint so future data_type
-- values (intraday_signal, future signal types) can be added without
-- a schema change.
--
-- Existing values: dynamic_limits, fleet_status, macro_dashboard,
-- risk_score, risk_score_v2, whale_tracker.
-- New value added: intraday_signal.
-- ============================================================

ALTER TABLE trading_data
  DROP CONSTRAINT IF EXISTS trading_data_data_type_check;

-- Optional: re-add constraint with full list. Commented out so any future
-- data_type is allowed without a migration. Uncomment if you prefer strict.
-- ALTER TABLE trading_data
--   ADD CONSTRAINT trading_data_data_type_check
--   CHECK (data_type IN (
--     'dynamic_limits',
--     'fleet_status',
--     'macro_dashboard',
--     'risk_score',
--     'risk_score_v2',
--     'whale_tracker',
--     'intraday_signal'
--   ));
