-- Add optional customer_name to sales (for POS customer name field).
-- Run this in Supabase SQL Editor if the column is missing.
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
