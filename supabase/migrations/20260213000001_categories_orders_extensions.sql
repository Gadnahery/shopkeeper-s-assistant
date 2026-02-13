-- Product Categories: Add description column
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

-- Sales: Add customer_name (optional), status for drafts
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Draft sales: status can be 'draft' | 'completed'
-- (sales already has status column)

-- Orders module
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
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

-- RLS for new tables
CREATE POLICY "ord_s" ON public.orders FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_i" ON public.orders FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_u" ON public.orders FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_d" ON public.orders FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE POLICY "oi_s" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_i" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_u" ON public.order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_d" ON public.order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));

CREATE POLICY "on_s" ON public.order_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "on_i" ON public.order_notes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));

CREATE POLICY "not_s" ON public.notifications FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_i" ON public.notifications FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_u" ON public.notifications FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shop_id ON public.notifications(shop_id);

-- Trigger for orders updated_at
CREATE TRIGGER tr_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Categories CRUD - add update/delete policies (if not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_u' AND tablename = 'categories') THEN
    CREATE POLICY "cat_u" ON public.categories FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cat_d' AND tablename = 'categories') THEN
    CREATE POLICY "cat_d" ON public.categories FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
END $$;
