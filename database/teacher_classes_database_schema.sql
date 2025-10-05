-- Teacher Classes Database Schema
-- Run these queries in Supabase SQL Editor to create the required tables

-- 1. Create grade_levels table
CREATE TABLE IF NOT EXISTS grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level INTEGER NOT NULL, -- Grade level number (1, 2, 3, etc.)
    name VARCHAR(50) NOT NULL, -- Grade name ("Grade 1", "Grade 2", etc.)
    description TEXT,
    school_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Class name assigned by admin
    class_name VARCHAR(100), -- Alternative class name field
    class_code VARCHAR(20), -- Class code (e.g., "5A-MATH")
    subject VARCHAR(50), -- Subject taught
    room_number VARCHAR(20), -- Room number
    max_students INTEGER DEFAULT 30, -- Maximum students allowed
    grade_level_id UUID REFERENCES grade_levels(id),
    school_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create teacher_class_assignments table
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    is_primary_teacher BOOLEAN DEFAULT false, -- Is this the primary teacher for the class
    is_active BOOLEAN DEFAULT true, -- Is this assignment currently active
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id) -- Prevent duplicate assignments
);

-- 4. Create student_class_assignments table (for student counts)
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    is_active BOOLEAN DEFAULT true,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id) -- Prevent duplicate enrollments
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_active ON teacher_class_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level_id ON classes(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_id ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_active ON student_class_assignments(is_active);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for school-based data isolation (with IF NOT EXISTS handling)
-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view grade levels from their school" ON grade_levels;
DROP POLICY IF EXISTS "Users can view classes from their school" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON teacher_class_assignments;
DROP POLICY IF EXISTS "Users can view class enrollments" ON student_class_assignments;

-- Grade levels policy
CREATE POLICY "Users can view grade levels from their school" ON grade_levels
    FOR SELECT USING (school_id = auth.uid() OR school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
    ));

-- Classes policy
CREATE POLICY "Users can view classes from their school" ON classes
    FOR SELECT USING (school_id = auth.uid() OR school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
    ));

-- Teacher class assignments policy
CREATE POLICY "Teachers can view their own class assignments" ON teacher_class_assignments
    FOR SELECT USING (teacher_id = auth.uid());

-- Student class assignments policy
CREATE POLICY "Users can view class enrollments" ON student_class_assignments
    FOR SELECT USING (
        student_id = auth.uid() OR 
        class_id IN (
            SELECT class_id FROM teacher_class_assignments WHERE teacher_id = auth.uid()
        )
    );

-- 8. Create function to get teacher's assigned classes (optional but recommended)
-- Drop existing function if it exists, then recreate it
DROP FUNCTION IF EXISTS get_teacher_assigned_classes(UUID);

CREATE OR REPLACE FUNCTION get_teacher_assigned_classes(p_teacher_id UUID)
RETURNS TABLE (
    class_id UUID,
    class_name VARCHAR,
    class_code VARCHAR,
    subject VARCHAR,
    room_number VARCHAR,
    max_students INTEGER,
    total_students BIGINT,
    grade_level INTEGER,
    grade_name VARCHAR,
    is_primary_teacher BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as class_id,
        c.name as class_name,
        c.class_code,
        c.subject,
        c.room_number,
        c.max_students,
        COALESCE(student_counts.total_students, 0) as total_students,
        gl.level as grade_level,
        gl.name as grade_name,
        tca.is_primary_teacher,
        tca.assigned_at
    FROM teacher_class_assignments tca
    JOIN classes c ON tca.class_id = c.id
    LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
    LEFT JOIN (
        SELECT 
            class_id, 
            COUNT(*) as total_students
        FROM student_class_assignments 
        WHERE is_active = true
        GROUP BY class_id
    ) student_counts ON c.id = student_counts.class_id
    WHERE tca.teacher_id = p_teacher_id 
    AND tca.is_active = true
    ORDER BY gl.level, c.name;
END;
$$;
