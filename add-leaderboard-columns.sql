-- Add like counter and view counter to profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_weekly_reset TIMESTAMP DEFAULT NOW();

-- Create function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_likes = total_likes + 1,
    daily_likes = daily_likes + 1,
    weekly_likes = weekly_likes + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset daily likes (run daily via cron or API)
CREATE OR REPLACE FUNCTION reset_daily_likes()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    daily_likes = 0,
    last_daily_reset = NOW()
  WHERE last_daily_reset < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Create function to reset weekly likes (run weekly)
CREATE OR REPLACE FUNCTION reset_weekly_likes()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    weekly_likes = 0,
    last_weekly_reset = NOW()
  WHERE last_weekly_reset < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_daily_likes ON profiles(daily_likes DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_likes ON profiles(weekly_likes DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_likes ON profiles(total_likes DESC);

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_like_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count TO anon, authenticated;
