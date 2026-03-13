CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_shop_id_idx ON public.push_subscriptions(shop_id);
CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select"
ON public.push_subscriptions
FOR SELECT TO authenticated
USING (user_id = auth.uid() AND shop_id = public.get_user_shop_id(auth.uid()));

CREATE POLICY "push_subscriptions_insert"
ON public.push_subscriptions
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND shop_id = public.get_user_shop_id(auth.uid()));

CREATE POLICY "push_subscriptions_update"
ON public.push_subscriptions
FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND shop_id = public.get_user_shop_id(auth.uid()))
WITH CHECK (user_id = auth.uid() AND shop_id = public.get_user_shop_id(auth.uid()));

CREATE POLICY "push_subscriptions_delete"
ON public.push_subscriptions
FOR DELETE TO authenticated
USING (user_id = auth.uid() AND shop_id = public.get_user_shop_id(auth.uid()));

CREATE TRIGGER tr_push_subscriptions
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
