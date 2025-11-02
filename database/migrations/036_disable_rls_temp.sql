-- TEMPORARY: Disable RLS on study_group_members to test
-- This will help us determine if RLS is the issue

ALTER TABLE study_group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_attendance DISABLE ROW LEVEL SECURITY;
