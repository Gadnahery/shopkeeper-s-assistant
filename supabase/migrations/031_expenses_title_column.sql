-- Migration 031: Expenses Title & Description Compatibility
-- Add 'title' column to public.expenses for forward/backward compatibility

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS title TEXT;

-- Sync existing rows
UPDATE public.expenses 
SET title = description 
WHERE title IS NULL AND description IS NOT NULL;

-- Trigger to keep title and description synchronized automatically
CREATE OR REPLACE FUNCTION public.sync_expenses_title_and_description()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NULL AND NEW.description IS NOT NULL THEN
    NEW.title := NEW.description;
  ELSIF NEW.description IS NULL AND NEW.title IS NOT NULL THEN
    NEW.description := NEW.title;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_expenses_title_description ON public.expenses;
CREATE TRIGGER trg_sync_expenses_title_description
BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.sync_expenses_title_and_description();
