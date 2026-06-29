-- Logs de avisos de vencimiento de suscripciones.
-- Ejecutar una vez en Supabase SQL Editor antes de activar el cron de Vercel.

create table if not exists public.subscription_email_logs (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('2_days', 'expires_today')),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (subscription_id, reminder_type)
);

create index if not exists idx_subscription_email_logs_subscription_id
on public.subscription_email_logs(subscription_id);

alter table public.subscription_email_logs enable row level security;

drop policy if exists "subscription_email_logs_admin" on public.subscription_email_logs;
create policy "subscription_email_logs_admin"
on public.subscription_email_logs for all
using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
