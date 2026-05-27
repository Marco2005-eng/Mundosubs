-- =====================================================
-- Tabla de Perfiles de Usuario
-- Se sincroniza automáticamente con auth.users
-- =====================================================

-- Tabla de perfiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  full_name       text,
  role            text NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'admin')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuarios ven su propio perfil
DROP POLICY IF EXISTS "user_profiles_read_own" ON public.user_profiles;
CREATE POLICY "user_profiles_read_own" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

-- Política: admin puede ver todos
DROP POLICY IF EXISTS "user_profiles_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_admin" ON public.user_profiles FOR ALL USING (
  auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);

-- Política: usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
CREATE POLICY "user_profiles_update_own" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- Función y Trigger para crear perfil automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta después de insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Tabla user_profiles creada con trigger automático' AS mensaje;