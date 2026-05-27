-- ==============================================================================
-- SCRIPT PARA CORREGIR RELACIONES DE TABLAS EN SUPABASE
-- Ejecutar esto en el Editor SQL de Supabase (Dashboard > SQL Editor)
-- ==============================================================================

-- ==============================================================================
-- 1. ELIMINAR FOREIGN KEYS ACTUALES QUE APUNTAN A auth.users
-- ==============================================================================

-- Eliminar FK de orders que apunta a auth.users
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Eliminar FK de subscriptions que apunta a auth.users  
ALTER TABLE public.subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Eliminar FK de user_discounts que apunta a auth.users
ALTER TABLE public.user_discounts 
  DROP CONSTRAINT IF EXISTS user_discounts_user_id_fkey;


-- ==============================================================================
-- 2. AGREGAR NUEVAS FOREIGN KEYS APUNTANDO A public.users
-- ==============================================================================

-- Nueva FK para orders -> users
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Nueva FK para subscriptions -> users
ALTER TABLE public.subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Nueva FK para user_discounts -> users
ALTER TABLE public.user_discounts 
  ADD CONSTRAINT user_discounts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- ==============================================================================
-- 3. VERIFICAR QUE user_profiles TENGA RELACIÓN CON users
-- ==============================================================================

-- Si user_profiles tiene columna user_id, crear la FK
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'user_id'
  ) THEN
    -- Eliminar FK existente si la hay
    ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
    
    -- Agregar nueva FK
    ALTER TABLE public.user_profiles 
      ADD CONSTRAINT user_profiles_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ==============================================================================
-- 4. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_discounts_user_id ON public.user_discounts(user_id);


-- ==============================================================================
-- 5. VERIFICAR LAS RELACIONES CREADAS
-- ==============================================================================

SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('orders', 'subscriptions', 'user_discounts', 'user_profiles');