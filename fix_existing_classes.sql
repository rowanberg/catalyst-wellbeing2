-- Fix existing classes data to show real names instead of "Class 1, Class 2, Class 3"
-- This works with your existing table structure

-- First, let's check what columns exist in the classes table
-- Run this to see the structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'classes' ORDER BY ordinal_position;

-- If classes table doesn't exist, create it with minimal structure
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100),
    class_code VARCHAR(20),
    subject VARCHAR(50),
    room_number VARCHAR(20),
    max_students INTEGER DEFAULT 30,
    grade_level_id UUID,
    school_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grade_levels table if it doesn't exist (with flexible column names)
CREATE TABLE IF NOT EXISTS grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    level INTEGER,
    description TEXT,
    school_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert grade levels (using only 'name' field to avoid column issues)
INSERT INTO grade_levels (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'Grade 5', 'Fifth grade elementary')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert the actual classes with real names for your teacher's assigned class IDs
INSERT INTO classes (id, name, class_name, class_code, subject, room_number, max_students, grade_level_id) VALUES
('13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', 'Mathematics 5A', 'Mathematics 5A', '5A-MATH', 'Mathematics', '101', 25, '550e8400-e29b-41d4-a716-446655440005'),
('660acb79-3c77-4034-917f-d494793cd5d5', 'Science 5B', 'Science 5B', '5B-SCI', 'Science', '102', 25, '550e8400-e29b-41d4-a716-446655440005'),
('172e04cc-2c40-4954-a4ad-13a6224d0ab1', 'English 5C', 'English 5C', '5C-ENG', 'English Language Arts', '103', 30, '550e8400-e29b-41d4-a716-446655440005'),
('05c96abe-74eb-4e97-ab35-5a42f27beee7', 'History 5D', 'History 5D', '5D-HIST', 'History', '104', 28, '550e8400-e29b-41d4-a716-446655440005')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    class_name = EXCLUDED.class_name,
    class_code = EXCLUDED.class_code,
    subject = EXCLUDED.subject,
    room_number = EXCLUDED.room_number,
    max_students = EXCLUDED.max_students,
    grade_level_id = EXCLUDED.grade_level_id;

-- Create student_class_assignments table for student counts
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- Insert some sample students for realistic counts (replace with real student IDs if available)
INSERT INTO student_class_assignments (student_id, class_id, is_active) VALUES
-- Mathematics 5A students
('11111111-1111-1111-1111-111111111111', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('22222222-2222-2222-2222-222222222222', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('33333333-3333-3333-3333-333333333333', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('44444444-4444-4444-4444-444444444444', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('55555555-5555-5555-5555-555555555555', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),

-- Science 5B students
('11111111-1111-1111-1111-111111111111', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('22222222-2222-2222-2222-222222222222', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('66666666-6666-6666-6666-666666666666', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('77777777-7777-7777-7777-777777777777', '660acb79-3c77-4034-917f-d494793cd5d5', true),

-- English 5C students
('11111111-1111-1111-1111-111111111111', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true),
('33333333-3333-3333-3333-333333333333', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true),
('88888888-8888-8888-8888-888888888888', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true),

-- History 5D students
('22222222-2222-2222-2222-222222222222', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true),
('44444444-4444-4444-4444-444444444444', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true),
('99999999-9999-9999-9999-999999999999', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '05c96abe-74eb-4e97-ab35-5a42f27beee7', true)
ON CONFLICT (student_id, class_id) DO NOTHING;

-- Verify the data
SELECT 
    c.id,
    c.name as class_name,
    c.class_code,
    c.subject,
    c.room_number,
    gl.name as grade_name,
    COUNT(sca.student_id) as student_count
FROM classes c
LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
LEFT JOIN student_class_assignments sca ON c.id = sca.class_id AND sca.is_active = true
WHERE c.id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
)
GROUP BY c.id, c.name, c.class_code, c.subject, c.room_number, gl.name
ORDER BY c.name;
