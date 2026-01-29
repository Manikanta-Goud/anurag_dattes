-- Add missing columns to events table
-- Run this in Supabase SQL Editor

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add club_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'club_name'
    ) THEN
        ALTER TABLE events ADD COLUMN club_name TEXT;
    END IF;

    -- Add event_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'event_time'
    ) THEN
        ALTER TABLE events ADD COLUMN event_time TIME;
    END IF;

    -- Add organizer column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'organizer'
    ) THEN
        ALTER TABLE events ADD COLUMN organizer TEXT;
    END IF;

    -- Add guests column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'guests'
    ) THEN
        ALTER TABLE events ADD COLUMN guests TEXT;
    END IF;

    -- Add max_capacity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'max_capacity'
    ) THEN
        ALTER TABLE events ADD COLUMN max_capacity INTEGER;
    END IF;

    -- Add registration_required column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'registration_required'
    ) THEN
        ALTER TABLE events ADD COLUMN registration_required BOOLEAN DEFAULT false;
    END IF;

    -- Add registration_link column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'registration_link'
    ) THEN
        ALTER TABLE events ADD COLUMN registration_link TEXT;
    END IF;

    -- Add contact_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE events ADD COLUMN contact_email TEXT;
    END IF;

    -- Add contact_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE events ADD COLUMN contact_phone TEXT;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE events ADD COLUMN created_by TEXT;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Verify all columns are now present
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;
