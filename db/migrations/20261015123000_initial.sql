CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  image TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('active','draft','archived')),
  sample INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE photos (
  id TEXT PRIMARY KEY, image TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  content_type TEXT, created_at TEXT NOT NULL
);
CREATE TABLE demo_orders (
  id TEXT PRIMARY KEY, items TEXT NOT NULL, total_minor INTEGER NOT NULL,
  shipping TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX demo_orders_created_at ON demo_orders(created_at);
CREATE TABLE admin_login_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL);
CREATE TABLE contact_rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL);
CREATE TABLE email_test_limits (id TEXT PRIMARY KEY, next_send BIGINT NOT NULL);
