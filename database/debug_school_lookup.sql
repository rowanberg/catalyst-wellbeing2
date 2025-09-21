-- Debug script to check if school S8BQY3IF3JSK exists and has grade levels
-- Run this in Supabase SQL Editor to verify your data

-- Check if school exists
SELECT 'Schools with code S8BQY3IF3JSK:' as query_type;
SELECT id, name, school_code, created_at 
FROM schools 
WHERE school_code = 'S8BQY3IF3JSK';

-- Check all schools (to see what codes exist)
SELECT 'All schools in database:' as query_type;
SELECT id, name, school_code, created_at 
FROM schools 
ORDER BY created_at DESC;

-- Check grade levels for this school
SELECT 'Grade levels for S8BQY3IF3JSK:' as query_type;
SELECT gl.id, gl.grade_level, gl.grade_name, gl.is_active, s.school_code
FROM grade_levels gl
JOIN schools s ON gl.school_id = s.id
WHERE s.school_code = 'S8BQY3IF3JSK'
ORDER BY gl.grade_level;

-- Check classes for this school
SELECT 'Classes for S8BQY3IF3JSK:' as query_type;
SELECT c.id, c.grade_level_id, c.class_name, c.max_students, s.school_code, gl.grade_level, gl.grade_name
FROM classes c
JOIN schools s ON c.school_id = s.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE s.school_code = 'S8BQY3IF3JSK'
ORDER BY gl.grade_level, c.class_name;
