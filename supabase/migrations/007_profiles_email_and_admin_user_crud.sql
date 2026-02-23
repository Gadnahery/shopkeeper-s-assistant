-- Add email to profiles so admins can see and use it (e.g. send password reset)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Sync email from auth.users on new user (trigger already exists; update function to set email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_shop_id UUID; inv_role TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL THEN
    new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
    inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff');
    IF inv_role NOT IN ('owner','manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone, NEW.email);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, inv_role::app_role);
  ELSE
    INSERT INTO public.shops (name, phone) VALUES (COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'), NEW.phone) RETURNING id INTO new_shop_id;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), NEW.phone, NEW.email);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill email from auth.users for existing profiles (run with SECURITY DEFINER or by superuser)
-- Optional: run once to sync existing users. Requires a function that reads auth.users.
-- Here we skip backfill; new signups will have email, existing rows can be updated by user or admin later.

-- Allow owner/manager to update other users' profiles in the same shop (for admin CRUD)
DROP POLICY IF EXISTS "prof_u" ON public.profiles;
CREATE POLICY "prof_u" ON public.profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = public.profiles.shop_id AND ur.role IN ('owner', 'manager')))
  );

-- Allow owner/manager to update user_roles in their shop
CREATE POLICY "role_u" ON public.user_roles FOR UPDATE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_roles.shop_id AND ur.role IN ('owner', 'manager')));

-- Allow owner/manager to delete user_roles in their shop (remove user from shop)
CREATE POLICY "role_d" ON public.user_roles FOR DELETE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = user_roles.shop_id AND ur.role IN ('owner', 'manager')));

-- Allow owner/manager to delete profiles in their shop (remove user from shop; profile row same shop_id)
CREATE POLICY "prof_d" ON public.profiles FOR DELETE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()) AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.shop_id = profiles.shop_id AND ur.role IN ('owner', 'manager')));
