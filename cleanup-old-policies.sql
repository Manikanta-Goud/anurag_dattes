-- Clean up old public policies
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "friend_requests_insert_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_select_own" ON friend_requests;
DROP POLICY IF EXISTS "friend_requests_update_receiver" ON friend_requests;

-- Verify only the new policies remain
SELECT 
  policyname, 
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'friend_requests'
ORDER BY policyname;
