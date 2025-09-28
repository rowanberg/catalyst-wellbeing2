-- Fix Class Linkage Issues
-- The assignments exist but classes are null in the JOIN query

-- 1. Check the current teacher_class_assignments
SELECT 'CURRENT TEACHER ASSIGNMENTS:' as info;
SELECT id, teacher_id, class_id, school_id, is_primary_teacher, is_active, assigned_at
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 2. Check if the class_ids in assignments actually exist in classes table
SELECT 'CHECKING CLASS EXISTENCE:' as info;
SELECT 
    tca.id as assignment_id,
    tca.class_id,
    c.id as class_exists,
    c.class_name,
    c.school_id as class_school_id,
    tca.school_id as assignment_school_id
FROM teacher_class_assignments tca
LEFT JOIN classes c ON tca.class_id = c.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 3. Check if there are classes that should be linked
SELECT 'AVAILABLE CLASSES IN SCHOOL:' as info;
SELECT id, class_name, class_code, school_id, grade_level_id
FROM classes 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY class_name;

-- 4. Delete the broken assignments and recreate them with correct class_ids
DELETE FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 5. Insert new assignments with the correct class_ids from our classes
INSERT INTO teacher_class_assignments (
    teacher_id, 
    class_id, 
    school_id,
    is_primary_teacher, 
    is_active,
    assigned_at
) 
SELECT 
    '641bb749-58ed-444e-b39c-984e59a93dd7' as teacher_id,
    c.id as class_id,
    c.school_id,
    true as is_primary_teacher,
    true as is_active,
    NOW() as assigned_at
FROM classes c
WHERE c.school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
AND c.id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
);

-- 6. If the above classes don't exist, create them first
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
    is_active
) VALUES
('13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'Mathematics 5A', '5A-MATH', 'Mathematics', '101', 25, 22, true),
('660acb79-3c77-4034-917f-d494793cd5d5', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'Science 5B', '5B-SCI', 'Science', '102', 25, 20, true),
('172e04cc-2c40-4954-a4ad-13a6224d0ab1', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'English 5C', '5C-ENG', 'English Language Arts', '103', 30, 28, true),
('05c96abe-74eb-4e97-ab35-5a42f27beee7', '142dac48-a69a-46cb-b5a1-22fca8113253', (SELECT id FROM grade_levels WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' AND is_active = true ORDER BY grade_level LIMIT 1), 'History 5D', '5D-HIST', 'History', '104', 28, 25, true)
ON CONFLICT (id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    class_code = EXCLUDED.class_code,
    subject = EXCLUDED.subject,
    grade_level_id = EXCLUDED.grade_level_id,
    school_id = EXCLUDED.school_id;

-- 7. Now create the assignments again (in case the INSERT SELECT didn't work)
INSERT INTO teacher_class_assignments (
    teacher_id, 
    class_id, 
    school_id,
    is_primary_teacher, 
    is_active,
    assigned_at
) VALUES
('641bb749-58ed-444e-b39c-984e59a93dd7', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', '142dac48-a69a-46cb-b5a1-22fca8113253', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '660acb79-3c77-4034-917f-d494793cd5d5', '142dac48-a69a-46cb-b5a1-22fca8113253', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', '142dac48-a69a-46cb-b5a1-22fca8113253', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '05c96abe-74eb-4e97-ab35-5a42f27beee7', '142dac48-a69a-46cb-b5a1-22fca8113253', true, true, NOW())
ON CONFLICT (teacher_id, class_id) DO UPDATE SET
    school_id = EXCLUDED.school_id,
    is_primary_teacher = EXCLUDED.is_primary_teacher,
    is_active = EXCLUDED.is_active,
    assigned_at = EXCLUDED.assigned_at;

-- 8. Final verification - this should now show proper JOIN results
SELECT 'FINAL VERIFICATION WITH JOIN:' as info;
SELECT 
    tca.id as assignment_id,
    tca.teacher_id,
    tca.class_id,
    tca.school_id as assignment_school_id,
    c.id as class_id_check,
    c.class_name,
    c.class_code,
    c.school_id as class_school_id,
    gl.grade_level,
    CONCAT('Grade ', gl.grade_level) as grade_name
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
AND tca.is_active = true
ORDER BY c.class_name;
