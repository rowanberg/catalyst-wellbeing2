-- Debug Teacher Data Issues
-- This script helps identify what data exists and what might be missing

-- 1. Check if teacher exists
SELECT 'TEACHER CHECK:' as info;
SELECT id, email, role 
FROM auth.users 
WHERE id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 2. Check teacher assignments
SELECT 'TEACHER ASSIGNMENTS:' as info;
SELECT teacher_id, class_id, is_primary_teacher, is_active, assigned_at
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- 3. Check classes that should be assigned
SELECT 'CLASSES TO BE ASSIGNED:' as info;
SELECT id, class_name, class_code, grade_level_id, school_id
FROM classes 
WHERE id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
);

-- 4. Check grade levels
SELECT 'GRADE LEVELS:' as info;
SELECT id, school_id, grade_level, is_active
FROM grade_levels 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY grade_level;

-- 5. Check if classes exist at all
SELECT 'ALL CLASSES IN SCHOOL:' as info;
SELECT id, class_name, class_code, grade_level_id
FROM classes 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253';

-- 6. Create missing classes if they don't exist
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
    grade_level_id = EXCLUDED.grade_level_id;

-- 7. Create teacher assignments
INSERT INTO teacher_class_assignments (
    teacher_id, 
    class_id, 
    is_primary_teacher, 
    is_active,
    assigned_at
) VALUES
('641bb749-58ed-444e-b39c-984e59a93dd7', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '660acb79-3c77-4034-917f-d494793cd5d5', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true, true, NOW())
ON CONFLICT (teacher_id, class_id) DO UPDATE SET
    is_primary_teacher = EXCLUDED.is_primary_teacher,
    is_active = EXCLUDED.is_active,
    assigned_at = EXCLUDED.assigned_at;

-- 8. Final verification
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
    tca.teacher_id,
    c.class_name,
    c.class_code,
    gl.grade_level,
    tca.is_active,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
ORDER BY c.class_name;
