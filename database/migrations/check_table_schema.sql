-- Quick diagnostic to check actual table schemas
-- Run this in Supabase SQL Editor to see what columns actually exist

-- Check student_achievements columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_achievements'
ORDER BY ordinal_position;

-- Check student_activity columns  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_activity'
ORDER BY ordinal_position;

-- Check student_progress columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_progress'
ORDER BY ordinal_position;

-- Check daily_topics columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_topics'
ORDER BY ordinal_position;
