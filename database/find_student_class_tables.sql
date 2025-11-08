-- Find tables related to students and classes
-- This will help identify the correct table names in your database

-- 1. List ALL tables in the database
SELECT 
  '=== ALL TABLES ===' as info,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Find tables with 'student' in the name
SELECT 
  '=== TABLES WITH STUDENT ===' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%student%';

-- 3. Find tables with 'class' in the name
SELECT 
  '=== TABLES WITH CLASS ===' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%class%';

-- 4. Check profiles table structure
SELECT 
  '=== PROFILES COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check if profiles has class_id column
SELECT 
  '=== PROFILES CLASS_ID CHECK ===' as info,
  COUNT(*) as has_class_id
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'class_id';
