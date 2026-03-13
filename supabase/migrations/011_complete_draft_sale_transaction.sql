CREATE OR REPLACE FUNCTION public.complete_draft_sale_transaction(
  p_sale_id uuid
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_user_id uuid;
  v_sale public.sales%ROWTYPE;
  v_item RECORD;
  v_product public.products%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  SELECT *
  INTO v_sale
  FROM public.sales
  WHERE id = p_sale_id
    AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft sale not found';
  END IF;

  IF v_sale.status <> 'draft' THEN
    RAISE EXCEPTION 'Only draft sales can be completed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.sale_items
    WHERE sale_id = v_sale.id
  ) THEN
    RAISE EXCEPTION 'Draft sale must contain at least one item';
  END IF;

  FOR v_item IN
    SELECT *
    FROM public.sale_items
    WHERE sale_id = v_sale.id
  LOOP
    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
      AND shop_id = v_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found for this shop', v_item.product_id;
    END IF;

    IF COALESCE(v_item.quantity, 0) <= 0 THEN
      RAISE EXCEPTION 'Draft item quantity must be greater than zero';
    END IF;

    IF COALESCE(v_product.stock, 0) < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
    END IF;

    UPDATE public.products
    SET stock = stock - v_item.quantity
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
      v_product.stock,
      v_product.stock - v_item.quantity,
      'sale',
      'Sale: ' || v_sale.invoice_number,
      v_shop_id
    );
  END LOOP;

  UPDATE public.sales
  SET status = 'completed'
  WHERE id = v_sale.id
  RETURNING * INTO v_sale;

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
    'draft_sale_completed',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'payment_method', v_sale.payment_method,
      'total', v_sale.total
    )
  );

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_draft_sale_transaction(uuid) TO authenticated;
