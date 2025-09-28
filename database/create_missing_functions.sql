-- Create the missing database functions that are causing the errors

-- Function to get teacher's classes with student counts
CREATE OR REPLACE FUNCTION get_teacher_classes(teacher_uuid UUID)
RETURNS TABLE (
  class_id UUID,
  class_name VARCHAR,
  grade_level VARCHAR,
  subject VARCHAR,
  student_count BIGINT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.grade_level,
    c.subject,
    COUNT(p.id) as student_count,
    tc.is_primary_teacher
  FROM classes c
  JOIN teacher_classes tc ON c.id = tc.class_id
  LEFT JOIN profiles p ON c.id = p.class_id AND p.role = 'student'
  WHERE tc.teacher_id = teacher_uuid
  GROUP BY c.id, c.name, c.grade_level, c.subject, tc.is_primary_teacher
  ORDER BY c.grade_level, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get students in a class with parent information
CREATE OR REPLACE FUNCTION get_class_students_with_parents(class_uuid UUID)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  student_email VARCHAR,
  student_grade VARCHAR,
  xp_points INTEGER,
  level_number INTEGER,
  streak_days INTEGER,
  mood VARCHAR,
  wellbeing_status VARCHAR,
  parent_id UUID,
  parent_name VARCHAR,
  parent_email VARCHAR,
  parent_phone VARCHAR,
  relationship VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    CONCAT(s.first_name, ' ', s.last_name),
    s.email,
    s.grade_level,
    COALESCE(s.xp_points, 0),
    COALESCE(s.level, 1),
    COALESCE(s.streak_days, 0),
    COALESCE(s.mood, 'neutral'),
    COALESCE(s.wellbeing_status, 'thriving'),
    p.id,
    CONCAT(p.first_name, ' ', p.last_name),
    p.email,
    p.phone,
    pcr.relationship
  FROM profiles s
  LEFT JOIN parent_child_relationships pcr ON s.id = pcr.child_id
  LEFT JOIN profiles p ON pcr.parent_id = p.id AND p.role = 'parent'
  WHERE s.class_id = class_uuid AND s.role = 'student'
  ORDER BY s.first_name, s.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
