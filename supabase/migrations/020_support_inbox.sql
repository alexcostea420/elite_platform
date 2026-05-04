-- Phase 4: Support Inbox unificat.
--
-- Extends the existing feedback table with admin status fields so we can
-- triage submissions in one queue: open / responded / archived. Plus
-- responded_at + admin_notes for context.

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'responded', 'archived')),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback(status, created_at DESC);
