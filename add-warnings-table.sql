-- Add warnings table to existing database
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS warnings (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Create policy for warnings
CREATE POLICY "Allow all operations on warnings" ON warnings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings("userId");
CREATE INDEX IF NOT EXISTS idx_warnings_unread ON warnings("userId", "isRead");
