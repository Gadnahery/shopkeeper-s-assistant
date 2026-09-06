-- Migration 023: Additive universal business profile and capability configuration.
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{"products": true, "services": false, "inventory": true, "purchases": true, "sales": true, "customers": true, "suppliers": true, "expenses": true, "employees": false, "appointments": false, "manufacturing": false, "batches": false, "expiry_tracking": false, "serial_numbers": false, "loyalty": false, "credit": true, "orders": true, "assets": false, "reports": true, "payments": true}'::jsonb;

ALTER TABLE public.shops
  DROP CONSTRAINT IF EXISTS shops_business_type_check;

ALTER TABLE public.shops
  ADD CONSTRAINT shops_business_type_check
  CHECK (business_type IN ('retail', 'wholesale', 'service', 'hybrid', 'manufacturing', 'pharmacy', 'other'));

COMMENT ON COLUMN public.shops.business_type IS 'Industry-agnostic business profile used to recommend and filter modules.';
COMMENT ON COLUMN public.shops.capabilities IS 'Enabled WiseCash modules for this business. Keys are additive feature flags.';
