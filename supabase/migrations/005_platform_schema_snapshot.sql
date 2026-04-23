-- Schema snapshot of tables that already exist in production
-- but were never captured in migrations. Idempotent (IF NOT EXISTS).
-- Source: reverse-engineered from app/api, scripts/, and lib/ code paths as of 2026-04-23.
-- Apply order: after 004_trial_race_fix.sql.

-- ===================== profiles (extend auth.users) =====================
-- Supabase creates auth.users automatically; profiles mirrors id and stores app-level fields.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'elite')),
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'trial', 'inactive', 'expired')),
  subscription_expires_at timestamptz,
  elite_since timestamptz,
  trial_used_at timestamptz,
  discord_user_id text,
  discord_username text,
  bot_active boolean NOT NULL DEFAULT false,
  bot_since timestamptz,
  is_veteran boolean NOT NULL DEFAULT false,
  email_unsubscribed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns exist even if table predates this migration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elite_since timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_user_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bot_active boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bot_since timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_veteran boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_unsubscribed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_discord_user_id ON profiles(discord_user_id) WHERE discord_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_discord_username ON profiles(discord_username) WHERE discord_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);

-- ===================== videos =====================
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id text UNIQUE,
  title text NOT NULL,
  description text,
  category text,
  tags text[] DEFAULT '{}',
  tier_required text NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'elite')),
  duration_seconds integer,
  thumbnail_url text,
  video_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_tier_published ON videos(tier_required, is_published);

-- ===================== platform_config =====================
CREATE TABLE IF NOT EXISTS platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== email_drip_queue =====================
CREATE TABLE IF NOT EXISTS email_drip_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  template text NOT NULL,
  subject text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled','skipped')),
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_drip_pending ON email_drip_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_drip_user ON email_drip_queue(user_id);

-- ===================== discord_drip_queue =====================
CREATE TABLE IF NOT EXISTS discord_drip_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id text NOT NULL,
  message_type text NOT NULL,
  message_text text NOT NULL,
  send_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discord_drip_pending ON discord_drip_queue(send_at) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_discord_drip_user ON discord_drip_queue(discord_user_id);

-- ===================== trading_data =====================
CREATE TABLE IF NOT EXISTS trading_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== leads =====================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== feedback =====================
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'general',
  message text NOT NULL,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback(user_id, created_at DESC);

-- ===================== rate_limits =====================
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON rate_limits(key, created_at DESC);

-- ===================== whale tracker =====================
CREATE TABLE IF NOT EXISTS whale_wallets (
  address text PRIMARY KEY,
  rank integer,
  previous_rank integer,
  display_name text,
  account_value numeric,
  pnl_90d numeric,
  volume_90d numeric,
  last_activity timestamptz,
  in_top_20_since date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whale_wallets_rank ON whale_wallets(rank);

CREATE TABLE IF NOT EXISTS whale_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL REFERENCES whale_wallets(address) ON DELETE CASCADE,
  asset text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('LONG','SHORT')),
  size numeric,
  entry_price numeric,
  leverage numeric,
  unrealized_pnl numeric,
  margin_used numeric,
  notional_usd numeric,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whale_positions_address ON whale_positions(address);
CREATE INDEX IF NOT EXISTS idx_whale_positions_current ON whale_positions(is_current, asset) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS whale_positions_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  asset text NOT NULL,
  direction text NOT NULL,
  size numeric,
  entry_price numeric,
  leverage numeric,
  unrealized_pnl numeric,
  margin_used numeric,
  notional_usd numeric,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whale_hist_address ON whale_positions_history(address);
CREATE INDEX IF NOT EXISTS idx_whale_hist_snapshot ON whale_positions_history(snapshot_at);

CREATE TABLE IF NOT EXISTS whale_fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tid text UNIQUE NOT NULL,
  address text NOT NULL REFERENCES whale_wallets(address) ON DELETE CASCADE,
  asset text NOT NULL,
  direction text CHECK (direction IN ('LONG','SHORT')),
  price numeric,
  size numeric,
  notional_usd numeric,
  closed_pnl numeric,
  action_type text,
  filled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whale_fills_address ON whale_fills(address);
CREATE INDEX IF NOT EXISTS idx_whale_fills_filled_at ON whale_fills(filled_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_fills_asset_filled ON whale_fills(asset, filled_at DESC);

CREATE TABLE IF NOT EXISTS whale_pnl_daily (
  address text NOT NULL REFERENCES whale_wallets(address) ON DELETE CASCADE,
  date date NOT NULL,
  cumulative_pnl numeric,
  daily_pnl numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (address, date)
);

CREATE TABLE IF NOT EXISTS whale_consensus (
  asset text PRIMARY KEY,
  long_count integer NOT NULL DEFAULT 0,
  short_count integer NOT NULL DEFAULT 0,
  net_long_notional_usd numeric,
  avg_long_leverage numeric,
  avg_short_leverage numeric,
  dominant_side text CHECK (dominant_side IN ('LONG','SHORT','NEUTRAL')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whale_churn_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  event text NOT NULL CHECK (event IN ('ENTERED','EXITED')),
  rank_before integer,
  rank_after integer,
  happened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===================== RLS enablement (matches production posture) =====================
-- RLS policies themselves are defined in 003_rls_policies.sql and should be extended there
-- if additional tables need tailored policies. For snapshotted tables we only ENABLE RLS
-- if not already enabled, so existing policies keep working.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','videos','platform_config','email_drip_queue','discord_drip_queue',
    'trading_data','leads','feedback','rate_limits',
    'whale_wallets','whale_positions','whale_positions_history','whale_fills',
    'whale_pnl_daily','whale_consensus','whale_churn_log'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
