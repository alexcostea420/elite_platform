-- Whale favorites: members can star whale wallets they want to track.
--
-- Composite PK on (user_id, address) prevents duplicates. RLS scopes every
-- operation to the row owner — admin override goes through service role.

CREATE TABLE IF NOT EXISTS whale_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, address)
);

CREATE INDEX IF NOT EXISTS idx_whale_favorites_user ON whale_favorites(user_id);

ALTER TABLE whale_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whale_favorites_select_own" ON whale_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "whale_favorites_insert_own" ON whale_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whale_favorites_delete_own" ON whale_favorites
  FOR DELETE USING (auth.uid() = user_id);
