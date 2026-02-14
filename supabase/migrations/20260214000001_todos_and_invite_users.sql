-- Ensure helper function exists (Lovable: profiles.id = auth.uid())
CREATE OR REPLACE FUNCTION public.get_user_shop_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT shop_id FROM public.profiles WHERE id = _user_id LIMIT 1 $$;

-- Todos table for admin to-do list
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  alert_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tod_s" ON public.todos FOR SELECT TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_i" ON public.todos FOR INSERT TO authenticated WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_u" ON public.todos FOR UPDATE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "tod_d" ON public.todos FOR DELETE TO authenticated USING (shop_id = public.get_user_shop_id(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_todos_shop_id ON public.todos(shop_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);

CREATE TRIGGER tr_todos BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to support admin-invited users (add to existing shop)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_shop_id UUID;
  inv_role TEXT;
BEGIN
  -- Check if user was invited to an existing shop
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL AND (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID IS NOT NULL THEN
    new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
    inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff')::TEXT;
    IF inv_role NOT IN ('owner','manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, inv_role::app_role);
  ELSE
    -- Normal signup: create new shop
    INSERT INTO public.shops (name, phone) VALUES (COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'), NEW.phone) RETURNING id INTO new_shop_id;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;
