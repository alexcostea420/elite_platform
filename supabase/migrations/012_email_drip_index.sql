-- Add partial index on email_drip_queue for cron polling.
-- Before: cron-send-emails (every 5min) seq-scans 89 rows, 6500+ scans observed.
-- After: index-only lookup on (status='pending', scheduled_at) — IO saved on every cron tick.

CREATE INDEX IF NOT EXISTS idx_email_drip_queue_pending
  ON public.email_drip_queue (scheduled_at)
  WHERE status = 'pending';
