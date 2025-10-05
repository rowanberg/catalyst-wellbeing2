-- Create Missing Classes
-- The API shows that these class IDs don't exist in the classes table

-- 1. Check what classes currently exist
SELECT 'EXISTING CLASSES:' as info;
SELECT id, class_name, class_code, school_id, grade_level_id
FROM classes 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253';

-- 2. Check what grade levels exist
SELECT 'EXISTING GRADE LEVELS:' as info;
SELECT id, school_id, grade_level, is_active
FROM grade_levels 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY grade_level;

-- 3. Create the missing classes with the exact IDs that the assignments are looking for
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
) VALUES
-- Use the first available grade level ID
('13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'Mathematics 5A', '5A-MATH', 'Mathematics', '101', 25, 22, true, NOW(), NOW()),
('660acb79-3c77-4034-917f-d494793cd5d5', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'Science 5B', '5B-SCI', 'Science', '102', 25, 20, true, NOW(), NOW()),
('172e04cc-2c40-4954-a4ad-13a6224d0ab1', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'English 5C', '5C-ENG', 'English Language Arts', '103', 30, 28, true, NOW(), NOW()),
('05c96abe-74eb-4e97-ab35-5a42f27beee7', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'History 5D', '5D-HIST', 'History', '104', 28, 25, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    class_code = EXCLUDED.class_code,
    subject = EXCLUDED.subject,
    grade_level_id = EXCLUDED.grade_level_id,
    school_id = EXCLUDED.school_id,
    updated_at = NOW();

-- 4. Verify the classes were created
SELECT 'CLASSES AFTER CREATION:' as info;
SELECT id, class_name, class_code, school_id, grade_level_id
FROM classes 
WHERE id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
)
ORDER BY class_name;

-- 5. Verify the teacher assignments still exist
SELECT 'TEACHER ASSIGNMENTS:' as info;
SELECT id, teacher_id, class_id, school_id, is_primary_teacher, is_active
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
ORDER BY assigned_at DESC;

-- 6. Test the JOIN to make sure it works
SELECT 'JOIN TEST:' as info;
SELECT 
    tca.id as assignment_id,
    tca.class_id,
    c.class_name,
    c.class_code,
    gl.grade_level,
    CONCAT('Grade ', gl.grade_level) as grade_name
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND tca.is_active = true
ORDER BY c.class_name;
