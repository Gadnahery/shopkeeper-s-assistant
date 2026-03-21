ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'US';

UPDATE public.shops
SET
  locale = COALESCE(NULLIF(locale, ''), 'en-US'),
  country_code = COALESCE(NULLIF(country_code, ''), 'US'),
  currency = COALESCE(NULLIF(currency, ''), 'USD');

ALTER TABLE public.shops
  ALTER COLUMN locale SET DEFAULT 'en-US',
  ALTER COLUMN country_code SET DEFAULT 'US',
  ALTER COLUMN currency SET DEFAULT 'USD';
