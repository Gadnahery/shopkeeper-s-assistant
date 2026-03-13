CREATE OR REPLACE FUNCTION public.receive_stock_transaction(
  p_product_id uuid,
  p_supplier_id uuid DEFAULT NULL,
  p_quantity numeric DEFAULT 0,
  p_buying_price numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.stock_received
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_product public.products%ROWTYPE;
  v_received public.stock_received%ROWTYPE;
  v_quantity numeric;
  v_effective_buying_price numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  v_quantity := COALESCE(p_quantity, 0);
  IF v_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity received must be greater than zero';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
    AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found for this shop';
  END IF;

  IF p_supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.suppliers
    WHERE id = p_supplier_id
      AND shop_id = v_shop_id
  ) THEN
    RAISE EXCEPTION 'Supplier not found for this shop';
  END IF;

  v_effective_buying_price := COALESCE(p_buying_price, v_product.buying_price, 0);
  IF v_effective_buying_price < 0 THEN
    RAISE EXCEPTION 'Buying price cannot be negative';
  END IF;

  INSERT INTO public.stock_received (
    shop_id,
    supplier_id,
    notes
  )
  VALUES (
    v_shop_id,
    p_supplier_id,
    NULLIF(BTRIM(COALESCE(p_notes, '')), '')
  )
  RETURNING * INTO v_received;

  INSERT INTO public.stock_received_items (
    stock_received_id,
    product_id,
    quantity,
    buying_price
  )
  VALUES (
    v_received.id,
    v_product.id,
    v_quantity,
    v_effective_buying_price
  );

  UPDATE public.products
  SET
    stock = COALESCE(stock, 0) + v_quantity,
    buying_price = v_effective_buying_price
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
    v_quantity,
    COALESCE(v_product.stock, 0),
    COALESCE(v_product.stock, 0) + v_quantity,
    'restock',
    COALESCE(NULLIF(BTRIM(COALESCE(p_notes, '')), ''), 'Stock received'),
    v_shop_id
  );

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
    'stock_received',
    'stock_received',
    v_received.id,
    jsonb_build_object(
      'product_id', v_product.id,
      'quantity', v_quantity,
      'supplier_id', p_supplier_id,
      'buying_price', v_effective_buying_price
    )
  );

  RETURN v_received;
END;
$$;

GRANT EXECUTE ON FUNCTION public.receive_stock_transaction(uuid, uuid, numeric, numeric, text) TO authenticated;
