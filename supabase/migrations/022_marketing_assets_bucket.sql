-- Storage bucket for marketing email assets (images uploaded in BlockComposer).
-- BlockComposer.tsx:429-430 reads getPublicUrl(path).publicUrl, so the bucket
-- must be public for read access.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-assets',
  'marketing-assets',
  true,
  10485760, -- 10 MB
  ARRAY['image/png','image/jpeg','image/jpg','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "Anyone can view marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketing assets" ON storage.objects;

CREATE POLICY "Anyone can view marketing assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-assets');

CREATE POLICY "Admins can upload marketing assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'marketing-assets' AND public.is_admin() = true);

CREATE POLICY "Admins can update marketing assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'marketing-assets' AND public.is_admin() = true)
  WITH CHECK (bucket_id = 'marketing-assets' AND public.is_admin() = true);

CREATE POLICY "Admins can delete marketing assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'marketing-assets' AND public.is_admin() = true);
