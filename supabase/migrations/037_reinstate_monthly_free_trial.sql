-- Migration 037: Reinstate Monthly 14-Day Free Trial
-- Reinstates automatic 14-day free trials once per calendar month per shop
-- Layered on top of the pay-to-activate subscription model from Migration 033

-- 1. Add tracking columns for monthly free trial usage
ALTER TABLE public.shop_subscriptions
  ADD COLUMN IF NOT EXISTS last_free_trial_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_trial_month TEXT;

-- 2. Ensure status check constraint includes 'trialing'
ALTER TABLE public.shop_subscriptions
  DROP CONSTRAINT IF EXISTS shop_subscriptions_status_check;

ALTER TABLE public.shop_subscriptions
  ADD CONSTRAINT shop_subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'past_due', 'expired', 'cancelled', 'trialing'));

-- 3. Function to grant monthly 14-day free trial to a single shop (idempotent per calendar month)
CREATE OR REPLACE FUNCTION public.grant_monthly_free_trial(target_shop_id UUID)
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.shop_subscriptions;
  v_current_month TEXT;
  v_last_month TEXT;
BEGIN
  IF target_shop_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Ensure row exists
  v_sub := public.ensure_shop_subscription(target_shop_id);

  -- Current calendar month in UTC format YYYY-MM
  v_current_month := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');

  -- Month of last granted free trial
  IF v_sub.last_free_trial_granted_at IS NOT NULL THEN
    v_last_month := to_char(v_sub.last_free_trial_granted_at AT TIME ZONE 'UTC', 'YYYY-MM');
  ELSE
    v_last_month := NULL;
  END IF;

  -- Condition A: Shop currently has a valid active paid subscription
  IF v_sub.status = 'active' AND (v_sub.current_period_ends_at IS NULL OR v_sub.current_period_ends_at > now()) THEN
    RETURN v_sub;
  END IF;

  -- Condition B: Shop currently has a running, non-expired trial
  IF v_sub.status = 'trialing' AND v_sub.trial_ends_at IS NOT NULL AND v_sub.trial_ends_at > now() THEN
    RETURN v_sub;
  END IF;

  -- Condition C: Shop has already received a free trial in this calendar month
  IF v_last_month IS NOT NULL AND v_last_month = v_current_month THEN
    RETURN v_sub;
  END IF;

  -- Grant 14-day free trial
  UPDATE public.shop_subscriptions
  SET
    status = 'trialing',
    trial_started_at = now(),
    trial_ends_at = now() + interval '14 days',
    last_free_trial_granted_at = now(),
    free_trial_month = v_current_month,
    updated_at = now()
  WHERE shop_id = target_shop_id
  RETURNING * INTO v_sub;

  -- Record in audit log
  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    target_shop_id,
    auth.uid(),
    'monthly_free_trial_granted',
    'shop_subscriptions',
    target_shop_id,
    jsonb_build_object(
      'trial_started_at', v_sub.trial_started_at,
      'trial_ends_at', v_sub.trial_ends_at,
      'month', v_current_month,
      'duration_days', 14
    )
  );

  RETURN v_sub;
END;
$$;

-- 4. Function to grant monthly free trials in bulk to all eligible shops (for daily cron)
CREATE OR REPLACE FUNCTION public.grant_monthly_free_trials_bulk()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_record RECORD;
  v_granted_count integer := 0;
  v_current_month TEXT;
BEGIN
  v_current_month := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');

  FOR v_shop_record IN
    SELECT s.id AS shop_id
    FROM public.shops s
    LEFT JOIN public.shop_subscriptions sub ON sub.shop_id = s.id
    WHERE
      sub.shop_id IS NULL
      OR (
        (sub.status NOT IN ('active') OR sub.current_period_ends_at <= now())
        AND (sub.status NOT IN ('trialing') OR sub.trial_ends_at <= now())
        AND (
          sub.last_free_trial_granted_at IS NULL
          OR to_char(sub.last_free_trial_granted_at AT TIME ZONE 'UTC', 'YYYY-MM') <> v_current_month
        )
      )
  LOOP
    PERFORM public.grant_monthly_free_trial(v_shop_record.shop_id);
    v_granted_count := v_granted_count + 1;
  END LOOP;

  RETURN v_granted_count;
END;
$$;

-- 5. Update has_active_subscription() to recognize active paid AND active trialing status
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
      AND (
        (s.status = 'active' AND (s.current_period_ends_at IS NULL OR s.current_period_ends_at > now()))
        OR
        (s.status = 'trialing' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at > now())
      )
  );
$$;

-- 6. Update refresh_shop_subscription_state() to handle trialing expiration
CREATE OR REPLACE FUNCTION public.refresh_shop_subscription_state(target_shop_id UUID DEFAULT public.get_user_shop_id(auth.uid()))
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.shop_subscriptions;
  next_status TEXT;
BEGIN
  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  next_status := subscription_row.status;

  IF subscription_row.current_period_ends_at IS NOT NULL AND subscription_row.current_period_ends_at > now() THEN
    next_status := 'active';
  ELSIF subscription_row.status = 'trialing' AND subscription_row.trial_ends_at IS NOT NULL AND subscription_row.trial_ends_at > now() THEN
    next_status := 'trialing';
  ELSIF subscription_row.grace_ends_at IS NOT NULL AND subscription_row.grace_ends_at > now() THEN
    next_status := 'past_due';
  ELSIF subscription_row.status NOT IN ('cancelled', 'pending') THEN
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

-- 7. Grant execution permissions
GRANT EXECUTE ON FUNCTION public.grant_monthly_free_trial(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_monthly_free_trials_bulk() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.refresh_shop_subscription_state(UUID) TO authenticated, service_role;
