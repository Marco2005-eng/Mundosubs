-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.login(text, text);

-- Crear función de login corregida
CREATE OR REPLACE FUNCTION public.login(p_email text, p_password text)
RETURNS TABLE(id uuid, email text, full_name text, role text) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role
  FROM public.users u
  WHERE u.email = p_email 
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.login(text, text) TO anon, authenticated;

SELECT '✅ Función login corregida' AS mensaje;