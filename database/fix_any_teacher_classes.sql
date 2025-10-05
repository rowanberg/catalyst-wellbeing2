-- Fix Assigned Classes for Any Teacher
-- This script will create missing classes for any teacher assignments

-- 1. Show all teacher assignments that have missing classes
SELECT 'TEACHER ASSIGNMENTS WITH MISSING CLASSES:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    tca.is_primary_teacher,
    tca.assigned_at,
    CASE WHEN c.id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as class_status
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
WHERE tca.is_active = true
ORDER BY tca.teacher_id, tca.assigned_at;

-- 2. Get available grade levels
SELECT 'AVAILABLE GRADE LEVELS:' as info;
SELECT id, school_id, grade_level, is_active
FROM grade_levels 
WHERE is_active = true
ORDER BY school_id, grade_level;

-- 3. Create missing classes for all teacher assignments
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

-- 4. Verify all assignments now have classes
SELECT 'VERIFICATION - ALL ASSIGNMENTS WITH CLASSES:' as info;
SELECT 
    tca.teacher_id,
    tca.class_id,
    c.class_name,
    c.class_code,
    gl.grade_level,
    tca.is_primary_teacher,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.is_active = true
ORDER BY tca.teacher_id, c.class_name;

-- 5. Show summary by teacher
SELECT 'SUMMARY BY TEACHER:' as info;
SELECT 
    tca.teacher_id,
    COUNT(*) as total_classes,
    STRING_AGG(c.class_name, ', ') as class_names
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
WHERE tca.is_active = true
GROUP BY tca.teacher_id
ORDER BY tca.teacher_id;
