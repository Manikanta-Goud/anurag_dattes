-- Run this SQL in your Supabase SQL Editor to create the banned_users table

CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  reason TEXT NOT NULL,
  "bannedBy" TEXT NOT NULL,
  "bannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "isActive" BOOLEAN DEFAULT true,
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_banned_users_userId ON banned_users("userId");
CREATE INDEX IF NOT EXISTS idx_banned_users_isActive ON banned_users("isActive");

-- Test the table
SELECT * FROM banned_users LIMIT 1;
