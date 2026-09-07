-- Migration 032: Align shops preferences and notification links
-- Adds auto_print_receipt and enable_low_stock_alerts columns to shops table
-- Adds link column to notifications table for click-through navigation

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS auto_print_receipt BOOLEAN DEFAULT false;

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS enable_low_stock_alerts BOOLEAN DEFAULT true;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link TEXT;
