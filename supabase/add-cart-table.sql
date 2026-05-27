-- =====================================================
-- Tabla de Carrito persistente en Supabase
-- =====================================================

-- Tabla de items del carrito
CREATE TABLE IF NOT EXISTS public.cart_items (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity        int NOT NULL DEFAULT 1,
  discount_pct    numeric(5,2) NOT NULL DEFAULT 0,
  discount_id     uuid REFERENCES public.discounts(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Política: usuarios ven su propio carrito
DROP POLICY IF EXISTS "cart_items_read_own" ON public.cart_items;
CREATE POLICY "cart_items_read_own" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_items_insert_own" ON public.cart_items;
CREATE POLICY "cart_items_insert_own" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_items_update_own" ON public.cart_items;
CREATE POLICY "cart_items_update_own" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_items_delete_own" ON public.cart_items;
CREATE POLICY "cart_items_delete_own" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

SELECT '✅ Tabla cart_items creada correctamente' AS mensaje;