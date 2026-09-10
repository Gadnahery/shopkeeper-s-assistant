-- Migration 040: Auto-set shop country, primary currency, and locale for newly registered users
-- Sets country_code, currency, and locale on public.shops from auth.users raw_user_meta_data.

-- 1. Update defaults on public.shops to reflect East African base
ALTER TABLE public.shops
  ALTER COLUMN country_code SET DEFAULT 'TZ',
  ALTER COLUMN currency SET DEFAULT 'TZS',
  ALTER COLUMN locale SET DEFAULT 'sw-TZ';

-- 2. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_shop_id UUID;
  inv_role TEXT;
  v_country_code TEXT;
  v_currency TEXT;
  v_locale TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'invited_to_shop_id' IS NOT NULL THEN
    new_shop_id := (NEW.raw_user_meta_data->>'invited_to_shop_id')::UUID;
    inv_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'invited_role'), ''), 'staff');
    IF inv_role NOT IN ('owner','manager','cashier','staff','hr') THEN inv_role := 'staff'; END IF;
    INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) 
    VALUES (NEW.id, new_shop_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Staff'), NEW.phone, NEW.email);
    INSERT INTO public.user_roles (user_id, shop_id, role) 
    VALUES (NEW.id, new_shop_id, inv_role::app_role);
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

    INSERT INTO public.shops (name, phone, country_code, currency, locale)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'shop_name', 'My Shop'),
      NEW.phone,
      v_country_code,
      v_currency,
      v_locale
    ) 
    RETURNING id INTO new_shop_id;

    INSERT INTO public.profiles (user_id, shop_id, full_name, phone, email) 
    VALUES (
      NEW.id, 
      new_shop_id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Shop Owner'), 
      NEW.phone, 
      NEW.email
    );

    INSERT INTO public.user_roles (user_id, shop_id, role) 
    VALUES (NEW.id, new_shop_id, 'owner');
  END IF;
  RETURN NEW;
END;
$$;
