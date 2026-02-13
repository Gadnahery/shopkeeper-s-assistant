-- ============================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR (e.g. in Lovable)
-- Fixes: categories "description" column + creates "orders" table
-- ============================================================

-- 1. Categories: add description column
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Orders module (skip if tables already exist)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS (drop first if re-running to avoid duplicate policy errors)
DO $$ BEGIN
  DROP POLICY IF EXISTS "ord_s" ON public.orders;
  DROP POLICY IF EXISTS "ord_i" ON public.orders;
  DROP POLICY IF EXISTS "ord_u" ON public.orders;
  DROP POLICY IF EXISTS "ord_d" ON public.orders;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "ord_s" ON public.orders FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_i" ON public.orders FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_u" ON public.orders FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_d" ON public.orders FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

DO $$ BEGIN
  DROP POLICY IF EXISTS "oi_s" ON public.order_items;
  DROP POLICY IF EXISTS "oi_i" ON public.order_items;
  DROP POLICY IF EXISTS "oi_u" ON public.order_items;
  DROP POLICY IF EXISTS "oi_d" ON public.order_items;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "oi_s" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_i" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_u" ON public.order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_d" ON public.order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));

DO $$ BEGIN
  DROP POLICY IF EXISTS "on_s" ON public.order_notes;
  DROP POLICY IF EXISTS "on_i" ON public.order_notes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "on_s" ON public.order_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "on_i" ON public.order_notes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));

DO $$ BEGIN
  DROP POLICY IF EXISTS "not_s" ON public.notifications;
  DROP POLICY IF EXISTS "not_i" ON public.notifications;
  DROP POLICY IF EXISTS "not_u" ON public.notifications;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "not_s" ON public.notifications FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_i" ON public.notifications FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_u" ON public.notifications FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON public.orders(due_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON public.notifications(shop_id);

-- Trigger for orders updated_at (function must exist from main migration)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
DROP TRIGGER IF EXISTS tr_orders ON public.orders;
CREATE TRIGGER tr_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add priority/due_date to orders if table already existed without them
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS due_date DATE;
