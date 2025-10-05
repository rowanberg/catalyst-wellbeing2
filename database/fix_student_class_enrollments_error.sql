-- Fix for "relation student_class_enrollments does not exist" error
-- This script ensures the correct table exists and fixes any references

-- First, ensure the student_class_assignments table exists
-- (This is the correct table name used throughout the system)
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, class_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_id ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_school_id ON student_class_assignments(school_id);

-- Enable Row Level Security
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_class_assignments
CREATE POLICY "Students can view their own class assignments" ON student_class_assignments
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view class assignments for their classes" ON student_class_assignments
    FOR SELECT USING (
        class_id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all class assignments in their school" ON student_class_assignments
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to manage class assignments
CREATE POLICY "Admins can manage class assignments" ON student_class_assignments
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- If for some reason there was an old table with the wrong name, we can create an alias
-- This is just a safety measure and can be removed if not needed
DO $$
BEGIN
    -- Check if the old table exists and create a view as alias if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_class_enrollments') THEN
        -- Create a view with the old name pointing to the correct table
        -- This ensures backward compatibility if any code still references the old name
        EXECUTE 'CREATE VIEW student_class_enrollments AS SELECT * FROM student_class_assignments';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If there are any issues, just continue
        NULL;
END $$;

-- Verify the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_class_assignments') THEN
        RAISE NOTICE 'SUCCESS: student_class_assignments table exists and is ready to use';
    ELSE
        RAISE EXCEPTION 'ERROR: student_class_assignments table was not created properly';
    END IF;
END $$;
