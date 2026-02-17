-- Fix: Add department column to staff table (used by HRM form)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS department TEXT;

-- Add auto_print_receipt to shop_settings (persist Settings switches)
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS auto_print_receipt BOOLEAN DEFAULT false;
