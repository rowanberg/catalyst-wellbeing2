-- Fix the update_school_user_count function that's causing the error

-- First, check the current function definition
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_school_user_count';

-- Drop and recreate the function with proper schema reference
DROP FUNCTION IF EXISTS update_school_user_count() CASCADE;

CREATE OR REPLACE FUNCTION update_school_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update count on insert
    UPDATE public.schools 
    SET 
      teacher_count = CASE 
        WHEN NEW.role = 'teacher' THEN COALESCE(teacher_count, 0) + 1 
        ELSE COALESCE(teacher_count, 0) 
      END,
      student_count = CASE 
        WHEN NEW.role = 'student' THEN COALESCE(student_count, 0) + 1 
        ELSE COALESCE(student_count, 0) 
      END
    WHERE id = NEW.school_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update count on delete
    UPDATE public.schools 
    SET 
      teacher_count = CASE 
        WHEN OLD.role = 'teacher' THEN GREATEST(COALESCE(teacher_count, 0) - 1, 0) 
        ELSE COALESCE(teacher_count, 0) 
      END,
      student_count = CASE 
        WHEN OLD.role = 'student' THEN GREATEST(COALESCE(student_count, 0) - 1, 0) 
        ELSE COALESCE(student_count, 0) 
      END
    WHERE id = OLD.school_id;
    
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_school_user_count_trigger ON profiles;

CREATE TRIGGER update_school_user_count_trigger
AFTER INSERT OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_school_user_count();

-- Also check and fix set_student_tag function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'set_student_tag';
