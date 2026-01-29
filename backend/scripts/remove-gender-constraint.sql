-- Remove the gender check constraint completely
-- Run this in Supabase SQL Editor

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;

-- Verify constraint is removed
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';
