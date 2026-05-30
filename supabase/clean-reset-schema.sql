-- =====================================================
-- MUNDOSUBS - Reset limpio de base de datos
-- =====================================================
-- IMPORTANTE:
-- Este script es destructivo para las tablas del esquema public.
-- Ejecutarlo solo despues de hacer backup/export si hay datos que conservar.
--
-- Fuente de verdad de identidad:
--   - auth.users = autenticacion real de Supabase
--   - public.profiles = datos publicos/operativos del usuario
--
-- Tablas antiguas/redundantes eliminadas:
--   - public.users
--   - public.user_profiles
--   - public.cart_items
--
-- Motivo:
--   public.users y public.user_profiles duplicaban datos de usuario y causaban
--   inconsistencias. El carrito persistente se elimina por ahora para evitar
--   guardar descuentos calculados en cliente; puede reintroducirse despues sin
--   discount_pct si hace falta.

begin;

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- 1. LIMPIEZA DE TABLAS PUBLICAS
-- =====================================================

drop table if exists public.whatsapp_reminders cascade;
drop table if exists public.notifications cascade;
drop table if exists public.coupon_redemptions cascade;
drop table if exists public.coupons cascade;
drop table if exists public.coupon_campaigns cascade;
drop table if exists public.finance_expenses cascade;
drop table if exists public.subscription_access cascade;
drop table if exists public.vouchers cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.orders cascade;
drop table if exists public.user_discounts cascade;
drop table if exists public.discounts cascade;
drop table if exists public.payment_methods cascade;
drop table if exists public.products cascade;
drop table if exists public.settings cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.users cascade;

drop type if exists public.product_category cascade;
drop type if exists public.order_status cascade;
drop type if exists public.discount_type cascade;
drop type if exists public.coupon_status cascade;
drop type if exists public.notification_channel cascade;
drop type if exists public.notification_status cascade;
drop type if exists public.reminder_status cascade;

-- =====================================================
-- 2. TIPOS
-- =====================================================

create type public.product_category as enum (
  'streaming',
  'game',
  'license',
  'software',
  'music'
);

create type public.order_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create type public.discount_type as enum (
  'loyalty',
  'manual',
  'coupon'
);

create type public.coupon_status as enum (
  'draft',
  'scheduled',
  'active',
  'expired',
  'disabled'
);

create type public.notification_channel as enum (
  'web',
  'email',
  'whatsapp_manual'
);

create type public.notification_status as enum (
  'unread',
  'read',
  'archived'
);

create type public.reminder_status as enum (
  'pending',
  'sent',
  'cancelled'
);

-- =====================================================
-- 3. FUNCIONES AUXILIARES
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- 4. PERFIL UNICO DEL USUARIO
-- =====================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  address text,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  whatsapp_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(lower(email));

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'admin' then 'admin' else 'cliente' end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    role = case when excluded.role = 'admin' then 'admin' else profiles.role end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- =====================================================
-- 5. CATALOGO Y METODOS DE PAGO
-- =====================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.product_category not null,
  price numeric(10,2) not null check (price >= 0),
  duration_days int not null check (duration_days > 0),
  features text[] not null default '{}',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_active on public.products(active);
create index idx_products_category on public.products(category);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.payment_methods (
  id text primary key check (id in ('bank_transfer', 'yape', 'plin')),
  label text not null,
  title text not null,
  description text,
  enabled boolean not null default true,
  holder text,
  phone text,
  bank_name text,
  account_number text,
  cci text,
  instructions text,
  qr_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payment_methods_enabled_sort on public.payment_methods(enabled, sort_order);

create trigger payment_methods_set_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

-- =====================================================
-- 6. DESCUENTOS Y CUPONES
-- =====================================================

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  type public.discount_type not null,
  pct numeric(5,2) not null check (pct > 0 and pct <= 100),
  min_purchases int check (min_purchases is null or min_purchases >= 0),
  product_id uuid references public.products(id) on delete set null,
  category public.product_category,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (type = 'loyalty' and min_purchases is not null)
    or (type in ('manual', 'coupon'))
  )
);

create index idx_discounts_type_active on public.discounts(type, active);
create index idx_discounts_product on public.discounts(product_id);
create index idx_discounts_category on public.discounts(category);

create trigger discounts_set_updated_at
before update on public.discounts
for each row execute function public.set_updated_at();

create table public.user_discounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discount_id uuid not null references public.discounts(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  note text
);

create index idx_user_discounts_user_active
on public.user_discounts(user_id, used_at, expires_at);

create table public.coupon_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  discount_id uuid not null references public.discounts(id) on delete restrict,
  scheduled_for date,
  status public.coupon_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger coupon_campaigns_set_updated_at
before update on public.coupon_campaigns
for each row execute function public.set_updated_at();

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.coupon_campaigns(id) on delete set null,
  discount_id uuid not null references public.discounts(id) on delete restrict,
  user_id uuid references auth.users(id) on delete cascade,
  code text not null unique,
  status public.coupon_status not null default 'active',
  max_redemptions int not null default 1 check (max_redemptions > 0),
  redeemed_count int not null default 0 check (redeemed_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (redeemed_count <= max_redemptions)
);

create index idx_coupons_user_status on public.coupons(user_id, status);
create index idx_coupons_code on public.coupons(code);

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique(coupon_id, order_id)
);

-- =====================================================
-- 7. ORDENES, VOUCHERS, SUSCRIPCIONES Y ACCESOS
-- =====================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  amount numeric(10,2) not null check (amount >= 0),
  original_amount numeric(10,2) not null check (original_amount >= 0),
  discount_id uuid references public.discounts(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  discount_pct numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  order_type text not null default 'new' check (order_type in ('new', 'renewal')),
  renewed_subscription_id uuid,
  status public.order_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user_created on public.orders(user_id, created_at desc);
create index idx_orders_status_created on public.orders(status, created_at desc);
create index idx_orders_product on public.orders(product_id);

alter table public.coupon_redemptions
  add constraint coupon_redemptions_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete cascade;

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  file_url text not null,
  operation_number text not null,
  bank text not null,
  uploaded_at timestamptz not null default now()
);

create index idx_vouchers_order on public.vouchers(order_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_user_expires on public.subscriptions(user_id, expires_at desc);

alter table public.orders
  add constraint orders_renewed_subscription_id_fkey
  foreign key (renewed_subscription_id) references public.subscriptions(id) on delete set null;

create index idx_orders_renewed_subscription on public.orders(renewed_subscription_id);

create table public.subscription_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  login_url text,
  account_email text,
  account_password text,
  profile_name text,
  profile_pin text,
  login_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscription_access_user on public.subscription_access(user_id);

create trigger subscription_access_set_updated_at
before update on public.subscription_access
for each row execute function public.set_updated_at();

-- =====================================================
-- 8. NOTIFICACIONES Y RECORDATORIOS
-- =====================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  channel public.notification_channel not null default 'web',
  status public.notification_status not null default 'unread',
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_notifications_user_status
on public.notifications(user_id, status, created_at desc);

create table public.whatsapp_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  phone text not null,
  message text not null,
  wa_link text not null,
  scheduled_for timestamptz,
  status public.reminder_status not null default 'pending',
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_whatsapp_reminders_status_schedule
on public.whatsapp_reminders(status, scheduled_for);

-- =====================================================
-- 9. FINANZAS Y SETTINGS
-- =====================================================

create table public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null default 'service_purchase',
  amount numeric(10,2) not null check (amount >= 0),
  occurred_at timestamptz not null default now(),
  vendor text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_finance_expenses_occurred_at on public.finance_expenses(occurred_at desc);
create index idx_finance_expenses_category on public.finance_expenses(category);

create trigger finance_expenses_set_updated_at
before update on public.finance_expenses
for each row execute function public.set_updated_at();

create table public.settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- =====================================================
-- 10. RLS
-- =====================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.payment_methods enable row level security;
alter table public.discounts enable row level security;
alter table public.user_discounts enable row level security;
alter table public.coupon_campaigns enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.orders enable row level security;
alter table public.vouchers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_access enable row level security;
alter table public.notifications enable row level security;
alter table public.whatsapp_reminders enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.settings enable row level security;

create policy "profiles_read_own_or_admin" on public.profiles
for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
for update using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());
create policy "profiles_admin_insert" on public.profiles
for insert with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
for delete using (public.is_admin());

create policy "products_read_active" on public.products
for select using (active = true or public.is_admin());
create policy "products_admin_all" on public.products
for all using (public.is_admin()) with check (public.is_admin());

create policy "payment_methods_read_enabled" on public.payment_methods
for select using (enabled = true or public.is_admin());
create policy "payment_methods_admin_all" on public.payment_methods
for all using (public.is_admin()) with check (public.is_admin());

create policy "discounts_read_authenticated" on public.discounts
for select using (auth.uid() is not null);
create policy "discounts_admin_all" on public.discounts
for all using (public.is_admin()) with check (public.is_admin());

create policy "user_discounts_read_own_or_admin" on public.user_discounts
for select using (auth.uid() = user_id or public.is_admin());
create policy "user_discounts_admin_all" on public.user_discounts
for all using (public.is_admin()) with check (public.is_admin());

create policy "coupon_campaigns_admin_all" on public.coupon_campaigns
for all using (public.is_admin()) with check (public.is_admin());

create policy "coupons_read_own_or_admin" on public.coupons
for select using (auth.uid() = user_id or public.is_admin());
create policy "coupons_admin_all" on public.coupons
for all using (public.is_admin()) with check (public.is_admin());

create policy "coupon_redemptions_read_own_or_admin" on public.coupon_redemptions
for select using (auth.uid() = user_id or public.is_admin());
create policy "coupon_redemptions_admin_all" on public.coupon_redemptions
for all using (public.is_admin()) with check (public.is_admin());

create policy "orders_read_own_or_admin" on public.orders
for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
for insert with check (auth.uid() = user_id);
create policy "orders_admin_all" on public.orders
for all using (public.is_admin()) with check (public.is_admin());

create policy "vouchers_read_own_or_admin" on public.vouchers
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = vouchers.order_id
      and orders.user_id = auth.uid()
  )
);
create policy "vouchers_insert_own" on public.vouchers
for insert with check (
  exists (
    select 1 from public.orders
    where orders.id = vouchers.order_id
      and orders.user_id = auth.uid()
  )
);
create policy "vouchers_admin_all" on public.vouchers
for all using (public.is_admin()) with check (public.is_admin());

create policy "subscriptions_read_own_or_admin" on public.subscriptions
for select using (auth.uid() = user_id or public.is_admin());
create policy "subscriptions_admin_all" on public.subscriptions
for all using (public.is_admin()) with check (public.is_admin());

create policy "subscription_access_read_own_or_admin" on public.subscription_access
for select using (auth.uid() = user_id or public.is_admin());
create policy "subscription_access_admin_all" on public.subscription_access
for all using (public.is_admin()) with check (public.is_admin());

create policy "notifications_read_own_or_admin" on public.notifications
for select using (auth.uid() = user_id or public.is_admin());
create policy "notifications_update_own_or_admin" on public.notifications
for update using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
create policy "notifications_admin_insert" on public.notifications
for insert with check (public.is_admin());
create policy "notifications_admin_delete" on public.notifications
for delete using (public.is_admin());

create policy "whatsapp_reminders_read_own_or_admin" on public.whatsapp_reminders
for select using (auth.uid() = user_id or public.is_admin());
create policy "whatsapp_reminders_admin_all" on public.whatsapp_reminders
for all using (public.is_admin()) with check (public.is_admin());

create policy "finance_expenses_admin_all" on public.finance_expenses
for all using (public.is_admin()) with check (public.is_admin());

create policy "settings_read_all" on public.settings
for select using (true);
create policy "settings_admin_all" on public.settings
for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================
-- 11. STORAGE BUCKETS
-- =====================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vouchers',
  'vouchers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-qrs',
  'payment-qrs',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================
-- 12. DATOS INICIALES
-- =====================================================

insert into public.settings (key, value) values
  ('whatsapp_number', '51977706674'),
  ('business_name', 'MUNDOSUBS'),
  ('contact_email', 'hola@mundosubs.pe')
on conflict (key) do update set value = excluded.value;

insert into public.payment_methods (
  id, label, title, description, enabled, holder, phone, bank_name,
  account_number, cci, instructions, sort_order
) values
  (
    'bank_transfer',
    'Transferencia bancaria',
    'Transferencia bancaria',
    'Cuenta bancaria o CCI para pagos manuales.',
    true,
    'MUNDOSUBS',
    null,
    'BCP',
    '000-0000000000',
    '000-000-000000000000-00',
    'Transfiere el monto exacto y sube el comprobante.',
    1
  ),
  (
    'yape',
    'Yape',
    'Yape',
    'Numero y QR para pagos desde Yape.',
    true,
    'MUNDOSUBS',
    '999 999 999',
    null,
    null,
    null,
    'Yapea el monto exacto y sube una captura de la operacion.',
    2
  ),
  (
    'plin',
    'Plin',
    'Plin',
    'Numero y QR para pagos desde Plin.',
    true,
    'MUNDOSUBS',
    '999 999 999',
    null,
    null,
    null,
    'Paga por Plin y adjunta una captura donde se vea el importe.',
    3
  )
on conflict (id) do nothing;

insert into public.products (name, category, price, duration_days, features, active) values
  ('Netflix Premium', 'streaming', 39.90, 30, array['Ultra HD', '4 pantallas', 'Descarga offline'], true),
  ('Spotify Premium', 'music', 19.90, 30, array['Sin anuncios', 'Musica offline', 'Alta calidad'], true),
  ('Xbox Game Pass Ultimate', 'game', 49.90, 30, array['Juegos day one', 'EA Play', 'Nube'], true),
  ('Adobe Creative Cloud', 'software', 79.90, 30, array['Todas las apps', '100GB Storage', 'Templates'], true),
  ('Steam Wallet S/50', 'license', 50.00, 365, array['Codigo digital', 'Entrega inmediata', 'Valido Peru'], true),
  ('Disney+ Premium', 'streaming', 32.90, 30, array['4K HDR', 'Multipantalla'], true),
  ('HBO Max', 'streaming', 29.90, 30, array['Series originales', 'Peliculas nuevas'], true),
  ('YouTube Premium', 'streaming', 29.90, 30, array['Sin anuncios', 'YouTube Music', 'Fondo'], true);

insert into public.discounts (label, type, pct, min_purchases, active) values
  ('Cliente frecuente - 3 compras', 'loyalty', 5, 3, true),
  ('Cliente frecuente - 6 compras', 'loyalty', 10, 6, true),
  ('Cliente VIP - 12 compras', 'loyalty', 15, 12, true),
  ('Cupon mensual base', 'coupon', 10, null, true);

commit;

select 'MUNDOSUBS schema limpio creado correctamente' as mensaje;
