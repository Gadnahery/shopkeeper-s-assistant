-- Migration 039: Automatic 14-Day Free Trial for New Users & Pending Accounts
-- Ensures every newly registered shop immediately starts with an active 14-day free trial.
-- Eliminates the locked subscription banner for new users and backfills pending shops.

-- 1. Update default values on shop_subscriptions table
ALTER TABLE public.shop_subscriptions
  ALTER COLUMN status SET DEFAULT 'trialing',
  ALTER COLUMN monthly_price SET DEFAULT 25000,
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');

-- 2. Update ensure_shop_subscription to automatically provision 14-day free trial on creation
DROP FUNCTION IF EXISTS public.ensure_shop_subscription(UUID);

CREATE OR REPLACE FUNCTION public.ensure_shop_subscription(target_shop_id UUID)
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.shop_subscriptions;
  v_current_month TEXT;
BEGIN
  IF target_shop_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_current_month := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');

  -- Insert new subscription row defaulting to active 14-day free trial
  INSERT INTO public.shop_subscriptions (
    shop_id,
    status,
    monthly_price,
    currency,
    trial_started_at,
    trial_ends_at,
    last_free_trial_granted_at,
    free_trial_month
  )
  VALUES (
    target_shop_id,
    'trialing',
    25000,
    'TZS',
    now(),
    now() + interval '14 days',
    now(),
    v_current_month
  )
  ON CONFLICT (shop_id) DO NOTHING;

  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  -- If the shop row was stuck in 'pending' or has no active trial, activate 14-day free trial immediately
  IF subscription_row.status = 'pending' 
     OR (
       subscription_row.status IN ('expired', 'past_due') 
       AND (subscription_row.current_period_ends_at IS NULL OR subscription_row.current_period_ends_at <= now())
       AND (subscription_row.free_trial_month IS NULL OR subscription_row.free_trial_month <> v_current_month)
     ) THEN
    UPDATE public.shop_subscriptions
    SET status = 'trialing',
        trial_started_at = now(),
        trial_ends_at = now() + interval '14 days',
        last_free_trial_granted_at = now(),
        free_trial_month = v_current_month,
        updated_at = now()
    WHERE shop_id = target_shop_id
    RETURNING * INTO subscription_row;
  END IF;

  RETURN subscription_row;
END;
$$;

-- 3. Update refresh_shop_subscription_state to recognize and maintain trialing state
DROP FUNCTION IF EXISTS public.refresh_shop_subscription_state(UUID);

CREATE OR REPLACE FUNCTION public.refresh_shop_subscription_state(
  target_shop_id UUID DEFAULT public.get_user_shop_id(auth.uid())
)
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.shop_subscriptions;
  next_status TEXT;
  v_current_month TEXT;
BEGIN
  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  IF NOT FOUND THEN
    -- Try to ensure subscription exists with 14-day free trial
    RETURN public.ensure_shop_subscription(target_shop_id);
  END IF;

  v_current_month := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
  next_status := subscription_row.status;

  -- 1. Active paid period always takes precedence
  IF subscription_row.current_period_ends_at IS NOT NULL AND subscription_row.current_period_ends_at > now() THEN
    next_status := 'active';
  -- 2. Non-expired free trial
  ELSIF (subscription_row.status = 'trialing' OR subscription_row.trial_ends_at > now()) AND subscription_row.trial_ends_at IS NOT NULL AND subscription_row.trial_ends_at > now() THEN
    next_status := 'trialing';
  -- 3. Transition grace window
  ELSIF subscription_row.grace_ends_at IS NOT NULL AND subscription_row.grace_ends_at > now() THEN
    next_status := 'past_due';
  -- 4. If pending or newly registered, grant the 14-day free trial
  ELSIF subscription_row.status = 'pending' THEN
    next_status := 'trialing';
    UPDATE public.shop_subscriptions
    SET status = 'trialing',
        trial_started_at = now(),
        trial_ends_at = now() + interval '14 days',
        last_free_trial_granted_at = now(),
        free_trial_month = v_current_month,
        updated_at = now()
    WHERE shop_id = target_shop_id
    RETURNING * INTO subscription_row;
    RETURN subscription_row;
  -- 5. Otherwise expired
  ELSIF subscription_row.status NOT IN ('cancelled') THEN
    next_status := 'expired';
  END IF;

  IF next_status IS DISTINCT FROM subscription_row.status THEN
    UPDATE public.shop_subscriptions
    SET status = next_status,
        updated_at = now()
    WHERE shop_id = target_shop_id
    RETURNING * INTO subscription_row;
  END IF;

  RETURN subscription_row;
END;
$$;

-- 4. Backfill all existing pending or unactivated shops with the 14-day free trial immediately and normalize monthly price to 25,000
UPDATE public.shop_subscriptions
SET status = 'trialing',
    trial_started_at = now(),
    trial_ends_at = now() + interval '14 days',
    last_free_trial_granted_at = now(),
    free_trial_month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'),
    monthly_price = 25000,
    updated_at = now()
WHERE status = 'pending' 
   OR trial_ends_at IS NULL
   OR (status IN ('expired', 'past_due') AND (current_period_ends_at IS NULL OR current_period_ends_at <= now()));

UPDATE public.shop_subscriptions
SET monthly_price = 25000
WHERE monthly_price = 10000 OR monthly_price IS NULL;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_shop_subscription(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.refresh_shop_subscription_state(UUID) TO authenticated, service_role, anon;
