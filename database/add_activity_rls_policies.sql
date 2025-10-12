-- Add RLS policies for activity tables used in wellbeing analytics

-- Policy for gratitude_entries
CREATE POLICY "Users can view gratitude in their school"
ON gratitude_entries
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Policy for kindness_counter
CREATE POLICY "Users can view kindness in their school"
ON kindness_counter
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Policy for courage_log
CREATE POLICY "Users can view courage in their school"
ON courage_log
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Policy for habit_tracker
CREATE POLICY "Users can view habits in their school"
ON habit_tracker
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Policy for mindfulness_sessions
CREATE POLICY "Users can view mindfulness in their school"
ON mindfulness_sessions
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM profiles
    WHERE school_id = public.get_user_school_id()
  )
);

-- Verify all policies were created
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'gratitude_entries', 
  'kindness_counter', 
  'courage_log', 
  'habit_tracker', 
  'mindfulness_sessions'
)
ORDER BY tablename, policyname;
