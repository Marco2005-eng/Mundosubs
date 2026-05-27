
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- products
create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text not null check (category in ('streaming','game','license','software','music')),
  price         numeric(10,2) not null,
  duration_days int not null,
  features      text[] not null default '{}',
  active        bool not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- discounts
create table public.discounts (
  id             uuid primary key default uuid_generate_v4(),
  label          text not null,
  type           text not null check (type in ('loyalty','manual')),
  pct            numeric(5,2) not null,
  min_purchases  int,
  product_id     uuid references public.products(id) on delete set null,
  category       text,
  active         bool not null default true,
  created_at     timestamptz not null default now()
);

-- orders
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  product_id      uuid not null references public.products(id),
  amount          numeric(10,2) not null,
  original_amount numeric(10,2) not null,
  discount_id     uuid references public.discounts(id) on delete set null,
  discount_pct    numeric(5,2) not null default 0,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

-- vouchers
create table public.vouchers (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  file_url         text not null,
  operation_number text not null,
  bank             text not null,
  uploaded_at      timestamptz not null default now()
);

-- subscriptions
create table public.subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id),
  order_id   uuid not null references public.orders(id) on delete cascade,
  starts_at  timestamptz not null,
  expires_at timestamptz not null
);

-- user_discounts
create table public.user_discounts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  discount_id uuid not null references public.discounts(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now(),
  expires_at  timestamptz,
  used_at     timestamptz,
  note        text
);

-- settings
create table public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('whatsapp_number', '51987654321'),
  ('business_name',   'MUNDOSUBS'),
  ('contact_email',   'hola@mundosubs.pe');

-- Indexes
create index on public.orders(user_id);
create index on public.orders(status);
create index on public.subscriptions(user_id);
create index on public.subscriptions(expires_at);
create index on public.user_discounts(user_id);
create index on public.vouchers(order_id);

-- RLS
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.vouchers       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.discounts      enable row level security;
alter table public.user_discounts enable row level security;
alter table public.settings       enable row level security;

-- products: public read for active
create policy "products_read" on public.products for select using (active = true);
create policy "products_admin" on public.products for all
  using (auth.jwt() ->> 'role' = 'admin' or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- orders: user reads own; service role writes
create policy "orders_read_own" on public.orders for select
  using (auth.uid() = user_id);
create policy "orders_admin" on public.orders for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- vouchers: user reads own
create policy "vouchers_read_own" on public.vouchers for select
  using (exists (select 1 from public.orders where orders.id = vouchers.order_id and orders.user_id = auth.uid()));
create policy "vouchers_admin" on public.vouchers for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- subscriptions: user reads own
create policy "subscriptions_read_own" on public.subscriptions for select
  using (auth.uid() = user_id);
create policy "subscriptions_admin" on public.subscriptions for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- discounts: all authenticated users can read
create policy "discounts_read" on public.discounts for select
  using (auth.uid() is not null);
create policy "discounts_admin" on public.discounts for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- user_discounts: user reads own
create policy "user_discounts_read_own" on public.user_discounts for select
  using (auth.uid() = user_id);
create policy "user_discounts_admin" on public.user_discounts for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- settings: public read; admin write
create policy "settings_read" on public.settings for select using (true);
create policy "settings_admin" on public.settings for all
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
