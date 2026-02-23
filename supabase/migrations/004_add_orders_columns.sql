-- Add missing columns to orders table (used by Orders page)
-- Run this in Supabase SQL Editor if you get "due_date column not found" error

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Refresh schema cache (optional, but helps)
NOTIFY pgrst, 'reload schema';
