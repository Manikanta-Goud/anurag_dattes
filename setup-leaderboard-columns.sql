-- Setup Leaderboard Columns for profiles table
-- Run this in Supabase SQL Editor

-- Add leaderboard columns if they don't exist
DO $$ 
BEGIN
    -- Add total_likes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'total_likes'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_likes INTEGER DEFAULT 0;
    END IF;

    -- Add daily_likes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'daily_likes'
    ) THEN
        ALTER TABLE profiles ADD COLUMN daily_likes INTEGER DEFAULT 0;
    END IF;

    -- Add weekly_likes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'weekly_likes'
    ) THEN
        ALTER TABLE profiles ADD COLUMN weekly_likes INTEGER DEFAULT 0;
    END IF;

    -- Add profile_views column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_views'
    ) THEN
        ALTER TABLE profiles ADD COLUMN profile_views INTEGER DEFAULT 0;
    END IF;

    -- Add last_daily_reset column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_daily_reset'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_daily_reset TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add last_weekly_reset column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_weekly_reset'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_weekly_reset TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('total_likes', 'daily_likes', 'weekly_likes', 'profile_views', 'last_daily_reset', 'last_weekly_reset')
ORDER BY column_name;

-- Add some test data for leaderboard (OPTIONAL - for testing)
-- Uncomment and run after adding columns

/*
-- Update first 5 users with test like data
UPDATE profiles 
SET daily_likes = 25, weekly_likes = 100, total_likes = 500, profile_views = 1200
WHERE id = (SELECT id FROM profiles LIMIT 1 OFFSET 0);

UPDATE profiles 
SET daily_likes = 20, weekly_likes = 85, total_likes = 420, profile_views = 950
WHERE id = (SELECT id FROM profiles LIMIT 1 OFFSET 1);

UPDATE profiles 
SET daily_likes = 15, weekly_likes = 70, total_likes = 350, profile_views = 800
WHERE id = (SELECT id FROM profiles LIMIT 1 OFFSET 2);
*/
