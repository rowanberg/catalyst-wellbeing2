-- Enhanced Attendance System Schema for Catalyst Platform
-- This schema supports teacher-based attendance management with grade and class organization

-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    grade_level_id UUID REFERENCES grade_levels(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique attendance per student per date
    UNIQUE(student_id, date)
);

-- Create attendance summary table for performance
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    grade_level_id UUID REFERENCES grade_levels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_students INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    late_count INTEGER NOT NULL DEFAULT 0,
    excused_count INTEGER NOT NULL DEFAULT 0,
    attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique summary per class/grade per date
    UNIQUE(school_id, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(grade_level_id, '00000000-0000-0000-0000-000000000000'::UUID), date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_grade_date ON attendance(grade_level_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

CREATE INDEX IF NOT EXISTS idx_attendance_summary_school_date ON attendance_summary(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_class_date ON attendance_summary(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_grade_date ON attendance_summary(grade_level_id, date);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance table
DROP POLICY IF EXISTS "Teachers can manage attendance for their school" ON attendance;
CREATE POLICY "Teachers can manage attendance for their school" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = attendance.school_id
        )
    );

-- RLS Policies for attendance_summary table
DROP POLICY IF EXISTS "Teachers can view attendance summary for their school" ON attendance_summary;
CREATE POLICY "Teachers can view attendance summary for their school" ON attendance_summary
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = attendance_summary.school_id
        )
    );

-- Function to get teacher's assigned grades
CREATE OR REPLACE FUNCTION get_teacher_assigned_grades(teacher_uuid UUID)
RETURNS TABLE (
    grade_level_id UUID,
    grade_name VARCHAR,
    grade_level INTEGER,
    total_classes INTEGER,
    total_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        gl.id as grade_level_id,
        gl.name as grade_name,
        gl.level as grade_level,
        COUNT(DISTINCT c.id)::INTEGER as total_classes,
        COUNT(DISTINCT sca.student_id) as total_students
    FROM grade_levels gl
    JOIN classes c ON c.grade_level_id = gl.id
    JOIN teacher_class_assignments tca ON tca.class_id = c.id
    LEFT JOIN student_class_assignments sca ON sca.class_id = c.id
    WHERE tca.teacher_id = teacher_uuid
    AND tca.is_active = true
    GROUP BY gl.id, gl.name, gl.level
    ORDER BY gl.level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's classes for a specific grade
CREATE OR REPLACE FUNCTION get_teacher_grade_classes(teacher_uuid UUID, grade_uuid UUID)
RETURNS TABLE (
    class_id UUID,
    class_name VARCHAR,
    grade_name VARCHAR,
    total_students BIGINT,
    present_today BIGINT,
    absent_today BIGINT,
    attendance_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.name as class_name,
        gl.name as grade_name,
        COUNT(DISTINCT sca.student_id) as total_students,
        COUNT(DISTINCT CASE WHEN a.status = 'present' AND a.date = CURRENT_DATE THEN a.student_id END) as present_today,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' AND a.date = CURRENT_DATE THEN a.student_id END) as absent_today,
        CASE 
            WHEN COUNT(DISTINCT sca.student_id) > 0 THEN
                ROUND((COUNT(DISTINCT CASE WHEN a.status = 'present' AND a.date = CURRENT_DATE THEN a.student_id END)::DECIMAL / COUNT(DISTINCT sca.student_id)) * 100, 2)
            ELSE 0
        END as attendance_rate
    FROM classes c
    JOIN grade_levels gl ON gl.id = c.grade_level_id
    JOIN teacher_class_assignments tca ON tca.class_id = c.id
    LEFT JOIN student_class_assignments sca ON sca.class_id = c.id
    LEFT JOIN attendance a ON a.student_id = sca.student_id AND a.class_id = c.id
    WHERE tca.teacher_id = teacher_uuid
    AND tca.is_active = true
    AND c.grade_level_id = grade_uuid
    GROUP BY c.id, c.name, gl.name
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students in a specific class for attendance
CREATE OR REPLACE FUNCTION get_class_students_for_attendance(class_uuid UUID, attendance_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    student_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    student_number VARCHAR,
    attendance_status VARCHAR,
    attendance_notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as student_id,
        p.first_name,
        p.last_name,
        p.student_number,
        a.status as attendance_status,
        a.notes as attendance_notes,
        a.marked_at
    FROM profiles p
    JOIN student_class_assignments sca ON sca.student_id = p.id
    LEFT JOIN attendance a ON a.student_id = p.id AND a.date = attendance_date
    WHERE sca.class_id = class_uuid
    AND sca.is_active = true
    AND p.role = 'student'
    ORDER BY p.first_name, p.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update attendance summary (trigger function)
CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update class-level summary
    INSERT INTO attendance_summary (
        school_id, class_id, grade_level_id, date,
        total_students, present_count, absent_count, late_count, excused_count, attendance_rate
    )
    SELECT 
        NEW.school_id,
        NEW.class_id,
        NEW.grade_level_id,
        NEW.date,
        COUNT(*) as total_students,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count,
        CASE 
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as attendance_rate
    FROM attendance 
    WHERE school_id = NEW.school_id 
    AND COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::UUID) = COALESCE(NEW.class_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND date = NEW.date
    ON CONFLICT (school_id, COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(grade_level_id, '00000000-0000-0000-0000-000000000000'::UUID), date)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        present_count = EXCLUDED.present_count,
        absent_count = EXCLUDED.absent_count,
        late_count = EXCLUDED.late_count,
        excused_count = EXCLUDED.excused_count,
        attendance_rate = EXCLUDED.attendance_rate,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic summary updates
DROP TRIGGER IF EXISTS attendance_summary_trigger ON attendance;
CREATE TRIGGER attendance_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_summary();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT ON attendance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_assigned_grades(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teacher_grade_classes(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_students_for_attendance(UUID, DATE) TO authenticated;
