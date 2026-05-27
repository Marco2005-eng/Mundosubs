-- Agregar campos de perfil a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS password_hash text;

SELECT '✅ Campos agregados a users' AS mensaje;