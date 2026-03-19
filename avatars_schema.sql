-- Supabase Storage Setup for Profile Avatars
-- Copy and paste this script into your Supabase SQL Editor and run it

-- 1. Create a public storage bucket called "avatars"
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read all avatars
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Allow users to update/delete their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
