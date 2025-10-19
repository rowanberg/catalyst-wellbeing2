-- Add missing columns to schools table

ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS teacher_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS student_count INTEGER DEFAULT 0;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'schools' 
AND column_name IN ('teacher_count', 'student_count');
