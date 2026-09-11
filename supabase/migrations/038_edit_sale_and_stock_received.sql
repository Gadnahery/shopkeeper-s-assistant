-- Migration 038: Edit Completed Sales, Correct Stock Received, and Purchases Reconciliation
-- Allows owners and managers to edit completed sales and correct stock received with symmetric inventory reversals and full audit trails.

-- 1. Add tracking columns to sales and stock_received
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.stock_received
  ADD COLUMN IF NOT EXISTS corrected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS corrected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Transactional RPC to edit a completed sale
CREATE OR REPLACE FUNCTION public.edit_sale_transaction(
  p_sale_id UUID,
  p_items JSONB,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_discount_amount NUMERIC DEFAULT NULL,
  p_discount_percent NUMERIC DEFAULT NULL,
  p_tax_amount NUMERIC DEFAULT NULL
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_sale public.sales%ROWTYPE;
  v_old_total NUMERIC;
  v_subtotal NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_old_item RECORD;
  v_product public.products%ROWTYPE;
  v_quantity NUMERIC;
  v_unit_price NUMERIC;
  v_product_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard: Only owner or manager may edit completed sales
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can edit completed sales';
  END IF;

  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found for this shop';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  v_old_total := v_sale.total;

  -- Step A: Reverse prior sale_items inventory impact
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
          'sale_edit_reversal',
          'Sale edit reversal: ' || v_sale.invoice_number,
          v_shop_id
        );
      END IF;
    END IF;
  END LOOP;

  -- Step B: Remove old sale_items rows
  DELETE FROM public.sale_items WHERE sale_id = v_sale.id;

  -- Step C: Insert new sale_items and decrement current stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::numeric, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'Each sale item must include a valid product_id';
    END IF;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Item price cannot be negative';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found for this shop', v_product_id;
    END IF;

    IF COALESCE(v_product.stock, 0) < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (available: %, requested: %)', v_product.name, v_product.stock, v_quantity;
    END IF;

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total,
      buying_price_at_sale,
      discount_amount,
      shop_id
    )
    VALUES (
      v_sale.id,
      v_product.id,
      COALESCE(NULLIF(BTRIM(COALESCE(v_item->>'product_name', '')), ''), v_product.name),
      v_quantity,
      v_unit_price,
      v_quantity * v_unit_price,
      COALESCE(v_product.buying_price, 0),
      0,
      v_shop_id
    );

    UPDATE public.products
    SET stock = stock - v_quantity
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
      -v_quantity,
      v_product.stock,
      v_product.stock - v_quantity,
      'sale_edit',
      'Sale edit: ' || v_sale.invoice_number,
      v_shop_id
    );
  END LOOP;

  -- Step D: Recompute totals
  v_total := v_subtotal - COALESCE(p_discount_amount, v_sale.discount_amount, 0) + COALESCE(p_tax_amount, v_sale.tax_amount, 0);
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Sale total cannot be negative';
  END IF;

  -- Step E: Update sales header
  UPDATE public.sales
  SET
    customer_id = COALESCE(p_customer_id, customer_id),
    customer_name = COALESCE(NULLIF(BTRIM(COALESCE(p_customer_name, '')), ''), customer_name),
    payment_method = COALESCE(NULLIF(BTRIM(COALESCE(p_payment_method, '')), ''), payment_method),
    subtotal = v_subtotal,
    discount_amount = COALESCE(p_discount_amount, discount_amount),
    discount_percent = COALESCE(p_discount_percent, discount_percent),
    tax_amount = COALESCE(p_tax_amount, tax_amount),
    total = v_total,
    edited_at = now(),
    edited_by = v_caller_id
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

  -- Step F: Insert audit log
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
    'sale_edited',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'old_total', v_old_total,
      'new_total', v_sale.total,
      'items_count', jsonb_array_length(p_items)
    )
  );

  RETURN v_sale;
END;
$$;

-- 3. Transactional RPC to correct a mistaken stock received entry
CREATE OR REPLACE FUNCTION public.correct_stock_received_transaction(
  p_stock_received_id UUID,
  p_new_quantity NUMERIC,
  p_new_buying_price NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.stock_received
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_received public.stock_received%ROWTYPE;
  v_item public.stock_received_items%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_delta NUMERIC;
  v_old_quantity NUMERIC;
  v_effective_price NUMERIC;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  IF p_new_quantity IS NULL OR p_new_quantity <= 0 THEN
    RAISE EXCEPTION 'Corrected quantity must be greater than zero';
  END IF;

  -- Role guard: Owner or manager
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can correct stock entries';
  END IF;

  SELECT * INTO v_received
  FROM public.stock_received
  WHERE id = p_stock_received_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock received record not found';
  END IF;

  SELECT * INTO v_item
  FROM public.stock_received_items
  WHERE stock_received_id = v_received.id
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock received item details not found';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = v_item.product_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated product not found in inventory';
  END IF;

  v_old_quantity := v_item.quantity;
  v_delta := p_new_quantity - v_old_quantity;
  v_effective_price := COALESCE(p_new_buying_price, v_item.buying_price, v_product.buying_price, 0);

  -- Adjust product stock by the delta
  UPDATE public.products
  SET
    stock = GREATEST(0, COALESCE(stock, 0) + v_delta),
    buying_price = v_effective_price
  WHERE id = v_product.id;

  -- Record stock history delta
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
    v_delta,
    COALESCE(v_product.stock, 0),
    GREATEST(0, COALESCE(v_product.stock, 0) + v_delta),
    'stock_correction',
    COALESCE(NULLIF(BTRIM(COALESCE(p_notes, '')), ''), 'Stock correction: ' || v_old_quantity || ' -> ' || p_new_quantity),
    v_shop_id
  );

  -- Update line item
  UPDATE public.stock_received_items
  SET
    quantity = p_new_quantity,
    buying_price = v_effective_price
  WHERE id = v_item.id;

  -- Update header
  UPDATE public.stock_received
  SET
    total_amount = p_new_quantity * v_effective_price,
    notes = COALESCE(NULLIF(BTRIM(COALESCE(p_notes, '')), ''), notes),
    corrected_at = now(),
    corrected_by = v_caller_id
  WHERE id = v_received.id
  RETURNING * INTO v_received;

  -- Record audit log
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
    'stock_received_corrected',
    'stock_received',
    v_received.id,
    jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'old_quantity', v_old_quantity,
      'new_quantity', p_new_quantity,
      'delta', v_delta,
      'notes', p_notes
    )
  );

  RETURN v_received;
END;
$$;

-- 4. Update update_purchase_transaction to reverse old items before reapplying when already received
CREATE OR REPLACE FUNCTION public.update_purchase_transaction(
  p_purchase_id uuid,
  p_supplier_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_paid_amount numeric DEFAULT NULL
)
RETURNS public.stock_received
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_user_id uuid;
  v_purchase public.stock_received%ROWTYPE;
  v_old_status text;
  v_new_status text;
  v_item record;
  v_json_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id uuid;
  v_quantity numeric;
  v_buying_price numeric;
  v_total_amount numeric := 0;
  v_old_stock numeric;
  v_old_cost numeric;
  v_new_avg_cost numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for user';
  END IF;

  IF NOT public.has_active_subscription(v_shop_id) THEN
    RAISE EXCEPTION 'Your subscription has expired or is inactive. Please subscribe or renew to update purchases.';
  END IF;

  SELECT * INTO v_purchase
  FROM public.stock_received
  WHERE id = p_purchase_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  v_old_status := LOWER(v_purchase.status);
  v_new_status := LOWER(COALESCE(NULLIF(BTRIM(p_status), ''), v_old_status));

  IF v_new_status NOT IN ('ordered', 'pending', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid purchase status: %', p_status;
  END IF;

  -- 1. If old status was received AND (new status is NOT received OR items are being replaced), reverse prior stock
  IF v_old_status = 'received' AND (v_new_status <> 'received' OR (p_items IS NOT NULL AND jsonb_array_length(p_items) > 0)) THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.stock_received_items
      WHERE stock_received_id = v_purchase.id
    LOOP
      SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id AND shop_id = v_shop_id FOR UPDATE;
      IF FOUND THEN
        UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - v_item.quantity)
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
          -v_item.quantity,
          COALESCE(v_product.stock, 0),
          GREATEST(0, COALESCE(v_product.stock, 0) - v_item.quantity),
          'purchase_correction',
          'Purchase edit reversal: ' || v_purchase.id::text,
          v_shop_id
        );
      END IF;
    END LOOP;
  END IF;

  -- 2. If new items provided, replace stock_received_items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    DELETE FROM public.stock_received_items WHERE stock_received_id = v_purchase.id;

    FOR v_json_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_product_id := (v_json_item->>'product_id')::uuid;
      v_quantity := (v_json_item->>'quantity')::numeric;
      v_buying_price := (v_json_item->>'buying_price')::numeric;
      v_total_amount := v_total_amount + (v_quantity * v_buying_price);

      INSERT INTO public.stock_received_items (
        stock_received_id,
        product_id,
        quantity,
        buying_price
      )
      VALUES (
        v_purchase.id,
        v_product_id,
        v_quantity,
        v_buying_price
      );
    END LOOP;
  ELSE
    v_total_amount := v_purchase.total_amount;
  END IF;

  -- 3. If new status is received, apply stock addition
  IF v_new_status = 'received' AND (v_old_status <> 'received' OR (p_items IS NOT NULL AND jsonb_array_length(p_items) > 0)) THEN
    FOR v_item IN
      SELECT product_id, quantity, buying_price
      FROM public.stock_received_items
      WHERE stock_received_id = v_purchase.id
    LOOP
      SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id AND shop_id = v_shop_id FOR UPDATE;
      IF FOUND THEN
        v_old_stock := GREATEST(0, COALESCE(v_product.stock, 0));
        v_old_cost := COALESCE(v_product.buying_price, 0);

        IF (v_old_stock + v_item.quantity) > 0 THEN
          v_new_avg_cost := ((v_old_stock * v_old_cost) + (v_item.quantity * v_item.buying_price)) / (v_old_stock + v_item.quantity);
        ELSE
          v_new_avg_cost := v_item.buying_price;
        END IF;

        UPDATE public.products
        SET
          stock = COALESCE(stock, 0) + v_item.quantity,
          buying_price = COALESCE(v_new_avg_cost, v_item.buying_price)
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
          v_item.quantity,
          v_old_stock,
          v_old_stock + v_item.quantity,
          'stock_received',
          'Purchase received (WAC blended): ' || v_purchase.id::text,
          v_shop_id
        );
      END IF;
    END LOOP;
  END IF;

  -- 4. Update purchase header
  UPDATE public.stock_received
  SET
    supplier_id = CASE WHEN p_supplier_id IS NOT NULL THEN p_supplier_id ELSE supplier_id END,
    status = v_new_status,
    total_amount = v_total_amount,
    paid_amount = COALESCE(p_paid_amount, paid_amount),
    notes = CASE WHEN p_notes IS NOT NULL THEN p_notes ELSE notes END,
    updated_at = now()
  WHERE id = v_purchase.id
  RETURNING * INTO v_purchase;

  -- 5. Audit log
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
    v_user_id,
    'purchase_updated',
    'stock_received',
    v_purchase.id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', v_new_status,
      'total_amount', v_total_amount,
      'paid_amount', v_purchase.paid_amount
    )
  );

  RETURN v_purchase;
END;
$$;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.edit_sale_transaction(UUID, JSONB, UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.correct_stock_received_transaction(UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_purchase_transaction(uuid, uuid, jsonb, text, text, numeric) TO authenticated;
