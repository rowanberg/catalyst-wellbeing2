-- Fix teacher grades function for grade-level based assignments
-- This ensures the function exists and works with the new schema

-- Function to get teacher's assigned grades with student counts
CREATE OR REPLACE FUNCTION get_teacher_grades(teacher_uuid UUID)
RETURNS TABLE (
  assignment_id UUID,
  grade_level VARCHAR,
  subject VARCHAR,
  student_count BIGINT,
  is_primary_teacher BOOLEAN,
  school_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tga.id,
    tga.grade_level,
    tga.subject,
    COUNT(p.id) as student_count,
    tga.is_primary_teacher,
    s.name as school_name
  FROM teacher_grade_assignments tga
  JOIN schools s ON tga.school_id = s.id
  LEFT JOIN profiles p ON p.school_id = tga.school_id 
    AND p.grade_level = tga.grade_level 
    AND p.role = 'student'
  WHERE tga.teacher_id = teacher_uuid
  GROUP BY tga.id, tga.grade_level, tga.subject, tga.is_primary_teacher, s.name
  ORDER BY tga.grade_level, tga.subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_teacher_grades(UUID) TO authenticated;
