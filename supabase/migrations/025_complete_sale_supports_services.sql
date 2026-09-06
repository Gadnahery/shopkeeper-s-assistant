-- Migration 025: Allow complete_sale_transaction to handle services and non-inventory items seamlessly
CREATE OR REPLACE FUNCTION public.complete_sale_transaction(
  p_customer_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_payment_method text DEFAULT 'Cash',
  p_mpesa_code text DEFAULT NULL,
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
  v_cashier_id uuid;
  v_invoice_number text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_sale public.sales%ROWTYPE;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_quantity numeric;
  v_unit_price numeric;
  v_tracks_stock boolean;
BEGIN
  v_cashier_id := auth.uid();
  IF v_cashier_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_cashier_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item->>'quantity')::numeric, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);

    IF COALESCE(v_item->>'product_id', '') = '' THEN
      RAISE EXCEPTION 'Each sale item must include a product_id';
    END IF;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
    END IF;

    IF v_unit_price < 0 THEN
      RAISE EXCEPTION 'Item price cannot be negative';
    END IF;

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  END LOOP;

  v_total := v_subtotal - COALESCE(p_discount_amount, 0) + COALESCE(p_tax_amount, 0);
  IF v_total < 0 THEN
    RAISE EXCEPTION 'Sale total cannot be negative';
  END IF;

  v_invoice_number := public.generate_invoice_number();

  INSERT INTO public.sales (
    invoice_number,
    customer_id,
    customer_name,
    shop_id,
    payment_method,
    mpesa_code,
    subtotal,
    discount_amount,
    discount_percent,
    tax_amount,
    cashier_id,
    total,
    status
  )
  VALUES (
    v_invoice_number,
    p_customer_id,
    NULLIF(BTRIM(COALESCE(p_customer_name, '')), ''),
    v_shop_id,
    COALESCE(NULLIF(BTRIM(COALESCE(p_payment_method, '')), ''), 'Cash'),
    NULLIF(BTRIM(COALESCE(p_mpesa_code, '')), ''),
    v_subtotal,
    COALESCE(p_discount_amount, 0),
    COALESCE(p_discount_percent, 0),
    COALESCE(p_tax_amount, 0),
    v_cashier_id,
    v_total,
    'completed'
  )
  RETURNING * INTO v_sale;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
      AND shop_id = v_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found for this shop', v_item->>'product_id';
    END IF;

    v_quantity := COALESCE((v_item->>'quantity')::numeric, 0);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);

    -- Check if product tracks inventory (services and non-stock items do not)
    v_tracks_stock := COALESCE(v_product.track_inventory, true) AND COALESCE(v_product.item_type, 'product') <> 'service';

    IF v_tracks_stock THEN
      IF COALESCE(v_product.stock, 0) < v_quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
      END IF;
    END IF;

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

    IF v_tracks_stock THEN
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
        'sale',
        'Sale: ' || v_sale.invoice_number,
        v_shop_id
      );
    END IF;
  END LOOP;

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
    v_cashier_id,
    'sale_created',
    'sales',
    v_sale.id,
    jsonb_build_object(
      'invoice_number', v_sale.invoice_number,
      'payment_method', v_sale.payment_method,
      'items_count', jsonb_array_length(p_items),
      'total', v_sale.total
    )
  );

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale_transaction(uuid, text, text, text, numeric, numeric, numeric, jsonb) TO authenticated;
