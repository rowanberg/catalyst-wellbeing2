-- Complete Attendance System Setup with Performance Optimization
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CREATE TABLES FIRST
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique attendance per student per date
    UNIQUE(student_id, date)
);

-- ============================================================================
-- 2. ATTENDANCE SUMMARY TABLE (for performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_students INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    late_count INTEGER NOT NULL DEFAULT 0,
    excused_count INTEGER NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique summary per class per date
    UNIQUE(school_id, class_id, date)
);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON attendance(marked_at);

-- Summary table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_summary_school_date ON attendance_summary(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_class_date ON attendance_summary(class_id, date) WHERE class_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_school_class_date ON attendance(school_id, class_id, date) WHERE class_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_student_status_date ON attendance(student_id, status, date);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- Attendance table policies
DROP POLICY IF EXISTS "Teachers can manage attendance for their school" ON attendance;
CREATE POLICY "Teachers can manage attendance for their school" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance.school_id
        )
    );

-- Summary table policies
DROP POLICY IF EXISTS "Teachers can view attendance summary for their school" ON attendance_summary;
CREATE POLICY "Teachers can view attendance summary for their school" ON attendance_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin', 'principal')
            AND profiles.school_id = attendance_summary.school_id
        )
    );

-- ============================================================================
-- 5. OPTIMIZED FUNCTIONS
-- ============================================================================

-- Function to get class students with attendance for a specific date
CREATE OR REPLACE FUNCTION get_class_attendance(
    p_class_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    student_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    student_number VARCHAR,
    attendance_status VARCHAR,
    attendance_notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as student_id,
        p.first_name,
        p.last_name,
        p.email,
        p.student_number,
        a.status as attendance_status,
        a.notes as attendance_notes,
        a.marked_at
    FROM profiles p
    JOIN student_class_assignments sca ON sca.student_id = p.id
    LEFT JOIN attendance a ON a.student_id = p.id AND a.date = p_date
    WHERE sca.class_id = p_class_id
    AND sca.is_active = true
    AND p.role = 'student'
    ORDER BY p.first_name, p.last_name;
END;
$$;

-- Function to get school attendance summary for date range
CREATE OR REPLACE FUNCTION get_school_attendance_summary(
    p_school_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    total_students BIGINT,
    present_count BIGINT,
    absent_count BIGINT,
    late_count BIGINT,
    excused_count BIGINT,
    attendance_rate DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.date,
        COUNT(*) as total_students,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
        ROUND(
            (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
            2
        ) as attendance_rate
    FROM attendance a
    WHERE a.school_id = p_school_id
    AND a.date BETWEEN p_start_date AND p_end_date
    GROUP BY a.date
    ORDER BY a.date DESC;
END;
$$;

-- Function to bulk upsert attendance (optimized for performance)
CREATE OR REPLACE FUNCTION upsert_attendance_bulk(
    p_attendance_data JSONB,
    p_teacher_id UUID,
    p_school_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    success BOOLEAN,
    affected_rows INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affected_rows INTEGER := 0;
BEGIN
    -- Bulk upsert attendance records
    INSERT INTO attendance (
        student_id, 
        teacher_id, 
        school_id, 
        date, 
        status, 
        notes,
        updated_at
    )
    SELECT 
        (item->>'student_id')::UUID,
        p_teacher_id,
        p_school_id,
        p_date,
        item->>'status',
        COALESCE(item->>'notes', ''),
        NOW()
    FROM jsonb_array_elements(p_attendance_data) AS item
    ON CONFLICT (student_id, date)
    DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        teacher_id = EXCLUDED.teacher_id,
        updated_at = NOW();
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    
    -- Update summary table
    PERFORM update_attendance_summary_for_date(p_school_id, p_date);
    
    RETURN QUERY SELECT true, v_affected_rows, 'Attendance updated successfully';
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 0, SQLERRM;
END;
$$;

-- Function to update attendance summary (optimized)
CREATE OR REPLACE FUNCTION update_attendance_summary_for_date(
    p_school_id UUID,
    p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update school-level summary
    INSERT INTO attendance_summary (
        school_id, 
        class_id,
        date,
        total_students, 
        present_count, 
        absent_count, 
        late_count, 
        excused_count, 
        attendance_rate,
        updated_at
    )
    SELECT 
        p_school_id,
        NULL as class_id,
        p_date,
        COUNT(*) as total_students,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_count,
        ROUND(
            (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)) * 100, 
            2
        ) as attendance_rate,
        NOW()
    FROM attendance a
    WHERE a.school_id = p_school_id 
    AND a.date = p_date
    ON CONFLICT (school_id, class_id, date)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        present_count = EXCLUDED.present_count,
        absent_count = EXCLUDED.absent_count,
        late_count = EXCLUDED.late_count,
        excused_count = EXCLUDED.excused_count,
        attendance_rate = EXCLUDED.attendance_rate,
        updated_at = NOW();
END;
$$;

-- ============================================================================
-- 6. TRIGGERS FOR AUTO-SUMMARY UPDATES
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_update_attendance_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update summary for the affected date and school
    IF TG_OP = 'DELETE' THEN
        PERFORM update_attendance_summary_for_date(OLD.school_id, OLD.date);
        RETURN OLD;
    ELSE
        PERFORM update_attendance_summary_for_date(NEW.school_id, NEW.date);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS attendance_summary_trigger ON attendance;
CREATE TRIGGER attendance_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_attendance_summary();

-- ============================================================================
-- 7. PERMISSIONS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT ON attendance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_attendance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_school_attendance_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_attendance_bulk(JSONB, UUID, UUID, DATE) TO authenticated;

-- ============================================================================
-- 8. PERFORMANCE OPTIMIZATION SETTINGS
-- ============================================================================
-- Analyze tables for query planner
ANALYZE attendance;
ANALYZE attendance_summary;

-- Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attendance_today 
ON attendance(school_id, status) 
WHERE date = CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_attendance_recent 
ON attendance(school_id, date, status) 
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- This script creates:
-- 1. Optimized attendance and summary tables
-- 2. Performance indexes for fast queries
-- 3. Row Level Security policies
-- 4. Efficient functions for common operations
-- 5. Auto-updating summary triggers
-- 6. Proper permissions
--
-- The system is now ready for high-performance attendance tracking!
