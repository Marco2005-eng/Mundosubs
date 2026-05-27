-- Datos de acceso entregados al cliente tras aprobar un pago.
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.subscription_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  login_url text,
  account_email text,
  account_password text,
  profile_name text,
  profile_pin text,
  login_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_access_user_id ON public.subscription_access(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_access_order_id ON public.subscription_access(order_id);

ALTER TABLE public.subscription_access ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscription_access
  ADD COLUMN IF NOT EXISTS login_code text;

DROP POLICY IF EXISTS "subscription_access_read_own" ON public.subscription_access;
CREATE POLICY "subscription_access_read_own"
ON public.subscription_access FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscription_access_admin" ON public.subscription_access;
CREATE POLICY "subscription_access_admin"
ON public.subscription_access FOR ALL
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
