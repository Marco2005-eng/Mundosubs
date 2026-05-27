-- Fix for recursive admin checks and payment QR storage access.
-- Run this in Supabase SQL Editor after the clean schema.

begin;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

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

drop policy if exists "payment_qrs_admin_all" on storage.objects;
drop policy if exists "payment_qrs_admin_read" on storage.objects;
drop policy if exists "payment_qrs_admin_insert" on storage.objects;
drop policy if exists "payment_qrs_admin_update" on storage.objects;
drop policy if exists "payment_qrs_admin_delete" on storage.objects;

create policy "payment_qrs_admin_read"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-qrs' and public.is_admin());

create policy "payment_qrs_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'payment-qrs' and public.is_admin());

create policy "payment_qrs_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'payment-qrs' and public.is_admin())
with check (bucket_id = 'payment-qrs' and public.is_admin());

create policy "payment_qrs_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'payment-qrs' and public.is_admin());

commit;
