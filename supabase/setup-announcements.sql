-- =====================================================
-- MUNDOSUBS - Novedades y promociones publicas
-- =====================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null check (type in ('promo', 'new_product', 'price_change', 'info')),
  product_id uuid references public.products(id) on delete set null,
  coupon_id uuid references public.coupons(id) on delete set null,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_active_dates
on public.announcements(active, starts_at, expires_at, created_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements_read_active" on public.announcements;
create policy "announcements_read_active"
on public.announcements for select
using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now())
);

drop policy if exists "announcements_admin_all" on public.announcements;
create policy "announcements_admin_all"
on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

notify pgrst, 'reload schema';

select 'announcements listo' as mensaje;
