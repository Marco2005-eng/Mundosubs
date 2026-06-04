insert into public.settings (key, value) values
  ('facebook_url', ''),
  ('tiktok_url', ''),
  ('footer_tagline', 'Suscripciones digitales en soles, sin tarjeta internacional.'),
  ('about_title', 'Quienes somos'),
  ('about_summary', 'Somos una tienda peruana de suscripciones digitales pensada para comprar en soles y recibir soporte directo.'),
  ('about_history', ''),
  ('about_images', '')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_assets_public_read" on storage.objects;
drop policy if exists "site_assets_admin_insert" on storage.objects;
drop policy if exists "site_assets_admin_update" on storage.objects;
drop policy if exists "site_assets_admin_delete" on storage.objects;

create policy "site_assets_public_read"
on storage.objects
for select
to public
using (bucket_id = 'site-assets');

create policy "site_assets_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

create policy "site_assets_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-assets' and public.is_admin());
