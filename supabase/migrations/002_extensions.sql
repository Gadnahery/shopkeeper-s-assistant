-- ============================================================
-- SMART MONEY POS - EXTENSIONS & ENHANCEMENTS
-- Run this SECOND in your new Supabase project SQL Editor
-- ============================================================

-- 1. Product enhancements
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS reorder_quantity INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_restock_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sold_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

UPDATE public.products SET sku = CONCAT('SKU-', UPPER(SUBSTRING(code, 1, 3)), '-', id::text) WHERE sku IS NULL;

-- 2. Product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  attributes JSONB NOT NULL,
  buying_price NUMERIC(10,2),
  selling_price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_variant_attributes UNIQUE(product_id, attributes)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_s" ON public.product_variants FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "pv_i" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "pv_u" ON public.product_variants FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "pv_d" ON public.product_variants FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- 3. Stock movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'transfer', 'damage', 'loss', 'initial')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT sm_product_or_variant CHECK ((product_id IS NOT NULL AND variant_id IS NULL) OR (product_id IS NULL AND variant_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_shop ON public.stock_movements(shop_id);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_s" ON public.stock_movements FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sm_i" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));

-- 4. Sales enhancements
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  ADD COLUMN IF NOT EXISTS discount_reason TEXT,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS cash_received NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS change_given NUMERIC(10,2);
CREATE INDEX IF NOT EXISTS idx_sales_employee ON public.sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- 5. Sale items enhancements
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0;

-- 6. Sale payments (multi-payment)
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'M-Pesa', 'Bank Transfer', 'Gift Card', 'Credit')),
  amount NUMERIC(10,2) NOT NULL,
  reference_number TEXT,
  card_last_four TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT sp_positive_amount CHECK (amount > 0)
);
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_s" ON public.sale_payments FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sp_i" ON public.sale_payments FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));

-- 7. Purchase orders
CREATE SEQUENCE IF NOT EXISTS po_number_seq;
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('po_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  po_number TEXT UNIQUE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT po_valid_dates CHECK (expected_delivery_date IS NULL OR expected_delivery_date >= order_date)
);
DROP TRIGGER IF EXISTS set_po_number ON public.purchase_orders;
CREATE TRIGGER set_po_number BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_s" ON public.purchase_orders FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "po_all" ON public.purchase_orders FOR ALL TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT poi_product_or_variant CHECK ((product_id IS NOT NULL AND variant_id IS NULL) OR (product_id IS NULL AND variant_id IS NOT NULL)),
  CONSTRAINT poi_positive_qty CHECK (quantity_ordered > 0),
  CONSTRAINT poi_valid_received CHECK (quantity_received >= 0 AND quantity_received <= quantity_ordered)
);
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poi_s" ON public.purchase_order_items FOR SELECT TO authenticated USING (po_id IN (SELECT id FROM public.purchase_orders WHERE shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "poi_all" ON public.purchase_order_items FOR ALL TO authenticated USING (po_id IN (SELECT id FROM public.purchase_orders WHERE shop_id = public.get_user_shop_id(auth.uid())));

-- 8. Customer enhancements
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_order_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'adjust', 'expire')),
  points INTEGER NOT NULL,
  sale_id UUID REFERENCES public.sales(id),
  reason TEXT,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lt_s" ON public.loyalty_transactions FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- 9. Supplier enhancements
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN ('cod', 'net_30', 'net_60', 'net_90', 'advance')),
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchase_value NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS average_delivery_days INTEGER;

-- 10. Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('store', 'warehouse', 'kiosk')),
  address TEXT,
  city TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_location_code UNIQUE(shop_id, code)
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loc_s" ON public.locations FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "loc_all" ON public.locations FOR ALL TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE TABLE IF NOT EXISTS public.location_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  last_updated TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ls_product_or_variant CHECK ((product_id IS NOT NULL AND variant_id IS NULL) OR (product_id IS NULL AND variant_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ls_product ON public.location_stock(location_id, product_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ls_variant ON public.location_stock(location_id, variant_id) WHERE product_id IS NULL;
ALTER TABLE public.location_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ls_s" ON public.location_stock FOR SELECT TO authenticated USING (location_id IN (SELECT id FROM public.locations WHERE shop_id = public.get_user_shop_id(auth.uid())));

-- 11. Stock transfers
CREATE SEQUENCE IF NOT EXISTS stock_transfer_seq;
CREATE OR REPLACE FUNCTION public.generate_transfer_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.transfer_number IS NULL OR NEW.transfer_number = '' THEN
    NEW.transfer_number := 'TRF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('stock_transfer_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  transfer_number TEXT UNIQUE,
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  transfer_date DATE DEFAULT CURRENT_DATE,
  expected_arrival_date DATE,
  actual_arrival_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT st_different_locations CHECK (from_location_id != to_location_id)
);
DROP TRIGGER IF EXISTS set_transfer_number ON public.stock_transfers;
CREATE TRIGGER set_transfer_number BEFORE INSERT ON public.stock_transfers FOR EACH ROW EXECUTE FUNCTION public.generate_transfer_number();
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "st_s" ON public.stock_transfers FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "st_all" ON public.stock_transfers FOR ALL TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- 12. Expenses enhancements
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB,
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_tax_deductible BOOLEAN DEFAULT false;

-- 13. Shop settings enhancements
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS receipt_header TEXT,
  ADD COLUMN IF NOT EXISTS receipt_footer TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB,
  ADD COLUMN IF NOT EXISTS enable_loyalty BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points_per_currency INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS enable_low_stock_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_notification_emails TEXT[];

-- 14. Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "al_s" ON public.activity_log FOR SELECT TO authenticated
  USING (
    shop_id = public.get_user_shop_id(auth.uid())
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = activity_log.shop_id AND ur.role IN ('owner', 'manager'))
  );

-- 15. Discounts
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('all', 'category', 'product')),
  category_id UUID REFERENCES public.categories(id),
  product_id UUID REFERENCES public.products(id),
  min_purchase_amount NUMERIC(10,2),
  max_discount_amount NUMERIC(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT disc_valid_dates CHECK (end_date IS NULL OR end_date > start_date)
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disc_s" ON public.discounts FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "disc_all" ON public.discounts FOR ALL TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- 16. Todos assignment & user page access
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_by_user_id UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS public.user_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shop_id, page_path)
);
ALTER TABLE public.user_page_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upa_select" ON public.user_page_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_page_access.shop_id AND ur.role IN ('owner', 'manager'))));
CREATE POLICY "upa_insert" ON public.user_page_access FOR INSERT TO authenticated
  WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_page_access.shop_id AND ur.role IN ('owner', 'manager')));
CREATE POLICY "upa_update" ON public.user_page_access FOR UPDATE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_page_access.shop_id AND ur.role IN ('owner', 'manager')));
CREATE POLICY "upa_delete" ON public.user_page_access FOR DELETE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_page_access.shop_id AND ur.role IN ('owner', 'manager')));
