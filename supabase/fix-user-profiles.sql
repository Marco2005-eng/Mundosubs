-- Corregir trigger de user_profiles
-- Primero, eliminar el trigger problemático si existe

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recrear la tabla (si ya existe, esto la recrea limpia)
DROP TABLE IF EXISTS public.user_profiles;

CREATE TABLE public.user_profiles (
  id              uuid PRIMARY KEY,
  email           text NOT NULL,
  full_name       text,
  role            text NOT NULL DEFAULT 'cliente',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_read_own" ON public.user_profiles;
CREATE POLICY "user_profiles_read_own" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_admin" ON public.user_profiles FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger con manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Trigger corregido' AS mensaje;