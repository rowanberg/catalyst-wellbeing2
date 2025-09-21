-- Quick fix for current teacher's missing classes
-- Teacher ID: 641bb749-58ed-444e-b39c-984e59a93dd7

-- 1. Check current assignments
SELECT 'CURRENT TEACHER ASSIGNMENTS:' as info;
SELECT 
    id,
    class_id,
    is_primary_teacher,
    assigned_at,
    is_active
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND is_active = true;

-- 2. Check if classes exist for current teacher's assignments
SELECT 'CLASSES FOR CURRENT TEACHER:' as info;
SELECT 
    tca.class_id,
    c.id as class_exists,
    c.class_name,
    c.class_code,
    c.subject,
    c.grade_level_id,
    gl.grade_level
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND tca.is_active = true;

-- 3. Create missing classes for current teacher
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
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND c.id IS NULL 
AND tca.is_active = true
ON CONFLICT (id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    updated_at = NOW();

-- 4. Final verification
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
    tca.id,
    tca.class_id,
    tca.is_primary_teacher,
    tca.assigned_at,
    c.class_name,
    c.class_code,
    c.subject,
    gl.grade_level
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND tca.is_active = true
ORDER BY tca.assigned_at DESC;
