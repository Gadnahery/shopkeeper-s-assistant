-- Fix duplicate invoice_number: make generation unique (timestamp + random).
-- Run in Supabase SQL Editor if you get "sales_invoice_number_key" duplicate errors.
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  invoice_num TEXT;
  ts_part TEXT;
  rnd_part TEXT;
BEGIN
  ts_part := TO_CHAR(clock_timestamp(), 'YYYYMMDD-HH24MISS') || '-' || LPAD(FLOOR(EXTRACT(MILLISECOND FROM clock_timestamp()))::TEXT, 3, '0');
  rnd_part := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 4));
  invoice_num := 'INV-' || ts_part || '-' || rnd_part;
  RETURN invoice_num;
END;
$$;
