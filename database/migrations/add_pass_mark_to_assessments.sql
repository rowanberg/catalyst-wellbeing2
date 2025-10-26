-- Migration: Add pass_mark field to assessments table
-- Description: Adds a pass_mark column to store the minimum score required to pass an assessment
-- Date: 2024-10-26

-- Add pass_mark column to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS pass_mark INTEGER DEFAULT 50;

-- Add comment to explain the column
COMMENT ON COLUMN assessments.pass_mark IS 'Minimum score required to pass the assessment';

-- Add check constraint to ensure pass_mark is not negative and not greater than max_score
ALTER TABLE assessments
ADD CONSTRAINT check_pass_mark_valid 
CHECK (pass_mark >= 0 AND pass_mark <= max_score);

-- Update existing assessments to have a default pass_mark of 50% of max_score
UPDATE assessments 
SET pass_mark = FLOOR(max_score * 0.5)
WHERE pass_mark IS NULL;

-- Make pass_mark NOT NULL after setting defaults
ALTER TABLE assessments 
ALTER COLUMN pass_mark SET NOT NULL;

-- Create index for performance when querying by pass status
CREATE INDEX IF NOT EXISTS idx_assessments_pass_mark 
ON assessments(pass_mark);
