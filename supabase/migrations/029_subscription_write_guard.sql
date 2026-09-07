-- Migration 029: Subscription write guard — enforce active subscription on key mutations.
-- Adds has_active_subscription() check at the TOP of each critical RPC,
-- consistent with the existing authentication-check pattern already in place.
-- Read operations are unaffected; only writes are guarded.

-- ─── 1. Patch complete_sale_transaction ───────────────────────────────────────
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
BEGIN
  v_cashier_id := auth.uid();
  IF v_cashier_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_cashier_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- ── Subscription guard ─────────────────────────────────────────────────────
  IF NOT public.has_active_subscription(v_shop_id) THEN
    RAISE EXCEPTION 'Subscription expired. Please renew your WiseCash subscription to record sales.';
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

  v_total := GREATEST(0, v_subtotal - COALESCE(p_discount_amount, 0));

  v_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  INSERT INTO public.sales (
    shop_id, cashier_id, customer_id, customer_name,
    payment_method, mpesa_code,
    discount_amount, discount_percent, tax_amount,
    subtotal, total, invoice_number, status
  ) VALUES (
    v_shop_id, v_cashier_id, p_customer_id, p_customer_name,
    p_payment_method, p_mpesa_code,
    COALESCE(p_discount_amount, 0), COALESCE(p_discount_percent, 0), COALESCE(p_tax_amount, 0),
    v_subtotal, v_total, v_invoice_number, 'completed'
  )
  RETURNING * INTO v_sale;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item->>'quantity')::numeric, 1);
    v_unit_price := COALESCE((v_item->>'unit_price')::numeric, 0);

    INSERT INTO public.sale_items (
      sale_id, product_id, product_name, quantity, unit_price, total_price
    ) VALUES (
      v_sale.id,
      (v_item->>'product_id')::uuid,
      COALESCE(v_item->>'product_name', ''),
      v_quantity,
      v_unit_price,
      v_quantity * v_unit_price
    );

    -- Deduct stock only for tracked inventory items
    UPDATE public.products
    SET stock = GREATEST(0, stock - v_quantity),
        updated_at = now()
    WHERE id = (v_item->>'product_id')::uuid
      AND shop_id = v_shop_id
      AND COALESCE(track_inventory, true) = true
      AND COALESCE(item_type, 'product') = 'product';
  END LOOP;

  -- Update customer credit balance if credit sale
  IF p_customer_id IS NOT NULL AND p_payment_method ILIKE '%credit%' THEN
    UPDATE public.customers
    SET credit_balance = COALESCE(credit_balance, 0) + v_total,
        updated_at = now()
    WHERE id = p_customer_id AND shop_id = v_shop_id;
  END IF;

  RETURN v_sale;
END;
$$;

-- ─── 2. Patch receive_stock_transaction ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.receive_stock_transaction(
  p_purchase_order_id uuid,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_user_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_cost numeric;
  v_received_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  -- ── Subscription guard ─────────────────────────────────────────────────────
  IF NOT public.has_active_subscription(v_shop_id) THEN
    RAISE EXCEPTION 'Subscription expired. Please renew your WiseCash subscription to receive stock.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Must include at least one item';
  END IF;

  INSERT INTO public.stock_received (
    shop_id, purchase_order_id, received_by, notes
  ) VALUES (
    v_shop_id, p_purchase_order_id, v_user_id, p_notes
  )
  RETURNING id INTO v_received_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::numeric, 0);
    v_cost := COALESCE((v_item->>'unit_cost')::numeric, 0);

    IF v_quantity <= 0 THEN CONTINUE; END IF;

    INSERT INTO public.stock_received_items (
      stock_received_id, product_id, quantity_received, unit_cost
    ) VALUES (v_received_id, v_product_id, v_quantity, v_cost);

    UPDATE public.products
    SET stock = COALESCE(stock, 0) + v_quantity,
        buying_price = CASE WHEN v_cost > 0 THEN v_cost ELSE buying_price END,
        updated_at = now()
    WHERE id = v_product_id AND shop_id = v_shop_id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'stock_received_id', v_received_id);
END;
$$;

-- ─── 3. RLS write guards on expenses (INSERT) ─────────────────────────────────
-- Drop the existing insert policy and replace it with a subscription-aware one.
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "Expenses: shop members can insert" ON public.expenses;

-- Rebuild: shop members with an active subscription only.
CREATE POLICY "expenses_insert_active_sub"
ON public.expenses
FOR INSERT TO authenticated
WITH CHECK (
  shop_id = public.get_user_shop_id(auth.uid())
  AND public.has_active_subscription(public.get_user_shop_id(auth.uid()))
);

-- ─── 4. RLS write guards on products (INSERT/UPDATE) ──────────────────────────
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "Products: shop members can insert" ON public.products;

CREATE POLICY "products_insert_active_sub"
ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  shop_id = public.get_user_shop_id(auth.uid())
  AND public.has_active_subscription(public.get_user_shop_id(auth.uid()))
);
