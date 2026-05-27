-- Función para verificar contraseña
CREATE OR REPLACE FUNCTION public.verify_password(p_user_id uuid, p_password text)
RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT (password_hash = crypt(p_password, password_hash)) INTO result
  FROM public.users
  WHERE id = p_user_id;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_password(uuid, text) TO anon, authenticated;

SELECT '✅ Función verify_password creada' AS mensaje;