-- ============================================================================
-- Add Parent Access RLS Policies
-- Purpose: Allow parents to access their children's data through parent_child_relationships
-- Date: 2025-10-15
-- ============================================================================

-- Parents need access to their children's data for the Parent Portal
-- This links through the parent_child_relationships table

-- ============================================================================
-- 1. Attendance (for dashboard attendance stats)
-- ============================================================================
CREATE POLICY "Parents can view their children's attendance" ON public.attendance
FOR SELECT TO authenticated
USING (
    student_id IN (
        SELECT pcr.child_id 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 2. Assessments (for grades and performance)
-- ============================================================================
CREATE POLICY "Parents can view their children's assessments" ON public.assessments
FOR SELECT TO authenticated
USING (
    class_id IN (
        SELECT sca.class_id 
        FROM public.student_class_assignments sca
        JOIN public.parent_child_relationships pcr ON pcr.child_id = sca.student_id
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
    OR id IN (
        SELECT ag.assessment_id 
        FROM public.assessment_grades ag
        JOIN public.parent_child_relationships pcr ON pcr.child_id = ag.student_id
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 3. Community Posts (for community feed)
-- ============================================================================
CREATE POLICY "Parents can view posts for their children's school" ON public.community_posts
FOR SELECT TO authenticated
USING (
    school_id IN (
        SELECT child_profile.school_id 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles parent_profile ON parent_profile.id = pcr.parent_id
        JOIN public.profiles child_profile ON child_profile.id = pcr.child_id
        WHERE parent_profile.user_id = auth.uid()
    )
);

-- ============================================================================
-- 4. Post Reactions (for community engagement)
-- ============================================================================
CREATE POLICY "Parents can view reactions on their school's posts" ON public.post_reactions
FOR SELECT TO authenticated
USING (
    post_id IN (
        SELECT cp.id 
        FROM public.community_posts cp
        JOIN public.parent_child_relationships pcr ON TRUE
        JOIN public.profiles parent_profile ON parent_profile.id = pcr.parent_id
        JOIN public.profiles child_profile ON child_profile.id = pcr.child_id
        WHERE parent_profile.user_id = auth.uid()
        AND cp.school_id = child_profile.school_id
    )
);

CREATE POLICY "Parents can manage their own reactions" ON public.post_reactions
FOR ALL TO authenticated
USING (
    parent_id IN (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
)
WITH CHECK (
    parent_id IN (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 5. Assessment Grades (for viewing children's grades)
-- ============================================================================
CREATE POLICY "Parents can view their children's assessment grades" ON public.assessment_grades
FOR SELECT TO authenticated
USING (
    student_id IN (
        SELECT pcr.child_id 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 6. Student Wallets (for gems/rewards tracking)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_wallets') THEN
        EXECUTE 'CREATE POLICY "Parents can view their children''s wallets" ON public.student_wallets
        FOR SELECT TO authenticated
        USING (
            student_id IN (
                SELECT pcr.child_id 
                FROM public.parent_child_relationships pcr
                JOIN public.profiles p ON p.id = pcr.parent_id
                WHERE p.user_id = auth.uid()
            )
        )';
    ELSE
        RAISE NOTICE 'Skipping student_wallets policy - table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 7. Student Achievements (for achievement tracking)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_achievements') THEN
        EXECUTE 'CREATE POLICY "Parents can view their children''s achievements" ON public.student_achievements
        FOR SELECT TO authenticated
        USING (
            student_id IN (
                SELECT pcr.child_id 
                FROM public.parent_child_relationships pcr
                JOIN public.profiles p ON p.id = pcr.parent_id
                WHERE p.user_id = auth.uid()
            )
        )';
    ELSE
        RAISE NOTICE 'Skipping student_achievements policy - table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 8. Performance Benchmarks (for analytics comparison)
-- ============================================================================
CREATE POLICY "Parents can view benchmarks for their children's school" ON public.performance_benchmarks
FOR SELECT TO authenticated
USING (
    school_id IN (
        SELECT child_profile.school_id 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles parent_profile ON parent_profile.id = pcr.parent_id
        JOIN public.profiles child_profile ON child_profile.id = pcr.child_id
        WHERE parent_profile.user_id = auth.uid()
    )
);

-- ============================================================================
-- 9. Parent Notifications (for notification settings)
-- ============================================================================
CREATE POLICY "Parents can manage their own notifications" ON public.parent_notifications
FOR ALL TO authenticated
USING (
    parent_id IN (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
)
WITH CHECK (
    parent_id IN (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 10. Student Messages (for parent-child communication)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_messages') THEN
        EXECUTE 'CREATE POLICY "Parents can view messages with their children" ON public.student_messages
        FOR SELECT TO authenticated
        USING (
            sender_id IN (
                SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
            )
            OR recipient_id IN (
                SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
            )
            OR sender_id IN (
                SELECT pcr.child_id 
                FROM public.parent_child_relationships pcr
                JOIN public.profiles p ON p.id = pcr.parent_id
                WHERE p.user_id = auth.uid()
            )
            OR recipient_id IN (
                SELECT pcr.child_id 
                FROM public.parent_child_relationships pcr
                JOIN public.profiles p ON p.id = pcr.parent_id
                WHERE p.user_id = auth.uid()
            )
        )';
    ELSE
        RAISE NOTICE 'Skipping student_messages policy - table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 11. Classes (for viewing child's class info)
-- ============================================================================
CREATE POLICY "Parents can view their children's classes" ON public.classes
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT sca.class_id 
        FROM public.student_class_assignments sca
        JOIN public.parent_child_relationships pcr ON pcr.child_id = sca.student_id
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- 12. Student Class Assignments (for schedule/timetable)
-- ============================================================================
CREATE POLICY "Parents can view their children's class assignments" ON public.student_class_assignments
FOR SELECT TO authenticated
USING (
    student_id IN (
        SELECT pcr.child_id 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- ============================================================================
-- NOTE: Profiles table policies
-- ============================================================================
-- The profiles table already has existing RLS policies that handle user access.
-- Adding new policies here would create circular RLS dependencies.
-- Parents can see their children's profiles through the existing school-based policies.

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    policy_count INTEGER;
    table_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Parent Access Policies Added ===';
    RAISE NOTICE '';
    
    -- Count new parent policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE '%parent%'
    OR policyname LIKE '%children%';
    
    RAISE NOTICE 'Total parent-related policies: %', policy_count;
    RAISE NOTICE '';
    
    -- List tables with parent policies
    RAISE NOTICE 'Tables with parent access policies:';
    FOR table_rec IN
        SELECT DISTINCT tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (policyname LIKE '%parent%' OR policyname LIKE '%children%')
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  ✅ %', table_rec.tablename;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- Summary
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== Summary ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Parent access policies added for:';
    RAISE NOTICE '1. attendance - View children attendance records';
    RAISE NOTICE '2. assessments - View children grades and assessments';
    RAISE NOTICE '3. community_posts - View school community posts';
    RAISE NOTICE '4. post_reactions - View and manage reactions (uses parent_id column)';
    RAISE NOTICE '5. assessment_grades - View children grades';
    RAISE NOTICE '6. student_wallets - View children gems/rewards';
    RAISE NOTICE '7. student_achievements - View children achievements';
    RAISE NOTICE '8. performance_benchmarks - View school benchmarks';
    RAISE NOTICE '9. parent_notifications - Manage own notifications (uses parent_id column)';
    RAISE NOTICE '10. student_messages - View family messages';
    RAISE NOTICE '11. classes - View children class info';
    RAISE NOTICE '12. student_class_assignments - View children schedules';
    RAISE NOTICE '';
    RAISE NOTICE 'Key fixes applied:';
    RAISE NOTICE '- post_reactions uses parent_id column (NOT user_id)';
    RAISE NOTICE '- parent_notifications uses parent_id column (NOT user_id)';
    RAISE NOTICE '- Profiles table policies omitted to avoid circular RLS dependencies';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the Parent Portal - it should now work!';
    RAISE NOTICE '';
END $$;
