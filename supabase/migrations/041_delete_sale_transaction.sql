-- Migration 041: Delete Recorded Sale Transaction
-- Allows owners and managers to delete recorded sales with complete inventory restoration,
-- reversal of stock impact, and audit logging.

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
  v_shop_id UUID;
  v_sale public.sales%ROWTYPE;
  v_old_item RECORD;
  v_product public.products%ROWTYPE;
  v_items_restored INT := 0;
  v_qty_restored NUMERIC := 0;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_caller_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- Role guard: Only owner or manager may delete recorded sales
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = v_caller_id AND ur.shop_id = v_shop_id AND ur.role IN ('owner', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only an owner or manager can delete recorded sales';
  END IF;

  -- Lock and retrieve sale
  SELECT * INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found for this shop';
  END IF;

  -- Step A: Reverse prior sale_items inventory impact and restore stock
  FOR v_old_item IN
    SELECT product_id, quantity, product_name
    FROM public.sale_items
    WHERE sale_id = v_sale.id
  LOOP
    v_product := NULL;

    -- 1. Match by product_id
    IF v_old_item.product_id IS NOT NULL THEN
      SELECT * INTO v_product
      FROM public.products
      WHERE id = v_old_item.product_id AND (shop_id = v_shop_id OR shop_id IS NULL)
      FOR UPDATE;
    END IF;

    -- 2. Fallback: match by product_name if product_id is null or not found
    IF v_product.id IS NULL AND v_old_item.product_name IS NOT NULL THEN
      SELECT * INTO v_product
      FROM public.products
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_old_item.product_name))
        AND (shop_id = v_shop_id OR shop_id IS NULL)
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF v_product.id IS NOT NULL THEN
      IF v_product.shop_id IS NULL THEN
        UPDATE public.products SET shop_id = v_shop_id WHERE id = v_product.id;
      END IF;

      -- Only adjust physical inventory tracking products
      IF COALESCE(v_product.track_inventory, true) AND COALESCE(v_product.item_type, 'product') <> 'service' THEN
        UPDATE public.products
        SET stock = COALESCE(stock, 0) + v_old_item.quantity
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
          COALESCE(v_product.stock, 0),
          COALESCE(v_product.stock, 0) + v_old_item.quantity,
          'sale_deleted_reversal',
          'Sale deleted: ' || COALESCE(v_sale.invoice_number, v_sale.id::text),
          v_shop_id
        );

        v_items_restored := v_items_restored + 1;
        v_qty_restored := v_qty_restored + v_old_item.quantity;
      END IF;
    END IF;
  END LOOP;

  -- Step B: Insert audit log before deleting
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
    'sale_deleted',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'total', v_sale.total,
      'payment_method', v_sale.payment_method,
      'customer_id', v_sale.customer_id,
      'customer_name', v_sale.customer_name,
      'items_restored', v_items_restored,
      'qty_restored', v_qty_restored
    )
  );

  -- Step C: Delete sale_items & sales record
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
