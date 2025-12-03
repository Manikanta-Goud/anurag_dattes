-- Check current data and populate leaderboard
-- Run this in Supabase SQL Editor

-- STEP 1: Check what data exists
SELECT 'Profiles Count' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Friend Requests Count', COUNT(*) FROM friend_requests
UNION ALL
SELECT 'Matches Count', COUNT(*) FROM matches
UNION ALL
SELECT 'Likes Count', COUNT(*) FROM likes;

-- STEP 2: See who has received friend requests
SELECT 
    p.name,
    p.email,
    COUNT(fr.id) as friend_requests_received
FROM profiles p
LEFT JOIN friend_requests fr ON fr.receiver_id = p.id
GROUP BY p.id, p.name, p.email
ORDER BY friend_requests_received DESC;

-- STEP 3: See who has matches (friends)
SELECT 
    p.name,
    p.email,
    COUNT(m.id) as total_matches
FROM profiles p
LEFT JOIN matches m ON (m.user1id = p.id OR m.user2id = p.id)
GROUP BY p.id, p.name, p.email
ORDER BY total_matches DESC;

-- STEP 4: Add leaderboard columns if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'total_likes'
    ) THEN
        ALTER TABLE profiles ADD COLUMN total_likes INTEGER DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN daily_likes INTEGER DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN weekly_likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- STEP 5: Populate leaderboard with actual data
-- Count friend requests + matches for each user
UPDATE profiles p
SET total_likes = (
    SELECT COALESCE(
        (SELECT COUNT(*) FROM friend_requests WHERE receiver_id = p.id) +
        (SELECT COUNT(*) FROM matches WHERE user1id = p.id OR user2id = p.id),
        0
    )
);

-- STEP 6: Verify the update worked
SELECT 
    name,
    email,
    total_likes,
    daily_likes,
    weekly_likes
FROM profiles
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;
