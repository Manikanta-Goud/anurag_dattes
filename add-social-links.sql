-- Add GitHub and LinkedIn columns to profiles table
-- This adds professional social media links to user profiles

-- Add GitHub column (stores GitHub profile URL or username)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS github TEXT;

-- Add LinkedIn column (stores LinkedIn profile URL or username)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('github', 'linkedin');

-- Optional: Add comments to document the columns
COMMENT ON COLUMN profiles.github IS 'GitHub profile URL or username';
COMMENT ON COLUMN profiles.linkedin IS 'LinkedIn profile URL or username';
