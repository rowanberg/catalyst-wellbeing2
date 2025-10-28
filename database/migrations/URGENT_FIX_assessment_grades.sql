-- URGENT FIX: Remove all dependencies on non-existent assessments table
-- Run this in Supabase SQL Editor NOW

-- Step 1: Drop all triggers that reference assessments table
DROP TRIGGER IF EXISTS trigger_update_assessment_metadata ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS trigger_increment_template_usage ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS assessment_grades_update_letter_grade ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_calculate_grade ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS trigger_update_grades_timestamp ON assessment_grades CASCADE;

-- Step 2: Drop the foreign key constraint
ALTER TABLE assessment_grades DROP CONSTRAINT IF EXISTS assessment_grades_assessment_id_fkey CASCADE;

-- Step 3: Drop functions that might query assessments table
DROP FUNCTION IF EXISTS update_assessment_metadata() CASCADE;
DROP FUNCTION IF EXISTS increment_template_usage() CASCADE;

-- Step 4: Recreate only the essential triggers

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_assessment_grades_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grades_timestamp
BEFORE UPDATE ON assessment_grades
FOR EACH ROW
EXECUTE FUNCTION update_assessment_grades_timestamp();

-- Auto-calculate percentage from score
CREATE OR REPLACE FUNCTION auto_calculate_percentage()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate percentage if score is provided but percentage is not
  IF NEW.score IS NOT NULL AND (NEW.percentage IS NULL OR NEW.percentage = 0) THEN
    -- Assume max score is 100 if not provided elsewhere
    NEW.percentage = (NEW.score / 100.0) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_grade
BEFORE INSERT OR UPDATE ON assessment_grades
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_percentage();

-- Auto-calculate letter grade from percentage
CREATE OR REPLACE FUNCTION auto_calculate_letter_grade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.percentage >= 97 THEN NEW.letter_grade = 'A+';
  ELSIF NEW.percentage >= 93 THEN NEW.letter_grade = 'A';
  ELSIF NEW.percentage >= 90 THEN NEW.letter_grade = 'A-';
  ELSIF NEW.percentage >= 87 THEN NEW.letter_grade = 'B+';
  ELSIF NEW.percentage >= 83 THEN NEW.letter_grade = 'B';
  ELSIF NEW.percentage >= 80 THEN NEW.letter_grade = 'B-';
  ELSIF NEW.percentage >= 77 THEN NEW.letter_grade = 'C+';
  ELSIF NEW.percentage >= 73 THEN NEW.letter_grade = 'C';
  ELSIF NEW.percentage >= 70 THEN NEW.letter_grade = 'C-';
  ELSIF NEW.percentage >= 67 THEN NEW.letter_grade = 'D+';
  ELSIF NEW.percentage >= 63 THEN NEW.letter_grade = 'D';
  ELSIF NEW.percentage >= 60 THEN NEW.letter_grade = 'D-';
  ELSE NEW.letter_grade = 'F';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_grades_update_letter_grade
BEFORE INSERT OR UPDATE ON assessment_grades
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_letter_grade();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: assessment_grades table fixed! You can now submit grades.';
END $$;
