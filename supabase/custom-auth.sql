-- Trigger para hashear passwords automáticamente
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agregar trigger a la tabla users
DROP TRIGGER IF EXISTS password_hash_trigger ON public.users;
CREATE TRIGGER password_hash_trigger
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION hash_password_trigger();

-- Actualizar passwords existentes (si hay)
UPDATE public.users SET password_hash = crypt(password_hash, gen_salt('bf')) 
WHERE password_hash NOT LIKE '$2a%';

-- Función de login
CREATE OR REPLACE FUNCTION public.login(email text, password text)
RETURNS TABLE(id uuid, email text, full_name text, role text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role
  FROM public.users u
  WHERE u.email = email 
    AND u.password_hash = crypt(password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar función para uso externo
GRANT EXECUTE ON FUNCTION public.login(text, text) TO PUBLIC;

SELECT '✅ Auth personalizado configurado' AS mensaje;