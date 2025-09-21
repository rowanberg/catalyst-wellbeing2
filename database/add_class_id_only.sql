-- MINIMAL SCRIPT: Add class_id column to profiles table only
-- Run this first, then run the main complete_database.sql

-- Add class_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_id UUID;

-- Verify the column was added
SELECT 
    'class_id column added' as status,
    COUNT(*) as exists
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'class_id';
