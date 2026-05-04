-- Admin audit log: persistent record of every admin mutation.
--
-- Why: at solo-founder scale Alex still forgets what he changed last week
-- ("did I refund Yanko or did I just promise to?"); audit closes that loop
-- and is foundational for refund tracking + future role-delegation.
--
-- What gets logged: any admin server action / API route that mutates
-- a user-facing record (profile tier, payment refund, invite revoke, video
-- publish, role grant). The wrapping is done in lib/admin/audit.ts so a
-- stray new endpoint that forgets to log is the only failure mode.
--
-- RLS: service_role-only writes (admin endpoints); admin-only reads via
-- profiles.role check. Members never see this table.

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable + ON DELETE SET NULL preserves the audit trail even if the
  -- admin's auth.users row is later deleted. We log the original UUID
  -- redundantly inside before_jsonb/after_jsonb if we ever need to recover it.
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  before_jsonb JSONB,
  after_jsonb JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin_time ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action_time ON admin_audit_log(action_type, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Reads: any user with role='admin' in profiles. Writes: service role only
-- (no insert policy → service_role bypasses RLS, regular users get rejected).
CREATE POLICY "audit_log_admin_read" ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT SELECT ON admin_audit_log TO authenticated;
GRANT INSERT, SELECT ON admin_audit_log TO service_role;
