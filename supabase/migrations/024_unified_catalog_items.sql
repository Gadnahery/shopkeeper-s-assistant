-- Migration 024: Extend the existing catalog so products and services share one model.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_discount BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tax_profile TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_item_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_item_type_check
  CHECK (item_type IN ('product', 'service'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_duration_minutes_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_duration_minutes_check
  CHECK (duration_minutes IS NULL OR duration_minutes > 0);

COMMENT ON COLUMN public.products.item_type IS 'Unified catalog item type: product or service.';
COMMENT ON COLUMN public.products.track_inventory IS 'Services and non-stock items can be sold without quantity tracking.';
