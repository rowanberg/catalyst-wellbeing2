-- Quick fix for class_id column issue
-- Run this single command to add the missing column

-- Simply add the class_id column without foreign key constraint first
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_id UUID;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'class_id';
