-- Invite links for Patreon migration & future invites
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  plan_duration TEXT NOT NULL CHECK (plan_duration IN ('30_days', '90_days', '365_days')),
  subscription_days INTEGER NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track which users used which invite
CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES invite_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

-- RLS
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage invite_links (admin operations)
-- No user-facing policies needed — all access is via service role client

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
