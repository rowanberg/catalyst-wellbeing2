-- Fixed Attendance System Schema for Catalyst Platform
-- This schema supports teacher-based attendance management with grade and class organization

-- Create attendance table if it doesn't exist (without foreign key constraints first)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    school_id UUID NOT NULL,
    class_id UUID,
    grade_level_id UUID,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique attendance per student per date
    UNIQUE(student_id, date)
);

-- Create attendance summary table for performance (simplified)
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
GRANT SELECT ON attendance_summary TO authenticated;
