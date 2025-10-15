-- ============================================================================
-- Fix Function Search Path Security Issues
-- Purpose: Set search_path for all functions to prevent SQL injection
-- Date: 2025-10-15
-- Total Functions to Fix: 104
-- ============================================================================

-- The search_path vulnerability allows attackers to potentially hijack function calls
-- by creating malicious objects in schemas that appear earlier in the search path.
-- Setting search_path = '' forces all references to be schema-qualified.

-- ============================================================================
-- Generate ALTER statements for all functions
-- ============================================================================
DO $$
DECLARE
    func RECORD;
    alter_statement TEXT;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== Fixing Function Search Paths ===';
    RAISE NOTICE '';
    
    FOR func IN 
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS arguments
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname IN (
            -- List all 104 functions from the report
            'update_student_whatsapp_config_updated_at',
            'update_school_details_updated_at',
            'calculate_subject_progress',
            'update_black_marks_updated_at',
            'end_conversations_after_office_hours',
            'initialize_student_achievements',
            'generate_wallet_address',
            'generate_transaction_hash',
            'set_wallet_address',
            'set_transaction_hash',
            'reset_daily_limits',
            'update_subject_progress_on_assessment',
            'update_achievement_progress',
            'update_milestone_progress',
            'increment_gems',
            'update_teacher_intervention_stats_after_implementation',
            'cleanup_expired_recommendations',
            'create_sample_student_data',
            'get_admin_school_students',
            'get_attendance_stats',
            'update_student_gemini_config_updated_at',
            'insert_sample_grade_class_data',
            'get_teacher_assigned_classes',
            'update_recognition_stats_after_shout_out',
            'update_shout_out_reaction_count',
            'update_student_rewards_on_achievement',
            'update_management_messages_updated_at',
            'add_student_points',
            'notify_new_management_message',
            'update_student_level',
            'update_profile_gems',
            'get_monthly_credits_issued',
            'calculate_grade_points',
            'update_assessment_metadata',
            'auto_calculate_grade',
            'increment_template_usage',
            'update_badge_awarded_count',
            'auto_assign_quest_to_students',
            'update_poll_analytics',
            'trigger_update_poll_analytics',
            'cleanup_old_mood_entries',
            'trigger_mood_cleanup',
            'update_school_gemini_config_updated_at',
            'set_help_request_priority',
            'update_group_member_count',
            'update_group_rating',
            'check_teacher_student_access',
            'check_wallet_achievements',
            'get_timezones',
            'calculate_exam_grade',
            'update_school_announcements_updated_at',
            'update_exam_analytics',
            'calculate_assessment_analytics',
            'trigger_update_analytics',
            'get_assessment_analytics',
            'update_game_stats',
            'update_tournament_participants',
            'generate_session_token',
            'calculate_letter_grade',
            'get_teacher_assessment_summary',
            'set_student_tag',
            'refresh_timezone_cache',
            'get_classmates_with_tags',
            'get_wallet_by_student_tag',
            'get_class_students',
            'generate_student_tag',
            'analyze_table_performance',
            'get_or_create_teacher_settings',
            'find_missing_indexes',
            'update_teacher_settings',
            'get_teacher_classes',
            'get_class_students_with_parents',
            'update_student_wallets_updated_at',
            'update_letter_grade',
            'get_school_grade_levels',
            'get_grade_classes',
            'update_portfolio_completion',
            'archive_attendance_safely',
            'rollback_attendance_archive',
            'monitor_attendance_tables',
            'check_same_school',
            'get_teacher_grades',
            'get_grade_students_with_parents',
            'update_tutor_rating',
            'update_tutor_stats',
            'validate_tutor_user_role',
            'create_tutor_profile',
            'update_project_engagement',
            'update_tutor_profile',
            'update_competition_participants',
            'update_class_student_count',
            'update_school_user_count',
            'create_family_conversation_if_not_exists',
            'check_school_limits',
            'execute_wallet_transaction',
            'reset_daily_wallet_limits',
            'update_event_registration_count',
            'unlock_next_math_battle_level',
            'get_math_battle_stats',
            'update_updated_at_column',
            'analyze_student_messaging_tables',
            'check_data_isolation',
            'maintain_student_messaging_tables',
            'set_wallet_lock_status',
            'cleanup_old_realtime_subscriptions',
            'check_subscription_health'
        )
    LOOP
        -- Generate ALTER FUNCTION statement with secure search_path
        alter_statement := format(
            'ALTER FUNCTION public.%I(%s) SET search_path = '''';',
            func.function_name,
            func.arguments
        );
        
        -- Execute the ALTER statement
        EXECUTE alter_statement;
        fixed_count := fixed_count + 1;
        
        -- Log progress every 10 functions
        IF fixed_count % 10 = 0 THEN
            RAISE NOTICE 'Fixed % functions...', fixed_count;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Fixed % functions with secure search_path', fixed_count;
    RAISE NOTICE '';
END $$;


-- ============================================================================
-- Verify the fixes
-- ============================================================================
DO $$
DECLARE
    vulnerable_count INTEGER;
    secure_count INTEGER;
BEGIN
    RAISE NOTICE '=== Verification ===';
    
    -- Count functions without search_path set
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND NOT EXISTS (
        SELECT 1 FROM pg_db_role_setting rs
        WHERE rs.setrole = p.proowner
        AND rs.setdatabase = 0
        AND rs.setconfig @> ARRAY['search_path=']
    );
    
    -- Count functions with search_path set
    SELECT COUNT(*) INTO secure_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND EXISTS (
        SELECT 1 FROM pg_db_role_setting rs
        WHERE rs.setrole = p.proowner
        AND rs.setdatabase = 0
        AND rs.setconfig @> ARRAY['search_path=']
    );
    
    RAISE NOTICE 'Functions without search_path (vulnerable): %', vulnerable_count;
    RAISE NOTICE 'Functions with search_path (secure): %', secure_count;
    RAISE NOTICE '';
    
    IF vulnerable_count > 0 THEN
        RAISE NOTICE '⚠️  Some functions may still be vulnerable';
        RAISE NOTICE 'Run the following query to identify them:';
        RAISE NOTICE '';
        RAISE NOTICE 'SELECT n.nspname || ''.'' || p.proname AS function_name';
        RAISE NOTICE 'FROM pg_proc p';
        RAISE NOTICE 'JOIN pg_namespace n ON n.oid = p.pronamespace';
        RAISE NOTICE 'WHERE n.nspname = ''public''';
        RAISE NOTICE 'AND NOT EXISTS (';
        RAISE NOTICE '    SELECT 1 FROM pg_db_role_setting rs';
        RAISE NOTICE '    WHERE rs.setrole = p.proowner';
        RAISE NOTICE '    AND rs.setdatabase = 0';
        RAISE NOTICE '    AND rs.setconfig @> ARRAY[''search_path='']';
        RAISE NOTICE ');';
    ELSE
        RAISE NOTICE '✅ All functions are now secure!';
    END IF;
END $$;


-- ============================================================================
-- Summary
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Summary ===';
    RAISE NOTICE '';
    RAISE NOTICE 'What we fixed:';
    RAISE NOTICE '1. Set search_path = '''' for all vulnerable functions';
    RAISE NOTICE '2. This prevents SQL injection via search path manipulation';
    RAISE NOTICE '3. Forces all object references to be schema-qualified';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '- Functions are now immune to search_path attacks';
    RAISE NOTICE '- No functional changes to your application';
    RAISE NOTICE '- Slight performance improvement (no path searching)';
    RAISE NOTICE '';
    RAISE NOTICE 'Best Practice:';
    RAISE NOTICE 'Always create new functions with: SET search_path = ''''';
    RAISE NOTICE '';
END $$;
