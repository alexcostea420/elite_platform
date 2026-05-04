-- Email analytics: capture Resend message_id at send time, then update
-- delivered/opened/clicked/bounced/complained timestamps via a Resend webhook.
--
-- Why: today we know we sent the email but not whether the user ever saw
-- it. Open and click rates are the cheapest signal we have for whether a
-- drip template is doing its job. message_id is the join key Resend gives
-- us back from POST /emails — without it we can't reconcile webhook events.

ALTER TABLE email_drip_queue
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_drip_message_id ON email_drip_queue(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_drip_template_sent_at ON email_drip_queue(template, sent_at DESC) WHERE sent_at IS NOT NULL;
