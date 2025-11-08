-- =====================================================================
-- TIMETABLE MANAGEMENT SYSTEM - SEED DATA
-- =====================================================================
-- This file provides initial sample data for the timetable system
-- Run this AFTER the schema and functions files
-- =====================================================================

-- =====================================================================
-- SEED DATA: Common Subjects
-- Note: Replace the school_id with your actual school ID
-- =====================================================================

-- Insert common subjects for schools
-- You can modify these based on your school's curriculum
INSERT INTO subjects (school_id, name, code, description, color, is_active) VALUES
    -- Core subjects
    ((SELECT id FROM schools LIMIT 1), 'Mathematics', 'MATH', 'Mathematics and Numeracy', '#3B82F6', true),
    ((SELECT id FROM schools LIMIT 1), 'English', 'ENG', 'English Language and Literature', '#10B981', true),
    ((SELECT id FROM schools LIMIT 1), 'Science', 'SCI', 'General Science', '#8B5CF6', true),
    ((SELECT id FROM schools LIMIT 1), 'Social Studies', 'SS', 'History, Geography, and Civics', '#F59E0B', true),
    ((SELECT id FROM schools LIMIT 1), 'Physical Education', 'PE', 'Sports and Physical Activities', '#EF4444', true),
    
    -- Additional subjects
    ((SELECT id FROM schools LIMIT 1), 'Computer Science', 'CS', 'Computing and Programming', '#06B6D4', true),
    ((SELECT id FROM schools LIMIT 1), 'Art', 'ART', 'Visual Arts and Design', '#EC4899', true),
    ((SELECT id FROM schools LIMIT 1), 'Music', 'MUS', 'Music Theory and Practice', '#A855F7', true),
    ((SELECT id FROM schools LIMIT 1), 'Foreign Language', 'LANG', 'Foreign Language Studies', '#14B8A6', true),
    ((SELECT id FROM schools LIMIT 1), 'Chemistry', 'CHEM', 'Chemistry for higher grades', '#6366F1', true),
    ((SELECT id FROM schools LIMIT 1), 'Physics', 'PHY', 'Physics for higher grades', '#0EA5E9', true),
    ((SELECT id FROM schools LIMIT 1), 'Biology', 'BIO', 'Biology for higher grades', '#22C55E', true),
    ((SELECT id FROM schools LIMIT 1), 'Economics', 'ECON', 'Economics and Business Studies', '#F97316', true),
    ((SELECT id FROM schools LIMIT 1), 'Literature', 'LIT', 'English Literature', '#84CC16', true),
    ((SELECT id FROM schools LIMIT 1), 'Geography', 'GEO', 'Physical and Human Geography', '#06B6D4', true)
ON CONFLICT (school_id, code) DO NOTHING;

-- =====================================================================
-- SEED DATA: Default Timetable Schemes
-- =====================================================================

-- Insert 6-Period Standard Scheme
DO $$
DECLARE
    v_scheme_id UUID;
    v_school_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    -- Create 6-Period Standard Scheme
    INSERT INTO timetable_schemes (
        school_id, name, description, working_days, periods_per_day, is_default, is_active
    ) VALUES (
        v_school_id,
        '6-Period Standard',
        '6 teaching periods with morning break and lunch',
        ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        6,
        true,
        true
    )
    ON CONFLICT (school_id, name) DO UPDATE SET is_default = true
    RETURNING id INTO v_scheme_id;
    
    -- Insert time slots for 6-Period Standard
    INSERT INTO timetable_time_slots (scheme_id, slot_type, label, start_time, end_time, slot_order) VALUES
    (v_scheme_id, 'period', 'Period 1', '08:00', '08:45', 1),
    (v_scheme_id, 'period', 'Period 2', '08:45', '09:30', 2),
    (v_scheme_id, 'period', 'Period 3', '09:30', '10:15', 3),
    (v_scheme_id, 'break', 'Morning Break', '10:15', '10:30', 4),
    (v_scheme_id, 'period', 'Period 4', '10:30', '11:15', 5),
    (v_scheme_id, 'period', 'Period 5', '11:15', '12:00', 6),
    (v_scheme_id, 'lunch', 'Lunch Break', '12:00', '12:45', 7),
    (v_scheme_id, 'period', 'Period 6', '12:45', '13:30', 8)
    ON CONFLICT (scheme_id, slot_order) DO NOTHING;
    
    RAISE NOTICE '6-Period Standard scheme created with ID: %', v_scheme_id;
END $$;

-- Insert 7-Period Extended Scheme
DO $$
DECLARE
    v_scheme_id UUID;
    v_school_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    -- Create 7-Period Extended Scheme
    INSERT INTO timetable_schemes (
        school_id, name, description, working_days, periods_per_day, is_default, is_active
    ) VALUES (
        v_school_id,
        '7-Period Extended',
        '7 teaching periods with short break and lunch',
        ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        7,
        false,
        true
    )
    ON CONFLICT (school_id, name) DO NOTHING
    RETURNING id INTO v_scheme_id;
    
    -- Insert time slots for 7-Period Extended
    INSERT INTO timetable_time_slots (scheme_id, slot_type, label, start_time, end_time, slot_order) VALUES
    (v_scheme_id, 'period', 'Period 1', '08:00', '08:40', 1),
    (v_scheme_id, 'period', 'Period 2', '08:40', '09:20', 2),
    (v_scheme_id, 'period', 'Period 3', '09:20', '10:00', 3),
    (v_scheme_id, 'break', 'Short Break', '10:00', '10:15', 4),
    (v_scheme_id, 'period', 'Period 4', '10:15', '10:55', 5),
    (v_scheme_id, 'period', 'Period 5', '10:55', '11:35', 6),
    (v_scheme_id, 'lunch', 'Lunch Break', '11:35', '12:20', 7),
    (v_scheme_id, 'period', 'Period 6', '12:20', '13:00', 8),
    (v_scheme_id, 'period', 'Period 7', '13:00', '13:40', 9)
    ON CONFLICT (scheme_id, slot_order) DO NOTHING;
    
    RAISE NOTICE '7-Period Extended scheme created with ID: %', v_scheme_id;
END $$;

-- Insert 5-Period Short Day Scheme
DO $$
DECLARE
    v_scheme_id UUID;
    v_school_id UUID;
BEGIN
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    
    -- Create 5-Period Short Day Scheme
    INSERT INTO timetable_schemes (
        school_id, name, description, working_days, periods_per_day, is_default, is_active
    ) VALUES (
        v_school_id,
        '5-Period Short Day',
        '5 teaching periods for half-day schedule',
        ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        5,
        false,
        true
    )
    ON CONFLICT (school_id, name) DO NOTHING
    RETURNING id INTO v_scheme_id;
    
    -- Insert time slots for 5-Period Short Day
    INSERT INTO timetable_time_slots (scheme_id, slot_type, label, start_time, end_time, slot_order) VALUES
    (v_scheme_id, 'period', 'Period 1', '08:00', '09:00', 1),
    (v_scheme_id, 'period', 'Period 2', '09:00', '10:00', 2),
    (v_scheme_id, 'break', 'Break', '10:00', '10:20', 3),
    (v_scheme_id, 'period', 'Period 3', '10:20', '11:20', 4),
    (v_scheme_id, 'period', 'Period 4', '11:20', '12:20', 5),
    (v_scheme_id, 'period', 'Period 5', '12:20', '13:20', 6)
    ON CONFLICT (scheme_id, slot_order) DO NOTHING;
    
    RAISE NOTICE '5-Period Short Day scheme created with ID: %', v_scheme_id;
END $$;

-- =====================================================================
-- SEED DATA: Sample Teacher Capabilities
-- Note: This creates capabilities for existing teachers
-- =====================================================================

-- Create default teacher capabilities for all teachers in the school
INSERT INTO teacher_capabilities (
    school_id, 
    teacher_id, 
    subject_ids, 
    grade_levels, 
    max_periods_per_day, 
    max_periods_per_week,
    preferred_days,
    is_active
)
SELECT 
    p.school_id,
    p.user_id,
    ARRAY[]::UUID[], -- Empty array, to be filled by teachers/admins
    ARRAY[]::TEXT[], -- Empty array, to be filled by teachers/admins
    6, -- Default max periods per day
    30, -- Default max periods per week
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    true
FROM profiles p
WHERE p.role = 'teacher'
    AND p.school_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM teacher_capabilities tc 
        WHERE tc.teacher_id = p.user_id
    )
ON CONFLICT (teacher_id) DO NOTHING;

-- =====================================================================
-- VERIFICATION QUERIES
-- Run these to verify the seed data was inserted correctly
-- =====================================================================

-- Verify subjects were created
DO $$
DECLARE
    subject_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO subject_count FROM subjects;
    RAISE NOTICE 'Total subjects created: %', subject_count;
END $$;

-- Verify timetable schemes were created
DO $$
DECLARE
    scheme_count INTEGER;
    slot_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO scheme_count FROM timetable_schemes;
    SELECT COUNT(*) INTO slot_count FROM timetable_time_slots;
    RAISE NOTICE 'Total schemes created: %', scheme_count;
    RAISE NOTICE 'Total time slots created: %', slot_count;
END $$;

-- Verify teacher capabilities were created
DO $$
DECLARE
    capability_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO capability_count FROM teacher_capabilities;
    RAISE NOTICE 'Total teacher capabilities created: %', capability_count;
END $$;

-- Display created schemes with their time slots
SELECT 
    ts.name as scheme_name,
    ts.periods_per_day,
    ts.is_default,
    COUNT(tts.id) as total_slots,
    COUNT(CASE WHEN tts.slot_type = 'period' THEN 1 END) as teaching_periods,
    COUNT(CASE WHEN tts.slot_type = 'break' THEN 1 END) as breaks,
    COUNT(CASE WHEN tts.slot_type = 'lunch' THEN 1 END) as lunch_breaks
FROM timetable_schemes ts
LEFT JOIN timetable_time_slots tts ON tts.scheme_id = ts.id
GROUP BY ts.id, ts.name, ts.periods_per_day, ts.is_default
ORDER BY ts.is_default DESC, ts.name;

-- Display created subjects by school
SELECT 
    s.school_id,
    sch.name as school_name,
    COUNT(s.id) as subject_count,
    array_agg(s.code ORDER BY s.name) as subject_codes
FROM subjects s
INNER JOIN schools sch ON sch.id = s.school_id
WHERE s.is_active = true
GROUP BY s.school_id, sch.name;

-- =====================================================================
-- SAMPLE TIMETABLE DATA (Optional - for testing)
-- =====================================================================

-- This section creates a sample timetable for one class
-- Uncomment and modify IDs to test the system

/*
DO $$
DECLARE
    v_school_id UUID;
    v_class_id UUID;
    v_scheme_id UUID;
    v_math_subject_id UUID;
    v_english_subject_id UUID;
    v_science_subject_id UUID;
    v_teacher_id UUID;
    v_period_slots UUID[];
BEGIN
    -- Get IDs (modify these to match your data)
    SELECT id INTO v_school_id FROM schools LIMIT 1;
    SELECT id INTO v_class_id FROM classes WHERE school_id = v_school_id LIMIT 1;
    SELECT id INTO v_scheme_id FROM timetable_schemes WHERE school_id = v_school_id AND is_default = true;
    SELECT id INTO v_math_subject_id FROM subjects WHERE school_id = v_school_id AND code = 'MATH';
    SELECT id INTO v_english_subject_id FROM subjects WHERE school_id = v_school_id AND code = 'ENG';
    SELECT id INTO v_science_subject_id FROM subjects WHERE school_id = v_school_id AND code = 'SCI';
    SELECT user_id INTO v_teacher_id FROM profiles WHERE school_id = v_school_id AND role = 'teacher' LIMIT 1;
    
    -- Get period time slot IDs
    SELECT array_agg(id ORDER BY slot_order) INTO v_period_slots
    FROM timetable_time_slots
    WHERE scheme_id = v_scheme_id AND slot_type = 'period';
    
    -- Create sample Monday schedule
    INSERT INTO timetable_entries (
        school_id, class_id, subject_id, teacher_id, time_slot_id, day_of_week, room_number
    ) VALUES
        (v_school_id, v_class_id, v_math_subject_id, v_teacher_id, v_period_slots[1], 'Monday', 'R101'),
        (v_school_id, v_class_id, v_english_subject_id, v_teacher_id, v_period_slots[2], 'Monday', 'R101'),
        (v_school_id, v_class_id, v_science_subject_id, v_teacher_id, v_period_slots[3], 'Monday', 'Lab1'),
        (v_school_id, v_class_id, v_math_subject_id, v_teacher_id, v_period_slots[4], 'Monday', 'R101'),
        (v_school_id, v_class_id, v_english_subject_id, v_teacher_id, v_period_slots[5], 'Monday', 'R101'),
        (v_school_id, v_class_id, v_science_subject_id, v_teacher_id, v_period_slots[6], 'Monday', 'Lab1')
    ON CONFLICT (class_id, day_of_week, time_slot_id) DO NOTHING;
    
    RAISE NOTICE 'Sample timetable entries created for class: %', v_class_id;
END $$;
*/

-- =====================================================================
-- End of seed data
-- =====================================================================
