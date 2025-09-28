-- Basic Attendance System Setup
-- Run this in Supabase SQL Editor

-- Drop existing objects that might conflict
DROP TRIGGER IF EXISTS attendance_summary_trigger ON attendance;
DROP FUNCTION IF EXISTS update_attendance_summary();
DROP FUNCTION IF EXISTS trigger_update_attendance_summary();
DROP FUNCTION IF EXISTS update_attendance_summary_for_date(UUID, DATE);
DROP TABLE IF EXISTS attendance_summary;
DROP TABLE IF EXISTS attendance;

-- Create attendance table
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique attendance per student per date
    UNIQUE(student_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy for teachers
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
