-- Create storage bucket for profile photos
-- Run this in Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the bucket
-- Allow anyone to read photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to update their own photos
CREATE POLICY "Users can update their photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');
