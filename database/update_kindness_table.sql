-- Update kindness_counter table to include description field
ALTER TABLE kindness_counter 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create kindness_entries table for individual kindness acts
CREATE TABLE IF NOT EXISTS kindness_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for kindness_entries
ALTER TABLE kindness_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own kindness entries
CREATE POLICY "Users can view own kindness entries" ON kindness_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own kindness entries
CREATE POLICY "Users can insert own kindness entries" ON kindness_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own kindness entries
CREATE POLICY "Users can update own kindness entries" ON kindness_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own kindness entries
CREATE POLICY "Users can delete own kindness entries" ON kindness_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kindness_entries_user_id ON kindness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_kindness_entries_created_at ON kindness_entries(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kindness_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kindness_entries_updated_at
  BEFORE UPDATE ON kindness_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_kindness_entries_updated_at();
