ALTER TABLE customer_order_items ADD COLUMN IF NOT EXISTS weight_grams INTEGER CHECK (weight_grams > 0);

CREATE TABLE IF NOT EXISTS packeta_auto_jobs (
 order_id TEXT PRIMARY KEY REFERENCES customer_orders(id) ON DELETE RESTRICT,
 state TEXT NOT NULL CHECK (state IN ('queued','creating','created','review','manual')),
 parcels JSONB NOT NULL,
 next_parcel INTEGER NOT NULL DEFAULT 0 CHECK (next_parcel >= 0),
 reason TEXT,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE packeta_auto_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS packeta_auto_jobs_queue_idx ON packeta_auto_jobs(updated_at) WHERE state IN ('queued','creating');
