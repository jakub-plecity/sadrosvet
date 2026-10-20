ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER;
UPDATE products SET sort_order = ranked.rn FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC, id) - 1 AS rn FROM products) ranked WHERE ranked.id = products.id AND products.sort_order IS NULL;
ALTER TABLE products ALTER COLUMN sort_order SET DEFAULT 0;
