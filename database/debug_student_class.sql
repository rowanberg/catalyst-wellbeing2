-- Debug student class name issue
-- Check what's in the profiles table for the student

-- 1. Check the student's profile data
SELECT 'STUDENT PROFILE DATA:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    class_name,
    grade_level,
    school_id
FROM profiles 
WHERE class_name = '55ac5f2c-7e1c-420f-ac92-4bfc1693a8ff'
OR class_name LIKE '%55ac5f2c%';

-- 2. Check if there's a class with this ID
SELECT 'CLASS WITH THIS ID:' as info;
SELECT 
    id,
    class_name,
    class_code,
    subject,
    grade_level_id
FROM classes 
WHERE id = '55ac5f2c-7e1c-420f-ac92-4bfc1693a8ff';

-- 3. Check student_class_assignments for this student
SELECT 'STUDENT CLASS ASSIGNMENTS:' as info;
SELECT 
    sca.student_id,
    sca.class_id,
    sca.is_active,
    c.class_name,
    c.class_code,
    gl.grade_level
FROM student_class_assignments sca
LEFT JOIN classes c ON sca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE sca.student_id IN (
    SELECT user_id FROM profiles 
    WHERE class_name = '55ac5f2c-7e1c-420f-ac92-4bfc1693a8ff'
);

-- 4. Check all students with UUID in class_name
SELECT 'ALL STUDENTS WITH UUID CLASS NAMES:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    class_name,
    grade_level
FROM profiles 
WHERE class_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 5. Fix the issue by updating class_name to actual class name
UPDATE profiles 
SET class_name = (
    SELECT c.class_name 
    FROM classes c 
    WHERE c.id = profiles.class_name::uuid
)
WHERE class_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
AND EXISTS (
    SELECT 1 FROM classes c WHERE c.id = profiles.class_name::uuid
);

-- 6. Verify the fix
SELECT 'AFTER FIX - STUDENT PROFILE DATA:' as info;
SELECT 
    user_id,
    first_name,
    last_name,
    class_name,
    grade_level,
    school_id
FROM profiles 
WHERE user_id IN (
    SELECT user_id FROM profiles 
    WHERE class_name = '55ac5f2c-7e1c-420f-ac92-4bfc1693a8ff'
    OR first_name IS NOT NULL
)
LIMIT 5;
