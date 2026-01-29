-- Test Leaderboard by adding sample like data
-- Run this AFTER running add-leaderboard-columns.sql
-- This will give some profiles random likes for testing

-- Update a few random profiles with sample data
-- Replace these UUIDs with actual profile IDs from your database

-- Find some profile IDs first:
SELECT id, name, email FROM profiles LIMIT 10;

-- Then manually update them with this pattern:
-- UPDATE profiles SET daily_likes = 50, weekly_likes = 120, total_likes = 500 WHERE id = 'your-profile-id-here';

-- Example updates (you need to replace the UUIDs):
/*
UPDATE profiles SET daily_likes = 50, weekly_likes = 120, total_likes = 500, profile_views = 1500 
WHERE email = 'student1@anurag.edu.in';

UPDATE profiles SET daily_likes = 45, weekly_likes = 100, total_likes = 450, profile_views = 1200 
WHERE email = 'student2@anurag.edu.in';

UPDATE profiles SET daily_likes = 40, weekly_likes = 95, total_likes = 400, profile_views = 1100 
WHERE email = 'student3@anurag.edu.in';

UPDATE profiles SET daily_likes = 35, weekly_likes = 80, total_likes = 350, profile_views = 900 
WHERE email = 'student4@anurag.edu.in';

UPDATE profiles SET daily_likes = 30, weekly_likes = 70, total_likes = 300, profile_views = 800 
WHERE email = 'student5@anurag.edu.in';
*/

-- Verify the updates:
SELECT id, name, email, daily_likes, weekly_likes, total_likes, profile_views 
FROM profiles 
WHERE daily_likes > 0 
ORDER BY daily_likes DESC;
