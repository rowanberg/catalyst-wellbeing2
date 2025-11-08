-- Create class_students table for linking students to classes
-- Run this if the table doesn't exist

-- Create the table
CREATE TABLE IF NOT EXISTS class_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a student can only be in a class once
  UNIQUE(student_id, class_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_active ON class_students(is_active) WHERE is_active = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_class_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_class_students_updated_at ON class_students;
CREATE TRIGGER trigger_update_class_students_updated_at
  BEFORE UPDATE ON class_students
  FOR EACH ROW
  EXECUTE FUNCTION update_class_students_updated_at();

-- Verify table was created
SELECT 
  'Table created successfully!' as message,
  COUNT(*) as row_count
FROM class_students;

COMMENT ON TABLE class_students IS 'Links students to their classes';
COMMENT ON COLUMN class_students.student_id IS 'Reference to profiles.id where role=student';
COMMENT ON COLUMN class_students.class_id IS 'Reference to classes.id';
COMMENT ON COLUMN class_students.is_active IS 'Whether the student is currently enrolled';
