-- =====================================================
-- MUNDOSUBS - Fix vouchers.file_url
-- =====================================================
-- Ejecutar si el reset limpio se aplico cuando la columna era file_path.
-- El codigo de la app usa vouchers.file_url.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vouchers'
      and column_name = 'file_path'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vouchers'
      and column_name = 'file_url'
  ) then
    alter table public.vouchers rename column file_path to file_url;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vouchers'
      and column_name = 'file_url'
  ) then
    alter table public.vouchers add column file_url text;
  end if;
end $$;

alter table public.vouchers
  alter column file_url set not null;

create index if not exists idx_vouchers_order
on public.vouchers(order_id);

-- Forzar a PostgREST/Supabase API a refrescar el cache del esquema.
notify pgrst, 'reload schema';

select 'vouchers.file_url listo' as mensaje;
