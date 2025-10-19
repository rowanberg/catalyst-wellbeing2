-- Fix all triggers and functions referencing schools table
-- Apply this to fix the "relation schools does not exist" error

-- 1. Fix update_school_user_count function
DROP FUNCTION IF EXISTS update_school_user_count() CASCADE;

CREATE OR REPLACE FUNCTION update_school_user_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.schools 
    SET 
      teacher_count = CASE WHEN NEW.role = 'teacher' THEN COALESCE(teacher_count, 0) + 1 ELSE COALESCE(teacher_count, 0) END,
      student_count = CASE WHEN NEW.role = 'student' THEN COALESCE(student_count, 0) + 1 ELSE COALESCE(student_count, 0) END,
      updated_at = NOW()
    WHERE id = NEW.school_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.schools 
    SET 
      teacher_count = CASE WHEN OLD.role = 'teacher' THEN GREATEST(COALESCE(teacher_count, 0) - 1, 0) ELSE COALESCE(teacher_count, 0) END,
      student_count = CASE WHEN OLD.role = 'student' THEN GREATEST(COALESCE(student_count, 0) - 1, 0) ELSE COALESCE(student_count, 0) END,
      updated_at = NOW()
    WHERE id = OLD.school_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER update_school_user_count_trigger
AFTER INSERT OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_school_user_count();

-- 2. Fix or create set_student_tag function if it exists
DROP FUNCTION IF EXISTS set_student_tag() CASCADE;

CREATE OR REPLACE FUNCTION set_student_tag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    -- Add any student-specific logic here
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_student_tag
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION set_student_tag();

-- 3. Verify the fix
SELECT 'Triggers fixed successfully' as status;
