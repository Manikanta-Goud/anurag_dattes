-- Add end_date column to events table for multi-day events
-- Run this in Supabase SQL Editor

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE events ADD COLUMN end_date DATE;
        RAISE NOTICE 'Column end_date added successfully';
    ELSE
        RAISE NOTICE 'Column end_date already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('event_date', 'end_date');
