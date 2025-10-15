-- Check RLS policies on tables used by parent dashboard API

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'student_class_assignments',
  'assessment_grades',
  'assessments',
  'attendance_records',
  'mood_tracking',
  'parent_child_relationships'
);

-- Check policies on these tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'student_class_assignments',
  'assessment_grades', 
  'assessments',
  'attendance_records',
  'mood_tracking',
  'parent_child_relationships'
)
ORDER BY tablename, policyname;

-- Test query as admin (should bypass RLS)
SELECT COUNT(*) as count FROM student_class_assignments 
WHERE student_id = '73135720-506c-409c-9dfe-949f272ea1d1';

SELECT COUNT(*) as count FROM assessment_grades 
WHERE student_id = '73135720-506c-409c-9dfe-949f272ea1d1';

SELECT COUNT(*) as count FROM attendance_records 
WHERE student_id = '73135720-506c-409c-9dfe-949f272ea1d1';
