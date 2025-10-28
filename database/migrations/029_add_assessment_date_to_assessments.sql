-- Add assessment_date column to assessments table
-- This will be used to display upcoming assessments in student dashboard

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS assessment_date TIMESTAMPTZ;

-- Create index for efficient querying of upcoming assessments
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date);

-- Add comment
COMMENT ON COLUMN assessments.assessment_date IS 'The scheduled date/time when the assessment will take place';
