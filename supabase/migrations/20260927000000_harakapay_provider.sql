-- HarakaPay provider support + net/gross/fee columns
-- Keep manual and azampay paths fully working in parallel.

ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_provider_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_provider_check
    CHECK (provider IN ('manual', 'azampay', 'harakapay'));

-- Net amount matters: HarakaPay takes a cut (2.9%–5.9%) before money lands.
-- `amount` = what the customer was charged (e.g. 25000)
-- `net_amount` = what actually lands in the HarakaPay wallet after their fee
ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC;

COMMENT ON COLUMN public.subscription_payments.gross_amount IS 'Amount charged to customer before provider fees';
COMMENT ON COLUMN public.subscription_payments.fee_amount IS 'Provider fee deducted (HarakaPay/AzamPay)';
COMMENT ON COLUMN public.subscription_payments.net_amount IS 'Amount received after provider fees';
