-- Setup FOMO Dice Feature Tables
-- Run this in Supabase SQL Editor

-- Table to store daily dice rolls
CREATE TABLE IF NOT EXISTS dice_rolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dice_number INTEGER NOT NULL CHECK (dice_number >= 1 AND dice_number <= 6),
  rolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  roll_date DATE NOT NULL DEFAULT CURRENT_DATE,
  has_selected_match BOOLEAN DEFAULT FALSE,
  selected_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one roll per user per day
  UNIQUE(user_id, roll_date)
);

-- Table to store dice matches (auto-matched pairs)
CREATE TABLE IF NOT EXISTS dice_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dice_number INTEGER NOT NULL,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  has_chatted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate matches
  UNIQUE(user1_id, user2_id),
  
  -- Ensure user1_id < user2_id for consistency
  CHECK (user1_id < user2_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_dice_rolls_user_date ON dice_rolls(user_id, roll_date);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_date_number ON dice_rolls(roll_date, dice_number);
CREATE INDEX IF NOT EXISTS idx_dice_matches_expiry ON dice_matches(expires_at, is_active);
CREATE INDEX IF NOT EXISTS idx_dice_matches_users ON dice_matches(user1_id, user2_id);

-- Function to auto-expire dice matches that haven't chatted
CREATE OR REPLACE FUNCTION expire_inactive_dice_matches()
RETURNS void AS $$
BEGIN
  -- Deactivate matches that expired and haven't chatted
  UPDATE dice_matches
  SET is_active = FALSE
  WHERE expires_at < NOW()
    AND has_chatted = FALSE
    AND is_active = TRUE;
    
  -- Delete the actual friendship from matches table
  DELETE FROM matches
  WHERE id IN (
    SELECT m.id
    FROM matches m
    INNER JOIN dice_matches dm ON (
      (m.user1id = dm.user1_id AND m.user2id = dm.user2_id) OR
      (m.user1id = dm.user2_id AND m.user2id = dm.user1_id)
    )
    WHERE dm.is_active = FALSE
      AND dm.has_chatted = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dice_rolls
CREATE POLICY "Users can view their own rolls"
  ON dice_rolls FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own rolls"
  ON dice_rolls FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own rolls"
  ON dice_rolls FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- RLS Policies for dice_matches
CREATE POLICY "Users can view their own matches"
  ON dice_matches FOR SELECT
  USING (auth.uid()::uuid IN (user1_id, user2_id));

CREATE POLICY "Users can update their own matches"
  ON dice_matches FOR UPDATE
  USING (auth.uid()::uuid IN (user1_id, user2_id));

-- Grant permissions
GRANT ALL ON dice_rolls TO authenticated;
GRANT ALL ON dice_matches TO authenticated;

-- Verify tables
SELECT 
  'dice_rolls' as table_name,
  COUNT(*) as row_count
FROM dice_rolls
UNION ALL
SELECT 
  'dice_matches' as table_name,
  COUNT(*) as row_count
FROM dice_matches;

COMMENT ON TABLE dice_rolls IS 'Stores daily dice rolls for FOMO feature - one roll per user per day';
COMMENT ON TABLE dice_matches IS 'Stores auto-matched pairs from dice feature - expires in 24h if no chat';
