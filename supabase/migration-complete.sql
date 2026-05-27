-- =====================================================
-- MUNDOSUBS - Schema completo para el proyecto
-- Ejecutar este SQL en el Supabase SQL Editor
-- =====================================================

-- 1. Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de productos (catálogo de servicios)
CREATE TABLE IF NOT EXISTS public.products (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  category      text NOT NULL CHECK (category IN ('streaming','game','license','software','music')),
  price         numeric(10,2) NOT NULL,
  duration_days int NOT NULL,
  features      text[] NOT NULL DEFAULT '{}',
  active        bool NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla de descuentos
CREATE TABLE IF NOT EXISTS public.discounts (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  label          text NOT NULL,
  type           text NOT NULL CHECK (type IN ('loyalty','manual')),
  pct            numeric(5,2) NOT NULL,
  min_purchases  int,
  product_id     uuid REFERENCES public.products(id) ON DELETE SET NULL,
  category       text,
  active         bool NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabla de pedidos (órdenes)
CREATE TABLE IF NOT EXISTS public.orders (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id),
  amount          numeric(10,2) NOT NULL,
  original_amount numeric(10,2) NOT NULL,
  discount_id     uuid REFERENCES public.discounts(id) ON DELETE SET NULL,
  discount_pct    numeric(5,2) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz
);

-- 5. Tabla de vouchers (comprobantes de pago)
CREATE TABLE IF NOT EXISTS public.vouchers (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url         text NOT NULL,
  operation_number text NOT NULL,
  bank             text NOT NULL,
  uploaded_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabla de suscripciones
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

-- 7. Tabla de descuentos de usuario
CREATE TABLE IF NOT EXISTS public.user_discounts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_id uuid NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  used_at     timestamptz,
  note        text
);

-- 8. Tabla de configuración
CREATE TABLE IF NOT EXISTS public.settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insertar configuración inicial
INSERT INTO public.settings (key, value) VALUES
  ('whatsapp_number', '51977706674'),
  ('business_name', 'MUNDOSUBS'),
  ('contact_email', 'hola@mundosubs.pe')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_discounts_user_id ON public.user_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_order_id ON public.vouchers(order_id);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Products: lectura pública para activos, admin para todo
DROP POLICY IF EXISTS "products_read" ON public.products;
CREATE POLICY "products_read" ON public.products FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "products_admin" ON public.products;
CREATE POLICY "products_admin" ON public.products FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Orders: usuarios leen los propios, admin lee todo
DROP POLICY IF EXISTS "orders_read_own" ON public.orders;
CREATE POLICY "orders_read_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin" ON public.orders;
CREATE POLICY "orders_admin" ON public.orders FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Vouchers: usuarios leen los propios
DROP POLICY IF EXISTS "vouchers_read_own" ON public.vouchers;
CREATE POLICY "vouchers_read_own" ON public.vouchers FOR SELECT 
  USING ( EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = vouchers.order_id 
    AND orders.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "vouchers_admin" ON public.vouchers;
CREATE POLICY "vouchers_admin" ON public.vouchers FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions_read_own" ON public.subscriptions;
CREATE POLICY "subscriptions_read_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_admin" ON public.subscriptions FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Discounts: todos los usuarios autenticados pueden leer
DROP POLICY IF EXISTS "discounts_read" ON public.discounts;
CREATE POLICY "discounts_read" ON public.discounts FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "discounts_admin" ON public.discounts;
CREATE POLICY "discounts_admin" ON public.discounts FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- User discounts
DROP POLICY IF EXISTS "user_discounts_read_own" ON public.user_discounts;
CREATE POLICY "user_discounts_read_own" ON public.user_discounts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_discounts_admin" ON public.user_discounts;
CREATE POLICY "user_discounts_admin" ON public.user_discounts FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Settings
DROP POLICY IF EXISTS "settings_read" ON public.settings;
CREATE POLICY "settings_read" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin" ON public.settings;
CREATE POLICY "settings_admin" ON public.settings FOR ALL USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- =====================================================
-- INSERTAR PRODUCTOS DE EJEMPLO
-- =====================================================
INSERT INTO public.products (name, category, price, duration_days, features, active) VALUES
  ('Netflix Premium', 'streaming', 39.90, 30, ARRAY['Ultra HD','4 pantallas','Descarga offline'], true),
  ('Spotify Premium', 'music', 19.90, 30, ARRAY['Sin anuncios','Música offline','Alta calidad'], true),
  ('Xbox Game Pass Ultimate', 'game', 49.90, 30, ARRAY['Juegos day one','EA Play','Nube'], true),
  ('Adobe Creative Cloud', 'software', 79.90, 30, ARRAY['Todas las apps','100GB Storage','Templates'], true),
  ('Steam Wallet S/50', 'license', 50.00, 365, ARRAY['Código digital','Entrega inmediata','Valido Perú'], true),
  ('Disney+ Premium', 'streaming', 32.90, 30, ARRAY['4K HDR','Multiplex'], true),
  ('HBO Max', 'streaming', 29.90, 30, ARRAY['Series originales','Películas nuevas'], true),
  ('YouTube Premium', 'streaming', 29.90, 30, ARRAY['Sin anuncios','YouTube Music','Fondo'], true)
ON CONFLICT DO NOTHING;

SELECT '✅ Base de datos configurada correctamente' AS mensaje;