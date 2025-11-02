-- Migration: Add gender column to profiles table
-- Description: Adds gender field to support demographic tracking and personalization
-- Date: 2025-01-29

-- Add gender column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.gender IS 'User gender: male, female, other, or prefer_not_to_say';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender) WHERE gender IS NOT NULL;

-- Add helpful comment
COMMENT ON INDEX idx_profiles_gender IS 'Index for demographic analytics queries';
