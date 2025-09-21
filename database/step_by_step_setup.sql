-- Step-by-step database setup to avoid dependency issues
-- Run each step separately in order

-- STEP 1: Create classes table (run this first)
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

-- STEP 2: Add class_id column to profiles table (run after step 1)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS class_id UUID;

-- STEP 3: Add foreign key constraint (run after step 2)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_profiles_class_id' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT fk_profiles_class_id 
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- STEP 4: Create teacher_classes junction table (run after step 3)
CREATE TABLE IF NOT EXISTS teacher_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_primary_teacher BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a teacher can't be assigned to the same class twice
  UNIQUE(teacher_id, class_id)
);

-- STEP 5: Create indexes (run after step 4)
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher_id ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_class_id ON teacher_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);

-- STEP 6: Insert sample classes (run after step 5)
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
    ('Grade 5B', '5', 'General', 'Elementary class for Grade 5 students')
) AS class_data(name, grade_level, subject, description)
ON CONFLICT (school_id, name, academic_year) DO NOTHING;
