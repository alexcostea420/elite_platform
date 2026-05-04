-- Phase 2.3: server-side video view tracking.
--
-- One row per (user, video). first/last viewed timestamps + a counter we
-- bump every time the player opens with that video selected. Lets admin
-- see most-watched content + per-member engagement.

CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT video_views_user_video_unique UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_last_viewed ON video_views(last_viewed_at DESC);

ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;

-- Members can read their own rows; admin reads everything.
CREATE POLICY "Users read own video_views" ON video_views
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all video_views" ON video_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- No INSERT/UPDATE/DELETE policies: writes happen via service role only
-- (the /api/videos/track route). Service role bypasses RLS by design.
