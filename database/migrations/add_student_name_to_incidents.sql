-- Add student_name_text column to incident_reports table
-- This allows storing manually entered student names when no profile is linked

ALTER TABLE public.incident_reports 
ADD COLUMN IF NOT EXISTS student_name_text TEXT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.incident_reports.student_name_text IS 
'Stores manually entered student name when no student profile is linked (students_involved is empty)';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_student_name_text 
ON public.incident_reports USING btree (student_name_text) 
WHERE student_name_text IS NOT NULL;
