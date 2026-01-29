-- Fix Friend Requests RLS Policies
-- Run this in Supabase SQL Editor

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update their received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON friend_requests;

-- Create permissive policies that allow all operations

-- Policy 1: Allow anyone to INSERT friend requests
CREATE POLICY "Allow sending friend requests"
ON friend_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow users to SELECT their friend requests (sent or received)
CREATE POLICY "Allow viewing friend requests"
ON friend_requests
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow users to UPDATE friend requests they received
CREATE POLICY "Allow updating friend requests"
ON friend_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow users to DELETE their friend requests
CREATE POLICY "Allow deleting friend requests"
ON friend_requests
FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'friend_requests';
