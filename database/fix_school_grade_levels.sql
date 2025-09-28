-- Fix grade levels for school S8BQY3IF3JSK (JEBIN PUBLIC SCHOOL)
-- School ID: f2baa26b-ad79-4576-bead-e57dc942e4f8

-- Insert grade levels for the specific school
INSERT INTO grade_levels (school_id, grade_level, grade_name, is_active) VALUES
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', 'K', 'Kindergarten', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '1', 'First Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '2', 'Second Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '3', 'Third Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '4', 'Fourth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '5', 'Fifth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '6', 'Sixth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '7', 'Seventh Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '8', 'Eighth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '9', 'Ninth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '10', 'Tenth Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '11', 'Eleventh Grade', true),
    ('f2baa26b-ad79-4576-bead-e57dc942e4f8', '12', 'Twelfth Grade', true)
ON CONFLICT (school_id, grade_level) DO NOTHING;

-- Insert sample classes for each grade level
INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject, max_students, current_students, is_active) 
SELECT 
    gl.school_id,
    gl.id,
    'Class A',
    CONCAT(gl.grade_level, 'A'),
    'General',
    25,
    0,
    true
FROM grade_levels gl
WHERE gl.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject, max_students, current_students, is_active) 
SELECT 
    gl.school_id,
    gl.id,
    'Class B',
    CONCAT(gl.grade_level, 'B'),
    'General',
    25,
    0,
    true
FROM grade_levels gl
WHERE gl.school_id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

-- Verify the data was inserted correctly
SELECT 
    s.name as school_name,
    gl.grade_level,
    gl.grade_name,
    COUNT(c.id) as class_count
FROM schools s
JOIN grade_levels gl ON s.id = gl.school_id
LEFT JOIN classes c ON gl.id = c.grade_level_id AND c.is_active = true
WHERE s.id = 'f2baa26b-ad79-4576-bead-e57dc942e4f8'
GROUP BY s.name, gl.grade_level, gl.grade_name
ORDER BY gl.grade_level;
