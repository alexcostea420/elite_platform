-- Drop global "1 trial per day" limit. Per-account guard (trial_used_at) stays.
--
-- Rationale: with disposable-email blocklist + gmail normalization + Discord-required
-- (migration 014), abuse is mitigated at the account level. The global daily slot
-- was forcing 2nd+ signups on the same day to bounce off "Trial-ul de azi a fost
-- luat" and not return.
--
-- The platform_config row 'trial_available' is left in place (for backfill / audit)
-- but no longer read or written by the RPC.

CREATE OR REPLACE FUNCTION claim_and_activate_trial(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := NOW();
  v_expires timestamptz := v_now + interval '7 days';
  v_profile RECORD;
  v_dup_count int;
  v_updated int;
BEGIN
  SELECT subscription_tier::text AS tier, trial_used_at, discord_user_id, email_normalized
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

  IF v_profile.discord_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'discord_required');
  END IF;

  IF v_profile.email_normalized IS NOT NULL THEN
    SELECT COUNT(*) INTO v_dup_count
    FROM profiles
    WHERE email_normalized = v_profile.email_normalized
      AND id <> p_user_id
      AND trial_used_at IS NOT NULL;

    IF v_dup_count > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'email_duplicate');
    END IF;
  END IF;

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
