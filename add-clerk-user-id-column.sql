-- Add clerk_user_id column to profiles table for Clerk authentication
-- This column stores the Clerk user ID to link Clerk authentication with Supabase profile data

-- Add the column (nullable initially to allow existing profiles)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Create an index for faster lookups by Clerk user ID
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

-- Add a comment to document the column
COMMENT ON COLUMN profiles.clerk_user_id IS 'Clerk user ID for authentication - links Clerk auth to Supabase profile';

-- Note: Keep auth_id column for backward compatibility with existing Supabase auth users
-- New users will use clerk_user_id, existing users will continue using auth_id
