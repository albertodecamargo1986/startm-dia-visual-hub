
-- Create storage bucket for label thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('label-thumbnails', 'label-thumbnails', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp']);

-- Allow authenticated users to upload their own label thumbnails
CREATE POLICY "label_thumbs_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'label-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own label thumbnails
CREATE POLICY "label_thumbs_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'label-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read for thumbnails
CREATE POLICY "label_thumbs_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'label-thumbnails');
