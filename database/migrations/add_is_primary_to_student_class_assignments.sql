-- Add is_primary column to student_class_assignments table
-- This allows marking one class as the primary class for each student

ALTER TABLE student_class_assignments 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_is_primary 
ON student_class_assignments(student_id, is_primary) WHERE is_primary = true;

-- Add constraint to ensure only one primary class per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_class_assignments_one_primary 
ON student_class_assignments(student_id) 
WHERE is_primary = true;

-- Update comment
COMMENT ON COLUMN student_class_assignments.is_primary IS 'Indicates the primary/main class for the student, displayed on attendance page';
