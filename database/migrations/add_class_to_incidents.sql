-- Add class information to incident_reports table
-- Allows linking incidents to specific classes

ALTER TABLE public.incident_reports 
ADD COLUMN IF NOT EXISTS class_id UUID NULL,
ADD COLUMN IF NOT EXISTS class_name TEXT NULL;

-- Add foreign key constraint to classes table
ALTER TABLE public.incident_reports
ADD CONSTRAINT incident_reports_class_id_fkey 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN public.incident_reports.class_id IS 
'Links incident to a specific class (optional)';

COMMENT ON COLUMN public.incident_reports.class_name IS 
'Stores class name text when no class profile is linked';

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_incident_reports_class_id 
ON public.incident_reports USING btree (class_id) 
WHERE class_id IS NOT NULL;
