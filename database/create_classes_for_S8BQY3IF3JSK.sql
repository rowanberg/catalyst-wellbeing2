-- Create classes for school S8BQY3IF3JSK
-- This will create classes for each grade level that exists for this school

DO $$
DECLARE
    school_uuid UUID;
    grade_rec RECORD;
BEGIN
    -- Get the school ID
    SELECT id INTO school_uuid FROM schools WHERE school_code = 'S8BQY3IF3JSK';
    
    IF school_uuid IS NULL THEN
        RAISE EXCEPTION 'School with code S8BQY3IF3JSK not found';
    END IF;
    
    -- Create classes for each grade level
    FOR grade_rec IN 
        SELECT id, grade_level, grade_name 
        FROM grade_levels 
        WHERE school_id = school_uuid AND is_active = true
        ORDER BY grade_level
    LOOP
        -- Create 2 classes per grade level (A and B sections)
        INSERT INTO classes (school_id, grade_level_id, class_name, max_students) VALUES
        (school_uuid, grade_rec.id, 'Class ' || grade_rec.grade_level || 'A', 25),
        (school_uuid, grade_rec.id, 'Class ' || grade_rec.grade_level || 'B', 25)
        ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;
        
        RAISE NOTICE 'Created classes for Grade % (%)', grade_rec.grade_level, grade_rec.grade_name;
    END LOOP;
    
    RAISE NOTICE 'Classes creation completed for school S8BQY3IF3JSK';
END $$;

-- Verify classes were created
SELECT 'Verification - Classes created:' as result_type;
SELECT c.id, c.class_name, c.max_students, gl.grade_level, gl.grade_name, s.school_code
FROM classes c
JOIN grade_levels gl ON c.grade_level_id = gl.id
JOIN schools s ON c.school_id = s.id
WHERE s.school_code = 'S8BQY3IF3JSK'
ORDER BY gl.grade_level, c.class_name;
