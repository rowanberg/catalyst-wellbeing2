-- Database functions for Teacher Students Page functionality

-- Function to get all grade levels for a school
CREATE OR REPLACE FUNCTION get_school_grade_levels(p_school_id UUID)
RETURNS TABLE (
    id UUID,
    grade_level VARCHAR,
    grade_name VARCHAR,
    student_count BIGINT,
    class_count BIGINT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gl.id,
        gl.grade_level,
        gl.grade_name,
        COALESCE(student_counts.count, 0) as student_count,
        COALESCE(class_counts.count, 0) as class_count,
        gl.is_active
    FROM grade_levels gl
    LEFT JOIN (
        SELECT 
            c.grade_level_id,
            COUNT(DISTINCT sca.student_id) as count
        FROM classes c
        LEFT JOIN student_class_assignments sca ON c.id = sca.class_id AND sca.is_active = true
        WHERE c.school_id = p_school_id AND c.is_active = true
        GROUP BY c.grade_level_id
    ) student_counts ON gl.id = student_counts.grade_level_id
    LEFT JOIN (
        SELECT 
            c.grade_level_id,
            COUNT(*) as count
        FROM classes c
        WHERE c.school_id = p_school_id AND c.is_active = true
        GROUP BY c.grade_level_id
    ) class_counts ON gl.id = class_counts.grade_level_id
    WHERE gl.school_id = p_school_id AND gl.is_active = true
    ORDER BY 
        CASE 
            WHEN gl.grade_level = 'K' THEN 0
            WHEN gl.grade_level ~ '^[0-9]+$' THEN gl.grade_level::INTEGER
            ELSE 999
        END,
        gl.grade_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get classes for a specific grade level
CREATE OR REPLACE FUNCTION get_grade_classes(p_school_id UUID, p_grade_level_id UUID)
RETURNS TABLE (
    id UUID,
    class_name VARCHAR,
    class_code VARCHAR,
    subject VARCHAR,
    room_number VARCHAR,
    student_count BIGINT,
    max_students INTEGER,
    teacher_names TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.class_name,
        c.class_code,
        c.subject,
        c.room_number,
        COALESCE(student_counts.count, 0) as student_count,
        c.max_students,
        COALESCE(teacher_names.names, '') as teacher_names,
        c.is_active
    FROM classes c
    LEFT JOIN (
        SELECT 
            sca.class_id,
            COUNT(*) as count
        FROM student_class_assignments sca
        WHERE sca.is_active = true
        GROUP BY sca.class_id
    ) student_counts ON c.id = student_counts.class_id
    LEFT JOIN (
        SELECT 
            tca.class_id,
            STRING_AGG(p.first_name || ' ' || p.last_name, ', ') as names
        FROM teacher_class_assignments tca
        JOIN profiles p ON tca.teacher_id = p.user_id
        WHERE tca.is_active = true
        GROUP BY tca.class_id
    ) teacher_names ON c.id = teacher_names.class_id
    WHERE c.school_id = p_school_id 
        AND c.grade_level_id = p_grade_level_id 
        AND c.is_active = true
    ORDER BY c.class_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students for a specific class
CREATE OR REPLACE FUNCTION get_class_students(p_school_id UUID, p_class_id UUID)
RETURNS TABLE (
    user_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    xp INTEGER,
    level INTEGER,
    streak_days INTEGER,
    total_quests_completed INTEGER,
    current_mood VARCHAR,
    wellbeing_status VARCHAR,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.first_name,
        p.last_name,
        COALESCE(au.email, (p.first_name || '.' || p.last_name || '@school.edu')::VARCHAR) as email,
        COALESCE(p.xp, 0) as xp,
        COALESCE(p.level, 1) as level,
        COALESCE(p.streak_days, 0) as streak_days,
        COALESCE(p.total_quests_completed, 0) as total_quests_completed,
        COALESCE(p.current_mood, 'neutral')::VARCHAR as current_mood,
        (CASE 
            WHEN COALESCE(p.xp, 0) >= 1000 THEN 'thriving'
            WHEN COALESCE(p.xp, 0) >= 500 THEN 'good'
            WHEN COALESCE(p.xp, 0) >= 200 THEN 'needs_support'
            ELSE 'at_risk'
        END)::VARCHAR as wellbeing_status,
        p.updated_at as last_active,
        p.created_at
    FROM student_class_assignments sca
    JOIN profiles p ON sca.student_id = p.user_id
    LEFT JOIN auth.users au ON p.user_id = au.id
    WHERE sca.school_id = p_school_id 
        AND sca.class_id = p_class_id 
        AND sca.is_active = true
        AND p.role = 'student'
    ORDER BY p.last_name, p.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's assigned classes
CREATE OR REPLACE FUNCTION get_teacher_assigned_classes(p_teacher_id UUID, p_school_id UUID)
RETURNS TABLE (
    class_id UUID,
    class_name VARCHAR,
    grade_level VARCHAR,
    grade_name VARCHAR,
    subject VARCHAR,
    student_count BIGINT,
    is_primary_teacher BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.class_name,
        gl.grade_level,
        gl.grade_name,
        c.subject,
        COALESCE(student_counts.count, 0) as student_count,
        tca.is_primary_teacher
    FROM teacher_class_assignments tca
    JOIN classes c ON tca.class_id = c.id
    JOIN grade_levels gl ON c.grade_level_id = gl.id
    LEFT JOIN (
        SELECT 
            class_id,
            COUNT(*) as count
        FROM student_class_assignments
        WHERE is_active = true
        GROUP BY class_id
    ) student_counts ON c.id = student_counts.class_id
    WHERE tca.teacher_id = p_teacher_id 
        AND tca.school_id = p_school_id 
        AND tca.is_active = true
        AND c.is_active = true
    ORDER BY gl.grade_level, c.class_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to insert sample data for testing
CREATE OR REPLACE FUNCTION insert_sample_grade_class_data(p_school_id UUID)
RETURNS VOID AS $$
DECLARE
    grade_k_id UUID;
    grade_1_id UUID;
    grade_2_id UUID;
    grade_3_id UUID;
    class_ka_id UUID;
    class_kb_id UUID;
    class_1a_id UUID;
    class_1b_id UUID;
BEGIN
    -- Insert sample grade levels
    INSERT INTO grade_levels (school_id, grade_level, grade_name) 
    VALUES 
        (p_school_id, 'K', 'Kindergarten'),
        (p_school_id, '1', 'First Grade'),
        (p_school_id, '2', 'Second Grade'),
        (p_school_id, '3', 'Third Grade')
    ON CONFLICT (school_id, grade_level) DO NOTHING
    RETURNING id INTO grade_k_id;
    
    -- Get grade IDs
    SELECT id INTO grade_k_id FROM grade_levels WHERE school_id = p_school_id AND grade_level = 'K';
    SELECT id INTO grade_1_id FROM grade_levels WHERE school_id = p_school_id AND grade_level = '1';
    SELECT id INTO grade_2_id FROM grade_levels WHERE school_id = p_school_id AND grade_level = '2';
    SELECT id INTO grade_3_id FROM grade_levels WHERE school_id = p_school_id AND grade_level = '3';
    
    -- Insert sample classes
    INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject, room_number, max_students)
    VALUES 
        (p_school_id, grade_k_id, 'Kindergarten A', 'KA', 'General Studies', '101', 20),
        (p_school_id, grade_k_id, 'Kindergarten B', 'KB', 'General Studies', '102', 20),
        (p_school_id, grade_1_id, 'Grade 1A', '1A', 'General Studies', '201', 25),
        (p_school_id, grade_1_id, 'Grade 1B', '1B', 'General Studies', '202', 25),
        (p_school_id, grade_2_id, 'Grade 2A', '2A', 'General Studies', '301', 25),
        (p_school_id, grade_2_id, 'Grade 2B', '2B', 'General Studies', '302', 25),
        (p_school_id, grade_3_id, 'Grade 3A', '3A', 'General Studies', '401', 25),
        (p_school_id, grade_3_id, 'Grade 3B', '3B', 'General Studies', '402', 25)
    ON CONFLICT (school_id, class_name) DO NOTHING;
    
    RAISE NOTICE 'Sample grade and class data inserted for school %', p_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
