-- Migration: Add exam type and due_date to assessments table
-- Created: 2025-10-02
-- Description: Adds 'exam' to assessment types and adds due_date column

-- Step 1: Add due_date column to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Step 2: Add comment to due_date column
COMMENT ON COLUMN assessments.due_date IS 'The due date/deadline for the assessment';

-- Step 3: Update the type check constraint to include 'exam'
-- First, drop the existing constraint if it exists
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_type_check;

-- Add the new constraint with 'exam' included
ALTER TABLE assessments 
ADD CONSTRAINT assessments_type_check 
CHECK (type IN ('quiz', 'test', 'assignment', 'project', 'exam'));

-- Step 4: Create index on due_date for performance
CREATE INDEX IF NOT EXISTS idx_assessments_due_date 
ON assessments(due_date);

-- Step 5: Create index on type for performance
CREATE INDEX IF NOT EXISTS idx_assessments_type 
ON assessments(type);

-- Step 6: Add class_id column if it doesn't exist (for class-specific assessments)
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS class_id UUID;

-- Step 7: Add foreign key constraint for class_id
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_class_id 
FOREIGN KEY (class_id) 
REFERENCES classes(id) 
ON DELETE SET NULL;

-- Step 8: Create index on class_id for performance
CREATE INDEX IF NOT EXISTS idx_assessments_class_id 
ON assessments(class_id);

-- Step 9: Add comment to class_id column
COMMENT ON COLUMN assessments.class_id IS 'The class this assessment is assigned to';

-- Verification query to check the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'assessments' 
-- AND column_name IN ('due_date', 'class_id', 'type');
