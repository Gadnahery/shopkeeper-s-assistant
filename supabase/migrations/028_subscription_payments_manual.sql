-- Migration 028: Extend subscription_payments for manual verification flow
-- Adds proof_url, verified_by, verified_at, rejection_reason columns.
-- Adds 'rejected' to the status check constraint.
-- Sets TZS 25,000 as the default monthly price and backfills zeroed rows.

-- ─── 1. New columns on subscription_payments ──────────────────────────────────
ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS proof_url TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- ─── 2. Extend status check to include 'rejected' ─────────────────────────────
ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_status_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_status_check
  CHECK (status IN ('pending', 'success', 'failed', 'cancelled', 'expired', 'rejected'));

-- ─── 3. Set TZS 25,000 as default monthly price ───────────────────────────────
ALTER TABLE public.shop_subscriptions
  ALTER COLUMN monthly_price SET DEFAULT 25000;

-- Backfill existing rows that still have 0 (unset).
UPDATE public.shop_subscriptions
SET monthly_price = 25000
WHERE monthly_price = 0 OR monthly_price IS NULL;

-- ─── 4. Storage bucket for payment proof screenshots ──────────────────────────
-- NOTE: Run this via the Supabase dashboard or CLI:
--   supabase storage create-bucket payment-proofs --private
-- Or apply via SQL using the storage schema:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,               -- private bucket
  5242880,             -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: shop users can upload to their own folder (shop_id prefix).
CREATE POLICY "payment_proofs_insert_own"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = public.get_user_shop_id(auth.uid())::text
);

-- RLS: shop users can read their own proofs.
CREATE POLICY "payment_proofs_select_own"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    (storage.foldername(name))[1] = public.get_user_shop_id(auth.uid())::text
    OR public.is_platform_admin(auth.uid())
  )
);
