CREATE TABLE public.shop_subscriptions (
  shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'expired', 'cancelled')),
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  current_period_started_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TZS',
  grace_ends_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'azampay',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'azampay',
  payment_channel TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'TZS',
  billing_period_months INTEGER NOT NULL DEFAULT 1 CHECK (billing_period_months > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'expired')),
  external_id TEXT NOT NULL UNIQUE,
  provider_reference TEXT,
  utility_reference TEXT,
  transaction_reference TEXT,
  message TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  callback_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_for_period_start TIMESTAMPTZ,
  paid_for_period_end TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX subscription_payments_shop_id_idx ON public.subscription_payments(shop_id);
CREATE INDEX subscription_payments_status_idx ON public.subscription_payments(status);
CREATE INDEX subscription_payments_created_at_idx ON public.subscription_payments(created_at DESC);

ALTER TABLE public.shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_subscriptions_select"
ON public.shop_subscriptions
FOR SELECT TO authenticated
USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE POLICY "shop_subscriptions_update_owner_manager"
ON public.shop_subscriptions
FOR UPDATE TO authenticated
USING (
  shop_id = public.get_user_shop_id(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.shop_id = shop_subscriptions.shop_id
      AND ur.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  shop_id = public.get_user_shop_id(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.shop_id = shop_subscriptions.shop_id
      AND ur.role IN ('owner', 'manager')
  )
);

CREATE POLICY "subscription_payments_select"
ON public.subscription_payments
FOR SELECT TO authenticated
USING (shop_id = public.get_user_shop_id(auth.uid()));

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
  ELSIF subscription_row.status = 'trialing' AND subscription_row.trial_ends_at > now() THEN
    next_status := 'trialing';
  ELSIF subscription_row.grace_ends_at IS NOT NULL AND subscription_row.grace_ends_at > now() THEN
    next_status := 'past_due';
  ELSIF subscription_row.status <> 'cancelled' THEN
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

CREATE OR REPLACE FUNCTION public.ensure_shop_subscription(target_shop_id UUID)
RETURNS public.shop_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_row public.shop_subscriptions;
BEGIN
  INSERT INTO public.shop_subscriptions (shop_id, monthly_price, currency)
  VALUES (target_shop_id, 0, 'TZS')
  ON CONFLICT (shop_id) DO NOTHING;

  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  RETURN subscription_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_shop_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_shop_subscription(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_subscription_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_shop_id UUID := public.get_user_shop_id(auth.uid());
  subscription_row public.shop_subscriptions;
  period_end TIMESTAMPTZ;
  days_left INTEGER;
  reminder_key TEXT;
  title_text TEXT;
  message_text TEXT;
BEGIN
  IF current_shop_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no-shop');
  END IF;

  PERFORM public.ensure_shop_subscription(current_shop_id);
  subscription_row := public.refresh_shop_subscription_state(current_shop_id);

  IF subscription_row IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no-subscription');
  END IF;

  IF subscription_row.status = 'trialing' THEN
    period_end := subscription_row.trial_ends_at;
  ELSE
    period_end := subscription_row.current_period_ends_at;
  END IF;

  IF period_end IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'status', subscription_row.status);
  END IF;

  days_left := CEIL(EXTRACT(EPOCH FROM (period_end - now())) / 86400.0);

  IF subscription_row.status IN ('trialing', 'active', 'past_due') AND days_left <= 7 THEN
    IF days_left <= 0 THEN
      reminder_key := 'subscription-expired';
      title_text := 'Subscription expired';
      message_text := 'Your subscription has ended. Renew now to continue using Smart Money.';
    ELSIF days_left = 1 THEN
      reminder_key := 'subscription-reminder-1';
      title_text := 'Subscription ends tomorrow';
      message_text := 'Your access ends tomorrow. Renew now to keep your team working without interruption.';
    ELSIF days_left <= 3 THEN
      reminder_key := 'subscription-reminder-3';
      title_text := 'Subscription ending soon';
      message_text := 'Only a few days remain on your Smart Money subscription. Renew early to avoid disruption.';
    ELSE
      reminder_key := 'subscription-reminder-7';
      title_text := 'Subscription reminder';
      message_text := 'Your Smart Money plan is nearing the end of this period. Prepare your renewal now.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications
      WHERE shop_id = current_shop_id
        AND type = reminder_key
        AND created_at >= COALESCE(subscription_row.current_period_started_at, subscription_row.trial_started_at)
    ) THEN
      INSERT INTO public.notifications (shop_id, title, message, type)
      VALUES (current_shop_id, title_text, message_text, reminder_key);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', subscription_row.status,
    'days_left', days_left,
    'period_end', period_end
  );
END;
$$;

INSERT INTO public.shop_subscriptions (shop_id, monthly_price, currency)
SELECT id, 0, 'TZS'
FROM public.shops
ON CONFLICT (shop_id) DO NOTHING;

SELECT public.refresh_shop_subscription_state(shop_id)
FROM public.shop_subscriptions;

CREATE TRIGGER tr_shop_subscriptions
BEFORE UPDATE ON public.shop_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER tr_subscription_payments
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_shops_create_subscription ON public.shops;
CREATE TRIGGER tr_shops_create_subscription
AFTER INSERT ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.handle_new_shop_subscription();
