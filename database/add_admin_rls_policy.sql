-- Add RLS policy for admins to view student class assignments
-- This allows admins to see all student-class assignments for their school

CREATE POLICY "Admins can view all student class assignments"
ON student_class_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
    AND profiles.school_id = student_class_assignments.school_id
  )
);

-- Add RLS policy for admins to view all profiles in their school
-- This allows admins to see student, teacher, and parent profiles

CREATE POLICY "Admins can view all profiles in their school"
ON profiles
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Verify the policies were created
SELECT policyname, tablename FROM pg_policies 
WHERE (tablename = 'student_class_assignments' AND policyname = 'Admins can view all student class assignments')
   OR (tablename = 'profiles' AND policyname = 'Admins can view all profiles in their school');
