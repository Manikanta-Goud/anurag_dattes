-- Check matches table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;
