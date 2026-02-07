
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  today_count INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count FROM public.sales WHERE DATE(created_at) = CURRENT_DATE;
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$;
