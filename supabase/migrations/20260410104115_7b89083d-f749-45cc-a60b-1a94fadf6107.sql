
-- Create cms-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-media', 'cms-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "CMS media: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-media');

-- Admin upload
CREATE POLICY "CMS media: admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cms-media'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

-- Admin update
CREATE POLICY "CMS media: admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

-- Admin delete
CREATE POLICY "CMS media: admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);
