-- Allow Comgate as an explicitly separate online method, without weakening COD/cash constraints.
DO $$
DECLARE item RECORD;
BEGIN
 FOR item IN SELECT conname FROM pg_constraint
 WHERE conrelid='customer_orders'::regclass AND contype='c'
 AND pg_get_constraintdef(oid) LIKE '%payment_method%'
 LOOP EXECUTE format('ALTER TABLE customer_orders DROP CONSTRAINT %I',item.conname); END LOOP;
END $$;
ALTER TABLE customer_orders
 ADD CONSTRAINT customer_orders_payment_method_allowed CHECK(payment_method IN ('cod','cash','comgate')),
 ADD CONSTRAINT customer_orders_payment_shipping_valid CHECK(
 (service='personal-pickup' AND payment_method IN ('cash','comgate') AND shipping_address IS NULL AND pickup_point IS NULL)
 OR (service<>'personal-pickup' AND payment_method IN ('cod','comgate') AND
     (service LIKE '%-address' OR pickup_point IS NOT NULL))
 ),
 ADD CONSTRAINT customer_orders_comgate_no_cod_fee CHECK(payment_method<>'comgate' OR cod_minor=0);
-- Exactly one active attempt per order; do not launch duplicate payment transactions after transport failures.
CREATE UNIQUE INDEX IF NOT EXISTS comgate_payments_one_attempt_idx ON comgate_payments(order_id);
ALTER TABLE comgate_payments ADD COLUMN IF NOT EXISTS redirect_url TEXT;
