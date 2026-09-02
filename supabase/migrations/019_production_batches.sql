-- Production Batches Migration for Manufacturing / Production Tracking

CREATE TABLE IF NOT EXISTS public.production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  output_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_to_produce NUMERIC NOT NULL DEFAULT 1,
  quantity_produced NUMERIC NOT NULL DEFAULT 0,
  input_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_batches_shop_id ON public.production_batches(shop_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_status ON public.production_batches(status);
CREATE INDEX IF NOT EXISTS idx_production_batches_output_product ON public.production_batches(output_product_id);

-- Enable RLS
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view production batches for their shop"
  ON public.production_batches
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert production batches for their shop"
  ON public.production_batches
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update production batches for their shop"
  ON public.production_batches
  FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete production batches for their shop"
  ON public.production_batches
  FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
