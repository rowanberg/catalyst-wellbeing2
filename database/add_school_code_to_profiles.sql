-- Add school_code column to profiles table
-- This allows filtering by school_code instead of school_id

-- Add school_code column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_code VARCHAR(12);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_code ON profiles(school_code);

-- Update existing profiles to set school_code from their linked school
UPDATE profiles 
SET school_code = schools.school_code
FROM schools 
WHERE profiles.school_id = schools.id 
AND profiles.school_code IS NULL;
