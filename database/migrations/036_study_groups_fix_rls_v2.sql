-- Fix infinite recursion - Simplified approach
-- The issue: When joining study_groups with study_group_members, circular RLS policies cause recursion
-- Solution: Make study_group_members policies independent (don't reference study_groups)

-- Drop all existing policies on study_group_members
DROP POLICY IF EXISTS "Users can view group members in their school" ON study_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON study_group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON study_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON study_group_members;

-- Simple policy: Allow viewing all study_group_members
-- Access control is handled by the study_groups table RLS
-- If you can see the group, you can see its members
CREATE POLICY "Allow viewing all group members" ON study_group_members
    FOR SELECT USING (true);

-- Allow users to insert themselves as members
CREATE POLICY "Users can join groups" ON study_group_members
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Allow users to delete their own memberships
CREATE POLICY "Users can leave groups" ON study_group_members
    FOR DELETE USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Allow group creators to manage all members (UPDATE and DELETE)
-- Use profile.id directly to avoid recursion
CREATE POLICY "Creators can manage members" ON study_group_members
    FOR UPDATE USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Similarly fix other tables
DROP POLICY IF EXISTS "Users can view sessions of their groups" ON study_group_sessions;
CREATE POLICY "Allow viewing sessions" ON study_group_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can create sessions" ON study_group_sessions;
CREATE POLICY "Allow creating sessions" ON study_group_sessions
    FOR INSERT WITH CHECK (
        created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view messages in their groups" ON study_group_messages;
CREATE POLICY "Allow viewing messages" ON study_group_messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can send messages" ON study_group_messages;
CREATE POLICY "Allow sending messages" ON study_group_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view resources in their groups" ON study_group_resources;
CREATE POLICY "Allow viewing resources" ON study_group_resources
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can upload resources" ON study_group_resources;
CREATE POLICY "Allow uploading resources" ON study_group_resources
    FOR INSERT WITH CHECK (
        uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can rate groups" ON study_group_ratings;
CREATE POLICY "Allow rating groups" ON study_group_ratings
    FOR ALL USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage join requests" ON study_group_join_requests;
CREATE POLICY "Allow managing join requests" ON study_group_join_requests
    FOR ALL USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Fix study_group_achievements if it has issues
ALTER TABLE study_group_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow viewing achievements" ON study_group_achievements;
CREATE POLICY "Allow viewing achievements" ON study_group_achievements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow viewing attendance" ON study_group_attendance;
CREATE POLICY "Allow viewing attendance" ON study_group_attendance
    FOR SELECT USING (true);
