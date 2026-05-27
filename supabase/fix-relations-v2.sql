-- ==============================================================================
-- SCRIPT PARA CORREGIR RELACIONES - MANEJO DE DATOS HUÉRFANOS
-- Ejecutar esto en el Editor SQL de Supabase
-- ==============================================================================

-- ==============================================================================
-- 1. Verificar cuántos pedidos tienen user_id que no existe en users
-- ==============================================================================

SELECT 
  'Orders con user_id huérfano' AS info,
  COUNT(*) AS cantidad
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = o.user_id);

SELECT 
  'Subscriptions con user_id huérfano' AS info,
  COUNT(*) AS cantidad
FROM public.subscriptions s
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = s.user_id);

SELECT 
  'User discounts con user_id huérfano' AS info,
  COUNT(*) AS cantidad
FROM public.user_discounts ud
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ud.user_id);


-- ==============================================================================
-- 2. Ver los user_ids huérfanos
-- ==============================================================================

SELECT DISTINCT user_id FROM public.orders 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = orders.user_id);

SELECT DISTINCT user_id FROM public.subscriptions 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = subscriptions.user_id);


-- ==============================================================================
-- 3. OPCIÓN A: Eliminar registros huérfanos (más seguro)
-- ==============================================================================

-- Eliminar orders con user_id huérfano
DELETE FROM public.orders 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = orders.user_id);

-- Eliminar subscriptions con user_id huérfano  
DELETE FROM public.subscriptions 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = subscriptions.user_id);

-- Eliminar user_discounts con user_id huérfano
DELETE FROM public.user_discounts 
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_discounts.user_id);

-- Eliminar vouchers de pedidos huérfanos (si hay)
DELETE FROM public.vouchers 
WHERE NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = vouchers.order_id);

SELECT '✅ Registros huérfanos eliminados' AS resultado;


-- ==============================================================================
-- 4. Ahora ejecutar las FK actualizadas
-- ==============================================================================

-- Eliminar FK antiguas
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.user_discounts DROP CONSTRAINT IF EXISTS user_discounts_user_id_fkey;

-- Crear nuevas FK apuntando a public.users
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions 
  ADD CONSTRAINT subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_discounts 
  ADD CONSTRAINT user_discounts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_discounts_user_id ON public.user_discounts(user_id);

SELECT '✅ Foreign keys actualizadas correctamente' AS resultado;