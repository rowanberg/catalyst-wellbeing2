-- Check current database state to diagnose the issue

-- 1. Check if class_id column exists and its properties
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'class_id';

-- 2. Check if classes table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'classes';

-- 3. Check if teacher_classes table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'teacher_classes';

-- 4. Check if the database functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_teacher_classes', 'get_class_students_with_parents');

-- 5. Check current profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
