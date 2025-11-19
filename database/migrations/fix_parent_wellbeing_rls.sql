-- Fix: Add RLS policy for parents to view their children's wellbeing analytics
-- Run this in Supabase SQL Editor

-- First, check if the policy already exists
SELECT policyname FROM pg_policies 
WHERE tablename = 'student_wellbeing_analytics_enhanced' 
AND policyname = 'Parents view children wellbeing analytics';

-- Drop the policy if it exists, then create it (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Parents view children wellbeing analytics" ON student_wellbeing_analytics_enhanced;

-- Create the RLS policy for parents (without is_active column)
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

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'student_wellbeing_analytics_enhanced' 
AND policyname = 'Parents view children wellbeing analytics';

-- Also verify parent_child_relationships table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parent_child_relationships' 
ORDER BY ordinal_position;
