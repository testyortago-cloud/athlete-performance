-- Create the athlete-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'athlete-photos',
  'athlete-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to athlete photos
CREATE POLICY IF NOT EXISTS "Public read access for athlete photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'athlete-photos');

-- Allow authenticated users to upload athlete photos
CREATE POLICY IF NOT EXISTS "Authenticated upload for athlete photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'athlete-photos');

-- Allow authenticated users to update/replace athlete photos
CREATE POLICY IF NOT EXISTS "Authenticated update for athlete photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'athlete-photos');

-- Allow authenticated users to delete athlete photos
CREATE POLICY IF NOT EXISTS "Authenticated delete for athlete photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'athlete-photos');
