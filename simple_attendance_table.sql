-- Simple Attendance Table - Different Approach
-- This creates a minimal table that should work with any existing structure

-- Drop the table if it exists and recreate it
DROP TABLE IF EXISTS attendance CASCADE;

-- Create a simple attendance table with minimal structure
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    school_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique constraint to prevent duplicate attendance per student per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_student_date 
ON attendance(student_id, attendance_date);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(attendance_status);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create a simple RLS policy
CREATE POLICY "attendance_policy" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = attendance.school_id
        )
    );

-- Grant permissions
GRANT ALL ON attendance TO authenticated;
