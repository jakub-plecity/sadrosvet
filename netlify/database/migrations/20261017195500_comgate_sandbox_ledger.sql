CREATE TABLE IF NOT EXISTS comgate_sandbox_transactions (
 trans_id TEXT PRIMARY KEY,
 ref_id TEXT NOT NULL UNIQUE,
 amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
 currency TEXT NOT NULL DEFAULT 'CZK' CHECK(currency='CZK'),
 status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','pending','paid','cancelled','error')),
 verified_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
