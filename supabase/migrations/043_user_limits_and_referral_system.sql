-- Migration 043: User Seat Limits and Referral Program System
-- 1. Ensures profiles table has email column
-- 2. Adds seat limits (4 base users + extra_user_seats @ 5,000 TZS each)
-- 3. Adds referral tracking (5% discount on next subscription renewal per referred shop)

-- 0. Ensure public.profiles has email column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 1. Add seat and referral columns to public.shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS extra_user_seats INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- 2. Unique referral code generator helper
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i INT;
  v_random_str TEXT;
BEGIN
  LOOP
    v_random_str := '';
    FOR v_i IN 1..6 LOOP
      v_random_str := v_random_str || SUBSTR(v_chars, FLOOR(RANDOM() * LENGTH(v_chars) + 1)::INT, 1);
    END LOOP;
    v_code := 'WISE-' || v_random_str;

    SELECT EXISTS(SELECT 1 FROM public.shops WHERE referral_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- 3. Populate referral codes for any existing shops without one
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.shops WHERE referral_code IS NULL LOOP
    UPDATE public.shops
    SET referral_code = public.generate_unique_referral_code()
    WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Automatically generate referral_code on new shop insert if not provided
CREATE OR REPLACE FUNCTION public.set_shop_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.referral_code IS NULL OR TRIM(NEW.referral_code) = '' THEN
    NEW.referral_code := public.generate_unique_referral_code();
  ELSE
    NEW.referral_code := UPPER(TRIM(NEW.referral_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_shop_referral_code ON public.shops;
CREATE TRIGGER trg_set_shop_referral_code
  BEFORE INSERT ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.set_shop_referral_code();

-- 5. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  referred_shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'expired')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_shop_id ON public.referrals(referrer_shop_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_shop_id ON public.referrals(referred_shop_id);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view referrals where their shop is referrer or referred" ON public.referrals;
CREATE POLICY "Users can view referrals where their shop is referrer or referred"
  ON public.referrals FOR SELECT
  USING (
    referrer_shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    ) OR
    referred_shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 6. Helper function to check capacity for a shop
-- Base capacity is 4 assigned staff members under the owner.
CREATE OR REPLACE FUNCTION public.check_shop_user_capacity(p_shop_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_extra_seats INT;
  v_max_capacity INT;
  v_current_assigned INT;
BEGIN
  SELECT COALESCE(extra_user_seats, 0)
  INTO v_extra_seats
  FROM public.shops
  WHERE id = p_shop_id;

  v_max_capacity := 4 + COALESCE(v_extra_seats, 0);

  SELECT COUNT(*)
  INTO v_current_assigned
  FROM public.user_roles
  WHERE shop_id = p_shop_id AND role != 'owner';

  RETURN v_current_assigned < v_max_capacity;
END;
$$;

-- 7. Update handle_new_user() trigger function to handle referrals and staff assignments safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_shop_id UUID;
  inv_role TEXT;
  v_country_code TEXT;
  v_currency TEXT;
  v_locale TEXT;
  v_referred_by_code TEXT;
  v_referrer_shop_id UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL THEN
    BEGIN
      new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
      inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff');
      IF inv_role NOT IN ('owner','manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;

      BEGIN
        INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) 
        VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone, NEW.email)
        ON CONFLICT (user_id) DO UPDATE SET
          shop_id = EXCLUDED.shop_id,
          full_name = EXCLUDED.full_name,
          email = COALESCE(EXCLUDED.email, public.profiles.email);
      EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.profiles (user_id, shop_id, full_name, phone) 
        VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone)
        ON CONFLICT (user_id) DO NOTHING;
      END;

      INSERT INTO public.user_roles (user_id, shop_id, role) 
      VALUES (NEW.id, new_shop_id, inv_role::app_role)
      ON CONFLICT (user_id, shop_id) DO UPDATE SET role = EXCLUDED.role;
    EXCEPTION WHEN OTHERS THEN
      -- Ensure trigger does not block user creation
      NULL;
    END;
  ELSE
    -- Resolve country, currency, and locale from user signup metadata
    v_country_code := UPPER(COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'country_code'), ''), 'TZ'));
    
    v_currency := UPPER(COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'currency'), ''),
      CASE v_country_code
        WHEN 'TZ' THEN 'TZS'
        WHEN 'KE' THEN 'KES'
        WHEN 'UG' THEN 'UGX'
        WHEN 'RW' THEN 'RWF'
        WHEN 'BI' THEN 'BIF'
        WHEN 'CD' THEN 'CDF'
        WHEN 'SS' THEN 'SSP'
        WHEN 'ZM' THEN 'ZMW'
        WHEN 'MW' THEN 'MWK'
        WHEN 'MZ' THEN 'MZN'
        WHEN 'ZA' THEN 'ZAR'
        WHEN 'NG' THEN 'NGN'
        WHEN 'GH' THEN 'GHS'
        WHEN 'GB' THEN 'GBP'
        WHEN 'EU' THEN 'EUR'
        WHEN 'AE' THEN 'AED'
        WHEN 'IN' THEN 'INR'
        WHEN 'CN' THEN 'CNY'
        WHEN 'CA' THEN 'CAD'
        WHEN 'AU' THEN 'AUD'
        WHEN 'US' THEN 'USD'
        ELSE 'TZS'
      END
    ));

    v_locale := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'locale'), ''),
      CASE v_country_code
        WHEN 'TZ' THEN 'sw-TZ'
        WHEN 'KE' THEN 'en-KE'
        WHEN 'UG' THEN 'en-UG'
        WHEN 'RW' THEN 'en-RW'
        WHEN 'BI' THEN 'fr-BI'
        WHEN 'CD' THEN 'fr-CD'
        WHEN 'SS' THEN 'en-SS'
        WHEN 'ZM' THEN 'en-ZM'
        WHEN 'MW' THEN 'en-MW'
        WHEN 'MZ' THEN 'pt-MZ'
        WHEN 'ZA' THEN 'en-ZA'
        WHEN 'NG' THEN 'en-NG'
        WHEN 'GH' THEN 'en-GH'
        WHEN 'GB' THEN 'en-GB'
        WHEN 'EU' THEN 'en-EU'
        WHEN 'AE' THEN 'ar-AE'
        WHEN 'IN' THEN 'en-IN'
        WHEN 'CN' THEN 'zh-CN'
        WHEN 'CA' THEN 'en-CA'
        WHEN 'AU' THEN 'en-AU'
        WHEN 'US' THEN 'en-US'
        ELSE 'sw-TZ'
      END
    );

    v_referred_by_code := UPPER(NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'referred_by_code',
      NEW.raw_user_meta_data->>'referral_code'
    )), ''));

    INSERT INTO public.shops (name, phone, country_code, currency, locale, referred_by_code)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'),
      NEW.phone,
      v_country_code,
      v_currency,
      v_locale,
      v_referred_by_code
    ) 
    RETURNING id INTO new_shop_id;

    -- If a referral code was provided, link with the referring shop
    IF v_referred_by_code IS NOT NULL THEN
      SELECT id INTO v_referrer_shop_id
      FROM public.shops
      WHERE referral_code = v_referred_by_code
      LIMIT 1;

      IF v_referrer_shop_id IS NOT NULL AND v_referrer_shop_id != new_shop_id THEN
        INSERT INTO public.referrals (referrer_shop_id, referred_shop_id, discount_percent, status)
        VALUES (v_referrer_shop_id, new_shop_id, 5.00, 'pending')
        ON CONFLICT (referred_shop_id) DO NOTHING;
      END IF;
    END IF;

    BEGIN
      INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) 
      VALUES (
        NEW.id, 
        new_shop_id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), 
        NEW.phone, 
        NEW.email
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.profiles (user_id, shop_id, full_name, phone) 
      VALUES (
        NEW.id, 
        new_shop_id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), 
        NEW.phone
      )
      ON CONFLICT (user_id) DO NOTHING;
    END;

    INSERT INTO public.user_roles (user_id, shop_id, role) 
    VALUES (NEW.id, new_shop_id, 'owner')
    ON CONFLICT (user_id, shop_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
