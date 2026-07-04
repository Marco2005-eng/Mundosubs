-- 1. Añadir columna description a products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;

-- 2. Añadir columna avatar_url a profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. Actualizar función trigger handle_new_auth_user para sincronizar avatar_url
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    CASE WHEN new.raw_user_meta_data ->> 'role' = 'admin' then 'admin' ELSE 'cliente' END,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    role = CASE WHEN excluded.role = 'admin' then 'admin' ELSE profiles.role END,
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), profiles.avatar_url),
    updated_at = now();

  RETURN new;
END;
$$;

-- 4. Crear tabla resena_user_public
CREATE TABLE IF NOT EXISTS public.resena_user_public (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name    text NOT NULL,
  user_email   text NOT NULL,
  user_avatar  text,
  rating       integer NOT NULL CONSTRAINT rating_check CHECK (rating >= 1 AND rating <= 5),
  comment      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 5. Habilitar RLS en resena_user_public
ALTER TABLE public.resena_user_public ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de RLS para resena_user_public
DROP POLICY IF EXISTS "Permitir lectura publica de resenas" ON public.resena_user_public;
CREATE POLICY "Permitir lectura publica de resenas"
  ON public.resena_user_public FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Permitir insercion a usuarios autenticados" ON public.resena_user_public;
CREATE POLICY "Permitir insercion a usuarios autenticados"
  ON public.resena_user_public FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
