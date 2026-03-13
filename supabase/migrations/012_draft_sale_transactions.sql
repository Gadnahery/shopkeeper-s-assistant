CREATE OR REPLACE FUNCTION public.save_draft_sale_transaction(
  p_customer_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_discount_amount numeric DEFAULT 0,
  p_discount_percent numeric DEFAULT 0,
  p_tax_amount numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_user_id uuid;
  v_invoice_number text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_sale public.sales%ROWTYPE;
  v_item jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Draft sale must contain at least one item';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE(v_item->>'product_id', '') = '' THEN
      RAISE EXCEPTION 'Each draft item must include a product_id';
    END IF;

    IF COALESCE((v_item->>'quantity')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Draft item quantity must be greater than zero';
    END IF;

    IF COALESCE((v_item->>'unit_price')::numeric, 0) < 0 THEN
      RAISE EXCEPTION 'Draft item price cannot be negative';
    END IF;

    v_subtotal := v_subtotal
      + (COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unit_price')::numeric, 0));
  END LOOP;

  v_total := v_subtotal - COALESCE(p_discount_amount, 0) + COALESCE(p_tax_amount, 0);
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Draft total cannot be negative';
  END IF;

  v_invoice_number := public.generate_invoice_number();

  INSERT INTO public.sales (
    invoice_number,
    customer_id,
    customer_name,
    payment_method,
    subtotal,
    discount_amount,
    discount_percent,
    tax_amount,
    cashier_id,
    total,
    status,
    shop_id
  )
  VALUES (
    v_invoice_number,
    p_customer_id,
    NULLIF(BTRIM(COALESCE(p_customer_name, '')), ''),
    'Cash',
    v_subtotal,
    COALESCE(p_discount_amount, 0),
    COALESCE(p_discount_percent, 0),
    COALESCE(p_tax_amount, 0),
    v_user_id,
    v_total,
    'draft',
    v_shop_id
  )
  RETURNING * INTO v_sale;

  INSERT INTO public.sale_items (
    sale_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    buying_price_at_sale,
    discount_amount,
    total,
    shop_id
  )
  SELECT
    v_sale.id,
    (value->>'product_id')::uuid,
    COALESCE(NULLIF(BTRIM(COALESCE(value->>'product_name', '')), ''), p.name),
    COALESCE((value->>'unit_price')::numeric, 0),
    COALESCE((value->>'quantity')::numeric, 0),
    COALESCE(p.buying_price, 0),
    0,
    COALESCE((value->>'quantity')::numeric, 0) * COALESCE((value->>'unit_price')::numeric, 0),
    v_shop_id
  FROM jsonb_array_elements(p_items) value
  JOIN public.products p
    ON p.id = (value->>'product_id')::uuid
   AND p.shop_id = v_shop_id;

  IF (SELECT count(*) FROM public.sale_items WHERE sale_id = v_sale.id) <> jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'One or more draft items reference products outside this shop';
  END IF;

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
    'draft_sale_saved',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'items_count', jsonb_array_length(p_items),
      'total', v_sale.total
    )
  );

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_draft_sale_transaction(uuid, text, numeric, numeric, numeric, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_draft_sale_transaction(
  p_sale_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_user_id uuid;
  v_sale public.sales%ROWTYPE;
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
    RAISE EXCEPTION 'Only draft sales can be deleted';
  END IF;

  DELETE FROM public.sale_items
  WHERE sale_id = v_sale.id;

  DELETE FROM public.sales
  WHERE id = v_sale.id;

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
    'draft_sale_deleted',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_draft_sale_transaction(uuid) TO authenticated;
