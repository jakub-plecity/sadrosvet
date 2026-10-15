CREATE TABLE packeta_api_operations (
 order_id TEXT PRIMARY KEY REFERENCES customer_orders(id) ON DELETE RESTRICT,
 state TEXT NOT NULL CHECK(state IN ('creating','created','review')),
 packet_id TEXT,
 barcode TEXT,
 error_code TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
