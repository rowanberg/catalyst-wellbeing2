-- Create school with specific code S8BQY3IF3JSK for testing
INSERT INTO schools (id, name, address, phone, email, admin_id, school_code, messaging_encryption_key)
VALUES (
    gen_random_uuid(),
    'Test School S8BQY3IF3JSK',
    '456 Test Avenue, Test City, TC 67890',
    '+1-555-0456',
    'admin@testschool.edu',
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user as admin
    'S8BQY3IF3JSK',
    encode(gen_random_bytes(32), 'hex')
) ON CONFLICT (school_code) DO NOTHING;

-- Get the school ID for reference
DO $$
DECLARE
    school_uuid UUID;
BEGIN
    SELECT id INTO school_uuid FROM schools WHERE school_code = 'S8BQY3IF3JSK';
    
    -- Insert grade levels for this school
    INSERT INTO grade_levels (school_id, grade_level, grade_name, is_active) VALUES
    (school_uuid, 'K', 'Kindergarten', true),
    (school_uuid, '1', 'First Grade', true),
    (school_uuid, '2', 'Second Grade', true),
    (school_uuid, '3', 'Third Grade', true),
    (school_uuid, '4', 'Fourth Grade', true),
    (school_uuid, '5', 'Fifth Grade', true)
    ON CONFLICT (school_id, grade_level) DO NOTHING;
    
    -- Insert sample classes
    INSERT INTO classes (school_id, grade_level, class_name, teacher_id, max_students) VALUES
    (school_uuid, '1', 'Class 1A', null, 25),
    (school_uuid, '1', 'Class 1B', null, 25),
    (school_uuid, '2', 'Class 2A', null, 25),
    (school_uuid, '3', 'Class 3A', null, 25)
    ON CONFLICT (school_id, grade_level, class_name) DO NOTHING;
END $$;
