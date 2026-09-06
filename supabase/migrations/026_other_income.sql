-- Migration 026: Record non-sales income such as consulting, rent, grants, or other receipts.
CREATE TABLE IF NOT EXISTS public.other_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS other_income_shop_date_idx ON public.other_income (shop_id, date DESC);

ALTER TABLE public.other_income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "other_income_s" ON public.other_income;
DROP POLICY IF EXISTS "other_income_i" ON public.other_income;
DROP POLICY IF EXISTS "other_income_u" ON public.other_income;
DROP POLICY IF EXISTS "other_income_d" ON public.other_income;

CREATE POLICY "other_income_s" ON public.other_income FOR SELECT TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "other_income_i" ON public.other_income FOR INSERT TO authenticated
  WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "other_income_u" ON public.other_income FOR UPDATE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "other_income_d" ON public.other_income FOR DELETE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
