-- Quick Debug for Assigned Classes Issue
-- Check current state and fix any issues

-- 1. Check current teacher assignments
SELECT 'CURRENT TEACHER ASSIGNMENTS:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    tca.is_active,
    tca.assigned_at,
    u.email as teacher_email
FROM teacher_class_assignments tca
LEFT JOIN auth.users u ON tca.teacher_id = u.id
WHERE tca.is_active = true
ORDER BY tca.assigned_at DESC
LIMIT 10;

-- 2. Check if classes exist for these assignments
SELECT 'CLASSES FOR ASSIGNMENTS:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    c.class_name,
    c.class_code,
    c.subject,
    gl.grade_level
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.is_active = true
ORDER BY tca.assigned_at DESC
LIMIT 10;

-- 3. Check profiles table for school_id
SELECT 'TEACHER PROFILES:' as info;
SELECT 
    p.user_id,
    p.school_id,
    p.role,
    u.email
FROM profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.role = 'teacher'
LIMIT 5;

-- 4. Test the exact query that the API would use
SELECT 'API QUERY TEST:' as info;
SELECT 
    tca.id,
    tca.class_id,
    tca.is_primary_teacher,
    tca.assigned_at,
    c.id as class_exists,
    c.class_name,
    c.class_code,
    c.subject,
    c.room_number,
    c.current_students,
    c.max_students,
    c.grade_level_id,
    gl.grade_level
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.is_active = true
ORDER BY tca.assigned_at DESC
LIMIT 5;
