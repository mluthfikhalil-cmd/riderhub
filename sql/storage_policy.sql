-- Create public storage bucket for 3D models
-- Run in Supabase SQL Editor

-- 1. Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models',
  'models',
  true,
  52428800,
  ARRAY['model/gltf-binary', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public read (skip if exists)
DO $$ BEGIN
  CREATE POLICY "public read models"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'models');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Allow anon upload
DO $$ BEGIN
  CREATE POLICY "anon upload models"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'models');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Verify
SELECT id, name, public FROM storage.buckets WHERE id = 'models';
