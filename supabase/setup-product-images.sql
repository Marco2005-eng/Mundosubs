ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.products.image_url IS 'Public logo/image URL shown in catalog and admin product cards.';

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.products.image_urls IS 'Up to four public image URLs shown as the product gallery.';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_write" ON storage.objects;
CREATE POLICY "product_images_admin_write"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-images'
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
);
