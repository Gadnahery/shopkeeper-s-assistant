-- Spec v2 core updates: schema additions and bug fixes

-- 1) Invoice sequence + deterministic invoice number generation
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_no bigint;
  date_part text;
BEGIN
  seq_no := nextval('public.invoice_seq');
  date_part := to_char(now(), 'YYYYMMDD');
  RETURN 'INV-' || date_part || '-' || lpad(seq_no::text, 6, '0');
END;
$$;

-- 2) Sales accuracy fields
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cashier_id uuid REFERENCES auth.users(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS loyalty_points_earned integer DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS refund_reason text;

ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS buying_price_at_sale numeric NOT NULL DEFAULT 0;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- 3) Inventory receiving + supplier payments
CREATE TABLE IF NOT EXISTS public.stock_received (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_received_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_received_id uuid NOT NULL REFERENCES public.stock_received(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL,
  buying_price numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  notes text,
  paid_at timestamptz DEFAULT now()
);

-- 4) Customers and credit
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.credit_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes text;

-- 5) Expenses upgrades
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recurring_frequency text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text;

-- 6) Loyalty, todos and audit log
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  points integer NOT NULL,
  reference_id uuid,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date date;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 7) Basic RLS
ALTER TABLE public.stock_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_received_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_received' AND policyname='sr_s') THEN
    CREATE POLICY "sr_s" ON public.stock_received FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_received' AND policyname='sr_i') THEN
    CREATE POLICY "sr_i" ON public.stock_received FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_received_items' AND policyname='sri_s') THEN
    CREATE POLICY "sri_s" ON public.stock_received_items FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.stock_received sr WHERE sr.id = stock_received_items.stock_received_id AND sr.shop_id = public.get_user_shop_id(auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stock_received_items' AND policyname='sri_i') THEN
    CREATE POLICY "sri_i" ON public.stock_received_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.stock_received sr WHERE sr.id = stock_received_items.stock_received_id AND sr.shop_id = public.get_user_shop_id(auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_payments' AND policyname='sp_s') THEN
    CREATE POLICY "sp_s" ON public.supplier_payments FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supplier_payments' AND policyname='sp_i') THEN
    CREATE POLICY "sp_i" ON public.supplier_payments FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='credit_repayments' AND policyname='cr_s') THEN
    CREATE POLICY "cr_s" ON public.credit_repayments FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='credit_repayments' AND policyname='cr_i') THEN
    CREATE POLICY "cr_i" ON public.credit_repayments FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_transactions' AND policyname='lt_s') THEN
    CREATE POLICY "lt_s" ON public.loyalty_transactions FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_transactions' AND policyname='lt_i') THEN
    CREATE POLICY "lt_i" ON public.loyalty_transactions FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_log' AND policyname='al_s') THEN
    CREATE POLICY "al_s" ON public.audit_log FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_log' AND policyname='al_i') THEN
    CREATE POLICY "al_i" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
  END IF;
END $$;
