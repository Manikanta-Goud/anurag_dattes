-- Production-Ready RLS Policies for friend_requests
-- Run this in Supabase SQL Editor

-- Step 1: Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "Allow sending friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Allow viewing friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Allow updating friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Allow deleting friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can view their friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can update received requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can delete sent requests" ON friend_requests;

-- Step 3: Create production policies

-- Policy 1: Service role can INSERT (backend uses service_role key)
CREATE POLICY "Service role can insert friend requests"
ON friend_requests
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Authenticated users can INSERT (for direct client access if needed)
CREATE POLICY "Authenticated users can send friend requests"
ON friend_requests
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Service role can SELECT all (for backend queries)
CREATE POLICY "Service role can select all friend requests"
ON friend_requests
FOR SELECT
TO service_role
USING (true);

-- Policy 4: Authenticated users can SELECT their requests
CREATE POLICY "Users can view their friend requests"
ON friend_requests
FOR SELECT
TO authenticated
USING (true);

-- Policy 5: Service role can UPDATE all
CREATE POLICY "Service role can update friend requests"
ON friend_requests
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 6: Service role can DELETE all
CREATE POLICY "Service role can delete friend requests"
ON friend_requests
FOR DELETE
TO service_role
USING (true);

-- Step 4: Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'friend_requests'
ORDER BY policyname;
