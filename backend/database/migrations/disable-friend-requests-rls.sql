-- Disable RLS on friend_requests table (for development)
-- Run this in Supabase SQL Editor

-- Disable Row Level Security on friend_requests
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'friend_requests';
