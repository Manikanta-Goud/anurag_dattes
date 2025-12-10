-- Create storage bucket for event photos
-- Run this in Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for the bucket
-- Allow anyone to read event photos
CREATE POLICY "Public Access for Event Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

-- Allow authenticated users to upload event photos
CREATE POLICY "Authenticated users can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Allow users to update event photos
CREATE POLICY "Authenticated users can update event photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'event-photos' AND auth.role() = 'authenticated');

-- Allow users to delete event photos
CREATE POLICY "Authenticated users can delete event photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-photos' AND auth.role() = 'authenticated');
