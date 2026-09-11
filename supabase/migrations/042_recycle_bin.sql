-- Migration 042: Recycle Bin with 7-day retention
-- Allows shops to recover deleted items (sales, products, expenses, orders, etc.)
-- Items are kept for 7 days before being automatically purged.

CREATE TABLE IF NOT EXISTS public.recycle_bin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'sales', 'products', 'expenses', 'orders', 'customers'
  entity_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_details JSONB DEFAULT '{}'::jsonb,
  original_data JSONB NOT NULL,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_by_name TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_recycle_bin_shop_expires ON public.recycle_bin(shop_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_shop_type ON public.recycle_bin(shop_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_recycle_bin_shop_deleted ON public.recycle_bin(shop_id, deleted_at DESC);

-- RLS
ALTER TABLE public.recycle_bin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view recycle bin for their shop" ON public.recycle_bin;
CREATE POLICY "Users can view recycle bin for their shop"
ON public.recycle_bin
FOR SELECT
TO authenticated
USING (
  shop_id = public.get_user_shop_id(auth.uid())
);

DROP POLICY IF EXISTS "Owners and managers can manage recycle bin" ON public.recycle_bin;
CREATE POLICY "Owners and managers can manage recycle bin"
ON public.recycle_bin
FOR ALL
TO authenticated
USING (
  shop_id = public.get_user_shop_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.shop_id = public.recycle_bin.shop_id
      AND ur.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  shop_id = public.get_user_shop_id(auth.uid())
);

-- Function to cleanup expired items older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_expired_recycle_bin()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM public.recycle_bin
  WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_recycle_bin() TO authenticated;

-- Function: Permanently delete specific item from recycle bin
CREATE OR REPLACE FUNCTION public.permanently_delete_recycle_bin_item(
  p_bin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_item public.recycle_bin%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only owner or manager can permanently delete items';
  END IF;

  SELECT * INTO v_item
  FROM public.recycle_bin
  WHERE id = p_bin_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recycle bin item not found';
  END IF;

  DELETE FROM public.recycle_bin WHERE id = v_item.id;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'recycle_bin_permanently_deleted',
    v_item.entity_type,
    v_item.entity_id,
    jsonb_build_object(
      'item_name', v_item.item_name,
      'original_bin_id', v_item.id
    )
  );

  RETURN jsonb_build_object('success', true, 'bin_id', p_bin_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.permanently_delete_recycle_bin_item(UUID) TO authenticated;

-- Function: Empty entire recycle bin for shop
CREATE OR REPLACE FUNCTION public.empty_recycle_bin()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_deleted_count INT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only owner or manager can empty recycle bin';
  END IF;

  DELETE FROM public.recycle_bin
  WHERE shop_id = v_shop_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'recycle_bin_emptied',
    'recycle_bin',
    jsonb_build_object('deleted_count', v_deleted_count)
  );

  RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.empty_recycle_bin() TO authenticated;

-- Update delete_sale_transaction to snapshot into recycle_bin
CREATE OR REPLACE FUNCTION public.delete_sale_transaction(
  p_sale_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_name TEXT;
  v_shop_id UUID;
  v_sale public.sales%ROWTYPE;
  v_old_item RECORD;
  v_product public.products%ROWTYPE;
  v_items_restored INT := 0;
  v_qty_restored NUMERIC := 0;
  v_items_json JSONB := '[]'::jsonb;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can delete recorded sales';
  END IF;

  SELECT full_name INTO v_caller_name FROM public.profiles WHERE user_id = v_caller_id;

  -- Lock and retrieve sale
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found for this shop';
  END IF;

  -- Collect sale items snapshot into JSON
  SELECT COALESCE(jsonb_agg(to_jsonb(si)), '[]'::jsonb)
  INTO v_items_json
  FROM public.sale_items si
  WHERE si.sale_id = v_sale.id;

  -- Step A: Reverse prior sale_items inventory impact and restore stock
  FOR v_old_item IN
    SELECT product_id, quantity
    FROM public.sale_items
    WHERE sale_id = v_sale.id
  LOOP
    IF v_old_item.product_id IS NOT NULL THEN
      SELECT * INTO v_product
      FROM public.products
      WHERE id = v_old_item.product_id AND shop_id = v_shop_id
      FOR UPDATE;

      IF FOUND THEN
        IF COALESCE(v_product.track_inventory, true) THEN
          UPDATE public.products
          SET stock = stock + v_old_item.quantity
          WHERE id = v_product.id;

          INSERT INTO public.stock_history (
            product_id,
            quantity_change,
            previous_stock,
            new_stock,
            change_type,
            notes,
            shop_id
          )
          VALUES (
            v_product.id,
            v_old_item.quantity,
            v_product.stock,
            v_product.stock + v_old_item.quantity,
            'sale_deleted_reversal',
            'Sale moved to Recycle Bin: ' || COALESCE(v_sale.invoice_number, v_sale.id::text),
            v_shop_id
          );

          v_items_restored := v_items_restored + 1;
          v_qty_restored := v_qty_restored + v_old_item.quantity;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Step B: Insert into recycle_bin (Retained for 7 days)
  INSERT INTO public.recycle_bin (
    shop_id,
    entity_type,
    entity_id,
    item_name,
    item_details,
    original_data,
    deleted_by,
    deleted_by_name,
    deleted_at,
    expires_at
  )
  VALUES (
    v_shop_id,
    'sales',
    v_sale.id,
    COALESCE(v_sale.invoice_number, 'Sale #' || SUBSTRING(v_sale.id::text FROM 1 FOR 8)),
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'total', v_sale.total,
      'subtotal', v_sale.subtotal,
      'payment_method', v_sale.payment_method,
      'customer_name', v_sale.customer_name,
      'items_count', jsonb_array_length(v_items_json),
      'items_restored', v_items_restored,
      'qty_restored', v_qty_restored
    ),
    jsonb_build_object(
      'sale', to_jsonb(v_sale),
      'sale_items', v_items_json
    ),
    v_caller_id,
    v_caller_name,
    now(),
    now() + INTERVAL '7 days'
  );

  -- Step C: Insert audit log
  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'sale_moved_to_recycle_bin',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'total', v_sale.total,
      'payment_method', v_sale.payment_method,
      'items_restored', v_items_restored,
      'qty_restored', v_qty_restored
    )
  );

  -- Step D: Delete sale_items & sales record from active view
  DELETE FROM public.sale_items WHERE sale_id = v_sale.id;
  DELETE FROM public.sales WHERE id = v_sale.id;

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', p_sale_id,
    'invoice_number', v_sale.invoice_number,
    'items_restored', v_items_restored,
    'qty_restored', v_qty_restored
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_sale_transaction(UUID) TO authenticated;

-- Function: Delete product to recycle bin
CREATE OR REPLACE FUNCTION public.delete_product_to_recycle_bin(
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_name TEXT;
  v_shop_id UUID;
  v_product public.products%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can delete products';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  SELECT full_name INTO v_caller_name FROM public.profiles WHERE user_id = v_caller_id;

  -- Insert into recycle_bin
  INSERT INTO public.recycle_bin (
    shop_id,
    entity_type,
    entity_id,
    item_name,
    item_details,
    original_data,
    deleted_by,
    deleted_by_name,
    deleted_at,
    expires_at
  )
  VALUES (
    v_shop_id,
    'products',
    v_product.id,
    v_product.name,
    jsonb_build_object(
      'name', v_product.name,
      'selling_price', v_product.selling_price,
      'buying_price', v_product.buying_price,
      'stock', v_product.stock,
      'category_id', v_product.category_id,
      'barcode', v_product.barcode,
      'sku', v_product.sku,
      'item_type', v_product.item_type
    ),
    to_jsonb(v_product),
    v_caller_id,
    v_caller_name,
    now(),
    now() + INTERVAL '7 days'
  );

  -- Delete from products
  DELETE FROM public.products WHERE id = v_product.id;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'product_moved_to_recycle_bin',
    'products',
    v_product.id,
    jsonb_build_object('name', v_product.name, 'stock', v_product.stock)
  );

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_product_to_recycle_bin(UUID) TO authenticated;

-- Function: Delete expense to recycle bin
CREATE OR REPLACE FUNCTION public.delete_expense_to_recycle_bin(
  p_expense_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_name TEXT;
  v_shop_id UUID;
  v_expense public.expenses%ROWTYPE;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can delete expenses';
  END IF;

  SELECT * INTO v_expense
  FROM public.expenses
  WHERE id = p_expense_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found';
  END IF;

  SELECT full_name INTO v_caller_name FROM public.profiles WHERE user_id = v_caller_id;

  INSERT INTO public.recycle_bin (
    shop_id,
    entity_type,
    entity_id,
    item_name,
    item_details,
    original_data,
    deleted_by,
    deleted_by_name,
    deleted_at,
    expires_at
  )
  VALUES (
    v_shop_id,
    'expenses',
    v_expense.id,
    COALESCE(v_expense.description, 'Expense - ' || COALESCE(v_expense.category, 'General')),
    jsonb_build_object(
      'description', v_expense.description,
      'amount', v_expense.amount,
      'category', v_expense.category,
      'date', v_expense.date,
      'payment_method', v_expense.payment_method
    ),
    to_jsonb(v_expense),
    v_caller_id,
    v_caller_name,
    now(),
    now() + INTERVAL '7 days'
  );

  DELETE FROM public.expenses WHERE id = v_expense.id;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'expense_moved_to_recycle_bin',
    'expenses',
    v_expense.id,
    jsonb_build_object('amount', v_expense.amount, 'category', v_expense.category)
  );

  RETURN jsonb_build_object('success', true, 'expense_id', p_expense_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_expense_to_recycle_bin(UUID) TO authenticated;

-- Function: Delete order to recycle bin
CREATE OR REPLACE FUNCTION public.delete_order_to_recycle_bin(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_name TEXT;
  v_shop_id UUID;
  v_order public.orders%ROWTYPE;
  v_customer_name TEXT;
  v_items_json JSONB := '[]'::jsonb;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can delete orders';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT full_name INTO v_caller_name FROM public.profiles WHERE user_id = v_caller_id;

  IF v_order.customer_id IS NOT NULL THEN
    SELECT name INTO v_customer_name FROM public.customers WHERE id = v_order.customer_id;
  END IF;

  -- Collect items
  SELECT COALESCE(jsonb_agg(to_jsonb(oi)), '[]'::jsonb)
  INTO v_items_json
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  INSERT INTO public.recycle_bin (
    shop_id,
    entity_type,
    entity_id,
    item_name,
    item_details,
    original_data,
    deleted_by,
    deleted_by_name,
    deleted_at,
    expires_at
  )
  VALUES (
    v_shop_id,
    'orders',
    v_order.id,
    COALESCE(v_order.order_number, 'Order #' || SUBSTRING(v_order.id::text FROM 1 FOR 8)),
    jsonb_build_object(
      'order_number', v_order.order_number,
      'total', v_order.total,
      'status', v_order.status,
      'customer_name', v_customer_name,
      'items_count', jsonb_array_length(v_items_json)
    ),
    jsonb_build_object(
      'order', to_jsonb(v_order),
      'order_items', v_items_json
    ),
    v_caller_id,
    v_caller_name,
    now(),
    now() + INTERVAL '7 days'
  );

  DELETE FROM public.order_items WHERE order_id = v_order.id;
  DELETE FROM public.orders WHERE id = v_order.id;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'order_moved_to_recycle_bin',
    'orders',
    v_order.id,
    jsonb_build_object('order_number', v_order.order_number, 'total', v_order.total)
  );

  RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_order_to_recycle_bin(UUID) TO authenticated;

-- Function: Restore item from recycle bin
CREATE OR REPLACE FUNCTION public.restore_recycle_bin_item(
  p_bin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_item public.recycle_bin%ROWTYPE;
  v_sale_data JSONB;
  v_items_data JSONB;
  v_item_elem JSONB;
  v_product public.products%ROWTYPE;
  v_product_data JSONB;
  v_expense_data JSONB;
  v_order_data JSONB;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can restore items';
  END IF;

  SELECT * INTO v_item
  FROM public.recycle_bin
  WHERE id = p_bin_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recycle bin item not found or expired';
  END IF;

  -- Polymorphic restore by entity_type
  IF v_item.entity_type = 'sales' THEN
    v_sale_data := v_item.original_data->'sale';
    v_items_data := v_item.original_data->'sale_items';

    -- Re-insert sale matching exact sales table schema (cashier_id instead of user_id)
    INSERT INTO public.sales (
      id,
      invoice_number,
      customer_id,
      customer_name,
      shop_id,
      payment_method,
      mpesa_code,
      status,
      subtotal,
      discount_amount,
      discount_percent,
      total,
      cashier_id,
      tax_amount,
      cash_amount,
      mpesa_amount,
      created_at
    )
    VALUES (
      (v_sale_data->>'id')::UUID,
      v_sale_data->>'invoice_number',
      (v_sale_data->>'customer_id')::UUID,
      v_sale_data->>'customer_name',
      v_shop_id,
      COALESCE(v_sale_data->>'payment_method', 'Cash'),
      v_sale_data->>'mpesa_code',
      COALESCE(v_sale_data->>'status', 'completed'),
      COALESCE((v_sale_data->>'subtotal')::NUMERIC, (v_sale_data->>'total')::NUMERIC, 0),
      COALESCE((v_sale_data->>'discount_amount')::NUMERIC, 0),
      COALESCE((v_sale_data->>'discount_percent')::NUMERIC, 0),
      COALESCE((v_sale_data->>'total')::NUMERIC, 0),
      COALESCE((v_sale_data->>'cashier_id')::UUID, v_caller_id),
      COALESCE((v_sale_data->>'tax_amount')::NUMERIC, 0),
      COALESCE((v_sale_data->>'cash_amount')::NUMERIC, 0),
      COALESCE((v_sale_data->>'mpesa_amount')::NUMERIC, 0),
      COALESCE((v_sale_data->>'created_at')::TIMESTAMPTZ, now())
    )
    ON CONFLICT (id) DO NOTHING;

    -- Re-insert sale items & re-deduct inventory
    IF v_items_data IS NOT NULL AND jsonb_array_length(v_items_data) > 0 THEN
      FOR v_item_elem IN SELECT * FROM jsonb_array_elements(v_items_data)
      LOOP
        INSERT INTO public.sale_items (
          id,
          sale_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total,
          shop_id,
          buying_price_at_sale,
          discount_amount,
          created_at
        )
        VALUES (
          COALESCE((v_item_elem->>'id')::UUID, gen_random_uuid()),
          (v_sale_data->>'id')::UUID,
          (v_item_elem->>'product_id')::UUID,
          COALESCE(v_item_elem->>'product_name', 'Item'),
          COALESCE((v_item_elem->>'quantity')::NUMERIC, 1),
          COALESCE((v_item_elem->>'unit_price')::NUMERIC, 0),
          COALESCE((v_item_elem->>'total')::NUMERIC, (v_item_elem->>'total_price')::NUMERIC, 0),
          v_shop_id,
          COALESCE((v_item_elem->>'buying_price_at_sale')::NUMERIC, 0),
          COALESCE((v_item_elem->>'discount_amount')::NUMERIC, 0),
          COALESCE((v_item_elem->>'created_at')::TIMESTAMPTZ, now())
        )
        ON CONFLICT (id) DO NOTHING;

        -- Re-deduct product stock
        IF (v_item_elem->>'product_id') IS NOT NULL THEN
          SELECT * INTO v_product
          FROM public.products
          WHERE id = (v_item_elem->>'product_id')::UUID AND shop_id = v_shop_id
          FOR UPDATE;

          IF FOUND AND COALESCE(v_product.track_inventory, true) THEN
            UPDATE public.products
            SET stock = GREATEST(0, stock - (v_item_elem->>'quantity')::NUMERIC)
            WHERE id = v_product.id;

            INSERT INTO public.stock_history (
              product_id,
              quantity_change,
              previous_stock,
              new_stock,
              change_type,
              notes,
              shop_id
            )
            VALUES (
              v_product.id,
              -((v_item_elem->>'quantity')::NUMERIC),
              v_product.stock,
              GREATEST(0, v_product.stock - (v_item_elem->>'quantity')::NUMERIC),
              'sale_restored',
              'Sale restored from Recycle Bin: ' || COALESCE(v_sale_data->>'invoice_number', v_item.item_name),
              v_shop_id
            );
          END IF;
        END IF;
      END LOOP;
    END IF;

  ELSIF v_item.entity_type = 'products' THEN
    v_product_data := v_item.original_data;

    INSERT INTO public.products (
      id,
      shop_id,
      name,
      description,
      selling_price,
      buying_price,
      stock,
      low_stock_alert,
      category_id,
      barcode,
      sku,
      image_url,
      item_type,
      track_inventory,
      unit,
      created_at
    )
    VALUES (
      (v_product_data->>'id')::UUID,
      v_shop_id,
      v_product_data->>'name',
      v_product_data->>'description',
      COALESCE((v_product_data->>'selling_price')::NUMERIC, 0),
      COALESCE((v_product_data->>'buying_price')::NUMERIC, 0),
      COALESCE((v_product_data->>'stock')::NUMERIC, 0),
      COALESCE((v_product_data->>'low_stock_alert')::INTEGER, (v_product_data->>'min_stock')::INTEGER, 5),
      (v_product_data->>'category_id')::UUID,
      v_product_data->>'barcode',
      v_product_data->>'sku',
      v_product_data->>'image_url',
      COALESCE(v_product_data->>'item_type', 'product'),
      COALESCE((v_product_data->>'track_inventory')::BOOLEAN, true),
      v_product_data->>'unit',
      COALESCE((v_product_data->>'created_at')::TIMESTAMPTZ, now())
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      selling_price = EXCLUDED.selling_price,
      buying_price = EXCLUDED.buying_price,
      stock = EXCLUDED.stock,
      low_stock_alert = EXCLUDED.low_stock_alert,
      category_id = EXCLUDED.category_id;

  ELSIF v_item.entity_type = 'expenses' THEN
    v_expense_data := v_item.original_data;

    INSERT INTO public.expenses (
      id,
      shop_id,
      description,
      category,
      category_id,
      amount,
      date,
      payment_method,
      notes,
      title,
      created_at
    )
    VALUES (
      (v_expense_data->>'id')::UUID,
      v_shop_id,
      COALESCE(v_expense_data->>'description', v_expense_data->>'title', 'Expense'),
      COALESCE(v_expense_data->>'category', 'General'),
      (v_expense_data->>'category_id')::UUID,
      COALESCE((v_expense_data->>'amount')::NUMERIC, 0),
      COALESCE((v_expense_data->>'date')::DATE, CURRENT_DATE),
      COALESCE(v_expense_data->>'payment_method', 'Cash'),
      v_expense_data->>'notes',
      COALESCE(v_expense_data->>'title', v_expense_data->>'description', 'Expense'),
      COALESCE((v_expense_data->>'created_at')::TIMESTAMPTZ, now())
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_item.entity_type = 'orders' THEN
    v_order_data := v_item.original_data->'order';
    v_items_data := v_item.original_data->'order_items';

    INSERT INTO public.orders (
      id,
      shop_id,
      order_number,
      customer_id,
      status,
      total,
      notes,
      delivery_date,
      paid_amount,
      created_at
    )
    VALUES (
      (v_order_data->>'id')::UUID,
      v_shop_id,
      v_order_data->>'order_number',
      (v_order_data->>'customer_id')::UUID,
      COALESCE(v_order_data->>'status', 'pending'),
      COALESCE((v_order_data->>'total')::NUMERIC, 0),
      v_order_data->>'notes',
      COALESCE((v_order_data->>'delivery_date')::DATE, (v_order_data->>'due_date')::DATE),
      COALESCE((v_order_data->>'paid_amount')::NUMERIC, 0),
      COALESCE((v_order_data->>'created_at')::TIMESTAMPTZ, now())
    )
    ON CONFLICT (id) DO NOTHING;

    IF v_items_data IS NOT NULL AND jsonb_array_length(v_items_data) > 0 THEN
      FOR v_item_elem IN SELECT * FROM jsonb_array_elements(v_items_data)
      LOOP
        INSERT INTO public.order_items (
          id,
          order_id,
          product_id,
          quantity,
          unit_price
        )
        VALUES (
          COALESCE((v_item_elem->>'id')::UUID, gen_random_uuid()),
          (v_order_data->>'id')::UUID,
          (v_item_elem->>'product_id')::UUID,
          COALESCE((v_item_elem->>'quantity')::NUMERIC, 1),
          COALESCE((v_item_elem->>'unit_price')::NUMERIC, 0)
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- Remove from recycle_bin
  DELETE FROM public.recycle_bin WHERE id = v_item.id;

  INSERT INTO public.audit_log (
    shop_id,
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_shop_id,
    v_caller_id,
    'recycle_bin_restored',
    v_item.entity_type,
    v_item.entity_id,
    jsonb_build_object(
      'item_name', v_item.item_name,
      'original_bin_id', v_item.id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'bin_id', p_bin_id,
    'entity_type', v_item.entity_type,
    'entity_id', v_item.entity_id,
    'item_name', v_item.item_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_recycle_bin_item(UUID) TO authenticated;
