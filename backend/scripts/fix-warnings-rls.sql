-- Fix warnings table schema and RLS policies
-- Run this in Supabase SQL Editor

-- Step 1: Check which schema you have and migrate if needed
-- First, let's check if the table exists and what columns it has

-- If you have the OLD schema (userId, message, isRead, createdAt), 
-- uncomment and run this section to migrate to the new schema:

/*
-- Add new columns
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE warnings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate data from old columns to new columns
UPDATE warnings SET user_id = "userId" WHERE user_id IS NULL;
UPDATE warnings SET reason = message WHERE reason IS NULL;
UPDATE warnings SET resolved = NOT "isRead" WHERE resolved IS NULL;
UPDATE warnings SET created_at = "createdAt" WHERE created_at IS NULL;

-- Drop old columns (uncomment after verifying data migration)
-- ALTER TABLE warnings DROP COLUMN IF EXISTS "userId";
-- ALTER TABLE warnings DROP COLUMN IF EXISTS message;
-- ALTER TABLE warnings DROP COLUMN IF EXISTS "isRead";
-- ALTER TABLE warnings DROP COLUMN IF EXISTS "createdAt";
*/

-- OR if table doesn't exist or you want to recreate it, run this:
-- DROP TABLE IF EXISTS warnings;

-- Create warnings table with correct schema
CREATE TABLE IF NOT EXISTS warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Drop all existing RLS policies
DROP POLICY IF EXISTS "Allow all operations on warnings" ON warnings;
DROP POLICY IF EXISTS "Users can view their own warnings" ON warnings;
DROP POLICY IF EXISTS "Users can insert warnings" ON warnings;
DROP POLICY IF EXISTS "Users can update warnings" ON warnings;
DROP POLICY IF EXISTS "Allow authenticated users to read their warnings" ON warnings;
DROP POLICY IF EXISTS "Allow authenticated users to update their warnings" ON warnings;
DROP POLICY IF EXISTS "Service role can do everything on warnings" ON warnings;

-- Step 3: Enable RLS
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies that allow all operations
-- This policy allows INSERT, UPDATE, DELETE, SELECT for all authenticated users
CREATE POLICY "Allow all authenticated operations on warnings"
  ON warnings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 5: Grant necessary permissions
GRANT ALL ON warnings TO authenticated;
GRANT ALL ON warnings TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warnings_user_id ON warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_unresolved ON warnings(user_id, resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_warnings_created ON warnings(created_at DESC);
