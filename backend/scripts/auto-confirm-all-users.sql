-- Auto-confirm all new user signups
-- Run this in Supabase SQL Editor

-- Step 1: Confirm ALL existing users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email LIKE '%@anurag.edu.in' 
  AND email_confirmed_at IS NULL;

-- Step 2: Create a trigger function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for all @anurag.edu.in users
  IF NEW.email LIKE '%@anurag.edu.in' THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger that runs BEFORE insert on auth.users
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();

-- Step 4: Verify - show all users
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email LIKE '%@anurag.edu.in'
ORDER BY created_at DESC;
