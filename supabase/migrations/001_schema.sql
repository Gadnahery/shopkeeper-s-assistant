-- ============================================================
-- SMART MONEY POS - CORE SCHEMA
-- Run this FIRST in your new Supabase project SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App roles
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'cashier', 'staff', 'hr');

-- 2. Shops
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'TZS',
  receipt_footer TEXT DEFAULT 'Asante kwa kununua!',
  receipt_header TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

-- 5. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_sw TEXT DEFAULT '',
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_sw TEXT,
  barcode TEXT,
  category_id UUID REFERENCES public.categories(id),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  buying_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  unit_type TEXT DEFAULT 'piece',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  customer_type TEXT DEFAULT 'retail',
  credit_balance NUMERIC DEFAULT 0,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  pending_payment NUMERIC DEFAULT 0,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  payment_method TEXT DEFAULT 'Cash',
  mpesa_code TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Sale items
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Expense categories
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_sw TEXT,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Shop settings
CREATE TABLE public.shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  address TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Stock history
CREATE TABLE public.stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  notes TEXT,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. HRM
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT DEFAULT 'Staff',
  department TEXT,
  salary NUMERIC DEFAULT 0,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Assets
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Equipment',
  location TEXT,
  purchase_price NUMERIC DEFAULT 0,
  purchase_date DATE,
  current_value NUMERIC DEFAULT 0,
  depreciation_rate NUMERIC,
  condition TEXT DEFAULT 'Good',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Todos
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  alert_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_shop_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT shop_id FROM public.profiles WHERE user_id = _user_id OR id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE invoice_num TEXT; ts_part TEXT; rnd_part TEXT;
BEGIN
  ts_part := TO_CHAR(clock_timestamp(), 'YYYYMMDD-HH24MISS') || '-' || LPAD(FLOOR(EXTRACT(MILLISECOND FROM clock_timestamp()))::TEXT, 3, '0');
  rnd_part := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
  invoice_num := 'INV-' || ts_part || '-' || rnd_part;
  RETURN invoice_num;
END;
$$;

-- Auth trigger: create shop + profile on signup; support invited users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_shop_id UUID; inv_role TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL THEN
    new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
    inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff');
    IF inv_role NOT IN ('owner','manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, inv_role::app_role);
  ELSE
    INSERT INTO public.shops (name, phone) VALUES (COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'), NEW.phone) RETURNING id INTO new_shop_id;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "shop_s" ON public.shops FOR SELECT TO authenticated USING (id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "shop_u" ON public.shops FOR UPDATE TO authenticated USING (id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prof_s" ON public.profiles FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prof_u" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prof_i" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "role_s" ON public.user_roles FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "role_i" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_s" ON public.categories FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_i" ON public.categories FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_u" ON public.categories FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_d" ON public.categories FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_s" ON public.products FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_i" ON public.products FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_u" ON public.products FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_d" ON public.products FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cust_s" ON public.customers FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cust_i" ON public.customers FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cust_u" ON public.customers FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cust_d" ON public.customers FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sup_s" ON public.suppliers FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sup_i" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sup_u" ON public.suppliers FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sup_d" ON public.suppliers FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sal_s" ON public.sales FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sal_i" ON public.sales FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sal_u" ON public.sales FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "si_s" ON public.sale_items FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "si_i" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "exp_s" ON public.expenses FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "exp_i" ON public.expenses FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "exp_u" ON public.expenses FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "exp_d" ON public.expenses FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ec_s" ON public.expense_categories FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ec_i" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_s" ON public.shop_settings FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_i" ON public.shop_settings FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_u" ON public.shop_settings FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sh_s" ON public.stock_history FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sh_i" ON public.stock_history FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_s" ON public.orders FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_i" ON public.orders FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_u" ON public.orders FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ord_d" ON public.orders FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "oi_s" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_i" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_u" ON public.order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "oi_d" ON public.order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "on_s" ON public.order_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "on_i" ON public.order_notes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.shop_id = public.get_user_shop_id(auth.uid())));
CREATE POLICY "not_s" ON public.notifications FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_i" ON public.notifications FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "not_u" ON public.notifications FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "stf_s" ON public.staff FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "stf_i" ON public.staff FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "stf_u" ON public.staff FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "stf_d" ON public.staff FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "att_s" ON public.attendance FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "att_i" ON public.attendance FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "att_u" ON public.attendance FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "pay_s" ON public.salary_payments FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "pay_i" ON public.salary_payments FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ast_s" ON public.assets FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ast_i" ON public.assets FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ast_u" ON public.assets FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ast_d" ON public.assets FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_s" ON public.todos FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_i" ON public.todos FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_u" ON public.todos FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_d" ON public.todos FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

-- Triggers
CREATE TRIGGER tr_shops BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_orders BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_todos BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "vi_avt" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "up_avt" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "vi_prod" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "up_prod" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
