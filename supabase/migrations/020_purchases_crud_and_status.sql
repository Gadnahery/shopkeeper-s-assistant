-- Migration 020: Purchases CRUD, Status, and Atomic Stock Transactions

-- 1. Add status, total_amount, paid_amount to stock_received
ALTER TABLE public.stock_received ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled'));
ALTER TABLE public.stock_received ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.stock_received ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;
ALTER TABLE public.stock_received ADD COLUMN IF NOT EXISTS received_by text;

-- 2. Add UPDATE and DELETE RLS policies
DROP POLICY IF EXISTS "Users can update stock_received for their shop" ON public.stock_received;
CREATE POLICY "Users can update stock_received for their shop"
ON public.stock_received
FOR UPDATE
USING (shop_id = public.get_user_shop_id(auth.uid()))
WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));

DROP POLICY IF EXISTS "Users can delete stock_received for their shop" ON public.stock_received;
CREATE POLICY "Users can delete stock_received for their shop"
ON public.stock_received
FOR DELETE
USING (shop_id = public.get_user_shop_id(auth.uid()));

DROP POLICY IF EXISTS "Users can update stock_received_items for their shop" ON public.stock_received_items;
CREATE POLICY "Users can update stock_received_items for their shop"
ON public.stock_received_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stock_received sr
    WHERE sr.id = stock_received_items.stock_received_id
      AND sr.shop_id = public.get_user_shop_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete stock_received_items for their shop" ON public.stock_received_items;
CREATE POLICY "Users can delete stock_received_items for their shop"
ON public.stock_received_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stock_received sr
    WHERE sr.id = stock_received_items.stock_received_id
      AND sr.shop_id = public.get_user_shop_id(auth.uid())
  )
);

-- 3. Atomic Multi-Item Create Purchase RPC
CREATE OR REPLACE FUNCTION public.create_purchase_transaction(
  p_supplier_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_status text DEFAULT 'received',
  p_notes text DEFAULT NULL,
  p_received_date date DEFAULT CURRENT_DATE,
  p_paid_amount numeric DEFAULT 0
)
RETURNS public.stock_received
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_purchase public.stock_received%ROWTYPE;
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_buying_price numeric;
  v_total_amount numeric := 0;
  v_product public.products%ROWTYPE;
  v_status text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_shop_id := public.get_user_shop_id(v_user_id);
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user';
  END IF;

  v_status := LOWER(COALESCE(p_status, 'received'));
  IF v_status NOT IN ('pending', 'received', 'cancelled') THEN
    v_status := 'received';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Purchase order must contain at least one item';
  END IF;

  -- Calculate total amount and validate items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::numeric;
    v_buying_price := (v_item->>'buying_price')::numeric;
    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero';
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

  -- Insert items and apply stock increment IF status is received
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

    -- Only increment inventory stock if status is received
    IF v_status = 'received' THEN
      UPDATE public.products
      SET
        stock = COALESCE(stock, 0) + v_quantity,
        buying_price = v_buying_price
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
        'purchase',
        COALESCE(NULLIF(BTRIM(COALESCE(p_notes, '')), ''), 'Purchase received'),
        v_shop_id
      );
    END IF;
  END LOOP;

  RETURN v_purchase;
END;
$$;

-- 4. Atomic Update Purchase RPC (with inventory delta reconciliation)
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
  v_user_id uuid;
  v_shop_id uuid;
  v_purchase public.stock_received%ROWTYPE;
  v_old_status text;
  v_new_status text;
  v_item record;
  v_json_item jsonb;
  v_product public.products%ROWTYPE;
  v_total_amount numeric := 0;
  v_product_id uuid;
  v_quantity numeric;
  v_buying_price numeric;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := public.get_user_shop_id(v_user_id);

  SELECT * INTO v_purchase
  FROM public.stock_received
  WHERE id = p_purchase_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  v_old_status := v_purchase.status;
  v_new_status := LOWER(COALESCE(p_status, v_old_status));

  -- 1. If old status was 'received', reverse prior stock effects
  IF v_old_status = 'received' THEN
    FOR v_item IN
      SELECT product_id, quantity, buying_price
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
          'Purchase edit reversal',
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

  -- 3. If new status is 'received', apply stock addition
  IF v_new_status = 'received' THEN
    FOR v_item IN
      SELECT product_id, quantity, buying_price
      FROM public.stock_received_items
      WHERE stock_received_id = v_purchase.id
    LOOP
      SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id AND shop_id = v_shop_id FOR UPDATE;
      IF FOUND THEN
        UPDATE public.products
        SET
          stock = COALESCE(stock, 0) + v_item.quantity,
          buying_price = v_item.buying_price
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
          COALESCE(v_product.stock, 0),
          COALESCE(v_product.stock, 0) + v_item.quantity,
          'purchase',
          'Purchase received',
          v_shop_id
        );
      END IF;
    END LOOP;
  END IF;

  -- 4. Update header record
  UPDATE public.stock_received
  SET
    supplier_id = COALESCE(p_supplier_id, v_purchase.supplier_id),
    status = v_new_status,
    notes = COALESCE(p_notes, v_purchase.notes),
    total_amount = v_total_amount,
    paid_amount = COALESCE(p_paid_amount, v_purchase.paid_amount)
  WHERE id = v_purchase.id
  RETURNING * INTO v_purchase;

  RETURN v_purchase;
END;
$$;

-- 5. Atomic Delete Purchase RPC (with inventory reversal)
CREATE OR REPLACE FUNCTION public.delete_purchase_transaction(
  p_purchase_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_shop_id uuid;
  v_purchase public.stock_received%ROWTYPE;
  v_item record;
  v_product public.products%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  v_shop_id := public.get_user_shop_id(v_user_id);

  SELECT * INTO v_purchase
  FROM public.stock_received
  WHERE id = p_purchase_id AND shop_id = v_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  -- If it was received, decrement inventory and log compensating stock history
  IF v_purchase.status = 'received' THEN
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
          'Purchase deletion correction',
          v_shop_id
        );
      END IF;
    END LOOP;
  END IF;

  -- Delete items and header record
  DELETE FROM public.stock_received_items WHERE stock_received_id = v_purchase.id;
  DELETE FROM public.stock_received WHERE id = v_purchase.id;

  RETURN true;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.create_purchase_transaction(uuid, jsonb, text, text, date, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_purchase_transaction(uuid, uuid, jsonb, text, text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_purchase_transaction(uuid) TO authenticated;
