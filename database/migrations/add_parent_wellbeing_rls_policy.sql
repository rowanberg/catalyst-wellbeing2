-- Add RLS policy for parents to view their children's wellbeing analytics
-- This allows parents to access wellbeing data for students they have a verified relationship with

-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Parents view children wellbeing analytics" ON student_wellbeing_analytics_enhanced;

-- Parents can view wellbeing analytics for their children
CREATE POLICY "Parents view children wellbeing analytics" 
  ON student_wellbeing_analytics_enhanced
  FOR SELECT 
  USING (
    student_id IN (
      SELECT pcr.child_id 
      FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON student_wellbeing_analytics_enhanced TO authenticated;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'student_wellbeing_analytics_enhanced' 
AND policyname = 'Parents view children wellbeing analytics';
