-- Ensure categories has a description column (for Add/Edit Category form)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
