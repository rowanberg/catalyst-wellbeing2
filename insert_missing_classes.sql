-- Insert the missing class records for the teacher's assigned class IDs
-- This will create the classes that the teacher is assigned to but don't exist in the classes table

-- First, let's check if these class IDs already exist
SELECT id, class_name, class_code FROM classes WHERE id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
);

-- Get a sample grade_level_id to use (we'll use one from existing data)
-- SELECT grade_level_id FROM classes LIMIT 1;

-- Insert the missing classes with real names
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

-- Verify the classes were inserted
SELECT id, class_name, class_code, subject, room_number, max_students, current_students 
FROM classes 
WHERE id IN (
    '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8',
    '660acb79-3c77-4034-917f-d494793cd5d5',
    '172e04cc-2c40-4954-a4ad-13a6224d0ab1',
    '05c96abe-74eb-4e97-ab35-5a42f27beee7'
)
ORDER BY class_name;
