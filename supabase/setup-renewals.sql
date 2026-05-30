-- Renewal support for MUNDOSUBS.
-- Run this once in Supabase SQL Editor before deploying renewal code.

begin;

alter table public.orders
  add column if not exists order_type text not null default 'new'
  check (order_type in ('new', 'renewal'));

alter table public.orders
  add column if not exists renewed_subscription_id uuid
  references public.subscriptions(id) on delete set null;

create index if not exists idx_orders_renewed_subscription
on public.orders(renewed_subscription_id);

commit;
