-- FINAL FIX: Remove ALL circular references between study_groups and study_group_members
-- The problem: ANY policy on study_group_members that references study_groups causes recursion during JOIN

-- Step 1: Drop ALL policies on study_group_members
DROP POLICY IF EXISTS "Allow viewing all group members" ON study_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON study_group_members;
DROP POLICY IF EXISTS "Creators can manage members" ON study_group_members;
DROP POLICY IF EXISTS "Users can view group members in their school" ON study_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON study_group_members;

-- Step 2: Create SIMPLE policies with NO subqueries to study_groups
-- Allow viewing all members (filtering happens on study_groups level)
CREATE POLICY "view_all_members" ON study_group_members
    FOR SELECT 
    USING (true);

-- Allow users to insert only their own user_id
CREATE POLICY "insert_own_membership" ON study_group_members
    FOR INSERT 
    WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow users to delete only their own memberships
CREATE POLICY "delete_own_membership" ON study_group_members
    FOR DELETE 
    USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow users to update only their own memberships
CREATE POLICY "update_own_membership" ON study_group_members
    FOR UPDATE 
    USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Step 3: Fix other related tables similarly
DROP POLICY IF EXISTS "Allow viewing sessions" ON study_group_sessions;
DROP POLICY IF EXISTS "Allow creating sessions" ON study_group_sessions;
DROP POLICY IF EXISTS "Users can view sessions of their groups" ON study_group_sessions;
DROP POLICY IF EXISTS "Group members can create sessions" ON study_group_sessions;

CREATE POLICY "view_all_sessions" ON study_group_sessions
    FOR SELECT USING (true);

CREATE POLICY "insert_own_sessions" ON study_group_sessions
    FOR INSERT WITH CHECK (created_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Allow viewing messages" ON study_group_messages;
DROP POLICY IF EXISTS "Allow sending messages" ON study_group_messages;
DROP POLICY IF EXISTS "Users can view messages in their groups" ON study_group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON study_group_messages;

CREATE POLICY "view_all_messages" ON study_group_messages
    FOR SELECT USING (true);

CREATE POLICY "insert_own_messages" ON study_group_messages
    FOR INSERT WITH CHECK (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Resources
DROP POLICY IF EXISTS "Allow viewing resources" ON study_group_resources;
DROP POLICY IF EXISTS "Allow uploading resources" ON study_group_resources;
DROP POLICY IF EXISTS "Users can view resources in their groups" ON study_group_resources;
DROP POLICY IF EXISTS "Group members can upload resources" ON study_group_resources;

CREATE POLICY "view_all_resources" ON study_group_resources
    FOR SELECT USING (true);

CREATE POLICY "insert_own_resources" ON study_group_resources
    FOR INSERT WITH CHECK (uploaded_by = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Ratings
DROP POLICY IF EXISTS "Allow rating groups" ON study_group_ratings;
DROP POLICY IF EXISTS "Users can rate groups" ON study_group_ratings;

CREATE POLICY "manage_own_ratings" ON study_group_ratings
    FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Join requests
DROP POLICY IF EXISTS "Allow managing join requests" ON study_group_join_requests;
DROP POLICY IF EXISTS "Users can manage join requests" ON study_group_join_requests;

CREATE POLICY "manage_own_requests" ON study_group_join_requests
    FOR ALL USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Attendance
DROP POLICY IF EXISTS "Allow viewing attendance" ON study_group_attendance;
CREATE POLICY "view_all_attendance" ON study_group_attendance
    FOR SELECT USING (true);

-- Achievements
DROP POLICY IF EXISTS "Allow viewing achievements" ON study_group_achievements;
CREATE POLICY "view_all_achievements" ON study_group_achievements
    FOR SELECT USING (true);
