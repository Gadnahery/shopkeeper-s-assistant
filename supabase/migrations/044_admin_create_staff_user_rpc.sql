-- ============================================================
-- SMART MONEY POS - MIGRATION 044: ADMIN CREATE STAFF USER RPC
-- Run this in your Supabase project SQL Editor
-- Enables instant staff creation, auto-confirmed logins, and fixes RLS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- 1. Allow shop owner / manager to insert profiles for staff in their shop
DROP POLICY IF EXISTS "prof_i" ON public.profiles;
CREATE POLICY "prof_i" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (
      shop_id = public.get_user_shop_id(auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.shop_id = public.profiles.shop_id
          AND ur.role IN ('owner', 'manager')
      )
    )
  );

-- 2. Database RPC: admin_create_staff_user
-- Instantly creates or links a staff user, hashes password with crypt(),
-- marks email as confirmed (NO email wait / rate limits),
-- enforces the 4-user limit (+ extra seats), and links profile + role.
CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_caller_role TEXT;
  v_new_user_id UUID;
  v_extra_seats INTEGER;
  v_max_seats INTEGER;
  v_current_count INTEGER;
  v_encrypted_pw TEXT;
  v_clean_email TEXT;
  v_clean_name TEXT;
  v_assigned_role TEXT;
BEGIN
  v_clean_email := LOWER(TRIM(p_email));
  v_clean_name := TRIM(p_full_name);
  v_assigned_role := LOWER(TRIM(p_role));

  IF v_clean_email = '' OR v_clean_name = '' OR p_password = '' THEN
    RAISE EXCEPTION 'Email, password, and full name are required.';
  END IF;

  IF LENGTH(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;

  -- 1. Identify caller
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  -- 2. Get caller shop and verify role
  SELECT shop_id INTO v_shop_id FROM public.profiles WHERE user_id = v_caller_id LIMIT 1;
  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'No shop found for current user.';
  END IF;

  SELECT role::text INTO v_caller_role FROM public.user_roles WHERE user_id = v_caller_id AND shop_id = v_shop_id LIMIT 1;
  IF v_caller_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Only shop owners or managers can add users.';
  END IF;

  -- 3. Check seat limit (Base 4 assigned staff under the owner + extra purchased seats)
  SELECT COALESCE(extra_user_seats, 0) INTO v_extra_seats FROM public.shops WHERE id = v_shop_id;
  v_max_seats := 4 + COALESCE(v_extra_seats, 0);

  SELECT COUNT(*) INTO v_current_count FROM public.user_roles WHERE shop_id = v_shop_id AND role != 'owner';
  IF v_current_count >= v_max_seats THEN
    RAISE EXCEPTION 'User seat limit reached (%/% assigned). Additional seats cost 5,000 TZS each in Billing.', v_current_count, v_max_seats;
  END IF;

  -- 4. Validate role
  IF v_assigned_role NOT IN ('owner', 'manager', 'cashier', 'staff', 'hr') THEN
    v_assigned_role := 'staff';
  END IF;

  -- 5. Encrypt password using pgcrypto blowfish
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

  -- 6. Check if user already exists in auth.users
  SELECT id INTO v_new_user_id FROM auth.users WHERE LOWER(email) = v_clean_email LIMIT 1;

  IF v_new_user_id IS NOT NULL THEN
    -- Update existing user: set password, confirm email, update metadata
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW(),
      raw_user_meta_data = jsonb_build_object(
        'full_name', v_clean_name,
        'invited_to_shop_id', v_shop_id,
        'invited_role', v_assigned_role
      )
    WHERE id = v_new_user_id;

    -- Ensure identity exists and is active
    UPDATE auth.identities
    SET identity_data = jsonb_build_object('sub', v_new_user_id::text, 'email', v_clean_email),
        last_sign_in_at = NOW()
    WHERE user_id = v_new_user_id AND provider = 'email';

    IF NOT FOUND THEN
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) VALUES (
        v_new_user_id, v_new_user_id,
        jsonb_build_object('sub', v_new_user_id::text, 'email', v_clean_email),
        'email', v_new_user_id::text, NOW(), NOW(), NOW()
      ) ON CONFLICT (provider, provider_id) DO NOTHING;
    END IF;
  ELSE
    -- Create brand new user in auth.users
    v_new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      v_new_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_clean_email,
      v_encrypted_pw,
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', v_clean_name,
        'invited_to_shop_id', v_shop_id,
        'invited_role', v_assigned_role
      ),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_new_user_id,
      v_new_user_id,
      jsonb_build_object('sub', v_new_user_id::text, 'email', v_clean_email),
      'email',
      v_new_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- 7. Upsert profile with shop_id and email
  INSERT INTO public.profiles (user_id, shop_id, full_name, email)
  VALUES (v_new_user_id, v_shop_id, v_clean_name, v_clean_email)
  ON CONFLICT (user_id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- 8. Upsert role
  INSERT INTO public.user_roles (user_id, shop_id, role)
  VALUES (v_new_user_id, v_shop_id, v_assigned_role::app_role)
  ON CONFLICT (user_id, shop_id) DO UPDATE SET
    role = EXCLUDED.role;

  -- 9. Optional audit logging
  BEGIN
    INSERT INTO public.audit_log (shop_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      v_shop_id,
      v_caller_id,
      'user_created',
      'profiles',
      v_new_user_id,
      jsonb_build_object('email', v_clean_email, 'role', v_assigned_role)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'email', v_clean_email,
    'role', v_assigned_role
  );
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_create_staff_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. One-time fix for existing unconfirmed users and orphaned staff records
-- Auto-confirms any pending users so they can log in right away
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Link any auth users that have invited_to_shop_id to profiles & user_roles
INSERT INTO public.profiles (user_id, shop_id, full_name, email)
SELECT 
  u.id, 
  (u.raw_user_meta_data->>'invited_to_shop_id')::UUID, 
  COALESCE(u.raw_user_meta_data->>'full_name', 'Staff'), 
  u.email
FROM auth.users u
WHERE u.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT (user_id) DO UPDATE SET
  shop_id = EXCLUDED.shop_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

INSERT INTO public.user_roles (user_id, shop_id, role)
SELECT 
  u.id, 
  (u.raw_user_meta_data->>'invited_to_shop_id')::UUID, 
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'invited_role'), ''), 'staff')::app_role
FROM auth.users u
WHERE u.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.shop_id = (u.raw_user_meta_data->>'invited_to_shop_id')::UUID)
ON CONFLICT (user_id, shop_id) DO UPDATE SET
  role = EXCLUDED.role;

-- 5. Database RPC: admin_delete_staff_user
-- Completely unlinks and deletes a staff user from the shop:
-- Nullifies references in sales, POs, audit logs, and tasks to prevent foreign key errors,
-- removes page permissions, user role, profile, and permanently purges auth.users.
CREATE OR REPLACE FUNCTION public.admin_delete_staff_user(
  p_user_id UUID,
  p_shop_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_shop_id UUID;
  v_caller_role TEXT;
  v_profile_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Resolve caller shop
  IF p_shop_id IS NOT NULL THEN
    v_shop_id := p_shop_id;
  ELSE
    SELECT shop_id INTO v_shop_id FROM public.profiles WHERE user_id = v_caller_id LIMIT 1;
  END IF;

  -- Check caller is owner or manager in this shop
  SELECT role::text INTO v_caller_role
  FROM public.user_roles
  WHERE user_id = v_caller_id AND shop_id = v_shop_id
  LIMIT 1;

  IF v_caller_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Only shop owners and managers can remove staff users';
  END IF;

  -- Cannot delete yourself
  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Cannot delete an owner
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND shop_id = v_shop_id AND role = 'owner') THEN
    RAISE EXCEPTION 'Cannot remove a shop owner';
  END IF;

  -- Get profile ID
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = p_user_id AND shop_id = v_shop_id LIMIT 1;

  -- 1. Safely nullify foreign key references pointing to profile or auth user
  BEGIN
    IF v_profile_id IS NOT NULL THEN
      UPDATE public.sales SET employee_id = NULL WHERE employee_id = v_profile_id;
      UPDATE public.purchase_orders SET created_by = NULL WHERE created_by = v_profile_id;
      UPDATE public.purchase_orders SET approved_by = NULL WHERE approved_by = v_profile_id;
    END IF;
    UPDATE public.sales SET cashier_id = NULL WHERE cashier_id = p_user_id;
    UPDATE public.audit_log SET user_id = NULL WHERE user_id = p_user_id;
    UPDATE public.customer_transactions SET recorded_by = NULL WHERE recorded_by = p_user_id;
    UPDATE public.expenses SET employee_id = NULL WHERE employee_id = p_user_id;
    UPDATE public.expenses SET approved_by = NULL WHERE approved_by = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Remove page permissions
  BEGIN
    DELETE FROM public.user_page_access WHERE user_id = p_user_id AND shop_id = v_shop_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 3. Remove role
  BEGIN
    DELETE FROM public.user_roles WHERE user_id = p_user_id AND shop_id = v_shop_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 4. Disassociate profile from shop
  BEGIN
    UPDATE public.profiles SET shop_id = NULL WHERE user_id = p_user_id AND shop_id = v_shop_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 5. Remove profile
  BEGIN
    DELETE FROM public.profiles WHERE user_id = p_user_id AND shop_id = v_shop_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 6. If this user has no other shop roles, remove from auth.users completely so they cannot log in
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id) THEN
    BEGIN
      DELETE FROM auth.users WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_staff_user(UUID, UUID) TO authenticated;

-- 6. Database RPC: apply_shop_referral
-- Securely links a newly created shop with a referrer shop via referral code (e.g. for Google OAuth signups)
CREATE OR REPLACE FUNCTION public.apply_shop_referral(
  p_shop_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID;
  v_clean_code TEXT;
  v_referrer_shop_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_clean_code := UPPER(NULLIF(TRIM(p_referral_code), ''));
  IF v_clean_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral code is required');
  END IF;

  -- Verify caller belongs to p_shop_id
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_caller_id AND shop_id = p_shop_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized shop access');
  END IF;

  -- Find referrer shop
  SELECT id INTO v_referrer_shop_id
  FROM public.shops
  WHERE UPPER(referral_code) = v_clean_code
  LIMIT 1;

  IF v_referrer_shop_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  IF v_referrer_shop_id = p_shop_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
  END IF;

  -- Update shop's referred_by_code
  UPDATE public.shops
  SET referred_by_code = v_clean_code
  WHERE id = p_shop_id;

  -- Insert or link in referrals table
  INSERT INTO public.referrals (referrer_shop_id, referred_shop_id, discount_percent, status)
  VALUES (v_referrer_shop_id, p_shop_id, 5.00, 'pending')
  ON CONFLICT (referred_shop_id) DO UPDATE SET
    referrer_shop_id = EXCLUDED.referrer_shop_id,
    discount_percent = 5.00,
    status = 'pending';

  RETURN jsonb_build_object('success', true, 'referrer_shop_id', v_referrer_shop_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_shop_referral(UUID, TEXT) TO authenticated;

-- Ensure referrals table allows insert by authenticated users for their own shop
DROP POLICY IF EXISTS "referrals_insert" ON public.referrals;
CREATE POLICY "referrals_insert" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (
    referred_shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

  