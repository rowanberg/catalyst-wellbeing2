-- Diagnostic queries to check existing table structures
-- Run these queries in Supabase SQL Editor to see what tables and columns exist

-- 1. Check if grade_levels table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'grade_levels' 
ORDER BY ordinal_position;

-- 2. Check if classes table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- 3. Check if teacher_class_assignments table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_class_assignments' 
ORDER BY ordinal_position;

-- 4. Check if student_class_assignments table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_class_assignments' 
ORDER BY ordinal_position;

-- 5. Check what data is currently in grade_levels (if any)
SELECT * FROM grade_levels LIMIT 5;

-- 6. Check what data is currently in classes (if any)
SELECT * FROM classes LIMIT 5;

-- 7. Check what data is currently in teacher_class_assignments (if any)
SELECT * FROM teacher_class_assignments LIMIT 5;
