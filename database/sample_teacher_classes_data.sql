-- Sample Data for Teacher Classes System
-- Run this AFTER creating the schema to insert test data

-- 1. Insert sample grade levels
INSERT INTO grade_levels (id, level, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 1, 'Grade 1', 'First grade elementary'),
('550e8400-e29b-41d4-a716-446655440002', 2, 'Grade 2', 'Second grade elementary'),
('550e8400-e29b-41d4-a716-446655440003', 3, 'Grade 3', 'Third grade elementary'),
('550e8400-e29b-41d4-a716-446655440004', 4, 'Grade 4', 'Fourth grade elementary'),
('550e8400-e29b-41d4-a716-446655440005', 5, 'Grade 5', 'Fifth grade elementary')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample classes with real names (as assigned by admin)
INSERT INTO classes (id, name, class_name, class_code, subject, room_number, max_students, grade_level_id) VALUES
-- Grade 5 classes
('13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', 'Mathematics 5A', 'Mathematics 5A', '5A-MATH', 'Mathematics', '101', 25, '550e8400-e29b-41d4-a716-446655440005'),
('660acb79-3c77-4034-917f-d494793cd5d5', 'Science 5B', 'Science 5B', '5B-SCI', 'Science', '102', 25, '550e8400-e29b-41d4-a716-446655440005'),
('172e04cc-2c40-4954-a4ad-13a6224d0ab1', 'English 5C', 'English 5C', '5C-ENG', 'English Language Arts', '103', 30, '550e8400-e29b-41d4-a716-446655440005'),

-- Grade 4 classes
('450e8400-e29b-41d4-a716-446655440001', 'Mathematics 4A', 'Mathematics 4A', '4A-MATH', 'Mathematics', '201', 25, '550e8400-e29b-41d4-a716-446655440004'),
('450e8400-e29b-41d4-a716-446655440002', 'Science 4B', 'Science 4B', '4B-SCI', 'Science', '202', 25, '550e8400-e29b-41d4-a716-446655440004'),

-- Grade 3 classes
('350e8400-e29b-41d4-a716-446655440001', 'Reading 3A', 'Reading 3A', '3A-READ', 'Reading', '301', 20, '550e8400-e29b-41d4-a716-446655440003'),
('350e8400-e29b-41d4-a716-446655440002', 'Art 3B', 'Art 3B', '3B-ART', 'Art', '302', 20, '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert teacher class assignments for the specific teacher
-- Replace '641bb749-58ed-444e-b39c-984e59a93dd7' with the actual teacher ID
INSERT INTO teacher_class_assignments (teacher_id, class_id, is_primary_teacher, is_active) VALUES
('641bb749-58ed-444e-b39c-984e59a93dd7', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true, true),   -- Mathematics 5A
('641bb749-58ed-444e-b39c-984e59a93dd7', '660acb79-3c77-4034-917f-d494793cd5d5', true, true),   -- Science 5B
('641bb749-58ed-444e-b39c-984e59a93dd7', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', false, true)   -- English 5C (assistant)
ON CONFLICT (teacher_id, class_id) DO NOTHING;

-- 4. Insert sample students for testing student counts
-- You can replace these with actual student IDs from your system
INSERT INTO student_class_assignments (student_id, class_id, is_active) VALUES
-- Students in Mathematics 5A
('student-1-uuid-here', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('student-2-uuid-here', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('student-3-uuid-here', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('student-4-uuid-here', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),
('student-5-uuid-here', '13a30be3-ea4d-4b0f-a4a5-7ea0b2dc50d8', true),

-- Students in Science 5B
('student-1-uuid-here', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('student-2-uuid-here', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('student-6-uuid-here', '660acb79-3c77-4034-917f-d494793cd5d5', true),
('student-7-uuid-here', '660acb79-3c77-4034-917f-d494793cd5d5', true),

-- Students in English 5C
('student-1-uuid-here', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true),
('student-2-uuid-here', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true),
('student-3-uuid-here', '172e04cc-2c40-4954-a4ad-13a6224d0ab1', true)
ON CONFLICT (student_id, class_id) DO NOTHING;

-- 5. Verify the data was inserted correctly
-- Run these queries to check:

-- Check grade levels
-- SELECT * FROM grade_levels ORDER BY level;

-- Check classes
-- SELECT c.*, gl.name as grade_name FROM classes c 
-- LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id 
-- ORDER BY gl.level, c.name;

-- Check teacher assignments
-- SELECT tca.*, c.name as class_name, gl.name as grade_name 
-- FROM teacher_class_assignments tca
-- JOIN classes c ON tca.class_id = c.id
-- LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
-- WHERE tca.teacher_id = '641bb749-58ed-444e-b39c-984e59a93dd7'
-- ORDER BY gl.level, c.name;

-- Check student counts per class
-- SELECT c.name, COUNT(sca.student_id) as student_count
-- FROM classes c
-- LEFT JOIN student_class_assignments sca ON c.id = sca.class_id AND sca.is_active = true
-- GROUP BY c.id, c.name
-- ORDER BY c.name;
