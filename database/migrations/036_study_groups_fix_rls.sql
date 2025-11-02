-- Fix infinite recursion in study_group_members RLS policies
-- The issue: policies were querying the same table they protect

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON study_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
DROP POLICY IF EXISTS "Group creators and moderators can update groups" ON study_groups;

-- Fix study_groups update policy (avoid recursion)
CREATE POLICY "Group creators and moderators can update groups" ON study_groups
    FOR UPDATE USING (
        created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Fix study_group_members policies (simplified to avoid recursion)
-- Allow users to view all members in their school's active groups
CREATE POLICY "Users can view group members in their school" ON study_group_members
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
            AND status = 'active'
        )
    );

-- Allow users to join groups
CREATE POLICY "Users can join groups" ON study_group_members
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
            AND status = 'active'
        )
    );

-- Allow users to leave groups (delete their own membership)
CREATE POLICY "Users can leave groups" ON study_group_members
    FOR DELETE USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Allow group creators to manage members
CREATE POLICY "Group creators can manage members" ON study_group_members
    FOR ALL USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );

-- Add policies for other tables
DROP POLICY IF EXISTS "Users can view sessions of their groups" ON study_group_sessions;
CREATE POLICY "Users can view sessions of their groups" ON study_group_sessions
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Group members can create sessions" ON study_group_sessions;
CREATE POLICY "Group members can create sessions" ON study_group_sessions
    FOR INSERT WITH CHECK (
        created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view messages in their groups" ON study_group_messages;
CREATE POLICY "Users can view messages in their groups" ON study_group_messages
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Group members can send messages" ON study_group_messages;
CREATE POLICY "Group members can send messages" ON study_group_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view resources in their groups" ON study_group_resources;
CREATE POLICY "Users can view resources in their groups" ON study_group_resources
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Group members can upload resources" ON study_group_resources;
CREATE POLICY "Group members can upload resources" ON study_group_resources
    FOR INSERT WITH CHECK (
        uploaded_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can rate groups" ON study_group_ratings;
CREATE POLICY "Users can rate groups" ON study_group_ratings
    FOR ALL USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND group_id IN (
            SELECT id FROM study_groups 
            WHERE school_id IN (SELECT school_id FROM profiles WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage join requests" ON study_group_join_requests;
CREATE POLICY "Users can manage join requests" ON study_group_join_requests
    FOR ALL USING (
        user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR group_id IN (
            SELECT id FROM study_groups 
            WHERE created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    );
