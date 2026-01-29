-- Run this SQL in your Supabase SQL Editor to create the banned_users table
-- IMPORTANT: Drop the old table first if it exists with wrong column names

DROP TABLE IF EXISTS banned_users;

CREATE TABLE banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL,
  reason TEXT NOT NULL,
  bannedby TEXT NOT NULL,
  bannedat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  isactive BOOLEAN DEFAULT true,
  UNIQUE(userid)
);

CREATE INDEX idx_banned_users_userid ON banned_users(userid);
CREATE INDEX idx_banned_users_isactive ON banned_users(isactive);

-- Test the table
SELECT * FROM banned_users LIMIT 1;
