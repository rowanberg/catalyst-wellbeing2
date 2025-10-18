-- Academic Upgrade System Tables
-- This migration creates the necessary tables for managing class promotions

-- Add missing columns to classes table if they don't exist
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS grade_level INTEGER,
ADD COLUMN IF NOT EXISTS section VARCHAR(10),
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20),
ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing classes to parse grade_level and section from name or class_name
-- First check if we have a name or class_name column to work with
DO $$
BEGIN
  -- Try to update using 'name' column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'name'
  ) THEN
    UPDATE classes 
    SET 
      grade_level = CASE 
        WHEN name ~ 'Grade (\d+)' THEN SUBSTRING(name FROM 'Grade (\d+)')::INTEGER
        WHEN name ~ 'Class (\d+)' THEN SUBSTRING(name FROM 'Class (\d+)')::INTEGER
        WHEN name ~ '^(\d+)' THEN SUBSTRING(name FROM '^(\d+)')::INTEGER
        ELSE 1
      END,
      section = CASE
        WHEN name ~ '-([A-Z])$' THEN SUBSTRING(name FROM '-([A-Z])$')
        WHEN name ~ '([A-Z])$' THEN SUBSTRING(name FROM '([A-Z])$')
        ELSE 'A'
      END,
      academic_year = COALESCE(academic_year, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT)
    WHERE grade_level IS NULL OR section IS NULL;
  -- Try 'class_name' column if it exists instead
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classes' AND column_name = 'class_name'
  ) THEN
    UPDATE classes 
    SET 
      grade_level = CASE 
        WHEN class_name ~ 'Grade (\d+)' THEN SUBSTRING(class_name FROM 'Grade (\d+)')::INTEGER
        WHEN class_name ~ 'Class (\d+)' THEN SUBSTRING(class_name FROM 'Class (\d+)')::INTEGER
        WHEN class_name ~ '^(\d+)' THEN SUBSTRING(class_name FROM '^(\d+)')::INTEGER
        ELSE 1
      END,
      section = CASE
        WHEN class_name ~ '-([A-Z])$' THEN SUBSTRING(class_name FROM '-([A-Z])$')
        WHEN class_name ~ '([A-Z])$' THEN SUBSTRING(class_name FROM '([A-Z])$')
        ELSE 'A'
      END,
      academic_year = COALESCE(academic_year, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT)
    WHERE grade_level IS NULL OR section IS NULL;
  ELSE
    -- If neither exists, just set defaults
    UPDATE classes 
    SET 
      grade_level = COALESCE(grade_level, 1),
      section = COALESCE(section, 'A'),
      academic_year = COALESCE(academic_year, EXTRACT(YEAR FROM CURRENT_DATE)::TEXT)
    WHERE grade_level IS NULL OR section IS NULL;
  END IF;
END $$;

-- Create promotion_mappings table for storing class promotion configurations
CREATE TABLE IF NOT EXISTS promotion_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  from_class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  from_class_name TEXT NOT NULL,
  from_grade INTEGER NOT NULL,
  from_section TEXT,
  to_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  to_class_name TEXT,
  to_grade INTEGER,
  to_section TEXT,
  is_locked BOOLEAN DEFAULT false,
  academic_year TEXT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, from_class_id, academic_year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotion_mappings_school 
  ON promotion_mappings(school_id);
CREATE INDEX IF NOT EXISTS idx_promotion_mappings_from_class 
  ON promotion_mappings(from_class_id);
CREATE INDEX IF NOT EXISTS idx_promotion_mappings_year 
  ON promotion_mappings(academic_year);
CREATE INDEX IF NOT EXISTS idx_promotion_mappings_grade 
  ON promotion_mappings(from_grade, to_grade);

-- Create academic_years table if not exists
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  year_range TEXT NOT NULL, -- e.g., "2024-2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, year_range)
);

-- Create student_promotions table to track individual student promotions
CREATE TABLE IF NOT EXISTS student_promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_class_id UUID REFERENCES classes(id),
  to_class_id UUID REFERENCES classes(id),
  academic_year_from TEXT NOT NULL,
  academic_year_to TEXT NOT NULL,
  promotion_status TEXT CHECK (promotion_status IN ('promoted', 'retained', 'conditional')) DEFAULT 'promoted',
  promoted_by UUID REFERENCES profiles(id),
  promoted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(student_id, academic_year_from)
);

-- Create indexes for student_promotions
CREATE INDEX IF NOT EXISTS idx_student_promotions_student 
  ON student_promotions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_from_class 
  ON student_promotions(from_class_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_to_class 
  ON student_promotions(to_class_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_year 
  ON student_promotions(academic_year_from, academic_year_to);

-- Add RLS policies for promotion_mappings
ALTER TABLE promotion_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view promotion mappings"
  ON promotion_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = promotion_mappings.school_id
    )
  );

CREATE POLICY "Admins can create promotion mappings"
  ON promotion_mappings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = promotion_mappings.school_id
    )
  );

CREATE POLICY "Admins can update promotion mappings"
  ON promotion_mappings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = promotion_mappings.school_id
    )
  );

CREATE POLICY "Admins can delete promotion mappings"
  ON promotion_mappings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.school_id = promotion_mappings.school_id
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotion_mappings_updated_at
  BEFORE UPDATE ON promotion_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add sample data generator function (optional - for testing)
CREATE OR REPLACE FUNCTION generate_sample_classes(p_school_id UUID)
RETURNS void AS $$
DECLARE
  v_grade INTEGER;
  v_section CHAR;
BEGIN
  -- Generate classes for grades 1-12 with sections A-C
  FOR v_grade IN 1..12 LOOP
    FOR v_section IN SELECT unnest(ARRAY['A', 'B', 'C']) LOOP
      INSERT INTO classes (
        school_id,
        name,
        grade_level,
        section,
        academic_year
      )
      VALUES (
        p_school_id,
        'Grade ' || v_grade || '-' || v_section,
        v_grade,
        v_section,
        EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add helper function to auto-generate promotion mappings
CREATE OR REPLACE FUNCTION auto_generate_promotion_mappings(p_school_id UUID)
RETURNS void AS $$
BEGIN
  -- Generate promotion mappings for all classes
  INSERT INTO promotion_mappings (
    school_id,
    from_class_id,
    from_class_name,
    from_grade,
    from_section,
    to_class_name,
    to_grade,
    to_section,
    academic_year
  )
  SELECT 
    c1.school_id,
    c1.id,
    c1.name,
    c1.grade_level,
    c1.section,
    'Grade ' || (c1.grade_level + 1) || '-' || c1.section,
    c1.grade_level + 1,
    c1.section,
    EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
  FROM classes c1
  WHERE c1.school_id = p_school_id
    AND c1.grade_level < 12
  ON CONFLICT (school_id, from_class_id, academic_year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Add column to profiles for class_id if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create index on profiles.class_id for performance
CREATE INDEX IF NOT EXISTS idx_profiles_class_id 
  ON profiles(class_id);

-- Grant necessary permissions
GRANT ALL ON promotion_mappings TO authenticated;
GRANT ALL ON academic_years TO authenticated;
GRANT ALL ON student_promotions TO authenticated;
GRANT EXECUTE ON FUNCTION generate_sample_classes TO authenticated;
GRANT EXECUTE ON FUNCTION auto_generate_promotion_mappings TO authenticated;
