-- Foundation only. No API uses this table yet. Never store card data.
CREATE TABLE IF NOT EXISTS comgate_payments (
 id TEXT PRIMARY KEY,
 order_id TEXT NOT NULL REFERENCES customer_orders(id) ON DELETE RESTRICT,
 trans_id TEXT UNIQUE,
 state TEXT NOT NULL DEFAULT 'created' CHECK(state IN ('created','pending','paid','cancelled','error')),
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 currency TEXT NOT NULL DEFAULT 'CZK' CHECK(currency='CZK'),
 ref_id TEXT NOT NULL,
 test BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 verified_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS comgate_single_paid_idx ON comgate_payments(order_id) WHERE state='paid';
CREATE INDEX IF NOT EXISTS comgate_payment_order_idx ON comgate_payments(order_id);
CREATE TABLE IF NOT EXISTS comgate_payment_events (
 id TEXT PRIMARY KEY,
 payment_id TEXT NOT NULL REFERENCES comgate_payments(id) ON DELETE RESTRICT,
 reported_state TEXT NOT NULL,
 verified_state TEXT,
 accepted BOOLEAN NOT NULL DEFAULT FALSE,
 received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
