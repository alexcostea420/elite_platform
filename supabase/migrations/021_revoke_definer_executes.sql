-- 021: Lock down SECURITY DEFINER RPCs + tighten leads INSERT
--
-- Background: every function created with SECURITY DEFINER in 003-015
-- relied on the implicit PostgreSQL default that grants EXECUTE to
-- PUBLIC for new functions. Combined with PostgREST exposing the public
-- schema to anon and authenticated, this means:
--
-- 1. claim_and_activate_trial(uuid) could be called by any anon caller
--    with an arbitrary user uuid as argument. The function does not
--    check auth.uid() = p_user_id, so an attacker who knew/guessed a
--    profile uuid could burn that user's trial_used_at slot. UUIDs are
--    random so guessing is impractical, but the API surface is wrong.
-- 2. rate_limit_consume / trim_rate_limits / trim_webhook_events expose
--    write access to internal bookkeeping tables to any anon caller.
-- 3. is_admin(uuid) lets anon probe admin status of any uuid.
--
-- Fix: revoke from PUBLIC, grant only to service_role. The webhooks /
-- trial / rate-limit RPCs all execute through the service-role key from
-- API routes, so this doesn't break callers.
--
-- Also tighten the leads INSERT policy. Currently `WITH CHECK (true)`
-- lets anon write any junk. Add a basic email-format check that mirrors
-- the validation already done in /api/lead-magnet so DB and API agree.

-- Functions
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.trim_webhook_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trim_webhook_events() TO service_role;

REVOKE ALL ON FUNCTION public.rate_limit_consume(text, int, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_limit_consume(text, int, bigint) TO service_role;

REVOKE ALL ON FUNCTION public.trim_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trim_rate_limits() TO service_role;

REVOKE ALL ON FUNCTION public.claim_and_activate_trial(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_and_activate_trial(uuid) TO service_role;

-- Leads INSERT: require RFC-style email shape and length cap matching the API
DROP POLICY IF EXISTS "Anyone can submit lead" ON leads;
CREATE POLICY "Anyone can submit lead" ON leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
