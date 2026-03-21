ALTER TABLE public.shop_subscriptions
ALTER COLUMN monthly_price SET DEFAULT 10000;

UPDATE public.shop_subscriptions
SET monthly_price = 10000,
    updated_at = now()
WHERE COALESCE(monthly_price, 0) <= 0;

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
  VALUES (target_shop_id, 10000, 'TZS')
  ON CONFLICT (shop_id) DO NOTHING;

  SELECT *
  INTO subscription_row
  FROM public.shop_subscriptions
  WHERE shop_id = target_shop_id;

  RETURN subscription_row;
END;
$$;

INSERT INTO public.shop_subscriptions (shop_id, monthly_price, currency)
SELECT id, 10000, 'TZS'
FROM public.shops
ON CONFLICT (shop_id) DO NOTHING;
