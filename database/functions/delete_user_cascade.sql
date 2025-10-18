-- Function to safely delete a user profile and all related data
-- This bypasses trigger issues by using proper schema qualification
-- Only deletes from tables that exist, gracefully handles missing tables

CREATE OR REPLACE FUNCTION public.delete_user_cascade(target_profile_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_user_id UUID;
    deleted_count INTEGER;
    total_deleted INTEGER := 0;
BEGIN
    -- Get the auth user_id for this profile
    SELECT user_id INTO target_user_id 
    FROM public.profiles 
    WHERE id = target_profile_id;
    
    -- Delete from parent_children if table exists
    BEGIN
        DELETE FROM public.parent_children 
        WHERE parent_id = target_profile_id OR child_id = target_profile_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        RAISE NOTICE 'Deleted % parent_children records', deleted_count;
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Table parent_children does not exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from parent_children: %', SQLERRM;
    END;
    
    -- Delete from attendance if table exists
    BEGIN
        DELETE FROM public.attendance WHERE student_id = target_profile_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        RAISE NOTICE 'Deleted % attendance records', deleted_count;
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Table attendance does not exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from attendance: %', SQLERRM;
    END;
    
    -- Delete from notifications if table exists
    BEGIN
        DELETE FROM public.notifications WHERE user_id = target_profile_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        RAISE NOTICE 'Deleted % notifications', deleted_count;
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Table notifications does not exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from notifications: %', SQLERRM;
    END;
    
    -- Delete from messages if table exists
    BEGIN
        DELETE FROM public.messages 
        WHERE sender_id = target_profile_id OR recipient_id = target_profile_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        RAISE NOTICE 'Deleted % messages', deleted_count;
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Table messages does not exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from messages: %', SQLERRM;
    END;
    
    -- Delete from community_posts if table exists (uses teacher_id column)
    BEGIN
        DELETE FROM public.community_posts WHERE teacher_id = target_profile_id;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        total_deleted := total_deleted + deleted_count;
        RAISE NOTICE 'Deleted % community_posts', deleted_count;
    EXCEPTION 
        WHEN undefined_table THEN
            RAISE NOTICE 'Table community_posts does not exist, skipping';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error deleting from community_posts: %', SQLERRM;
    END;
    
    -- Finally, delete the profile itself
    DELETE FROM public.profiles WHERE id = target_profile_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    IF deleted_count = 0 THEN
        RETURN jsonb_build_object(
            'error', true,
            'message', 'Profile not found or already deleted',
            'profile_id', target_profile_id
        );
    END IF;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'profile_deleted', true,
        'total_related_records_deleted', total_deleted,
        'profile_id', target_profile_id,
        'user_id', target_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'error', true,
        'message', SQLERRM,
        'detail', SQLSTATE,
        'profile_id', target_profile_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_cascade(UUID) TO service_role;

-- Example usage:
-- SELECT public.delete_user_cascade('profile-uuid-here');
