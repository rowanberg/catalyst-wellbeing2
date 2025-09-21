-- Create mood_tracking table for storing student mood data
-- This table is required for the mood tracking functionality in the student dashboard

-- Create mood tracking table
CREATE TABLE IF NOT EXISTS mood_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious')),
  mood_emoji TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own mood tracking
DROP POLICY IF EXISTS "Users can manage their own mood tracking" ON mood_tracking;
CREATE POLICY "Users can manage their own mood tracking" ON mood_tracking
  FOR ALL USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_id ON mood_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date ON mood_tracking(date);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date ON mood_tracking(user_id, date);

-- Add comment explaining the table
COMMENT ON TABLE mood_tracking IS 'Stores daily mood entries for students with 30-day retention policy';

-- Add current_mood column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_mood TEXT;
