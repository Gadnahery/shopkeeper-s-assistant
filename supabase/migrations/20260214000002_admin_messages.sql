-- Admin-to-staff messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID NOT NULL,
  recipient_user_id UUID NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_shop ON public.messages(shop_id);

-- RLS: Users can read messages where they are sender or recipient
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
  USING (
    sender_user_id = auth.uid() OR recipient_user_id = auth.uid()
  );

-- RLS: Only owners can send messages to staff in their shop
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND shop_id = public.get_user_shop_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.shop_id = messages.shop_id AND ur.role = 'owner'
    )
  );

-- Recipient can update read_at only
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());
