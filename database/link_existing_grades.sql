-- Link Existing Grade Levels with Classes
-- This script finds existing grade levels and links them properly

-- 1. First, check what columns exist in grade_levels table
SELECT 'GRADE_LEVELS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'grade_levels' 
ORDER BY ordinal_position;

-- 2. Show existing grade levels (using only existing columns)
SELECT 'EXISTING GRADE LEVELS:' as info;
SELECT id, school_id, grade_level, is_active 
FROM grade_levels 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY grade_level;

-- 2. Show existing classes
SELECT 'EXISTING CLASSES:' as info;
SELECT id, class_name, grade_level_id, school_id
FROM classes 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY class_name;

-- 3. Update classes to use the first available grade level (Grade 5 or similar)
-- We'll use a subquery to get the first grade level ID
UPDATE classes 
SET grade_level_id = (
    SELECT id 
    FROM grade_levels 
    WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253' 
    AND is_active = true 
    ORDER BY grade_level 
    LIMIT 1
)
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
AND id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
);

-- 4. Verify the linkage
SELECT 'CLASSES WITH GRADE LEVELS:' as info;
SELECT 
    c.id,
    c.class_name,
    c.class_code,
    c.grade_level_id,
    gl.grade_level,
    CONCAT('Grade ', gl.grade_level) as grade_name
FROM classes c
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE c.school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY c.class_name;

-- 5. Ensure teacher assignments exist
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
    assigned_at = EXCLUDED.assigned_at,
    updated_at = NOW();

-- 6. Final verification
SELECT 'TEACHER ASSIGNMENTS WITH GRADE INFO:' as info;
SELECT 
    tca.teacher_id,
    c.class_name,
    c.class_code,
    gl.grade_level,
    CONCAT('Grade ', gl.grade_level) as grade_name,
    tca.is_primary_teacher,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
  AND tca.is_active = true
ORDER BY c.class_name;
