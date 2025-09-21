-- Sample school data for testing
-- This creates a sample school with grade levels and classes for development/testing

-- Insert a sample school
INSERT INTO schools (id, name, address, phone, email, admin_id, school_code, messaging_encryption_key)
VALUES (
    gen_random_uuid(),
    'Catalyst Elementary School',
    '123 Education Street, Learning City, LC 12345',
    '+1-555-0123',
    'admin@catalyst-elementary.edu',
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user as admin
    'CATALYST001',
    encode(gen_random_bytes(32), 'hex')
) ON CONFLICT (school_code) DO NOTHING;

-- Get the school ID for reference
DO $$
DECLARE
    school_uuid UUID;
BEGIN
    SELECT id INTO school_uuid FROM schools WHERE school_code = 'CATALYST001';
    
    -- Insert grade levels for the school
    INSERT INTO grade_levels (school_id, grade_level, grade_name, is_active) VALUES
        (school_uuid, 'K', 'Kindergarten', true),
        (school_uuid, '1', 'First Grade', true),
        (school_uuid, '2', 'Second Grade', true),
        (school_uuid, '3', 'Third Grade', true),
        (school_uuid, '4', 'Fourth Grade', true),
        (school_uuid, '5', 'Fifth Grade', true)
    ON CONFLICT (school_id, grade_level) DO NOTHING;
    
    -- Insert classes for each grade level
    INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject, room_number, max_students, is_active)
    SELECT 
        school_uuid,
        gl.id,
        CASE 
            WHEN gl.grade_level IN ('K', '1', '2') THEN gl.grade_name || ' - Class A'
            ELSE gl.grade_name || ' - Mathematics'
        END,
        gl.grade_level || 'A',
        CASE 
            WHEN gl.grade_level IN ('K', '1', '2') THEN 'General'
            ELSE 'Mathematics'
        END,
        '10' || gl.grade_level,
        25,
        true
    FROM grade_levels gl 
    WHERE gl.school_id = school_uuid
    ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;
    
    -- Add additional classes for higher grades
    INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject, room_number, max_students, is_active)
    SELECT 
        school_uuid,
        gl.id,
        gl.grade_name || ' - English',
        gl.grade_level || 'B',
        'English',
        '20' || gl.grade_level,
        25,
        true
    FROM grade_levels gl 
    WHERE gl.school_id = school_uuid AND gl.grade_level IN ('3', '4', '5')
    ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;
    
END $$;
