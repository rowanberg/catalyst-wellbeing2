-- Create RPC function to get student rank data
CREATE OR REPLACE FUNCTION get_student_rank_data(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_data RECORD;
    v_rank INTEGER;
    v_total_students INTEGER;
    v_result JSONB;
BEGIN
    -- Get student data
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.xp,
        p.gems,
        p.level,
        p.avatar_url
    INTO v_student_data
    FROM profiles p
    WHERE p.id = p_student_id AND p.role = 'student';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Student not found');
    END IF;

    -- Calculate rank based on XP
    SELECT COUNT(*) + 1
    INTO v_rank
    FROM profiles
    WHERE role = 'student' AND xp > v_student_data.xp;

    -- Get total students
    SELECT COUNT(*)
    INTO v_total_students
    FROM profiles
    WHERE role = 'student';

    -- Build result
    v_result := jsonb_build_object(
        'student_id', v_student_data.id,
        'first_name', v_student_data.first_name,
        'last_name', v_student_data.last_name,
        'xp', v_student_data.xp,
        'gems', v_student_data.gems,
        'level', v_student_data.level,
        'avatar_url', v_student_data.avatar_url,
        'rank', v_rank,
        'total_students', v_total_students,
        'percentile', CASE 
            WHEN v_total_students > 0 THEN 
                ROUND((1.0 - (v_rank::NUMERIC / v_total_students::NUMERIC)) * 100, 1)
            ELSE 0 
        END
    );

    RETURN v_result;
END;
$$;
