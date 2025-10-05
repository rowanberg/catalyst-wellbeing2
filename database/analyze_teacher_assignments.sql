-- Comprehensive Analysis of Teacher Class Assignment Storage
-- This script finds all possible places where teacher-class relationships are stored

-- 1. Check all tables that might contain teacher assignments
SELECT 'ALL TABLES IN DATABASE:' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%teacher%' OR 
    table_name ILIKE '%class%' OR 
    table_name ILIKE '%assign%' OR
    table_name ILIKE '%user%' OR
    table_name ILIKE '%profile%'
)
ORDER BY table_name;

-- 2. Check teacher_class_assignments table structure
SELECT 'TEACHER_CLASS_ASSIGNMENTS STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_class_assignments'
ORDER BY ordinal_position;

-- 3. Check if there's a classes table with teacher_id column
SELECT 'CLASSES TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- 4. Check if there's a users/profiles table with class assignments
SELECT 'USERS/PROFILES TABLES:' as info;
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'profiles', 'user_profiles', 'teacher_profiles')
AND (column_name ILIKE '%class%' OR column_name ILIKE '%assign%')
ORDER BY table_name, ordinal_position;

-- 5. Look for any table with both teacher_id and class_id columns
SELECT 'TABLES WITH TEACHER_ID AND CLASS_ID:' as info;
SELECT DISTINCT t1.table_name
FROM information_schema.columns t1
JOIN information_schema.columns t2 ON t1.table_name = t2.table_name
WHERE t1.column_name ILIKE '%teacher%id%'
AND t2.column_name ILIKE '%class%id%'
ORDER BY t1.table_name;

-- 6. Check for any JSON columns that might store assignments
SELECT 'TABLES WITH JSON COLUMNS:' as info;
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE data_type IN ('json', 'jsonb')
ORDER BY table_name;

-- 7. Check auth.users table structure (might have metadata)
SELECT 'AUTH.USERS STRUCTURE:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 8. Check for any views that might show teacher assignments
SELECT 'VIEWS RELATED TO TEACHERS/CLASSES:' as info;
SELECT table_name, view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND (
    table_name ILIKE '%teacher%' OR 
    table_name ILIKE '%class%' OR 
    table_name ILIKE '%assign%'
)
ORDER BY table_name;

-- 9. Check if classes table has any teacher-related columns
SELECT 'CLASSES TABLE COLUMNS:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'classes'
AND (
    column_name ILIKE '%teacher%' OR 
    column_name ILIKE '%created%' OR 
    column_name ILIKE '%assign%'
)
ORDER BY column_name;

-- 9b. Show sample classes data with existing columns only
SELECT 'SAMPLE CLASSES DATA:' as info;
SELECT id, class_name, class_code, grade_level_id, school_id, created_at, updated_at
FROM classes 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
LIMIT 5;

-- 10. Check for any other assignment-related tables
SELECT 'ALL ASSIGNMENT TABLES:' as info;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name ILIKE '%assign%'
ORDER BY table_name;

-- 11. Search for functions that might handle teacher assignments
SELECT 'FUNCTIONS RELATED TO TEACHER ASSIGNMENTS:' as info;
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
    routine_name ILIKE '%teacher%' OR 
    routine_name ILIKE '%class%' OR 
    routine_name ILIKE '%assign%'
)
ORDER BY routine_name;
