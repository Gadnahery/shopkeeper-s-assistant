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

  UPDATE public.orders
  SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    due_date = CASE WHEN p_set_due_date THEN p_due_date ELSE due_date END,
    notes = CASE WHEN p_set_notes THEN p_notes ELSE notes END,
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
      'changes', v_changes
    )
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_transaction(uuid, text, text, date, text, boolean, boolean) TO authenticated;
