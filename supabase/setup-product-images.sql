ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.products.image_url IS 'Public logo/image URL shown in catalog and admin product cards.';
