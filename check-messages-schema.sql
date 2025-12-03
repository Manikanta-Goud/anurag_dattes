-- Check messages table schema
-- Run in Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
