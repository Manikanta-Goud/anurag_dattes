-- Add club_name column to existing events table
-- Run this ONLY if you already created the events table without club_name

ALTER TABLE events ADD COLUMN IF NOT EXISTS club_name TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN events.club_name IS 'Name of the club or organization organizing the event (e.g., Tech Club, Cultural Society, Sports Committee)';
