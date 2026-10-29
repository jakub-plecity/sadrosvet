-- Foundations only: the public checkout still writes demo_orders.
-- Never store payment card data in these tables.
CREATE TABLE customer_orders (
  id TEXT PRIMARY KEY,
  order_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','confirmed','processing','shipped','ready_for_pickup','completed','cancelled')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod','cash')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded')),
  service TEXT NOT NULL CHECK (service IN (
    'personal-pickup','balikovna-point','balikovna-address',
    'packeta-point','packeta-address')),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  pickup_point JSONB,
  customer_note TEXT NOT NULL DEFAULT '',
  subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
  shipping_minor INTEGER NOT NULL CHECK (shipping_minor >= 0),
  cod_minor INTEGER NOT NULL CHECK (cod_minor >= 0),
  total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'CZK' CHECK (currency='CZK'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (total_minor = subtotal_minor + shipping_minor + cod_minor),
  CHECK (
    (service='personal-pickup' AND payment_method='cash' AND shipping_address IS NULL AND pickup_point IS NULL)
    OR
    (service<>'personal-pickup' AND payment_method='cod'
      AND (service LIKE '%-address' OR pickup_point IS NOT NULL))
  )
);
CREATE INDEX customer_orders_created_at_idx ON customer_orders(created_at DESC);
CREATE INDEX customer_orders_status_idx ON customer_orders(status);

CREATE TABLE customer_order_items (
  order_id TEXT NOT NULL REFERENCES customer_orders(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  PRIMARY KEY(order_id,product_id)
);

-- Worker will deliver each email once when actual checkout is implemented.
-- No outgoing mail is triggered by this migration.
CREATE TABLE order_email_outbox (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES customer_orders(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('placed','cancelled','shipped','ready_for_pickup')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  retry_after TIMESTAMPTZ,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id,event_type,recipient)
);
CREATE INDEX order_email_outbox_pending_idx ON order_email_outbox(status,retry_after);
