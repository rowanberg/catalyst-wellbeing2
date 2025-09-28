-- Comprehensive Fix for Teacher Students Page
-- This script ensures all necessary data exists for the teacher students functionality

-- 1. First, find existing grade levels for the school
SELECT 'EXISTING GRADE LEVELS:' as info;
SELECT id, school_id, level, name, grade_level, is_active 
FROM grade_levels 
WHERE school_id = '142dac48-a69a-46cb-b5a1-22fca8113253'
ORDER BY level;

-- 2. Use an existing grade level ID (we'll update this after seeing what exists)
-- For now, let's create classes with a placeholder and update them later
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
-- Use the same school_id and a grade_level_id from existing data
('13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', '142dac48-a69a-46cb-b5a1-22fca8113253', '8cbac2d1-19eb-43cb-9b01-9c0222f3d5eb', 'Mathematics 5A', '5A-MATH', 'Mathematics', '101', 25, 22, true),
('660acb79-3c77-4034-917f-d494793cd5d5', '142dac48-a69a-46cb-b5a1-22fca8113253', '8cbac2d1-19eb-43cb-9b01-9c0222f3d5eb', 'Science 5B', '5B-SCI', 'Science', '102', 25, 20, true),
('172e04cc-2c40-4954-a4ad-13a6224d0ab1', '142dac48-a69a-46cb-b5a1-22fca8113253', '8cbac2d1-19eb-43cb-9b01-9c0222f3d5eb', 'English 5C', '5C-ENG', 'English Language Arts', '103', 30, 28, true),
('05c96abe-74eb-4e97-ab35-5a42f27beee7', '142dac48-a69a-46cb-b5a1-22fca8113253', '8cbac2d1-19eb-43cb-9b01-9c0222f3d5eb', 'History 5D', '5D-HIST', 'History', '104', 28, 25, true)
ON CONFLICT (id) DO UPDATE SET
    class_name = EXCLUDED.class_name,
    class_code = EXCLUDED.class_code,
    subject = EXCLUDED.subject,
    room_number = EXCLUDED.room_number,
    max_students = EXCLUDED.max_students,
    current_students = EXCLUDED.current_students;

-- 3. Ensure teacher_class_assignments table exists
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    is_primary_teacher BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_active ON teacher_class_assignments(is_active);

-- 4. Insert teacher assignments
INSERT INTO teacher_class_assignments (
    teacher_id, 
    class_id, 
    is_primary_teacher, 
    is_active,
    assigned_at
) VALUES
-- Assign teacher to all 4 classes
('641bb749-58ed-444e-b39c-984e59a93dd7', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '660acb79-3c77-4034-917f-d494793cd5d5', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true, true, NOW()),
('641bb749-58ed-444e-b39c-984e59a93dd7', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true, true, NOW())
ON CONFLICT (teacher_id, class_id) DO UPDATE SET
    is_primary_teacher = EXCLUDED.is_primary_teacher,
    is_active = EXCLUDED.is_active,
    assigned_at = EXCLUDED.assigned_at,
    updated_at = NOW();

-- 5. Verification queries
-- Check classes
SELECT 'CLASSES' as table_name, COUNT(*) as count FROM classes 
WHERE id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5', 
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
);

-- Check teacher assignments
SELECT 'TEACHER_ASSIGNMENTS' as table_name, COUNT(*) as count 
FROM teacher_class_assignments 
WHERE teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7';

-- Show detailed results
SELECT 
    c.class_name,
    c.class_code,
    c.subject,
    c.current_students,
    tca.is_primary_teacher,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
  AND tca.is_active = true
ORDER BY c.class_name;
