-- Migration 033: Retire free trial, enforce pay-to-activate, and grant 14-day grace period to existing shops

-- 1. Modify shop_subscriptions schema: remove trial defaults, set status default to pending
ALTER TABLE public.shop_subscriptions
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN trial_ends_at DROP NOT NULL,
  ALTER COLUMN trial_ends_at DROP DEFAULT;

-- 2. Update status check constraint
ALTER TABLE public.shop_subscriptions
  DROP CONSTRAINT IF EXISTS shop_subscriptions_status_check;

ALTER TABLE public.shop_subscriptions
  ADD CONSTRAINT shop_subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'past_due', 'expired', 'cancelled', 'trialing'));

-- 3. Update has_active_subscription() to drop trialing condition
CREATE OR REPLACE FUNCTION public.has_active_subscription(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shop_subscriptions s
    WHERE s.shop_id = target_shop_id
      AND s.status = 'active'
      AND (s.current_period_ends_at IS NULL OR s.current_period_ends_at > now())
  );
$$;

-- 4. Update ensure_shop_subscription() to default to pending and TZS 25,000 without trial
CREATE OR REPLACE FUNCTION public.ensure_shop_subscription(target_shop_id UUID)
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.shop_subscriptions;
BEGIN
  INSERT INTO public.shop_subscriptions (shop_id, status, monthly_price, currency, trial_started_at, trial_ends_at)
  VALUES (target_shop_id, 'pending', 25000, 'TZS', NULL, NULL)
  ON CONFLICT (shop_id) DO NOTHING;

  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  RETURN subscription_row;
END;
$$;

-- 5. Transition for existing shops: 14-day grace window
-- Shops with no subscription row at all yet receive an active 14-day transition period
INSERT INTO public.shop_subscriptions (shop_id, status, current_period_started_at, current_period_ends_at, monthly_price)
SELECT s.id, 'active', now(), now() + interval '14 days', 25000
FROM public.shops s
LEFT JOIN public.shop_subscriptions sub ON sub.shop_id = s.id
WHERE sub.shop_id IS NULL
ON CONFLICT (shop_id) DO NOTHING;

-- Existing trialing rows transition to active with 14-day grace window
UPDATE public.shop_subscriptions
SET status = 'active',
    current_period_started_at = now(),
    current_period_ends_at = now() + interval '14 days',
    monthly_price = 25000
WHERE status = 'trialing';
