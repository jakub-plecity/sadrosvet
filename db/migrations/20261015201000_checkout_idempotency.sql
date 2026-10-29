-- Store a request fingerprint to reject reuse of an idempotency key with changed customer/order details.
ALTER TABLE customer_orders ADD COLUMN request_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS customer_orders_request_hash_idx ON customer_orders(id,request_hash);
