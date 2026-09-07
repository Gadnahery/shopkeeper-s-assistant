-- Migration 027: Platform admin infrastructure
-- Creates the platform_admins table, helper functions, and cross-shop RLS policies.
-- IMPORTANT: Run this AFTER the account hurusana7@gmail.com has signed up in the app.

-- ─── 1. Platform admins table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the first admin by email (idempotent).
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'hurusana7@gmail.com'
ON CONFLICT DO NOTHING;

-- ─── 2. Helper: is_platform_admin ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = uid
  );
$$;

-- ─── 3. Helper: has_active_subscription ───────────────────────────────────────
-- Returns TRUE when the shop is in trial or active (with a valid period end or no
-- period required for trialing), or within the grace window.
CREATE OR REPLACE FUNCTION public.has_active_subscription(target_shop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shop_subscriptions s
    WHERE s.shop_id = target_shop_id
      AND (
        -- Trialing with time remaining
        (s.status = 'trialing' AND s.trial_ends_at > now())
        -- Paid period still valid
        OR (s.status = 'active' AND (s.current_period_ends_at IS NULL OR s.current_period_ends_at > now()))
        -- Within grace period
        OR (s.status = 'past_due' AND s.grace_ends_at IS NOT NULL AND s.grace_ends_at > now())
      )
  );
$$;

-- ─── 4. RLS — platform_admins (select only, no UI writes) ─────────────────────
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admins_select_self"
ON public.platform_admins
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- ─── 5. New RLS policies on shop_subscriptions for platform admins ─────────────
-- Admins get full SELECT across all shops.
CREATE POLICY "shop_subscriptions_platform_admin_select"
ON public.shop_subscriptions
FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Admins can UPDATE any shop's subscription (approve flow).
CREATE POLICY "shop_subscriptions_platform_admin_update"
ON public.shop_subscriptions
FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- ─── 6. New RLS policies on subscription_payments for platform admins ──────────
-- Admins can SELECT all payments across all shops.
CREATE POLICY "subscription_payments_platform_admin_select"
ON public.subscription_payments
FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()));

-- Admins can UPDATE any payment (approve/reject flow).
CREATE POLICY "subscription_payments_platform_admin_update"
ON public.subscription_payments
FOR UPDATE TO authenticated
USING (public.is_platform_admin(auth.uid()))
WITH CHECK (public.is_platform_admin(auth.uid()));

-- Shop users can INSERT their own payments.
CREATE POLICY "subscription_payments_insert_own"
ON public.subscription_payments
FOR INSERT TO authenticated
WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
