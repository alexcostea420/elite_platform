-- Refund tracking on payments.
--
-- Why: solo-founder reality — Alex sometimes refunds a payment manually
-- (USDT/USDC back to the user, or card chargeback) and needs the platform
-- to remember it. Without this, the same row keeps showing as "confirmed"
-- and gets double-counted in revenue, plus there's no audit trail.
--
-- Approach: extend the existing payments table with refund metadata and
-- expand the status check to allow 'refunded'. A refund does NOT delete
-- the original payment — we keep amount_received intact and add a
-- separate refunded_amount so partial refunds are representable later.
-- The audit_log entry (action_type='payment_refund') captures who/why.

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'confirmed', 'expired', 'failed', 'refunded'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_refunded_at ON payments(refunded_at DESC) WHERE refunded_at IS NOT NULL;
