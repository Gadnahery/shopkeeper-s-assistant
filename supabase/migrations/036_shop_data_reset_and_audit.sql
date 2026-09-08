-- Migration 036: Shop Data Reset Engine and Audit Trail
-- Allows shop owners to transactionally wipe specific modules or all business data
-- Preserves shop record, user roles, accounts, settings, and subscriptions.

-- 1. Create audit table data_reset_log
CREATE TABLE IF NOT EXISTS public.data_reset_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  reset_type TEXT NOT NULL, -- 'module' | 'all'
  module_name TEXT,        -- 'sales' | 'inventory' | 'purchases' | 'production' | 'customers' | 'expenses' | 'suppliers' | 'orders' | 'ALL'
  row_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_reset_log_shop_id_idx ON public.data_reset_log(shop_id);
CREATE INDEX IF NOT EXISTS data_reset_log_created_at_idx ON public.data_reset_log(created_at DESC);

ALTER TABLE public.data_reset_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view reset logs for their shop" ON public.data_reset_log;
CREATE POLICY "Owners can view reset logs for their shop"
ON public.data_reset_log
FOR SELECT
TO authenticated
USING (
  shop_id = public.get_user_shop_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.shop_id = public.data_reset_log.shop_id
      AND ur.role = 'owner'
  )
);

-- 2. Ensure foreign keys support clean deletions without violating integrity
DO $$
BEGIN
  -- Sales customer foreign key
  ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_customer_id_fkey;
  ALTER TABLE public.sales ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  -- Sale items product foreign key
  ALTER TABLE public.sale_items ALTER COLUMN product_id DROP NOT NULL;
  ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
  ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  -- Order items product foreign key
  ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
  ALTER TABLE public.order_items ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  -- Orders sale foreign key
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_sale_id_fkey;
  ALTER TABLE public.orders ADD CONSTRAINT orders_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  -- Stock received supplier foreign key
  ALTER TABLE public.stock_received DROP CONSTRAINT IF EXISTS stock_received_supplier_id_fkey;
  ALTER TABLE public.stock_received ADD CONSTRAINT stock_received_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Function to reset a single module
CREATE OR REPLACE FUNCTION public.reset_shop_module(p_module text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_user_email text;
  v_module text;
  v_counts jsonb := '{}'::jsonb;
  v_c1 int := 0;
  v_c2 int := 0;
  v_c3 int := 0;
  v_c4 int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No active shop found for caller';
  END IF;

  -- Verify owner role strictly server-side
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND shop_id = v_shop_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only shop owners are permitted to reset shop data';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  v_module := LOWER(TRIM(COALESCE(p_module, '')));

  IF v_module = 'sales' THEN
    SELECT count(*) INTO v_c1 FROM public.sale_items WHERE shop_id = v_shop_id;
    SELECT count(*) INTO v_c2 FROM public.sales WHERE shop_id = v_shop_id;
    SELECT count(*) INTO v_c3 FROM public.draft_sales WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('sale_items', v_c1, 'sales', v_c2, 'draft_sales', v_c3);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'sales', v_counts);

    UPDATE public.orders SET sale_id = NULL WHERE shop_id = v_shop_id;
    DELETE FROM public.sale_items WHERE shop_id = v_shop_id;
    DELETE FROM public.sales WHERE shop_id = v_shop_id;
    DELETE FROM public.draft_sale_items WHERE draft_sale_id IN (SELECT id FROM public.draft_sales WHERE shop_id = v_shop_id);
    DELETE FROM public.draft_sales WHERE shop_id = v_shop_id;

  ELSIF v_module = 'purchases' THEN
    SELECT count(*) INTO v_c1 FROM public.stock_received_items WHERE stock_received_id IN (SELECT id FROM public.stock_received WHERE shop_id = v_shop_id);
    SELECT count(*) INTO v_c2 FROM public.stock_received WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('stock_received_items', v_c1, 'stock_received', v_c2);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'purchases', v_counts);

    DELETE FROM public.stock_received_items WHERE stock_received_id IN (SELECT id FROM public.stock_received WHERE shop_id = v_shop_id);
    DELETE FROM public.stock_received WHERE shop_id = v_shop_id;

  ELSIF v_module = 'production' THEN
    SELECT count(*) INTO v_c1 FROM public.production_batches WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('production_batches', v_c1);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'production', v_counts);

    DELETE FROM public.production_batches WHERE shop_id = v_shop_id;

  ELSIF v_module = 'customers' THEN
    SELECT count(*) INTO v_c1 FROM public.customer_payments WHERE shop_id = v_shop_id;
    SELECT count(*) INTO v_c2 FROM public.customers WHERE shop_id = v_shop_id;
    SELECT count(*) INTO v_c3 FROM public.appointments WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('customer_payments', v_c1, 'customers', v_c2, 'appointments', v_c3);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'customers', v_counts);

    UPDATE public.sales SET customer_id = NULL WHERE shop_id = v_shop_id;
    UPDATE public.draft_sales SET customer_id = NULL WHERE shop_id = v_shop_id;
    UPDATE public.orders SET customer_id = NULL WHERE shop_id = v_shop_id;
    DELETE FROM public.customer_payments WHERE shop_id = v_shop_id;
    DELETE FROM public.appointments WHERE shop_id = v_shop_id;
    DELETE FROM public.customers WHERE shop_id = v_shop_id;

  ELSIF v_module = 'expenses' THEN
    SELECT count(*) INTO v_c1 FROM public.expenses WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('expenses', v_c1);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'expenses', v_counts);

    DELETE FROM public.expenses WHERE shop_id = v_shop_id;

  ELSIF v_module = 'inventory' OR v_module = 'products' THEN
    SELECT count(*) INTO v_c1 FROM public.stock_history WHERE product_id IN (SELECT id FROM public.products WHERE shop_id = v_shop_id);
    SELECT count(*) INTO v_c2 FROM public.products WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('stock_history', v_c1, 'products', v_c2);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'inventory', v_counts);

    UPDATE public.sale_items SET product_id = NULL WHERE shop_id = v_shop_id;
    UPDATE public.order_items SET product_id = NULL WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
    UPDATE public.stock_received_items SET product_id = NULL WHERE stock_received_id IN (SELECT id FROM public.stock_received WHERE shop_id = v_shop_id);
    UPDATE public.appointments SET service_id = NULL WHERE shop_id = v_shop_id;

    DELETE FROM public.stock_history WHERE product_id IN (SELECT id FROM public.products WHERE shop_id = v_shop_id);
    DELETE FROM public.production_batches WHERE shop_id = v_shop_id;
    DELETE FROM public.products WHERE shop_id = v_shop_id;

  ELSIF v_module = 'suppliers' THEN
    SELECT count(*) INTO v_c1 FROM public.suppliers WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('suppliers', v_c1);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'suppliers', v_counts);

    UPDATE public.stock_received SET supplier_id = NULL WHERE shop_id = v_shop_id;
    DELETE FROM public.suppliers WHERE shop_id = v_shop_id;

  ELSIF v_module = 'orders' THEN
    SELECT count(*) INTO v_c1 FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
    SELECT count(*) INTO v_c2 FROM public.orders WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('order_items', v_c1, 'orders', v_c2);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'orders', v_counts);

    DELETE FROM public.order_notes WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
    DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
    DELETE FROM public.orders WHERE shop_id = v_shop_id;

  ELSIF v_module = 'other_income' THEN
    SELECT count(*) INTO v_c1 FROM public.other_income WHERE shop_id = v_shop_id;
    v_counts := jsonb_build_object('other_income', v_c1);

    INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
    VALUES (v_shop_id, v_user_id, v_user_email, 'module', 'other_income', v_counts);

    DELETE FROM public.other_income WHERE shop_id = v_shop_id;

  ELSE
    RAISE EXCEPTION 'Unknown module name "%". Supported modules: sales, purchases, production, customers, expenses, inventory, suppliers, orders, other_income', p_module;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'module', v_module,
    'deleted_counts', v_counts,
    'timestamp', now()
  );
END;
$$;

-- 4. Function to reset all business data in a single transactional operation
-- Explicitly preserves: shops, profiles, user_roles, shop_settings, shop_preferences, shop_subscriptions, subscription_payments
CREATE OR REPLACE FUNCTION public.reset_shop_all_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_user_email text;
  v_summary jsonb := '{}'::jsonb;
  v_cnt int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No active shop found for caller';
  END IF;

  -- Verify owner role strictly server-side
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_user_id AND shop_id = v_shop_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only shop owners are permitted to perform a full data reset';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Count rows across all business modules
  SELECT count(*) INTO v_cnt FROM public.sales WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{sales}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.products WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{products}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.customers WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{customers}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.expenses WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{expenses}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.stock_received WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{stock_received}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.production_batches WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{production_batches}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.orders WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{orders}', to_jsonb(v_cnt));

  SELECT count(*) INTO v_cnt FROM public.suppliers WHERE shop_id = v_shop_id;
  v_summary := jsonb_set(v_summary, '{suppliers}', to_jsonb(v_cnt));

  -- Record audit trail BEFORE deleting
  INSERT INTO public.data_reset_log (shop_id, user_id, user_email, reset_type, module_name, row_counts)
  VALUES (v_shop_id, v_user_id, v_user_email, 'all', 'ALL', v_summary);

  -- Perform deletion in strict dependency order: child rows first, parent rows next

  -- 1. Appointments
  DELETE FROM public.appointments WHERE shop_id = v_shop_id;

  -- 2. Orders, order_items, order_notes
  DELETE FROM public.order_notes WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE shop_id = v_shop_id);
  DELETE FROM public.orders WHERE shop_id = v_shop_id;

  -- 3. Sales, sale_items, draft_sales, draft_sale_items
  DELETE FROM public.sale_items WHERE shop_id = v_shop_id;
  DELETE FROM public.sales WHERE shop_id = v_shop_id;
  DELETE FROM public.draft_sale_items WHERE draft_sale_id IN (SELECT id FROM public.draft_sales WHERE shop_id = v_shop_id);
  DELETE FROM public.draft_sales WHERE shop_id = v_shop_id;

  -- 4. Purchases (stock_received, stock_received_items)
  DELETE FROM public.stock_received_items WHERE stock_received_id IN (SELECT id FROM public.stock_received WHERE shop_id = v_shop_id);
  DELETE FROM public.stock_received WHERE shop_id = v_shop_id;

  -- 5. Production
  DELETE FROM public.production_batches WHERE shop_id = v_shop_id;

  -- 6. Stock history & Products
  DELETE FROM public.stock_history WHERE product_id IN (SELECT id FROM public.products WHERE shop_id = v_shop_id);
  DELETE FROM public.products WHERE shop_id = v_shop_id;

  -- 7. Customer payments & Customers
  DELETE FROM public.customer_payments WHERE shop_id = v_shop_id;
  DELETE FROM public.customers WHERE shop_id = v_shop_id;

  -- 8. Suppliers
  DELETE FROM public.suppliers WHERE shop_id = v_shop_id;

  -- 9. Expenses & Other Income
  DELETE FROM public.expenses WHERE shop_id = v_shop_id;
  DELETE FROM public.other_income WHERE shop_id = v_shop_id;

  -- PRESERVED:
  -- - public.shops
  -- - public.profiles
  -- - public.user_roles
  -- - public.shop_settings
  -- - public.shop_preferences
  -- - public.shop_subscriptions
  -- - public.subscription_payments

  RETURN jsonb_build_object(
    'success', true,
    'reset_type', 'all',
    'deleted_summary', v_summary,
    'timestamp', now()
  );
END;
$$;
