-- Metodos de pago administrables para checkout.
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id text PRIMARY KEY
);

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS holder text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS cci text,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS qr_path text,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.payment_methods
SET title = id
WHERE title IS NULL;

UPDATE public.payment_methods
SET label = title
WHERE label IS NULL;

ALTER TABLE public.payment_methods
  ALTER COLUMN label SET NOT NULL,
  ALTER COLUMN title SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_methods_id_check'
      AND conrelid = 'public.payment_methods'::regclass
  ) THEN
    ALTER TABLE public.payment_methods
      ADD CONSTRAINT payment_methods_id_check
      CHECK (id IN ('bank_transfer', 'yape', 'plin'));
  END IF;
END $$;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_read_enabled" ON public.payment_methods;
CREATE POLICY "payment_methods_read_enabled"
ON public.payment_methods FOR SELECT
USING (enabled = true);

DROP POLICY IF EXISTS "payment_methods_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_admin"
ON public.payment_methods FOR ALL
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

INSERT INTO public.payment_methods (
  id,
  label,
  title,
  description,
  enabled,
  holder,
  phone,
  bank_name,
  account_number,
  cci,
  instructions,
  sort_order
)
VALUES
  (
    'bank_transfer',
    'Transferencia bancaria',
    'Transferencia bancaria',
    'Cuenta bancaria o CCI para pagos manuales.',
    true,
    'MUNDOSUBS',
    null,
    'BCP',
    '000-0000000000',
    '000-000-000000000000-00',
    'Transfiere el monto exacto y sube el comprobante del banco.',
    1
  ),
  (
    'yape',
    'Yape',
    'Yape',
    'Numero y QR para pagos desde Yape.',
    true,
    'MUNDOSUBS',
    '999 999 999',
    null,
    null,
    null,
    'Yapea el monto exacto y sube una captura de la operacion.',
    2
  ),
  (
    'plin',
    'Plin',
    'Plin',
    'Numero y QR para pagos desde Plin.',
    true,
    'MUNDOSUBS',
    '999 999 999',
    null,
    null,
    null,
    'Paga por Plin y adjunta una captura donde se vea el importe.',
    3
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'payment-qrs',
  'payment-qrs',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
