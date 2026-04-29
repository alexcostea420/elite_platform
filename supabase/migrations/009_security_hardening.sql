-- 009_security_hardening.sql
-- Adds:
--   1. webhook_events  — replay protection for Patreon (and future) webhooks
--   2. rate_limit_consume(...) RPC — atomic check+insert for rate limiting
--   3. trim_webhook_events() helper — call from cron to keep the table small

-- ─────────────────────────────────────────────────────────────
-- 1. Webhook event dedup
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id            BIGSERIAL PRIMARY KEY,
    provider      TEXT        NOT NULL,
    event_id      TEXT        NOT NULL,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS webhook_events_received_at_idx
    ON public.webhook_events (received_at);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; no policies needed for normal users (no access).

-- Janitor: keep last 30d. Call from cron-expire or a dedicated cleanup cron.
CREATE OR REPLACE FUNCTION public.trim_webhook_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.webhook_events
    WHERE received_at < now() - INTERVAL '30 days';
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Atomic rate limit
-- ─────────────────────────────────────────────────────────────
-- Replaces the application-level count + insert pattern, which was racy:
-- two concurrent requests could both see count < limit and both insert.

CREATE OR REPLACE FUNCTION public.rate_limit_consume(
    p_key       TEXT,
    p_limit     INT,
    p_window_ms BIGINT
)
RETURNS TABLE (allowed BOOLEAN, remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start TIMESTAMPTZ := now() - (p_window_ms || ' milliseconds')::INTERVAL;
    v_count        INT;
BEGIN
    -- Lock all matching rows for this key first; serializes concurrent calls
    -- on the same key without blocking other keys.
    PERFORM 1
    FROM public.rate_limits
    WHERE key = p_key
      AND created_at >= v_window_start
    FOR UPDATE;

    SELECT count(*)::INT INTO v_count
    FROM public.rate_limits
    WHERE key = p_key
      AND created_at >= v_window_start;

    IF v_count >= p_limit THEN
        RETURN QUERY SELECT false, 0;
        RETURN;
    END IF;

    INSERT INTO public.rate_limits (key) VALUES (p_key);

    RETURN QUERY SELECT true, GREATEST(p_limit - v_count - 1, 0);
END;
$$;

-- Cleanup rows older than 24h. Cheap, can run any time.
CREATE OR REPLACE FUNCTION public.trim_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.rate_limits
    WHERE created_at < now() - INTERVAL '24 hours';
$$;
