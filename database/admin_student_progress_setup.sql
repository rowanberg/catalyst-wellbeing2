-- Admin Student Progress Setup SQL
-- This file ensures all tables and data structures needed for admin student progress tracking are properly created

-- Ensure all required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create classes table for proper class management
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  academic_year TEXT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, school_id, academic_year)
);

-- Add class_id to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create subject_progress table for tracking academic progress
CREATE TABLE IF NOT EXISTS subject_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL CHECK (subject_name IN ('Mathematics', 'Science', 'English', 'Social Studies', 'Art', 'Physical Education', 'Music')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  letter_grade TEXT,
  last_assessment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_name)
);

-- Create academic_assessments table for detailed tracking
CREATE TABLE IF NOT EXISTS academic_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'test', 'assignment', 'project', 'exam')),
  title TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  max_score INTEGER DEFAULT 100,
  date_taken DATE DEFAULT CURRENT_DATE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wellbeing_status_log table for tracking student wellbeing over time
CREATE TABLE IF NOT EXISTS wellbeing_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('thriving', 'managing', 'needs_support', 'at_risk')),
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to profiles table for student progress tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wellbeing_status TEXT DEFAULT 'managing' CHECK (wellbeing_status IN ('thriving', 'managing', 'needs_support', 'at_risk')),
ADD COLUMN IF NOT EXISTS level_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;

-- Update existing profiles to have proper default values
UPDATE profiles 
SET 
  wellbeing_status = COALESCE(wellbeing_status, 'managing'),
  level_number = COALESCE(level_number, 1),
  xp_points = COALESCE(xp_points, COALESCE(xp, 0))
WHERE role = 'student';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_progress_student_id ON subject_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_assessments_student_id ON academic_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_assessments_subject ON academic_assessments(subject_name);
CREATE INDEX IF NOT EXISTS idx_wellbeing_status_log_student_id ON wellbeing_status_log(student_id);

-- Row Level Security (RLS) Policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
DROP POLICY IF EXISTS "School staff can view classes" ON classes;
CREATE POLICY "School staff can view classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.school_id = classes.school_id
      AND p.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.school_id = classes.school_id
      AND p.role = 'admin'
    )
  );

-- RLS Policies for subject_progress
DROP POLICY IF EXISTS "Students can view own progress" ON subject_progress;
CREATE POLICY "Students can view own progress" ON subject_progress
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "School staff can view student progress" ON subject_progress;
CREATE POLICY "School staff can view student progress" ON subject_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = subject_progress.student_id
      AND p1.school_id = p2.school_id
      AND p1.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Teachers can manage student progress" ON subject_progress;
CREATE POLICY "Teachers can manage student progress" ON subject_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = subject_progress.student_id
      AND p1.school_id = p2.school_id
      AND p1.role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for academic_assessments
DROP POLICY IF EXISTS "Students can view own assessments" ON academic_assessments;
CREATE POLICY "Students can view own assessments" ON academic_assessments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "School staff can view assessments" ON academic_assessments;
CREATE POLICY "School staff can view assessments" ON academic_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = academic_assessments.student_id
      AND p1.school_id = p2.school_id
      AND p1.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Teachers can manage assessments" ON academic_assessments;
CREATE POLICY "Teachers can manage assessments" ON academic_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p1, profiles p2
      WHERE p1.user_id = auth.uid() 
      AND p2.user_id = academic_assessments.student_id
      AND p1.school_id = p2.school_id
      AND p1.role IN ('admin', 'teacher')
    )
  );

-- Function to automatically calculate subject progress from assessments
CREATE OR REPLACE FUNCTION calculate_subject_progress(student_uuid UUID, subject TEXT)
RETURNS INTEGER AS $$
DECLARE
  avg_score INTEGER;
BEGIN
  SELECT COALESCE(AVG(score), 0)::INTEGER
  INTO avg_score
  FROM academic_assessments
  WHERE student_id = student_uuid 
  AND subject_name = subject
  AND date_taken >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN avg_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subject progress when assessments are added
CREATE OR REPLACE FUNCTION update_subject_progress_on_assessment()
RETURNS TRIGGER AS $$
DECLARE
  new_progress INTEGER;
  letter_grade TEXT;
BEGIN
  -- Calculate new progress
  new_progress := calculate_subject_progress(NEW.student_id, NEW.subject_name);
  
  -- Determine letter grade
  IF new_progress >= 95 THEN letter_grade := 'A+';
  ELSIF new_progress >= 90 THEN letter_grade := 'A';
  ELSIF new_progress >= 85 THEN letter_grade := 'A-';
  ELSIF new_progress >= 80 THEN letter_grade := 'B+';
  ELSIF new_progress >= 75 THEN letter_grade := 'B';
  ELSIF new_progress >= 70 THEN letter_grade := 'B-';
  ELSIF new_progress >= 65 THEN letter_grade := 'C+';
  ELSIF new_progress >= 60 THEN letter_grade := 'C';
  ELSE letter_grade := 'C-';
  END IF;
  
  -- Update or insert subject progress
  INSERT INTO subject_progress (student_id, subject_name, progress_percentage, letter_grade, last_assessment_date)
  VALUES (NEW.student_id, NEW.subject_name, new_progress, letter_grade, NEW.date_taken)
  ON CONFLICT (student_id, subject_name) 
  DO UPDATE SET 
    progress_percentage = new_progress,
    letter_grade = letter_grade,
    last_assessment_date = NEW.date_taken,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update subject progress when assessments are added
DROP TRIGGER IF EXISTS assessment_progress_update_trigger ON academic_assessments;
CREATE TRIGGER assessment_progress_update_trigger
  AFTER INSERT OR UPDATE ON academic_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_subject_progress_on_assessment();

-- Function to create sample student data for testing
CREATE OR REPLACE FUNCTION create_sample_student_data(school_uuid UUID)
RETURNS VOID AS $$
DECLARE
  student_id UUID;
  class_id UUID;
  subject_name TEXT;
  subjects TEXT[] := ARRAY['Mathematics', 'Science', 'English', 'Social Studies'];
BEGIN
  -- Create sample classes
  INSERT INTO classes (name, grade_level, school_id) VALUES
  ('Class 4A', '4th Grade', school_uuid),
  ('Class 5A', '5th Grade', school_uuid),
  ('Class 6A', '6th Grade', school_uuid)
  ON CONFLICT (name, school_id, academic_year) DO NOTHING;
  
  -- Get a class ID for assignment
  SELECT id INTO class_id FROM classes WHERE school_id = school_uuid LIMIT 1;
  
  -- Create sample students if they don't exist
  FOR i IN 1..6 LOOP
    INSERT INTO auth.users (id, email) VALUES 
    (gen_random_uuid(), 'student' || i || '@school.edu')
    ON CONFLICT (email) DO NOTHING;
    
    SELECT id INTO student_id FROM auth.users WHERE email = 'student' || i || '@school.edu';
    
    INSERT INTO profiles (
      user_id, first_name, last_name, role, school_id, class_id,
      grade_level, xp_points, level_number, streak_days, 
      wellbeing_status, gems, current_mood
    ) VALUES (
      student_id,
      CASE i 
        WHEN 1 THEN 'Emma'
        WHEN 2 THEN 'Liam' 
        WHEN 3 THEN 'Sophia'
        WHEN 4 THEN 'Noah'
        WHEN 5 THEN 'Ava'
        WHEN 6 THEN 'Ethan'
      END,
      CASE i
        WHEN 1 THEN 'Johnson'
        WHEN 2 THEN 'Chen'
        WHEN 3 THEN 'Rodriguez'
        WHEN 4 THEN 'Williams'
        WHEN 5 THEN 'Thompson'
        WHEN 6 THEN 'Davis'
      END,
      'student',
      school_uuid,
      class_id,
      CASE i % 3
        WHEN 0 THEN '4th Grade'
        WHEN 1 THEN '5th Grade'
        WHEN 2 THEN '6th Grade'
      END,
      1500 + (i * 300),
      8 + i,
      5 + i,
      CASE i % 3
        WHEN 0 THEN 'thriving'
        WHEN 1 THEN 'managing'
        WHEN 2 THEN 'needs_support'
      END,
      50 + (i * 20),
      CASE i % 4
        WHEN 0 THEN 'happy'
        WHEN 1 THEN 'calm'
        WHEN 2 THEN 'excited'
        WHEN 3 THEN 'neutral'
      END
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Create subject progress for each student
    FOREACH subject_name IN ARRAY subjects LOOP
      INSERT INTO subject_progress (student_id, subject_name, progress_percentage, letter_grade)
      VALUES (
        student_id,
        subject_name,
        60 + (RANDOM() * 40)::INTEGER,
        CASE 
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 90 THEN 'A'
          WHEN (60 + (RANDOM() * 40)::INTEGER) >= 80 THEN 'B'
          ELSE 'C'
        END
      ) ON CONFLICT (student_id, subject_name) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin's school students with progress data
CREATE OR REPLACE FUNCTION get_admin_school_students(admin_user_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  grade_level TEXT,
  class_name TEXT,
  xp_points INTEGER,
  level_number INTEGER,
  streak_days INTEGER,
  wellbeing_status TEXT,
  current_mood TEXT,
  gems INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  subject_progress JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.grade_level,
    COALESCE(c.name, 'Unassigned') as class_name,
    COALESCE(p.xp_points, 0) as xp_points,
    COALESCE(p.level_number, 1) as level_number,
    COALESCE(p.streak_days, 0) as streak_days,
    COALESCE(p.wellbeing_status, 'managing') as wellbeing_status,
    COALESCE(p.current_mood, 'neutral') as current_mood,
    COALESCE(p.gems, 0) as gems,
    p.created_at,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'name', sp.subject_name,
          'progress', sp.progress_percentage,
          'grade', sp.letter_grade
        )
      ) FROM subject_progress sp WHERE sp.student_id = p.user_id),
      '[]'::jsonb
    ) as subject_progress
  FROM profiles p
  LEFT JOIN classes c ON p.class_id = c.id
  WHERE p.role = 'student'
  AND p.school_id = (
    SELECT school_id FROM profiles WHERE user_id = admin_user_id AND role = 'admin'
  )
  ORDER BY p.grade_level, p.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
