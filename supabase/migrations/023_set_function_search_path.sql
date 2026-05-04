-- 023: Pin search_path on SECURITY DEFINER functions
--
-- Per Supabase linter (0011_function_search_path_mutable): SECURITY DEFINER
-- functions with role-mutable search_path can be exploited if an attacker
-- has CREATE on a schema earlier in the search_path. Pinning to `public`
-- removes that vector. All these functions only reference public-schema
-- objects, so this is a no-op behaviorally.
--
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.rate_limit_consume(text, int, bigint) SET search_path = public;
ALTER FUNCTION public.trim_rate_limits() SET search_path = public;
ALTER FUNCTION public.trim_webhook_events() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.tier_level(public.subscription_tier) SET search_path = public;
ALTER FUNCTION public.can_access_video(public.subscription_tier, public.subscription_tier) SET search_path = public;
