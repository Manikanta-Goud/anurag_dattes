-- Test if leaderboard columns exist
-- Run this in Supabase SQL Editor to check your setup

-- 1. Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('total_likes', 'daily_likes', 'weekly_likes', 'profile_views', 'last_daily_reset', 'last_weekly_reset')
ORDER BY column_name;

-- If you see 6 rows above, columns exist! ✅
-- If you see 0 rows, you need to run add-leaderboard-columns.sql ❌

-- 2. Check if increment function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('increment_like_count', 'increment_view_count', 'reset_daily_likes', 'reset_weekly_likes');

-- You should see 4 functions above ✅

-- 3. Try to view profile data with like columns
SELECT id, name, email, 
       COALESCE(total_likes, 0) as total_likes, 
       COALESCE(daily_likes, 0) as daily_likes, 
       COALESCE(weekly_likes, 0) as weekly_likes,
       COALESCE(profile_views, 0) as profile_views
FROM profiles 
LIMIT 5;

-- If this works, setup is complete! ✅
-- If you get "column does not exist" error, run add-leaderboard-columns.sql ❌
