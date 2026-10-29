-- Manual merchant handoff to Packeta. Does not submit a shipment to Packeta API.
CREATE TABLE order_shipments (
  order_id TEXT PRIMARY KEY REFERENCES customer_orders(id) ON DELETE RESTRICT,
  carrier TEXT NOT NULL CHECK(carrier='packeta'),
  external_tracking_code TEXT NOT NULL CHECK(length(external_tracking_code) BETWEEN 4 AND 80),
  weight_grams INTEGER NOT NULL CHECK(weight_grams BETWEEN 1 AND 30000),
  dispatch_note TEXT NOT NULL DEFAULT '',
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  handed_over_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX order_shipments_handed_over_idx ON order_shipments(handed_over_at);
