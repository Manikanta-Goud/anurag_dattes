-- Create achievements table for student achievements
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  description TEXT NOT NULL,
  achievement_date TIMESTAMP NOT NULL,
  sector TEXT NOT NULL, -- CSE, AI, AIML, ECE, etc.
  image_url TEXT,
  achievement_type TEXT, -- Competition, Research, Sports, Cultural, etc.
  position TEXT, -- 1st Place, 2nd Place, Winner, etc.
  organization TEXT, -- Organization that gave the achievement
  created_by TEXT, -- Admin who created this
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- Policy: Allow insert (controlled by API/admin logic)
CREATE POLICY "Allow insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update (controlled by API/admin logic)
CREATE POLICY "Allow update achievements"
  ON achievements FOR UPDATE
  USING (true);

-- Policy: Allow delete (controlled by API/admin logic)
CREATE POLICY "Allow delete achievements"
  ON achievements FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_achievements_date ON achievements(achievement_date DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_sector ON achievements(sector);
CREATE INDEX IF NOT EXISTS idx_achievements_created_at ON achievements(created_at DESC);

-- Add comment to table
COMMENT ON TABLE achievements IS 'Stores student achievements that can be viewed by all students';
