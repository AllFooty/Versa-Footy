-- Phase 2/A: storage bucket for marketing email images.
-- Public read (so emails can <img src=...> the asset); admin-only write.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-assets',
  'marketing-assets',
  true,
  10 * 1024 * 1024, -- 10 MB
  ARRAY['image/png','image/jpeg','image/gif','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read of the bucket's objects.
DROP POLICY IF EXISTS marketing_assets_public_read ON storage.objects;
CREATE POLICY marketing_assets_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'marketing-assets');

-- Admin-only write/update/delete.
DROP POLICY IF EXISTS marketing_assets_admin_insert ON storage.objects;
CREATE POLICY marketing_assets_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'marketing-assets'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS marketing_assets_admin_update ON storage.objects;
CREATE POLICY marketing_assets_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS marketing_assets_admin_delete ON storage.objects;
CREATE POLICY marketing_assets_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'marketing-assets'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
