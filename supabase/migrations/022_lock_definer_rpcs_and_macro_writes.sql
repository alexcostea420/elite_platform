-- 022: Finish locking down SECURITY DEFINER RPCs + tighten macro/config write paths
--
-- Migration 021 only revoked EXECUTE from PUBLIC, but Supabase grants EXECUTE
-- to anon and authenticated explicitly on every public-schema function. So
-- the linter still flags claim_and_activate_trial, rate_limit_consume,
-- trim_rate_limits, trim_webhook_events, handle_new_auth_user, rls_auto_enable
-- as callable by anon/authenticated via /rest/v1/rpc/...
--
-- All of these are called only by service-role API routes (or by the auth
-- system itself for handle_new_auth_user, which runs as a trigger and does
-- not need EXECUTE on public-schema role grants). Safe to revoke.
--
-- is_admin(uuid) intentionally stays callable by authenticated because RLS
-- policies on portfolio_holdings, portfolio_transactions, etc. invoke it
-- as USING (is_admin(auth.uid())). Revoking EXECUTE would break those.
--
-- Also: macro_metrics and platform_config have RLS policies with role = '-'
-- (PUBLIC) and WITH CHECK (true). anon and authenticated both have INSERT
-- on these tables, so the policy is the only line of defense, and it's
-- always-true. Restrict the write policies to service_role and drop the
-- redundant table-level write privileges from anon/authenticated.

-- Lock down RPCs that are only called by service_role
REVOKE EXECUTE ON FUNCTION public.claim_and_activate_trial(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rate_limit_consume(text, int, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trim_rate_limits() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trim_webhook_events() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;

-- macro_metrics: writes are done by sync_trading_data.py via service_role.
-- Drop the always-true policies, recreate scoped to service_role.
DROP POLICY IF EXISTS service_insert_macro ON public.macro_metrics;
DROP POLICY IF EXISTS service_update_macro ON public.macro_metrics;
CREATE POLICY service_insert_macro ON public.macro_metrics
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY service_update_macro ON public.macro_metrics
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
-- Strip table-level write grants so anon/authenticated can't bypass via direct DML.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.macro_metrics FROM anon, authenticated;

-- platform_config: only the trial-claim flow writes here, via service_role.
DROP POLICY IF EXISTS service_role_can_write_config ON public.platform_config;
CREATE POLICY service_role_can_write_config ON public.platform_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.platform_config FROM anon, authenticated;
