-- Add columns to banned_users table for permanent deletion tracking
-- This marks accounts that are permanently deleted and cannot re-register

-- Add email column to store user's email
ALTER TABLE banned_users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add name column to store user's name
ALTER TABLE banned_users
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add is_permanent column to mark permanent bans
ALTER TABLE banned_users
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT false;

-- Add index for faster lookups of permanent bans by email
CREATE INDEX IF NOT EXISTS idx_banned_users_email_permanent ON banned_users(email, is_permanent);

-- Add comments
COMMENT ON COLUMN banned_users.email IS 'User email address for permanent ban checking';
COMMENT ON COLUMN banned_users.name IS 'User name for reference';
COMMENT ON COLUMN banned_users.is_permanent IS 'True if account is permanently deleted by admin and cannot re-register';
