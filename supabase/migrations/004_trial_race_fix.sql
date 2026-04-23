-- Atomic daily trial claim to eliminate race conditions
-- Replaces the read-then-write pattern in /api/trial with a locked, transactional claim
-- Returns { claimed: boolean } — true if this call actually claimed the slot

CREATE OR REPLACE FUNCTION try_claim_daily_trial(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config jsonb;
  v_available boolean;
  v_reset_at timestamptz;
  v_now timestamptz := NOW();
  v_today_8utc timestamptz := date_trunc('day', v_now AT TIME ZONE 'UTC')::timestamptz + interval '8 hours';
BEGIN
  -- Lock the single config row for the duration of this transaction
  SELECT value INTO v_config
  FROM platform_config
  WHERE key = 'trial_available'
  FOR UPDATE;

  -- If row doesn't exist, create it as available
  IF v_config IS NULL THEN
    INSERT INTO platform_config (key, value, updated_at)
    VALUES ('trial_available', jsonb_build_object('available', true, 'reset_at', NULL), v_now)
    ON CONFLICT (key) DO NOTHING;
    v_config := jsonb_build_object('available', true, 'reset_at', NULL);
  END IF;

  v_available := COALESCE((v_config->>'available')::boolean, true);
  v_reset_at := COALESCE((v_config->>'reset_at')::timestamptz, 'epoch'::timestamptz);

  -- If marked unavailable, check whether daily reset should have occurred (>= 08:00 UTC today)
  IF NOT v_available AND v_now >= v_today_8utc AND v_reset_at < v_today_8utc THEN
    v_available := true;
  END IF;

  IF NOT v_available THEN
    RETURN jsonb_build_object('claimed', false);
  END IF;

  -- Atomically flip to unavailable under the row lock
  UPDATE platform_config
  SET value = jsonb_build_object(
        'available', false,
        'last_claimed_at', v_now,
        'last_claimed_by', p_user_id,
        'reset_at', v_now
      ),
      updated_at = v_now
  WHERE key = 'trial_available';

  RETURN jsonb_build_object('claimed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION try_claim_daily_trial(uuid) TO service_role;
