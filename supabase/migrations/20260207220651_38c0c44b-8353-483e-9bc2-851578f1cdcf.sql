
-- 1. App roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'cashier', 'staff', 'hr');

-- 2. Shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, logo_url TEXT,
  tax_rate NUMERIC DEFAULT 0, currency TEXT DEFAULT 'TZS',
  receipt_footer TEXT DEFAULT 'Asante kwa kununua!', receipt_header TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL, phone TEXT, avatar_url TEXT, language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shop_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_shop_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT shop_id FROM public.profiles WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- 6. Add shop_id to existing tables
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.stock_history ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

-- 7. HRM tables
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL, phone TEXT, email TEXT,
  position TEXT DEFAULT 'Staff', department TEXT,
  salary NUMERIC DEFAULT 0, hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active', avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE, check_in TIMESTAMPTZ, check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present', notes TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL, month TEXT NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE, payment_method TEXT DEFAULT 'Cash',
  notes TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- 8. Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, category TEXT DEFAULT 'Equipment',
  purchase_price NUMERIC DEFAULT 0, current_value NUMERIC DEFAULT 0,
  purchase_date DATE DEFAULT CURRENT_DATE, depreciation_rate NUMERIC DEFAULT 10,
  condition TEXT DEFAULT 'Good', location TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 9. Indexes
CREATE INDEX idx_profiles_uid ON public.profiles(user_id);
CREATE INDEX idx_profiles_sid ON public.profiles(shop_id);
CREATE INDEX idx_roles_uid ON public.user_roles(user_id);
CREATE INDEX idx_products_sid ON public.products(shop_id);
CREATE INDEX idx_sales_sid ON public.sales(shop_id);
CREATE INDEX idx_customers_sid ON public.customers(shop_id);
CREATE INDEX idx_suppliers_sid ON public.suppliers(shop_id);
CREATE INDEX idx_expenses_sid ON public.expenses(shop_id);
CREATE INDEX idx_staff_sid ON public.staff(shop_id);
CREATE INDEX idx_assets_sid ON public.assets(shop_id);

-- 10. Drop old open policies
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('products','categories','customers','suppliers','sales','sale_items','expenses','expense_categories','stock_history','shop_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 11. RLS Policies
CREATE POLICY "shop_s" ON public.shops FOR SELECT TO authenticated USING (id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "shop_u" ON public.shops FOR UPDATE TO authenticated USING (id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prof_s" ON public.profiles FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prof_u" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "prof_i" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "role_s" ON public.user_roles FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "role_i" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_s" ON public.products FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_i" ON public.products FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_u" ON public.products FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "prod_d" ON public.products FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_s" ON public.categories FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "cat_i" ON public.categories FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
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
CREATE POLICY "sh_s" ON public.stock_history FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "sh_i" ON public.stock_history FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_s" ON public.shop_settings FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_i" ON public.shop_settings FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "ss_u" ON public.shop_settings FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
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

-- 12. Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER tr_shops BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_staff BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tr_assets BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Auto-create shop + profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_shop_id UUID;
BEGIN
  INSERT INTO public.shops (name, phone) VALUES (COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'), NEW.phone) RETURNING id INTO new_shop_id;
  INSERT INTO public.profiles (user_id, shop_id, full_name, phone) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), NEW.phone);
  INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, 'owner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "vi_prod" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "up_prod" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "vi_avt" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "up_avt" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
