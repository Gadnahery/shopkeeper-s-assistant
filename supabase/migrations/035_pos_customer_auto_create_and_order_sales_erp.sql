-- Migration 035: POS customer auto-creation (with credit/ERP sync) and order completion sale integration

-- 1. Ensure orders table has sale_id and customer_id columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_sale_id_idx ON public.orders (sale_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON public.orders (customer_id);

-- 2. Update complete_sale_transaction: auto-create customer when custom name is typed, update customer debt on credit sale
DROP FUNCTION IF EXISTS public.complete_sale_transaction(uuid, text, text, text, numeric, numeric, numeric, jsonb, numeric, numeric, uuid);

CREATE OR REPLACE FUNCTION public.complete_sale_transaction(
  p_customer_id uuid DEFAULT NULL,
  p_customer_name text DEFAULT NULL,
  p_payment_method text DEFAULT 'Cash',
  p_mpesa_code text DEFAULT NULL,
  p_discount_amount numeric DEFAULT 0,
  p_discount_percent numeric DEFAULT 0,
  p_tax_amount numeric DEFAULT 0,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_cash_amount numeric DEFAULT NULL,
  p_mpesa_amount numeric DEFAULT NULL,
  p_idempotency_key uuid DEFAULT NULL
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
  v_cash_amount numeric := 0;
  v_mpesa_amount numeric := 0;
  v_clean_method text;
  v_sale public.sales%ROWTYPE;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_quantity numeric;
  v_unit_price numeric;
  v_tracks_stock boolean;
  v_resolved_customer_id uuid;
  v_clean_customer_name text;
BEGIN
  v_cashier_id := auth.uid();
  IF v_cashier_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_cashier_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- 1. Idempotency Check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_sale
    FROM public.sales
    WHERE idempotency_key = p_idempotency_key
      AND shop_id = v_shop_id;

    IF FOUND THEN
      RETURN v_sale;
    END IF;
  END IF;

  -- 2. Subscription write guard
  IF NOT public.has_active_subscription(v_shop_id) THEN
    RAISE EXCEPTION 'Your subscription has expired or is inactive. Please subscribe or renew to record sales.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Sale must contain at least one item';
  END IF;

  v_clean_method := COALESCE(NULLIF(BTRIM(COALESCE(p_payment_method, '')), ''), 'Cash');
  v_clean_customer_name := NULLIF(BTRIM(COALESCE(p_customer_name, '')), '');
  v_resolved_customer_id := p_customer_id;

  -- 3. Auto-create or resolve customer if custom customer name was typed
  IF v_resolved_customer_id IS NULL AND v_clean_customer_name IS NOT NULL THEN
    SELECT id INTO v_resolved_customer_id
    FROM public.customers
    WHERE shop_id = v_shop_id AND LOWER(TRIM(name)) = LOWER(v_clean_customer_name)
    LIMIT 1;

    IF v_resolved_customer_id IS NULL THEN
      INSERT INTO public.customers (
        name,
        shop_id,
        credit_balance,
        created_at
      )
      VALUES (
        v_clean_customer_name,
        v_shop_id,
        0,
        now()
      )
      RETURNING id INTO v_resolved_customer_id;
    END IF;
  END IF;

  -- Credit sales require an identifiable customer (either selected or typed)
  IF v_clean_method = 'Credit' THEN
    IF v_resolved_customer_id IS NULL THEN
      RAISE EXCEPTION 'Customer name or selection is required for credit sales';
    END IF;
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

  -- Determine payment component amounts
  IF v_clean_method = 'Cash' THEN
    v_cash_amount := v_total;
    v_mpesa_amount := 0;
  ELSIF v_clean_method = 'M-Pesa' THEN
    v_cash_amount := 0;
    v_mpesa_amount := v_total;
  ELSIF v_clean_method = 'Credit' THEN
    v_cash_amount := 0;
    v_mpesa_amount := 0;
  ELSIF v_clean_method = 'Split' THEN
    v_cash_amount := COALESCE(p_cash_amount, 0);
    v_mpesa_amount := COALESCE(p_mpesa_amount, 0);
  ELSE
    v_cash_amount := v_total;
    v_mpesa_amount := 0;
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
    status,
    cash_amount,
    mpesa_amount,
    idempotency_key
  )
  VALUES (
    v_invoice_number,
    v_resolved_customer_id,
    v_clean_customer_name,
    v_shop_id,
    v_clean_method,
    NULLIF(BTRIM(COALESCE(p_mpesa_code, '')), ''),
    v_subtotal,
    COALESCE(p_discount_amount, 0),
    COALESCE(p_discount_percent, 0),
    COALESCE(p_tax_amount, 0),
    v_cashier_id,
    v_total,
    'completed',
    v_cash_amount,
    v_mpesa_amount,
    p_idempotency_key
  )
  RETURNING * INTO v_sale;

  -- If credit sale, atomically add to customer credit_balance in customers table
  IF v_clean_method = 'Credit' AND v_resolved_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET credit_balance = COALESCE(credit_balance, 0) + v_total
    WHERE id = v_resolved_customer_id AND shop_id = v_shop_id;
  END IF;

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
      'total', v_sale.total,
      'cash_amount', v_cash_amount,
      'mpesa_amount', v_mpesa_amount,
      'idempotency_key', p_idempotency_key,
      'customer_id', v_resolved_customer_id
    )
  );

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale_transaction(uuid, text, text, text, numeric, numeric, numeric, jsonb, numeric, numeric, uuid) TO authenticated;


-- 3. Update update_order_transaction: when order status changes to 'completed', auto-record completed sale, deduct stock, and update ERP
DROP FUNCTION IF EXISTS public.update_order_transaction(uuid, text, text, date, text, boolean, boolean);

CREATE OR REPLACE FUNCTION public.update_order_transaction(
  p_order_id uuid,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_set_due_date boolean DEFAULT false,
  p_set_notes boolean DEFAULT false
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
  v_sale public.sales%ROWTYPE;
  v_item record;
  v_product public.products%ROWTYPE;
  v_resolved_customer_id uuid;
  v_clean_customer_name text;
  v_invoice_number text;
  v_tracks_stock boolean;
  v_changes jsonb := '{}'::jsonb;
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

  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'processing', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status';
  END IF;

  IF p_priority IS NOT NULL AND p_priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Invalid order priority';
  END IF;

  -- When order status transitions to 'completed' and no sale has been recorded for it yet:
  -- Record the completed sale into public.sales, deduct stock, and update ERP financials
  IF p_status = 'completed' AND v_order.status <> 'completed' AND v_order.sale_id IS NULL THEN
    v_clean_customer_name := NULLIF(BTRIM(COALESCE(v_order.customer_name, '')), '');
    v_resolved_customer_id := v_order.customer_id;

    -- Resolve or create customer in public.customers
    IF v_resolved_customer_id IS NULL AND v_clean_customer_name IS NOT NULL THEN
      SELECT id INTO v_resolved_customer_id
      FROM public.customers
      WHERE shop_id = v_shop_id AND LOWER(TRIM(name)) = LOWER(v_clean_customer_name)
      LIMIT 1;

      IF v_resolved_customer_id IS NULL THEN
        INSERT INTO public.customers (
          name,
          phone,
          shop_id,
          credit_balance,
          created_at
        )
        VALUES (
          v_clean_customer_name,
          NULLIF(BTRIM(COALESCE(v_order.customer_phone, '')), ''),
          v_shop_id,
          0,
          now()
        )
        RETURNING id INTO v_resolved_customer_id;
      END IF;
    END IF;

    v_invoice_number := public.generate_invoice_number();

    -- Insert sale
    INSERT INTO public.sales (
      invoice_number,
      customer_id,
      customer_name,
      shop_id,
      payment_method,
      subtotal,
      discount_amount,
      discount_percent,
      tax_amount,
      cashier_id,
      total,
      status,
      cash_amount,
      mpesa_amount
    )
    VALUES (
      v_invoice_number,
      v_resolved_customer_id,
      v_clean_customer_name,
      v_shop_id,
      'Cash',
      COALESCE(v_order.total, 0),
      0,
      0,
      0,
      v_user_id,
      COALESCE(v_order.total, 0),
      'completed',
      COALESCE(v_order.total, 0),
      0
    )
    RETURNING * INTO v_sale;

    -- Process each order item into sale_items and deduct stock
    FOR v_item IN
      SELECT * FROM public.order_items WHERE order_id = v_order.id
    LOOP
      IF v_item.product_id IS NOT NULL THEN
        SELECT *
        INTO v_product
        FROM public.products
        WHERE id = v_item.product_id
          AND shop_id = v_shop_id
        FOR UPDATE;

        IF FOUND THEN
          v_tracks_stock := COALESCE(v_product.track_inventory, true) AND COALESCE(v_product.item_type, 'product') <> 'service';

          IF v_tracks_stock THEN
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
              'Order: ' || v_order.order_number,
              v_shop_id
            );
          END IF;
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
        v_item.product_id,
        COALESCE(NULLIF(BTRIM(COALESCE(v_item.product_name, '')), ''), 'Order Item'),
        v_item.quantity,
        v_item.unit_price,
        v_item.quantity * v_item.unit_price,
        COALESCE(v_product.buying_price, 0),
        0,
        v_shop_id
      );
    END LOOP;

    -- Link sale to order
    v_order.sale_id := v_sale.id;
    v_order.customer_id := v_resolved_customer_id;
  END IF;

  UPDATE public.orders
  SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    due_date = CASE WHEN p_set_due_date THEN p_due_date ELSE due_date END,
    notes = CASE WHEN p_set_notes THEN p_notes ELSE notes END,
    sale_id = COALESCE(v_order.sale_id, sale_id),
    customer_id = COALESCE(v_order.customer_id, customer_id),
    updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  IF p_status IS NOT NULL THEN
    v_changes := v_changes || jsonb_build_object('status', p_status);
  END IF;
  IF p_priority IS NOT NULL THEN
    v_changes := v_changes || jsonb_build_object('priority', p_priority);
  END IF;
  IF p_set_due_date THEN
    v_changes := v_changes || jsonb_build_object('due_date', p_due_date);
  END IF;
  IF p_set_notes THEN
    v_changes := v_changes || jsonb_build_object('notes', p_notes);
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
    'order_updated',
    'orders',
    v_order.id,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'changes', v_changes,
      'sale_id', v_order.sale_id
    )
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_transaction(uuid, text, text, date, text, boolean, boolean) TO authenticated;
