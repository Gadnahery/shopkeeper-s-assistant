-- ============================================================
-- FIX: Shop name and username not showing in header
-- ============================================================
-- Your profiles table uses user_id = auth.uid(), not id.
-- get_user_shop_id was using "id" which never matched.
-- Run this in Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_shop_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT shop_id FROM public.profiles
  WHERE user_id = _user_id OR id = _user_id
  LIMIT 1
$$;
