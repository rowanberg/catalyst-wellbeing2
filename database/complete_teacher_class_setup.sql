-- Complete Teacher Class Management Setup
-- Run this script in the correct order to set up the entire system

-- Step 1: Create classes table first
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  subject VARCHAR(100),
  description TEXT,
  academic_year VARCHAR(20) NOT NULL,
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique class names per school and academic year
  UNIQUE(school_id, name, academic_year)
);

-- Step 2: Create teacher_classes junction table
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_primary_teacher BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a teacher can't be assigned to the same class twice
  UNIQUE(teacher_id, class_id)
);

-- Step 3: Add class_id column to profiles table for students
DO $$ 
BEGIN
    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'class_id') THEN
        ALTER TABLE profiles 
        ADD COLUMN class_id UUID;
        
        RAISE NOTICE 'Added class_id column to profiles table';
    ELSE
        RAISE NOTICE 'class_id column already exists in profiles table';
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_profiles_class_id' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT fk_profiles_class_id 
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for class_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class_id ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);

-- Step 5: Row Level Security Policies

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

-- Teacher classes policies
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view their class assignments" ON teacher_classes;
CREATE POLICY "Teachers can view their class assignments" ON teacher_classes
  FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'teacher')
      AND school_id IN (
        SELECT school_id FROM profiles WHERE id = teacher_classes.teacher_id
      )
    )
  );

DROP POLICY IF EXISTS "Admins can manage teacher class assignments" ON teacher_classes;
CREATE POLICY "Admins can manage teacher class assignments" ON teacher_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.school_id = p2.school_id
      WHERE p1.id = auth.uid() 
      AND p1.role = 'admin'
      AND p2.id = teacher_classes.teacher_id
    )
  );

-- Step 6: Insert sample classes for testing
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

-- Step 7: Create database functions

-- Function to get teacher's classes with student counts
CREATE OR REPLACE FUNCTION get_teacher_classes(teacher_uuid UUID)
RETURNS TABLE (
  class_id UUID,
  class_name VARCHAR,
  grade_level VARCHAR,
  subject VARCHAR,
  student_count BIGINT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.grade_level,
    c.subject,
    COUNT(p.id) as student_count,
    tc.is_primary_teacher
  FROM classes c
  JOIN teacher_classes tc ON c.id = tc.class_id
  LEFT JOIN profiles p ON c.id = p.class_id AND p.role = 'student'
  WHERE tc.teacher_id = teacher_uuid
  GROUP BY c.id, c.name, c.grade_level, c.subject, tc.is_primary_teacher
  ORDER BY c.grade_level, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students in a class with parent information
CREATE OR REPLACE FUNCTION get_class_students_with_parents(class_uuid UUID)
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
  WHERE s.class_id = class_uuid AND s.role = 'student'
  ORDER BY s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Assign existing students to classes based on grade level
DO $$
DECLARE
    school_record RECORD;
    class_record RECORD;
    student_count INTEGER;
BEGIN
    -- For each school, assign students to classes based on their grade level
    FOR school_record IN SELECT id, name FROM schools LOOP
        RAISE NOTICE 'Processing school: %', school_record.name;
        
        -- For each class in this school
        FOR class_record IN 
            SELECT id, name, grade_level, max_students
            FROM classes 
            WHERE school_id = school_record.id 
            ORDER BY grade_level, name
        LOOP
            -- Count current students in this class
            SELECT COUNT(*) INTO student_count
            FROM profiles 
            WHERE class_id = class_record.id AND role = 'student';
            
            -- Only assign if class isn't full
            IF student_count < class_record.max_students THEN
                -- Assign unassigned students with matching grade level
                UPDATE profiles 
                SET class_id = class_record.id 
                WHERE school_id = school_record.id 
                AND role = 'student' 
                AND grade_level = class_record.grade_level
                AND class_id IS NULL
                AND id IN (
                    SELECT id FROM profiles 
                    WHERE school_id = school_record.id 
                    AND role = 'student' 
                    AND grade_level = class_record.grade_level
                    AND class_id IS NULL
                    LIMIT (class_record.max_students - student_count)
                );
                
                GET DIAGNOSTICS student_count = ROW_COUNT;
                IF student_count > 0 THEN
                    RAISE NOTICE 'Assigned % students to class %', student_count, class_record.name;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Final verification query
SELECT 
    s.name as school_name,
    c.name as class_name,
    c.grade_level,
    c.subject,
    COUNT(p.id) as student_count,
    c.max_students
FROM schools s
LEFT JOIN classes c ON s.id = c.school_id
LEFT JOIN profiles p ON c.id = p.class_id AND p.role = 'student'
GROUP BY s.name, c.name, c.grade_level, c.subject, c.max_students
ORDER BY s.name, c.grade_level, c.name;
