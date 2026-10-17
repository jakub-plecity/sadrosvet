-- Track automatic status polling without modifying the payment state.
ALTER TABLE comgate_payments ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS comgate_reconcile_due_idx
 ON comgate_payments(last_checked_at,created_at)
 WHERE state IN ('created','pending') AND trans_id IS NOT NULL;
