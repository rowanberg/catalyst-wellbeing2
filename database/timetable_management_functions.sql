-- =====================================================================
-- TIMETABLE MANAGEMENT SYSTEM - DATABASE FUNCTIONS
-- =====================================================================
-- This file contains all database functions for timetable operations
-- including CRUD, validation, conflict detection, and AI generation
-- =====================================================================

-- =====================================================================
-- FUNCTION: get_timetable_for_class
-- Purpose: Retrieve complete timetable for a specific class
-- =====================================================================

CREATE OR REPLACE FUNCTION get_timetable_for_class(
    p_class_id UUID,
    p_school_id UUID DEFAULT NULL
)
RETURNS TABLE (
    entry_id UUID,
    class_id UUID,
    class_name VARCHAR,
    subject_id UUID,
    subject_name VARCHAR,
    subject_code VARCHAR,
    subject_color VARCHAR,
    teacher_id UUID,
    teacher_name TEXT,
    teacher_email VARCHAR,
    time_slot_id UUID,
    slot_label VARCHAR,
    start_time TIME,
    end_time TIME,
    slot_type VARCHAR,
    slot_order INTEGER,
    day_of_week VARCHAR,
    room_number VARCHAR,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id as entry_id,
        te.class_id,
        c.class_name,
        te.subject_id,
        s.name as subject_name,
        s.code as subject_code,
        s.color as subject_color,
        te.teacher_id,
        CONCAT(p.first_name, ' ', p.last_name) as teacher_name,
        (SELECT email FROM auth.users WHERE id = te.teacher_id) as teacher_email,
        te.time_slot_id,
        ts.label as slot_label,
        ts.start_time,
        ts.end_time,
        ts.slot_type,
        ts.slot_order,
        te.day_of_week,
        te.room_number,
        te.notes
    FROM timetable_entries te
    INNER JOIN classes c ON c.id = te.class_id
    INNER JOIN subjects s ON s.id = te.subject_id
    INNER JOIN timetable_time_slots ts ON ts.id = te.time_slot_id
    LEFT JOIN profiles p ON p.user_id = te.teacher_id
    WHERE te.class_id = p_class_id
        AND te.is_active = true
        AND (p_school_id IS NULL OR te.school_id = p_school_id)
    ORDER BY 
        CASE te.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
        END,
        ts.slot_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: get_teacher_schedule
-- Purpose: Retrieve schedule for a specific teacher
-- =====================================================================

CREATE OR REPLACE FUNCTION get_teacher_schedule(
    p_teacher_id UUID,
    p_school_id UUID DEFAULT NULL
)
RETURNS TABLE (
    entry_id UUID,
    class_id UUID,
    class_name VARCHAR,
    subject_id UUID,
    subject_name VARCHAR,
    subject_code VARCHAR,
    time_slot_id UUID,
    slot_label VARCHAR,
    start_time TIME,
    end_time TIME,
    day_of_week VARCHAR,
    room_number VARCHAR,
    slot_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id as entry_id,
        te.class_id,
        c.class_name,
        te.subject_id,
        s.name as subject_name,
        s.code as subject_code,
        te.time_slot_id,
        ts.label as slot_label,
        ts.start_time,
        ts.end_time,
        te.day_of_week,
        te.room_number,
        ts.slot_order
    FROM timetable_entries te
    INNER JOIN classes c ON c.id = te.class_id
    INNER JOIN subjects s ON s.id = te.subject_id
    INNER JOIN timetable_time_slots ts ON ts.id = te.time_slot_id
    WHERE te.teacher_id = p_teacher_id
        AND te.is_active = true
        AND (p_school_id IS NULL OR te.school_id = p_school_id)
    ORDER BY 
        CASE te.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
        END,
        ts.slot_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: create_timetable_entry
-- Purpose: Create a new timetable entry with validation
-- =====================================================================

CREATE OR REPLACE FUNCTION create_timetable_entry(
    p_school_id UUID,
    p_class_id UUID,
    p_subject_id UUID,
    p_teacher_id UUID,
    p_time_slot_id UUID,
    p_day_of_week VARCHAR,
    p_room_number VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_entry_id UUID;
    v_slot_type VARCHAR;
BEGIN
    -- Validate that time slot is a teaching period, not break or lunch
    SELECT slot_type INTO v_slot_type
    FROM timetable_time_slots
    WHERE id = p_time_slot_id;
    
    IF v_slot_type != 'period' THEN
        RAISE EXCEPTION 'Cannot assign classes to non-teaching slots (breaks or lunch)';
    END IF;
    
    -- Insert the entry
    INSERT INTO timetable_entries (
        school_id, class_id, subject_id, teacher_id,
        time_slot_id, day_of_week, room_number, notes,
        created_by, updated_by
    ) VALUES (
        p_school_id, p_class_id, p_subject_id, p_teacher_id,
        p_time_slot_id, p_day_of_week, p_room_number, p_notes,
        COALESCE(p_created_by, auth.uid()), COALESCE(p_created_by, auth.uid())
    )
    RETURNING id INTO v_entry_id;
    
    RETURN v_entry_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'A timetable entry already exists for this class, day, and time slot';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: update_timetable_entry
-- Purpose: Update an existing timetable entry
-- =====================================================================

CREATE OR REPLACE FUNCTION update_timetable_entry(
    p_entry_id UUID,
    p_subject_id UUID DEFAULT NULL,
    p_teacher_id UUID DEFAULT NULL,
    p_room_number VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE timetable_entries
    SET 
        subject_id = COALESCE(p_subject_id, subject_id),
        teacher_id = COALESCE(p_teacher_id, teacher_id),
        room_number = COALESCE(p_room_number, room_number),
        notes = COALESCE(p_notes, notes),
        updated_by = COALESCE(p_updated_by, auth.uid())
    WHERE id = p_entry_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: delete_timetable_entry
-- Purpose: Soft delete a timetable entry
-- =====================================================================

CREATE OR REPLACE FUNCTION delete_timetable_entry(
    p_entry_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE timetable_entries
    SET is_active = false
    WHERE id = p_entry_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: detect_teacher_conflicts
-- Purpose: Detect if a teacher is double-booked
-- =====================================================================

CREATE OR REPLACE FUNCTION detect_teacher_conflicts(
    p_teacher_id UUID,
    p_day_of_week VARCHAR,
    p_time_slot_id UUID,
    p_exclude_entry_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_entry_id UUID,
    class_name VARCHAR,
    subject_name VARCHAR,
    slot_label VARCHAR,
    conflict_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.id as conflict_entry_id,
        c.class_name,
        s.name as subject_name,
        ts.label as slot_label,
        FORMAT('Teacher is already assigned to %s (%s) at this time', 
               c.class_name, s.name) as conflict_message
    FROM timetable_entries te
    INNER JOIN classes c ON c.id = te.class_id
    INNER JOIN subjects s ON s.id = te.subject_id
    INNER JOIN timetable_time_slots ts ON ts.id = te.time_slot_id
    WHERE te.teacher_id = p_teacher_id
        AND te.day_of_week = p_day_of_week
        AND te.time_slot_id = p_time_slot_id
        AND te.is_active = true
        AND (p_exclude_entry_id IS NULL OR te.id != p_exclude_entry_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: detect_room_conflicts
-- Purpose: Detect if a room is double-booked
-- =====================================================================

CREATE OR REPLACE FUNCTION detect_room_conflicts(
    p_school_id UUID,
    p_room_number VARCHAR,
    p_day_of_week VARCHAR,
    p_time_slot_id UUID,
    p_exclude_entry_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_entry_id UUID,
    class_name VARCHAR,
    subject_name VARCHAR,
    teacher_name TEXT,
    conflict_message TEXT
) AS $$
BEGIN
    IF p_room_number IS NULL OR p_room_number = '' THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        te.id as conflict_entry_id,
        c.class_name,
        s.name as subject_name,
        CONCAT(p.first_name, ' ', p.last_name) as teacher_name,
        FORMAT('Room %s is already assigned to %s (%s) at this time', 
               p_room_number, c.class_name, s.name) as conflict_message
    FROM timetable_entries te
    INNER JOIN classes c ON c.id = te.class_id
    INNER JOIN subjects s ON s.id = te.subject_id
    LEFT JOIN profiles p ON p.user_id = te.teacher_id
    WHERE te.school_id = p_school_id
        AND te.room_number = p_room_number
        AND te.day_of_week = p_day_of_week
        AND te.time_slot_id = p_time_slot_id
        AND te.is_active = true
        AND (p_exclude_entry_id IS NULL OR te.id != p_exclude_entry_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: get_teacher_workload
-- Purpose: Calculate teacher's current workload
-- =====================================================================

CREATE OR REPLACE FUNCTION get_teacher_workload(
    p_teacher_id UUID,
    p_school_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_periods INTEGER,
    periods_per_day JSONB,
    periods_by_class JSONB,
    periods_by_subject JSONB
) AS $$
DECLARE
    v_total INTEGER;
    v_per_day JSONB;
    v_by_class JSONB;
    v_by_subject JSONB;
BEGIN
    -- Total periods
    SELECT COUNT(*)::INTEGER INTO v_total
    FROM timetable_entries
    WHERE teacher_id = p_teacher_id
        AND is_active = true
        AND (p_school_id IS NULL OR school_id = p_school_id);
    
    -- Periods per day
    SELECT jsonb_object_agg(day_of_week, period_count) INTO v_per_day
    FROM (
        SELECT day_of_week, COUNT(*)::INTEGER as period_count
        FROM timetable_entries
        WHERE teacher_id = p_teacher_id
            AND is_active = true
            AND (p_school_id IS NULL OR school_id = p_school_id)
        GROUP BY day_of_week
    ) sub;
    
    -- Periods by class
    SELECT jsonb_object_agg(class_name, period_count) INTO v_by_class
    FROM (
        SELECT c.class_name, COUNT(*)::INTEGER as period_count
        FROM timetable_entries te
        INNER JOIN classes c ON c.id = te.class_id
        WHERE te.teacher_id = p_teacher_id
            AND te.is_active = true
            AND (p_school_id IS NULL OR te.school_id = p_school_id)
        GROUP BY c.class_name
    ) sub;
    
    -- Periods by subject
    SELECT jsonb_object_agg(subject_name, period_count) INTO v_by_subject
    FROM (
        SELECT s.name as subject_name, COUNT(*)::INTEGER as period_count
        FROM timetable_entries te
        INNER JOIN subjects s ON s.id = te.subject_id
        WHERE te.teacher_id = p_teacher_id
            AND te.is_active = true
            AND (p_school_id IS NULL OR te.school_id = p_school_id)
        GROUP BY s.name
    ) sub;
    
    RETURN QUERY SELECT 
        v_total,
        COALESCE(v_per_day, '{}'::jsonb),
        COALESCE(v_by_class, '{}'::jsonb),
        COALESCE(v_by_subject, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: get_subject_distribution
-- Purpose: Get subject distribution for a class
-- =====================================================================

CREATE OR REPLACE FUNCTION get_subject_distribution(
    p_class_id UUID
)
RETURNS TABLE (
    subject_id UUID,
    subject_name VARCHAR,
    subject_code VARCHAR,
    period_count INTEGER,
    percentage NUMERIC
) AS $$
DECLARE
    v_total INTEGER;
BEGIN
    -- Get total periods for the class
    SELECT COUNT(*)::INTEGER INTO v_total
    FROM timetable_entries
    WHERE class_id = p_class_id AND is_active = true;
    
    IF v_total = 0 THEN
        v_total := 1; -- Avoid division by zero
    END IF;
    
    RETURN QUERY
    SELECT 
        s.id as subject_id,
        s.name as subject_name,
        s.code as subject_code,
        COUNT(*)::INTEGER as period_count,
        ROUND((COUNT(*) * 100.0 / v_total)::numeric, 2) as percentage
    FROM timetable_entries te
    INNER JOIN subjects s ON s.id = te.subject_id
    WHERE te.class_id = p_class_id
        AND te.is_active = true
    GROUP BY s.id, s.name, s.code
    ORDER BY period_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: copy_timetable_to_class
-- Purpose: Copy entire timetable from one class to another
-- =====================================================================

CREATE OR REPLACE FUNCTION copy_timetable_to_class(
    p_source_class_id UUID,
    p_target_class_id UUID,
    p_school_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_copied_count INTEGER := 0;
    v_entry RECORD;
BEGIN
    -- Clear existing timetable for target class
    UPDATE timetable_entries
    SET is_active = false
    WHERE class_id = p_target_class_id;
    
    -- Copy entries from source to target
    FOR v_entry IN 
        SELECT * FROM timetable_entries 
        WHERE class_id = p_source_class_id AND is_active = true
    LOOP
        INSERT INTO timetable_entries (
            school_id, class_id, subject_id, teacher_id,
            time_slot_id, day_of_week, room_number, notes,
            created_by, updated_by
        ) VALUES (
            p_school_id, p_target_class_id, v_entry.subject_id, v_entry.teacher_id,
            v_entry.time_slot_id, v_entry.day_of_week, v_entry.room_number, v_entry.notes,
            COALESCE(p_created_by, auth.uid()), COALESCE(p_created_by, auth.uid())
        )
        ON CONFLICT (class_id, day_of_week, time_slot_id) DO NOTHING;
        
        v_copied_count := v_copied_count + 1;
    END LOOP;
    
    RETURN v_copied_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: clear_timetable_for_class
-- Purpose: Clear all timetable entries for a class
-- =====================================================================

CREATE OR REPLACE FUNCTION clear_timetable_for_class(
    p_class_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        UPDATE timetable_entries
        SET is_active = false
        WHERE class_id = p_class_id AND is_active = true
        RETURNING *
    )
    SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: validate_timetable_completeness
-- Purpose: Check if a class timetable is complete
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_timetable_completeness(
    p_class_id UUID,
    p_scheme_id UUID
)
RETURNS TABLE (
    total_slots INTEGER,
    filled_slots INTEGER,
    empty_slots INTEGER,
    completion_percentage NUMERIC,
    missing_days TEXT[],
    validation_passed BOOLEAN
) AS $$
DECLARE
    v_total INTEGER;
    v_filled INTEGER;
    v_empty INTEGER;
    v_percentage NUMERIC;
    v_working_days TEXT[];
    v_missing_days TEXT[];
BEGIN
    -- Get working days from scheme
    SELECT working_days INTO v_working_days
    FROM timetable_schemes
    WHERE id = p_scheme_id;
    
    -- Calculate total slots (working days * periods)
    SELECT 
        array_length(ts.working_days, 1) * COUNT(tts.id)
    INTO v_total
    FROM timetable_schemes ts
    CROSS JOIN timetable_time_slots tts
    WHERE ts.id = p_scheme_id
        AND tts.scheme_id = p_scheme_id
        AND tts.slot_type = 'period';
    
    -- Count filled slots
    SELECT COUNT(*)::INTEGER INTO v_filled
    FROM timetable_entries te
    INNER JOIN timetable_time_slots ts ON ts.id = te.time_slot_id
    WHERE te.class_id = p_class_id
        AND te.is_active = true
        AND ts.slot_type = 'period';
    
    v_empty := v_total - v_filled;
    v_percentage := CASE WHEN v_total > 0 THEN ROUND((v_filled * 100.0 / v_total)::numeric, 2) ELSE 0 END;
    
    -- Find missing days
    SELECT array_agg(day)
    INTO v_missing_days
    FROM unnest(v_working_days) day
    WHERE day NOT IN (
        SELECT DISTINCT day_of_week
        FROM timetable_entries
        WHERE class_id = p_class_id AND is_active = true
    );
    
    RETURN QUERY SELECT 
        v_total,
        v_filled,
        v_empty,
        v_percentage,
        COALESCE(v_missing_days, ARRAY[]::TEXT[]),
        (v_percentage >= 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: get_available_teachers_for_slot
-- Purpose: Find available teachers for a specific time slot
-- =====================================================================

CREATE OR REPLACE FUNCTION get_available_teachers_for_slot(
    p_school_id UUID,
    p_subject_id UUID,
    p_day_of_week VARCHAR,
    p_time_slot_id UUID
)
RETURNS TABLE (
    teacher_id UUID,
    teacher_name TEXT,
    teacher_email VARCHAR,
    current_workload INTEGER,
    max_periods_per_day INTEGER,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH teacher_workload AS (
        SELECT 
            te.teacher_id,
            COUNT(*)::INTEGER as day_workload
        FROM timetable_entries te
        WHERE te.day_of_week = p_day_of_week
            AND te.is_active = true
        GROUP BY te.teacher_id
    )
    SELECT 
        p.user_id as teacher_id,
        CONCAT(p.first_name, ' ', p.last_name) as teacher_name,
        (SELECT email FROM auth.users WHERE id = p.user_id) as teacher_email,
        COALESCE(tw.day_workload, 0) as current_workload,
        tc.max_periods_per_day,
        NOT EXISTS (
            SELECT 1 FROM timetable_entries te
            WHERE te.teacher_id = p.user_id
                AND te.day_of_week = p_day_of_week
                AND te.time_slot_id = p_time_slot_id
                AND te.is_active = true
        ) as is_available
    FROM profiles p
    INNER JOIN teacher_capabilities tc ON tc.teacher_id = p.user_id
    LEFT JOIN teacher_workload tw ON tw.teacher_id = p.user_id
    WHERE p.role = 'teacher'
        AND p.school_id = p_school_id
        AND tc.is_active = true
        AND p_subject_id = ANY(tc.subject_ids)
        AND p_day_of_week = ANY(tc.preferred_days)
    ORDER BY current_workload ASC, teacher_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: create_default_timetable_scheme
-- Purpose: Create a default 6-period scheme for a school
-- =====================================================================

CREATE OR REPLACE FUNCTION create_default_timetable_scheme(
    p_school_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_scheme_id UUID;
BEGIN
    -- Create the scheme
    INSERT INTO timetable_schemes (
        school_id, name, description, periods_per_day, is_default
    ) VALUES (
        p_school_id, '6-Period Standard', '6 teaching periods with break and lunch', 6, true
    )
    RETURNING id INTO v_scheme_id;
    
    -- Create time slots
    INSERT INTO timetable_time_slots (scheme_id, slot_type, label, start_time, end_time, slot_order) VALUES
    (v_scheme_id, 'period', 'Period 1', '08:00', '08:45', 1),
    (v_scheme_id, 'period', 'Period 2', '08:45', '09:30', 2),
    (v_scheme_id, 'period', 'Period 3', '09:30', '10:15', 3),
    (v_scheme_id, 'break', 'Morning Break', '10:15', '10:30', 4),
    (v_scheme_id, 'period', 'Period 4', '10:30', '11:15', 5),
    (v_scheme_id, 'period', 'Period 5', '11:15', '12:00', 6),
    (v_scheme_id, 'lunch', 'Lunch Break', '12:00', '12:45', 7),
    (v_scheme_id, 'period', 'Period 6', '12:45', '13:30', 8);
    
    RETURN v_scheme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- FUNCTION: bulk_create_timetable_entries
-- Purpose: Create multiple timetable entries efficiently
-- =====================================================================

CREATE OR REPLACE FUNCTION bulk_create_timetable_entries(
    p_entries JSONB,
    p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_created_count INTEGER := 0;
    v_entry JSONB;
BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO timetable_entries (
            school_id, class_id, subject_id, teacher_id,
            time_slot_id, day_of_week, room_number, notes,
            created_by, updated_by
        ) VALUES (
            (v_entry->>'school_id')::UUID,
            (v_entry->>'class_id')::UUID,
            (v_entry->>'subject_id')::UUID,
            (v_entry->>'teacher_id')::UUID,
            (v_entry->>'time_slot_id')::UUID,
            v_entry->>'day_of_week',
            v_entry->>'room_number',
            v_entry->>'notes',
            COALESCE(p_created_by, auth.uid()),
            COALESCE(p_created_by, auth.uid())
        )
        ON CONFLICT (class_id, day_of_week, time_slot_id) DO NOTHING;
        
        v_created_count := v_created_count + 1;
    END LOOP;
    
    RETURN v_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- End of functions
-- =====================================================================
