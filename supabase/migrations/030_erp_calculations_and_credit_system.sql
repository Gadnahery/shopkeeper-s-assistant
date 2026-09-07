-- Migration 030: ERP Calculations and Credit Accounting Integrity
-- 1. Extend sales table with cash_amount and mpesa_amount
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cash_amount numeric DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS mpesa_amount numeric DEFAULT 0;

-- 2. Customer payment ledger table
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'Cash',
  reference text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer payments in their shop"
ON public.customer_payments FOR SELECT
TO authenticated
USING (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert customer payments in their shop"
ON public.customer_payments FOR INSERT
TO authenticated
WITH CHECK (
  shop_id IN (
    SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 3. Atomic payment recording RPC
CREATE OR REPLACE FUNCTION public.record_customer_payment(
  p_customer_id uuid,
  p_amount numeric,
  p_payment_method text DEFAULT 'Cash',
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_customer public.customers%ROWTYPE;
  v_new_balance numeric;
  v_payment_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for user';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT * INTO v_customer
  FROM public.customers
  WHERE id = p_customer_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  v_new_balance := GREATEST(0, COALESCE(v_customer.credit_balance, 0) - p_amount);

  UPDATE public.customers
  SET credit_balance = v_new_balance
  WHERE id = p_customer_id;

  INSERT INTO public.customer_payments (
    shop_id,
    customer_id,
    amount,
    payment_method,
    reference,
    notes,
    recorded_by
  )
  VALUES (
    v_shop_id,
    p_customer_id,
    p_amount,
    COALESCE(NULLIF(BTRIM(p_payment_method), ''), 'Cash'),
    NULLIF(BTRIM(p_reference), ''),
    NULLIF(BTRIM(p_notes), ''),
    v_user_id
  )
  RETURNING id INTO v_payment_id;

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
    'customer_payment_recorded',
    'customer_payments',
    v_payment_id,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'amount', p_amount,
      'payment_method', p_payment_method,
      'previous_balance', v_customer.credit_balance,
      'new_balance', v_new_balance
    )
  );

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'new_balance', v_new_balance,
    'amount', p_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_customer_payment(uuid, numeric, text, text, text) TO authenticated;

-- 4. Update complete_sale_transaction to handle Credit and Split accurately
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
  p_mpesa_amount numeric DEFAULT NULL
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

  v_clean_method := COALESCE(NULLIF(BTRIM(COALESCE(p_payment_method, '')), ''), 'Cash');

  -- Credit sales require an identifiable customer
  IF v_clean_method = 'Credit' THEN
    IF p_customer_id IS NULL THEN
      RAISE EXCEPTION 'Customer is required for credit sales';
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
    mpesa_amount
  )
  VALUES (
    v_invoice_number,
    p_customer_id,
    NULLIF(BTRIM(COALESCE(p_customer_name, '')), ''),
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
    v_mpesa_amount
  )
  RETURNING * INTO v_sale;

  -- If credit sale, atomically add to customer credit_balance
  IF v_clean_method = 'Credit' AND p_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET credit_balance = COALESCE(credit_balance, 0) + v_total
    WHERE id = p_customer_id AND shop_id = v_shop_id;
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
      'total', v_sale.total,
      'cash_amount', v_cash_amount,
      'mpesa_amount', v_mpesa_amount
    )
  );

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale_transaction(uuid, text, text, text, numeric, numeric, numeric, jsonb, numeric, numeric) TO authenticated;

-- Also maintain backward compatibility for 8-arg signature
CREATE OR REPLACE FUNCTION public.complete_sale_transaction(
  p_customer_id uuid,
  p_customer_name text,
  p_payment_method text,
  p_mpesa_code text,
  p_discount_amount numeric,
  p_discount_percent numeric,
  p_tax_amount numeric,
  p_items jsonb
)
RETURNS public.sales
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.complete_sale_transaction(
    p_customer_id,
    p_customer_name,
    p_payment_method,
    p_mpesa_code,
    p_discount_amount,
    p_discount_percent,
    p_tax_amount,
    p_items,
    NULL,
    NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale_transaction(uuid, text, text, text, numeric, numeric, numeric, jsonb) TO authenticated;

-- 5. Weighted-Average Costing (WAC) on Purchase Receiving
-- Updates create_purchase_order_transaction and update_purchase_status_and_stock
CREATE OR REPLACE FUNCTION public.create_purchase_order_transaction(
  p_supplier_id uuid,
  p_received_date date,
  p_notes text,
  p_items jsonb,
  p_status text DEFAULT 'received',
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
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_product_id uuid;
  v_quantity numeric;
  v_buying_price numeric;
  v_total_amount numeric := 0;
  v_status text;
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

  v_status := LOWER(COALESCE(NULLIF(BTRIM(p_status), ''), 'received'));
  IF v_status NOT IN ('ordered', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid purchase status: %', p_status;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Purchase must contain at least one item';
  END IF;

  -- Validate items and compute total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::numeric;
    v_buying_price := (v_item->>'buying_price')::numeric;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;
    IF v_buying_price < 0 THEN
      RAISE EXCEPTION 'Buying price cannot be negative';
    END IF;
    v_total_amount := v_total_amount + (v_quantity * v_buying_price);
  END LOOP;

  -- Insert single stock_received record
  INSERT INTO public.stock_received (
    shop_id,
    supplier_id,
    received_date,
    notes,
    status,
    total_amount,
    paid_amount
  )
  VALUES (
    v_shop_id,
    p_supplier_id,
    COALESCE(p_received_date, CURRENT_DATE),
    NULLIF(BTRIM(COALESCE(p_notes, '')), ''),
    v_status,
    v_total_amount,
    COALESCE(p_paid_amount, v_total_amount)
  )
  RETURNING * INTO v_purchase;

  -- Insert items and apply stock increment with Weighted Average Costing (WAC) IF status is received
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_buying_price := (v_item->>'buying_price')::numeric;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id AND shop_id = v_shop_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found in this shop', v_product_id;
    END IF;

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

    -- Only increment inventory stock and blend cost if status is received
    IF v_status = 'received' THEN
      v_old_stock := GREATEST(0, COALESCE(v_product.stock, 0));
      v_old_cost := COALESCE(v_product.buying_price, 0);

      IF (v_old_stock + v_quantity) > 0 THEN
        v_new_avg_cost := ((v_old_stock * v_old_cost) + (v_quantity * v_buying_price)) / (v_old_stock + v_quantity);
      ELSE
        v_new_avg_cost := v_buying_price;
      END IF;

      UPDATE public.products
      SET
        stock = COALESCE(stock, 0) + v_quantity,
        buying_price = COALESCE(v_new_avg_cost, v_buying_price)
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
        'stock_received',
        'Purchase received (WAC blended): ' || v_purchase.id::text,
        v_shop_id
      );
    END IF;
  END LOOP;

  RETURN v_purchase;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_purchase_order_transaction(uuid, date, text, jsonb, text, numeric) TO authenticated;

-- Update update_purchase_status_and_stock to use Weighted Average Costing when receiving
CREATE OR REPLACE FUNCTION public.update_purchase_status_and_stock(
  p_purchase_id uuid,
  p_status text,
  p_paid_amount numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT NULL
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

  SELECT * INTO v_purchase
  FROM public.stock_received
  WHERE id = p_purchase_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  v_old_status := LOWER(v_purchase.status);
  v_new_status := LOWER(COALESCE(NULLIF(BTRIM(p_status), ''), v_old_status));

  IF v_new_status NOT IN ('ordered', 'received', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid purchase status: %', p_status;
  END IF;

  -- 1. If was received and changing away from received, reverse stock addition
  IF v_old_status = 'received' AND v_new_status <> 'received' THEN
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
          'Purchase status changed from received to ' || v_new_status,
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

  -- 3. If new status is 'received' (and either wasn't before or items replaced), apply stock addition with WAC
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

  -- 4. Update the purchase header
  UPDATE public.stock_received
  SET
    status = v_new_status,
    total_amount = v_total_amount,
    paid_amount = COALESCE(p_paid_amount, paid_amount),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = v_purchase.id
  RETURNING * INTO v_purchase;

  RETURN v_purchase;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_purchase_status_and_stock(uuid, text, numeric, text, jsonb) TO authenticated;
