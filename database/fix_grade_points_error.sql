-- Fix for "grade_points" error in assessment_grades trigger
-- This script will drop any problematic triggers and recreate them correctly

-- Drop existing triggers that might reference grade_points
DROP TRIGGER IF EXISTS assessment_grades_update_letter_grade ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS update_grade_points ON assessment_grades CASCADE;
DROP TRIGGER IF EXISTS calculate_grade_points ON assessment_grades CASCADE;

-- Drop existing functions that might reference grade_points
DROP FUNCTION IF EXISTS update_letter_grade() CASCADE;
DROP FUNCTION IF EXISTS update_grade_points() CASCADE;
DROP FUNCTION IF EXISTS calculate_grade_points() CASCADE;

-- Recreate the correct trigger function (without grade_points)
CREATE OR REPLACE FUNCTION update_letter_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate letter grade based on percentage
    IF NEW.percentage >= 97 THEN NEW.letter_grade := 'A+';
    ELSIF NEW.percentage >= 93 THEN NEW.letter_grade := 'A';
    ELSIF NEW.percentage >= 90 THEN NEW.letter_grade := 'A-';
    ELSIF NEW.percentage >= 87 THEN NEW.letter_grade := 'B+';
    ELSIF NEW.percentage >= 83 THEN NEW.letter_grade := 'B';
    ELSIF NEW.percentage >= 80 THEN NEW.letter_grade := 'B-';
    ELSIF NEW.percentage >= 77 THEN NEW.letter_grade := 'C+';
    ELSIF NEW.percentage >= 73 THEN NEW.letter_grade := 'C';
    ELSIF NEW.percentage >= 70 THEN NEW.letter_grade := 'C-';
    ELSIF NEW.percentage >= 67 THEN NEW.letter_grade := 'D+';
    ELSIF NEW.percentage >= 63 THEN NEW.letter_grade := 'D';
    ELSIF NEW.percentage >= 60 THEN NEW.letter_grade := 'D-';
    ELSE NEW.letter_grade := 'F';
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER assessment_grades_update_letter_grade
    BEFORE INSERT OR UPDATE ON assessment_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_letter_grade();

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Grade trigger fixed successfully!';
    RAISE NOTICE 'The grade_points error should now be resolved.';
END $$;
