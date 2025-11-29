-- Migration: Setup Storage Buckets
-- Description: Creates all storage buckets for images and files with proper RLS policies
-- Dependencies: Phase 1 (app_users)

-- Note: Storage buckets should be created via Supabase Dashboard or CLI
-- This migration only sets up the RLS policies for the buckets

-- =====================================================
-- STORAGE BUCKET SCHEMA UPDATE
-- =====================================================

-- Add 'public' column to storage.buckets if it doesn't exist
-- This column is used in newer Supabase versions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'storage' 
    AND table_name = 'buckets' 
    AND column_name = 'public'
  ) THEN
    ALTER TABLE storage.buckets ADD COLUMN public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- STORAGE BUCKET CREATION
-- =====================================================

-- 1. Trade Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-images',
  'trade-images',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Trade Chart Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-chart-images',
  'trade-chart-images',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 3. Journal Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-images',
  'journal-images',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 4. Notes Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes-images',
  'notes-images',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 5. Strategy Images Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'strategy-images',
  'strategy-images',
  false,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 6. Profile Pictures Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 7. Trader Profile About Images Bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'traders-profile-about',
  'traders-profile-about',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 8. General TradeLens Bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tradelens',
  'tradelens',
  false,
  52428800, -- 50 MB
  NULL -- Allow any file type
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- =====================================================
-- RLS POLICIES FOR STORAGE BUCKETS
-- =====================================================

-- Trade Images Policies
CREATE POLICY "Users can upload their own trade images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own trade images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own trade images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Trade images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trade-images');

-- Trade Chart Images Policies
CREATE POLICY "Users can upload their own trade chart images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-chart-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own trade chart images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'trade-chart-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own trade chart images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-chart-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Trade chart images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'trade-chart-images');

-- Journal Images Policies
CREATE POLICY "Users can upload their own journal images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own journal images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own journal images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Journal images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journal-images');

-- Notes Images Policies
CREATE POLICY "Users can upload their own notes images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notes-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own notes images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notes-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own notes images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'notes-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Notes images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'notes-images');

-- Strategy Images Policies (Private)
CREATE POLICY "Users can upload their own strategy images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'strategy-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own strategy images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'strategy-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own strategy images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'strategy-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own strategy images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'strategy-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Profile Pictures Policies
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Trader Profile About Policies
CREATE POLICY "Users can upload their own trader profile about images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'traders-profile-about' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own trader profile about images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'traders-profile-about' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own trader profile about images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'traders-profile-about' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Trader profile about images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'traders-profile-about');

-- TradeLens General Bucket Policies (Private)
CREATE POLICY "Users can upload to their own tradelens folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tradelens' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own tradelens files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tradelens' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own tradelens files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tradelens' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own tradelens files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tradelens' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- STORAGE BUCKETS SETUP COMPLETE
-- =====================================================
-- All 8 storage buckets created with proper RLS policies
-- Users can only access their own files (organized by user_id folders)
-- Public buckets allow read access to all users
