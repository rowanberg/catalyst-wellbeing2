-- Fix assessment_grades to work without assessments table dependency
-- This removes the problematic foreign key and triggers

-- 1. Drop the foreign key constraint that requires assessments table
ALTER TABLE assessment_grades 
DROP CONSTRAINT IF EXISTS assessment_grades_assessment_id_fkey CASCADE;

-- 2. Drop triggers that might reference assessments table
DROP TRIGGER IF EXISTS trigger_update_assessment_metadata ON assessment_grades;
DROP TRIGGER IF EXISTS trigger_increment_template_usage ON assessment_grades;

-- 3. Keep the useful triggers
-- (assessment_grades_update_letter_grade, trigger_auto_calculate_grade, trigger_update_grades_timestamp should still work)

-- 4. Add a simple check to ensure assessment_id is not null
ALTER TABLE assessment_grades 
ADD CONSTRAINT assessment_id_not_null CHECK (assessment_id IS NOT NULL);

-- Note: assessment_id will still be stored, but won't require the assessments table to exist
-- This allows /teacher/update-results to work independently
