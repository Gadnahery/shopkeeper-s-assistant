-- Migration 025: Optional appointments for service and hybrid businesses.
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  service_name TEXT NOT NULL,
  staff_name TEXT,
  appointment_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_shop_time_idx ON public.appointments (shop_id, appointment_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appt_s" ON public.appointments;
DROP POLICY IF EXISTS "appt_i" ON public.appointments;
DROP POLICY IF EXISTS "appt_u" ON public.appointments;
DROP POLICY IF EXISTS "appt_d" ON public.appointments;

CREATE POLICY "appt_s" ON public.appointments FOR SELECT TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "appt_i" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "appt_u" ON public.appointments FOR UPDATE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
CREATE POLICY "appt_d" ON public.appointments FOR DELETE TO authenticated
  USING (shop_id = public.get_user_shop_id(auth.uid()));
