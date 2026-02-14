-- ============================================================
-- FIX: "Database error saving new user" when registering staff
-- ============================================================
-- Your profiles table requires user_id. The handle_new_user trigger
-- was only inserting (id, shop_id, full_name, phone) - missing user_id.
-- Run this in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_shop_id UUID;
  inv_role TEXT;
BEGIN
  -- Invited user (admin adds staff to their shop)
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL AND (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID IS NOT NULL THEN
    new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
    inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff')::TEXT;
    IF inv_role NOT IN ('manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;
    -- Never allow invited users to become owner (security)
    -- Include user_id (required in your schema)
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone)
    VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, inv_role::app_role);
  ELSE
    -- Normal signup (create new shop)
    INSERT INTO public.shops (name, phone) VALUES (COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'), NEW.phone) RETURNING id INTO new_shop_id;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone)
    VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), NEW.phone);
    INSERT INTO public.user_roles (user_id, shop_id, role) VALUES (NEW.id, new_shop_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;
