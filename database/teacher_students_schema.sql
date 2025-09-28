-- Teacher Students Page Database Schema
-- This file contains the necessary tables and relationships for the teacher students functionality

-- Ensure we have proper grade levels table
CREATE TABLE IF NOT EXISTS grade_levels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    grade_level VARCHAR(10) NOT NULL, -- e.g., '1', '2', 'K', '12'
    grade_name VARCHAR(100) NOT NULL, -- e.g., 'First Grade', 'Kindergarten'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, grade_level)
);

-- Ensure we have proper classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    grade_level_id UUID REFERENCES grade_levels(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL, -- e.g., 'Grade 1A', 'Math 101'
    class_code VARCHAR(20), -- e.g., 'G1A', 'MATH101'
    subject VARCHAR(100) NOT NULL DEFAULT 'General Studies',
    room_number VARCHAR(20),
    max_students INTEGER DEFAULT 25,
    current_students INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, class_name)
);

-- Student class assignments table
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, class_id)
);

-- Teacher class assignments table
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    is_primary_teacher BOOLEAN DEFAULT false,
    subject VARCHAR(100),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(teacher_id, class_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grade_levels_school_id ON grade_levels(school_id);
CREATE INDEX IF NOT EXISTS idx_grade_levels_active ON grade_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level_id ON classes(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_id ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_school_id ON student_class_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_school_id ON teacher_class_assignments(school_id);

-- Function to update current_students count in classes table
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        UPDATE classes 
        SET current_students = current_students + 1 
        WHERE id = NEW.class_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false) THEN
        UPDATE classes 
        SET current_students = GREATEST(current_students - 1, 0) 
        WHERE id = COALESCE(OLD.class_id, NEW.class_id);
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true THEN
        UPDATE classes 
        SET current_students = current_students + 1 
        WHERE id = NEW.class_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update student counts
DROP TRIGGER IF EXISTS trigger_update_class_student_count ON student_class_assignments;
CREATE TRIGGER trigger_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON student_class_assignments
    FOR EACH ROW EXECUTE FUNCTION update_class_student_count();

-- RLS Policies (with IF NOT EXISTS handling)
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;

-- Grade levels policies
DROP POLICY IF EXISTS "Users can view grade levels from their school" ON grade_levels;
CREATE POLICY "Users can view grade levels from their school" ON grade_levels
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage grade levels in their school" ON grade_levels;
CREATE POLICY "Admins can manage grade levels in their school" ON grade_levels
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Classes policies
DROP POLICY IF EXISTS "Users can view classes from their school" ON classes;
CREATE POLICY "Users can view classes from their school" ON classes
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage classes in their school" ON classes;
CREATE POLICY "Admins can manage classes in their school" ON classes
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Student class assignments policies
DROP POLICY IF EXISTS "Users can view student assignments from their school" ON student_class_assignments;
CREATE POLICY "Users can view student assignments from their school" ON student_class_assignments
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins and teachers can manage student assignments in their school" ON student_class_assignments;
CREATE POLICY "Admins and teachers can manage student assignments in their school" ON student_class_assignments
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
        )
    );

-- Teacher class assignments policies
DROP POLICY IF EXISTS "Users can view teacher assignments from their school" ON teacher_class_assignments;
CREATE POLICY "Users can view teacher assignments from their school" ON teacher_class_assignments
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage teacher assignments in their school" ON teacher_class_assignments;
CREATE POLICY "Admins can manage teacher assignments in their school" ON teacher_class_assignments
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Teachers can view their own assignments" ON teacher_class_assignments;
CREATE POLICY "Teachers can view their own assignments" ON teacher_class_assignments
    FOR SELECT USING (teacher_id = auth.uid());
