-- Insert Teacher Class Assignments
-- This script creates assignments between the teacher and the classes

-- First, let's check if the teacher_class_assignments table exists
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    is_primary_teacher BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_active ON teacher_class_assignments(is_active);

-- Insert teacher assignments for the test teacher
-- Using the teacher ID from the error logs and the class IDs from insert_missing_classes.sql
INSERT INTO teacher_class_assignments (
    teacher_id, 
    class_id, 
    is_primary_teacher, 
    is_active,
    assigned_at
) VALUES
-- Assign teacher to Mathematics 5A
('641bb749-58ed-444e-b39c-984e59a93dd7', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true, true, NOW()),
-- Assign teacher to Science 5B  
('641bb749-58ed-444e-b39c-984e59a93dd7', '660acb79-3c77-4034-917f-d494793cd5d5', true, true, NOW()),
-- Assign teacher to English 5C
('641bb749-58ed-444e-b39c-984e59a93dd7', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true, true, NOW()),
-- Assign teacher to History 5D
('641bb749-58ed-444e-b39c-984e59a93dd7', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true, true, NOW())
ON CONFLICT (teacher_id, class_id) DO UPDATE SET
    is_primary_teacher = EXCLUDED.is_primary_teacher,
    is_active = EXCLUDED.is_active,
    assigned_at = EXCLUDED.assigned_at,
    updated_at = NOW();

-- Verify the assignments were created
SELECT 
    tca.id,
    tca.teacher_id,
    tca.class_id,
    c.class_name,
    c.class_code,
    tca.is_primary_teacher,
    tca.is_active,
    tca.assigned_at
FROM teacher_class_assignments tca
JOIN classes c ON tca.class_id = c.id
WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
ORDER BY c.class_name;

-- Also check if we have the teacher in the users/profiles table
SELECT id, email, role, school_id 
FROM auth.users 
WHERE id = '641bb749-58ed-444e-b39c-984e59a93dd7';
