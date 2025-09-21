-- Drop existing grade_levels table if it exists to ensure clean structure
DROP TABLE IF EXISTS grade_levels CASCADE;

-- Create table for storing school grade levels and classes
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    grade_level VARCHAR(10) NOT NULL, -- e.g., '1', '2', '3', 'K', '12'
    grade_name VARCHAR(100), -- e.g., 'First Grade', 'Kindergarten'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, grade_level)
);

-- Drop existing classes table if it exists without the proper structure
DROP TABLE IF EXISTS classes CASCADE;

-- Create table for storing classes within grade levels
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    grade_level_id UUID REFERENCES grade_levels(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL, -- e.g., 'Class A', 'Mathematics', 'Science'
    class_code VARCHAR(20), -- e.g., '1A', 'MATH101'
    subject VARCHAR(100), -- e.g., 'Mathematics', 'English', 'Science'
    room_number VARCHAR(20),
    max_students INTEGER DEFAULT 30,
    current_students INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, grade_level_id, class_name)
);

-- Drop existing assignment tables if they exist
DROP TABLE IF EXISTS teacher_class_assignments CASCADE;
DROP TABLE IF EXISTS student_class_assignments CASCADE;

-- Create table for teacher-class assignments
CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    is_primary_teacher BOOLEAN DEFAULT false, -- Main teacher for the class
    subject VARCHAR(100), -- Subject they teach for this class
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, class_id)
);

-- Create table for student-class assignments
CREATE TABLE student_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- Insert sample grade levels for a school (assuming school_id exists)
INSERT INTO grade_levels (school_id, grade_level, grade_name) VALUES
    ((SELECT id FROM schools LIMIT 1), 'K', 'Kindergarten'),
    ((SELECT id FROM schools LIMIT 1), '1', 'First Grade'),
    ((SELECT id FROM schools LIMIT 1), '2', 'Second Grade'),
    ((SELECT id FROM schools LIMIT 1), '3', 'Third Grade'),
    ((SELECT id FROM schools LIMIT 1), '4', 'Fourth Grade'),
    ((SELECT id FROM schools LIMIT 1), '5', 'Fifth Grade'),
    ((SELECT id FROM schools LIMIT 1), '6', 'Sixth Grade'),
    ((SELECT id FROM schools LIMIT 1), '7', 'Seventh Grade'),
    ((SELECT id FROM schools LIMIT 1), '8', 'Eighth Grade'),
    ((SELECT id FROM schools LIMIT 1), '9', 'Ninth Grade'),
    ((SELECT id FROM schools LIMIT 1), '10', 'Tenth Grade'),
    ((SELECT id FROM schools LIMIT 1), '11', 'Eleventh Grade'),
    ((SELECT id FROM schools LIMIT 1), '12', 'Twelfth Grade')
ON CONFLICT (school_id, grade_level) DO NOTHING;

-- Insert sample classes for each grade level
INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'Class A',
    CONCAT(gl.grade_level, 'A'),
    'General'
FROM grade_levels gl
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'Class B',
    CONCAT(gl.grade_level, 'B'),
    'General'
FROM grade_levels gl
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

-- For higher grades, add subject-specific classes
INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'Mathematics',
    CONCAT(gl.grade_level, 'MATH'),
    'Mathematics'
FROM grade_levels gl 
WHERE gl.grade_level IN ('6', '7', '8', '9', '10', '11', '12')
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'English',
    CONCAT(gl.grade_level, 'ENG'),
    'English'
FROM grade_levels gl 
WHERE gl.grade_level IN ('6', '7', '8', '9', '10', '11', '12')
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'Science',
    CONCAT(gl.grade_level, 'SCI'),
    'Science'
FROM grade_levels gl 
WHERE gl.grade_level IN ('6', '7', '8', '9', '10', '11', '12')
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

INSERT INTO classes (school_id, grade_level_id, class_name, class_code, subject) 
SELECT 
    gl.school_id,
    gl.id,
    'Social Studies',
    CONCAT(gl.grade_level, 'SS'),
    'Social Studies'
FROM grade_levels gl 
WHERE gl.grade_level IN ('6', '7', '8', '9', '10', '11', '12')
ON CONFLICT (school_id, grade_level_id, class_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grade_levels_school_id ON grade_levels(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level_id ON classes(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_id ON student_class_assignments(class_id);

-- Create RLS policies
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for grade_levels
CREATE POLICY "Users can view grade levels from their school" ON grade_levels
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Policies for classes
CREATE POLICY "Users can view classes from their school" ON classes
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );

-- Policies for teacher_class_assignments
CREATE POLICY "Teachers can view their own class assignments" ON teacher_class_assignments
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their own class assignments" ON teacher_class_assignments
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own class assignments" ON teacher_class_assignments
    FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own class assignments" ON teacher_class_assignments
    FOR DELETE USING (teacher_id = auth.uid());

-- Policies for student_class_assignments
CREATE POLICY "Users can view student class assignments from their school" ON student_class_assignments
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM profiles WHERE user_id = auth.uid()
        )
    );
