-- Seed Script: Insert Universal Welcome Post for ALL Schools
-- Run this after migration to create welcome posts for all existing schools
-- Also run this periodically to create welcome posts for newly added schools

-- This script will:
-- 1. Loop through all schools in the database
-- 2. Check if they already have a welcome post
-- 3. Create one if missing (requires an admin profile for that school)


DO $$
DECLARE
    school_record RECORD;
    v_admin_profile_id UUID;
    v_posts_created INTEGER := 0;
    v_posts_skipped INTEGER := 0;
    v_admins_missing INTEGER := 0;
BEGIN
    RAISE NOTICE '=========================================';    
    RAISE NOTICE 'Processing all schools...';
    RAISE NOTICE '=========================================';    
    RAISE NOTICE '';

    FOR school_record IN 
        SELECT id, name FROM schools ORDER BY name
    LOOP
        -- Check if welcome post already exists
        IF EXISTS(
            SELECT 1 FROM community_posts 
            WHERE school_id = school_record.id 
            AND is_school_welcome_post = true
        ) THEN
            RAISE NOTICE '[SKIP] % - Welcome post already exists', school_record.name;
            v_posts_skipped := v_posts_skipped + 1;
            CONTINUE;
        END IF;

        -- Find admin for this school
        SELECT id INTO v_admin_profile_id
        FROM profiles
        WHERE school_id = school_record.id
        AND role = 'admin'
        LIMIT 1;

        IF v_admin_profile_id IS NULL THEN
            RAISE WARNING '[ERROR] % - No admin profile found (skipping)', school_record.name;
            v_admins_missing := v_admins_missing + 1;
            CONTINUE;
        END IF;

        -- Create the welcome post
        INSERT INTO community_posts (
            teacher_id, 
            school_id, 
            class_id, 
            title, 
            content,
            media_urls, 
            post_type, 
            visibility, 
            is_pinned,
            is_school_welcome_post, 
            created_at
        ) VALUES (
            v_admin_profile_id,
            school_record.id,
            NULL,
            'Welcome to ' || school_record.name,
            E'Welcome to Catalyst – your connection to ' || school_record.name || E'.\n\nStay updated with classroom highlights, achievements, and important announcements. Teachers share photos, videos, and updates about your child''s learning journey.\n\nReact with emojis to show your support. We''re glad you''re here!',
            '[]'::jsonb,
            'announcement',
            'all_parents',
            true,
            true,
            NOW()
        );
        
        RAISE NOTICE '[CREATED] % - Welcome post added successfully', school_record.name;
        v_posts_created := v_posts_created + 1;
    END LOOP;

    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '  Posts created: %', v_posts_created;
    RAISE NOTICE '  Posts skipped (already exist): %', v_posts_skipped;
    RAISE NOTICE '  Schools without admin (skipped): %', v_admins_missing;
    RAISE NOTICE '=========================================';
END $$;


-- ALTERNATIVE: Create welcome post for a SINGLE school
-- Uncomment and modify if you only want to create for one specific school
/*
DO $$
DECLARE
    v_school_id UUID := 'YOUR_SCHOOL_ID'; -- REPLACE WITH ACTUAL SCHOOL ID
    v_admin_profile_id UUID;
    v_school_name TEXT;
BEGIN
    -- Check if welcome post already exists
    IF EXISTS(
        SELECT 1 FROM community_posts 
        WHERE school_id = v_school_id 
        AND is_school_welcome_post = true
    ) THEN
        RAISE NOTICE 'Welcome post already exists for this school';
        RETURN;
    END IF;

    -- Find admin
    SELECT id INTO v_admin_profile_id
    FROM profiles
    WHERE school_id = v_school_id
    AND role = 'admin'
    LIMIT 1;

    IF v_admin_profile_id IS NULL THEN
        RAISE EXCEPTION 'No admin profile found for school';
    END IF;

    -- Get school name
    SELECT name INTO v_school_name FROM schools WHERE id = v_school_id;

    -- Create welcome post
    INSERT INTO community_posts (
        teacher_id, school_id, class_id, title, content,
        media_urls, post_type, visibility, is_pinned,
        is_school_welcome_post, created_at
    ) VALUES (
        v_admin_profile_id,
        v_school_id,
        NULL,
        'Welcome to ' || v_school_name,
        E'Welcome to Catalyst – your connection to ' || v_school_name || E'.\n\nStay updated with classroom highlights, achievements, and important announcements. Teachers share photos, videos, and updates about your child''s learning journey.\n\nReact with emojis to show your support. We''re glad you''re here!',
        '[]'::jsonb,
        'announcement',
        'all_parents',
        true,
        true,
        NOW()
    );

    RAISE NOTICE 'Welcome post created successfully';
END $$;
*/
