-- Complete Database Setup for Teacher Class Management System
-- =============================================================================
-- COMPLETE DATABASE SETUP FOR TEACHER CLASS MANAGEMENT
-- This script sets up all tables, columns, constraints, functions, and sample data
-- =============================================================================

-- =============================================================================
-- STEP 1: ENHANCE PROFILES TABLE FOR CLASS MANAGEMENT
-- =============================================================================

-- Add grade_level and subject columns if they don't exist (for better class matching)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_level VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subject_preference VARCHAR(50);

-- =============================================================================
-- STEP 2: CREATE CORE TABLES
-- =============================================================================

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(10) NOT NULL,
  subject VARCHAR(50),
  description TEXT,
  academic_year VARCHAR(20) DEFAULT '2024-2025',
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(school_id, name, academic_year)
);

-- Create teacher_grade_assignments table (replaces teacher_classes)
CREATE TABLE IF NOT EXISTS teacher_grade_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade_level VARCHAR(10) NOT NULL,
  subject VARCHAR(50) DEFAULT 'General',
  is_primary_teacher BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(teacher_id, school_id, grade_level, subject)
);

-- Create parent_child_relationships table
CREATE TABLE IF NOT EXISTS parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship VARCHAR(50) DEFAULT 'parent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(parent_id, child_id)
);

-- =============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_teacher_grade_assignments_teacher_id ON teacher_grade_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_grade_assignments_school_grade ON teacher_grade_assignments(school_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_school_grade ON profiles(school_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_child_id ON parent_child_relationships(child_id);

-- =============================================================================
-- STEP 4: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Classes policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view classes from their school" ON classes;
CREATE POLICY "Users can view classes from their school" ON classes
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage classes in their school" ON classes;
CREATE POLICY "Admins can manage classes in their school" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND school_id = classes.school_id
    )
  );

-- Teacher grade assignments policies
ALTER TABLE teacher_grade_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view their grade assignments" ON teacher_grade_assignments;
CREATE POLICY "Teachers can view their grade assignments" ON teacher_grade_assignments
  FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'teacher')
      AND school_id = teacher_grade_assignments.school_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage teacher grade assignments" ON teacher_grade_assignments;
CREATE POLICY "Admins can manage teacher grade assignments" ON teacher_grade_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND school_id = teacher_grade_assignments.school_id
    )
  );

-- Parent child relationships policies
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own relationships" ON parent_child_relationships;
CREATE POLICY "Users can view their own relationships" ON parent_child_relationships
  FOR SELECT USING (
    parent_id = auth.uid() OR 
    child_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'teacher')
      AND school_id IN (
        SELECT school_id FROM profiles 
        WHERE id = parent_child_relationships.parent_id 
        OR id = parent_child_relationships.child_id
      )
    )
  );

DROP POLICY IF EXISTS "Parents can manage their relationships" ON parent_child_relationships;
CREATE POLICY "Parents can manage their relationships" ON parent_child_relationships
  FOR ALL USING (
    parent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND school_id IN (
        SELECT school_id FROM profiles 
        WHERE id = parent_child_relationships.parent_id
      )
    )
  );

-- =============================================================================
-- STEP 5: DATABASE FUNCTIONS
-- =============================================================================

-- Function to get teacher's assigned grades with student counts
CREATE OR REPLACE FUNCTION get_teacher_grades(teacher_uuid UUID)
RETURNS TABLE (
  assignment_id UUID,
  grade_level VARCHAR,
  subject VARCHAR,
  student_count BIGINT,
  is_primary_teacher BOOLEAN,
  school_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tga.id,
    tga.grade_level,
    tga.subject,
    COUNT(p.id) as student_count,
    tga.is_primary_teacher,
    s.name as school_name
  FROM teacher_grade_assignments tga
  JOIN schools s ON tga.school_id = s.id
  LEFT JOIN profiles p ON p.school_id = tga.school_id 
    AND p.grade_level = tga.grade_level 
    AND p.role = 'student'
  WHERE tga.teacher_id = teacher_uuid
  GROUP BY tga.id, tga.grade_level, tga.subject, tga.is_primary_teacher, s.name
  ORDER BY tga.grade_level, tga.subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students in a grade with parent information
CREATE OR REPLACE FUNCTION get_grade_students_with_parents(teacher_school_id UUID, target_grade_level VARCHAR)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  student_email VARCHAR,
  student_grade VARCHAR,
  xp_points INTEGER,
  level_number INTEGER,
  streak_days INTEGER,
  mood VARCHAR,
  wellbeing_status VARCHAR,
  parent_id UUID,
  parent_name VARCHAR,
  parent_email VARCHAR,
  parent_phone VARCHAR,
  relationship VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    CONCAT(s.first_name, ' ', s.last_name),
    s.email,
    s.grade_level,
    COALESCE(s.xp_points, 0),
    COALESCE(s.level, 1),
    COALESCE(s.streak_days, 0),
    COALESCE(s.mood, 'neutral'),
    COALESCE(s.wellbeing_status, 'thriving'),
    p.id,
    CONCAT(p.first_name, ' ', p.last_name),
    p.email,
    p.phone,
    pcr.relationship
  FROM profiles s
  LEFT JOIN parent_child_relationships pcr ON s.id = pcr.child_id
  LEFT JOIN profiles p ON pcr.parent_id = p.id AND p.role = 'parent'
  WHERE s.school_id = teacher_school_id 
    AND s.grade_level = target_grade_level 
    AND s.role = 'student'
  ORDER BY s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 6: INSERT SAMPLE DATA
-- =============================================================================

-- Insert sample classes for all schools
INSERT INTO classes (school_id, name, grade_level, subject, description, academic_year) 
SELECT 
  s.id,
  class_data.name,
  class_data.grade_level,
  class_data.subject,
  class_data.description,
  '2024-2025'
FROM schools s
CROSS JOIN (
  VALUES 
    ('Grade 1A', '1', 'General', 'Primary class for Grade 1 students'),
    ('Grade 1B', '1', 'General', 'Primary class for Grade 1 students'),
    ('Grade 2A', '2', 'General', 'Primary class for Grade 2 students'),
    ('Grade 2B', '2', 'General', 'Primary class for Grade 2 students'),
    ('Grade 3A', '3', 'General', 'Primary class for Grade 3 students'),
    ('Grade 3B', '3', 'General', 'Primary class for Grade 3 students'),
    ('Grade 4A', '4', 'General', 'Elementary class for Grade 4 students'),
    ('Grade 4B', '4', 'General', 'Elementary class for Grade 4 students'),
    ('Grade 5A', '5', 'General', 'Elementary class for Grade 5 students'),
    ('Grade 5B', '5', 'General', 'Elementary class for Grade 5 students'),
    ('Grade 6 Math', '6', 'Mathematics', 'Advanced Mathematics for Grade 6'),
    ('Grade 6 Science', '6', 'Science', 'Science class for Grade 6 students'),
    ('Grade 6 English', '6', 'English', 'English Language Arts for Grade 6'),
    ('Grade 7 Math', '7', 'Mathematics', 'Advanced Mathematics for Grade 7'),
    ('Grade 7 Science', '7', 'Science', 'Science class for Grade 7 students'),
    ('Grade 7 English', '7', 'English', 'English Language Arts for Grade 7'),
    ('Grade 8 Math', '8', 'Mathematics', 'Advanced Mathematics for Grade 8'),
    ('Grade 8 Science', '8', 'Science', 'Science class for Grade 8 students'),
    ('Grade 8 English', '8', 'English', 'English Language Arts for Grade 8')
) AS class_data(name, grade_level, subject, description)
ON CONFLICT (school_id, name, academic_year) DO NOTHING;

-- =============================================================================
-- STEP 7: INSERT SAMPLE TEACHER GRADE ASSIGNMENTS
-- =============================================================================

-- Insert sample teacher grade assignments for all schools
INSERT INTO teacher_grade_assignments (teacher_id, school_id, grade_level, subject, is_primary_teacher)
SELECT 
  t.id as teacher_id,
  t.school_id,
  grade_data.grade_level,
  grade_data.subject,
  grade_data.is_primary
FROM profiles t
CROSS JOIN (
  VALUES 
    ('1', 'General', true),
    ('2', 'General', true),
    ('3', 'General', true),
    ('4', 'General', true),
    ('5', 'General', true),
    ('6', 'Mathematics', true),
    ('6', 'Science', false),
    ('6', 'English', false),
    ('7', 'Mathematics', true),
    ('7', 'Science', false),
    ('7', 'English', false),
    ('8', 'Mathematics', true),
    ('8', 'Science', false),
    ('8', 'English', false)
) AS grade_data(grade_level, subject, is_primary)
WHERE t.role = 'teacher'
ON CONFLICT (teacher_id, school_id, grade_level, subject) DO NOTHING;

-- =============================================================================
-- STEP 8: VERIFICATION QUERIES
-- =============================================================================

-- Verify the setup
SELECT 
    'Classes Created' as status,
    COUNT(*) as count
FROM classes
UNION ALL
SELECT 
    'Teacher Grade Assignments Table' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name = 'teacher_grade_assignments'
UNION ALL
SELECT 
    'Teacher Grade Assignments' as status,
    COUNT(*) as count
FROM teacher_grade_assignments
UNION ALL
SELECT 
    'Database Functions' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('get_teacher_grades', 'get_grade_students_with_parents');

-- Database setup complete
SELECT 'Database setup completed successfully' as status;
