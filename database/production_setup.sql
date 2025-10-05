-- Production Setup for Teacher Students Page
-- This script ensures all data is properly linked and production-ready

-- 1. Ensure all teacher assignments have corresponding classes
SELECT 'CHECKING TEACHER ASSIGNMENTS WITHOUT CLASSES:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    CASE WHEN c.id IS NULL THEN 'MISSING CLASS' ELSE 'CLASS EXISTS' END as status
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
WHERE tca.is_active = true
ORDER BY tca.teacher_id;

-- 2. Create missing classes for any orphaned assignments
INSERT INTO classes (
    id, 
    school_id, 
    grade_level_id, 
    class_name, 
    class_code, 
    subject, 
    room_number, 
    max_students, 
    current_students, 
    is_active,
    created_at,
    updated_at
) 
SELECT DISTINCT
    tca.class_id,
    '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid as school_id,
    (
        SELECT gl.id 
        FROM grade_levels gl 
        WHERE gl.school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid
        AND gl.is_active = true 
        ORDER BY gl.grade_level 
        LIMIT 1
    ) as grade_level_id,
    'Class ' || SUBSTRING(tca.class_id::text, 1, 8) as class_name,
    'CLS-' || SUBSTRING(tca.class_id::text, 1, 4) as class_code,
    'General' as subject,
    '101' as room_number,
    25 as max_students,
    20 as current_students,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
WHERE c.id IS NULL 
AND tca.is_active = true
ON CONFLICT (id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    updated_at = NOW();

-- 3. Ensure all classes have proper grade level links
UPDATE classes 
SET grade_level_id = (
    SELECT gl.id 
    FROM grade_levels gl 
    WHERE gl.school_id = classes.school_id
    AND gl.is_active = true 
    ORDER BY gl.grade_level 
    LIMIT 1
)
WHERE grade_level_id IS NULL 
AND school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid;

-- 4. Clean up any inactive or orphaned assignments
DELETE FROM teacher_class_assignments 
WHERE is_active = false 
OR assigned_at < NOW() - INTERVAL '1 year';

-- 5. Update student counts in classes
UPDATE classes 
SET current_students = (
    SELECT COUNT(*)
    FROM student_class_assignments sca
    WHERE sca.class_id = classes.id
    AND sca.is_active = true
)
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid;

-- 6. Ensure all teachers have at least one class assignment
-- (This is optional - only run if you want to assign classes to teachers without any)
/*
INSERT INTO teacher_class_assignments (
    teacher_id,
    class_id,
    school_id,
    is_primary_teacher,
    is_active,
    assigned_at
)
SELECT DISTINCT
    u.id as teacher_id,
    c.id as class_id,
    c.school_id,
    true as is_primary_teacher,
    true as is_active,
    NOW() as assigned_at
FROM auth.users u
CROSS JOIN LATERAL (
    SELECT id, school_id 
    FROM classes 
    WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid
    ORDER BY created_at 
    LIMIT 1
) c
WHERE u.id NOT IN (
    SELECT DISTINCT teacher_id 
    FROM teacher_class_assignments 
    WHERE is_active = true
)
AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = u.id 
    AND p.role = 'teacher'
    AND p.school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid
)
ON CONFLICT (teacher_id, class_id) DO NOTHING;
*/

-- 7. Final verification - show all teacher assignments with class details
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
    tca.teacher_id,
    u.email as teacher_email,
    c.class_name,
    c.class_code,
    c.subject,
    gl.grade_level,
    c.current_students,
    c.max_students,
    tca.is_primary_teacher,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN auth.users u ON tca.teacher_id = u.id
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.is_active = true
ORDER BY u.email, c.class_name;

-- 8. Show summary statistics
SELECT 'SUMMARY STATISTICS:' as info;
SELECT 
    'Total Teachers' as metric,
    COUNT(DISTINCT tca.teacher_id) as count
FROM teacher_class_assignments tca
WHERE tca.is_active = true

UNION ALL

SELECT 
    'Total Classes' as metric,
    COUNT(DISTINCT tca.class_id) as count
FROM teacher_class_assignments tca
WHERE tca.is_active = true

UNION ALL

SELECT 
    'Total Assignments' as metric,
    COUNT(*) as count
FROM teacher_class_assignments tca
WHERE tca.is_active = true

UNION ALL

SELECT 
    'Classes with Grade Levels' as metric,
    COUNT(*) as count
FROM classes c
WHERE c.grade_level_id IS NOT NULL
AND c.school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'::uuid;
