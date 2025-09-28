-- Add status column to school_details table for better setup tracking
-- This will help control the setup banner display more precisely

-- Add the status column
ALTER TABLE school_details 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'not_completed';

-- Add a check constraint to ensure valid status values
ALTER TABLE school_details 
ADD CONSTRAINT check_school_details_status 
CHECK (status IN ('not_completed', 'in_progress', 'completed'));

-- Update existing records based on setup_completed field
UPDATE school_details 
SET status = CASE 
    WHEN setup_completed = true THEN 'completed'
    ELSE 'not_completed'
END;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_school_details_status ON school_details(status);

-- Update the comment to reflect the new column
COMMENT ON COLUMN school_details.status IS 'Setup status: not_completed, in_progress, completed';

-- Show the updated table structure
\d school_details;
