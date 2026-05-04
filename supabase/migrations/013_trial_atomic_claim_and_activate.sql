-- Atomic trial activation: claims today's daily slot AND sets profile to Elite/trial
-- in a single transaction. Either both succeed or neither does.
--
-- Replaces try_claim_daily_trial which only flipped the slot, leaving the route to do
-- a separate profile UPDATE that could silently fail (and burn the daily slot).
--
-- Returns:
--   { ok: true, expires_at: timestamptz }                        -- success
--   { ok: false, reason: 'already_used' }                        -- profile.trial_used_at is set
--   { ok: false, reason: 'already_elite' }                       -- profile.subscription_tier='elite'
--   { ok: false, reason: 'no_profile' }                          -- profile row missing
--   { ok: false, reason: 'taken', next_reset: timestamptz }      -- daily slot consumed by someone else

CREATE OR REPLACE FUNCTION claim_and_activate_trial(p_user_id uuid)
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
  v_next_reset timestamptz;
  v_expires timestamptz := v_now + interval '7 days';
  v_profile RECORD;
  v_updated int;
BEGIN
  SELECT subscription_tier::text AS tier, trial_used_at
    INTO v_profile
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_profile');
  END IF;

  IF v_profile.trial_used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used');
  END IF;

  IF v_profile.tier = 'elite' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_elite');
  END IF;

  SELECT value INTO v_config
    FROM platform_config
    WHERE key = 'trial_available'
    FOR UPDATE;

  IF v_config IS NULL THEN
    INSERT INTO platform_config (key, value, updated_at)
    VALUES ('trial_available', jsonb_build_object('available', true, 'reset_at', NULL), v_now)
    ON CONFLICT (key) DO NOTHING;
    v_config := jsonb_build_object('available', true, 'reset_at', NULL);
  END IF;

  v_available := COALESCE((v_config->>'available')::boolean, true);
  v_reset_at  := COALESCE((v_config->>'reset_at')::timestamptz, 'epoch'::timestamptz);

  IF NOT v_available AND v_now >= v_today_8utc AND v_reset_at < v_today_8utc THEN
    v_available := true;
  END IF;

  IF NOT v_available THEN
    v_next_reset := CASE
      WHEN v_now < v_today_8utc THEN v_today_8utc
      ELSE v_today_8utc + interval '1 day'
    END;
    RETURN jsonb_build_object('ok', false, 'reason', 'taken', 'next_reset', v_next_reset);
  END IF;

  UPDATE platform_config
  SET value = jsonb_build_object(
        'available', false,
        'last_claimed_at', v_now,
        'last_claimed_by', p_user_id,
        'reset_at', v_now
      ),
      updated_at = v_now
  WHERE key = 'trial_available';

  UPDATE profiles
  SET subscription_tier = 'elite',
      subscription_status = 'trial',
      subscription_expires_at = v_expires,
      elite_since = v_now,
      trial_used_at = v_now
  WHERE id = p_user_id
    AND trial_used_at IS NULL
    AND subscription_tier <> 'elite';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'profile_state_changed';
  END IF;

  RETURN jsonb_build_object('ok', true, 'expires_at', v_expires);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_and_activate_trial(uuid) TO service_role;

DROP FUNCTION IF EXISTS try_claim_daily_trial(uuid);
