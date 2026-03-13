CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_no bigint;
  date_part text;
BEGIN
  seq_no := nextval('public.order_number_seq');
  date_part := to_char(now(), 'YYYYMMDD');
  RETURN 'ORD-' || date_part || '-' || lpad(seq_no::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_transaction(
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_priority text DEFAULT 'medium',
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_order public.orders%ROWTYPE;
  v_order_number text;
  v_total numeric := 0;
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
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF COALESCE(p_priority, 'medium') NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid order priority';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE(NULLIF(BTRIM(COALESCE(v_item->>'product_name', '')), ''), '') = '' THEN
      RAISE EXCEPTION 'Each order item must include a product_name';
    END IF;

    IF COALESCE((v_item->>'quantity')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Order item quantity must be greater than zero';
    END IF;

    IF COALESCE((v_item->>'unit_price')::numeric, 0) < 0 THEN
      RAISE EXCEPTION 'Order item price cannot be negative';
    END IF;

    v_total := v_total
      + (COALESCE((v_item->>'quantity')::numeric, 0) * COALESCE((v_item->>'unit_price')::numeric, 0));
  END LOOP;

  v_order_number := public.generate_order_number();

  INSERT INTO public.orders (
    shop_id,
    order_number,
    customer_name,
    customer_phone,
    status,
    total,
    notes,
    priority,
    due_date
  )
  VALUES (
    v_shop_id,
    v_order_number,
    NULLIF(BTRIM(COALESCE(p_customer_name, '')), ''),
    NULLIF(BTRIM(COALESCE(p_customer_phone, '')), ''),
    'pending',
    v_total,
    NULLIF(BTRIM(COALESCE(p_notes, '')), ''),
    COALESCE(NULLIF(BTRIM(COALESCE(p_priority, '')), ''), 'medium'),
    p_due_date
  )
  RETURNING * INTO v_order;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    total
  )
  SELECT
    v_order.id,
    NULLIF(value->>'product_id', '')::uuid,
    value->>'product_name',
    COALESCE((value->>'quantity')::numeric, 0),
    COALESCE((value->>'unit_price')::numeric, 0),
    COALESCE((value->>'quantity')::numeric, 0) * COALESCE((value->>'unit_price')::numeric, 0)
  FROM jsonb_array_elements(p_items) value;

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
    'order_created',
    'orders',
    v_order.id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'items_count', jsonb_array_length(p_items),
      'total', v_order.total
    )
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_transaction(text, text, text, date, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_order_transaction(
  p_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_order public.orders%ROWTYPE;
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
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  DELETE FROM public.orders
  WHERE id = v_order.id;

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
    'order_deleted',
    'orders',
    v_order.id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'status', v_order.status,
      'total', v_order.total
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_order_transaction(uuid) TO authenticated;
