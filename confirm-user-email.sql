-- Manually confirm email for ALL users
-- Run this in Supabase SQL Editor

-- Confirm email for ALL users with @anurag.edu.in
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email LIKE '%@anurag.edu.in' 
  AND email_confirmed_at IS NULL;

-- Verify the update - show all confirmed users
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email LIKE '%@anurag.edu.in'
ORDER BY email;
