-- ============================================================================
-- Parent Access Policies - Minimal Working Version
-- ============================================================================

-- 1. ATTENDANCE
CREATE POLICY "parent_view_child_attendance" ON public.attendance
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE pcr.child_id = attendance.student_id
        AND p.user_id = auth.uid()
    )
);

-- 2. COMMUNITY POSTS
CREATE POLICY "parent_view_school_posts" ON public.community_posts
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.parent_child_relationships pcr
        JOIN public.profiles parent_prof ON parent_prof.id = pcr.parent_id
        JOIN public.profiles child_prof ON child_prof.id = pcr.child_id
        WHERE parent_prof.user_id = auth.uid()
        AND community_posts.school_id = child_prof.school_id
    )
);

-- 3. POST REACTIONS - View
CREATE POLICY "parent_view_reactions" ON public.post_reactions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.parent_child_relationships pcr
        JOIN public.profiles parent_prof ON parent_prof.id = pcr.parent_id
        JOIN public.profiles child_prof ON child_prof.id = pcr.child_id
        JOIN public.community_posts cp ON cp.id = post_reactions.post_id
        WHERE parent_prof.user_id = auth.uid()
        AND cp.school_id = child_prof.school_id
    )
);

-- 4. POST REACTIONS - Manage Own
CREATE POLICY "parent_manage_own_reactions" ON public.post_reactions
FOR ALL TO authenticated
USING (
    post_reactions.parent_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    post_reactions.parent_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- 5. ASSESSMENTS
CREATE POLICY "parent_view_child_assessments" ON public.assessments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.student_class_assignments sca
        JOIN public.parent_child_relationships pcr ON pcr.child_id = sca.student_id
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
        AND assessments.class_id = sca.class_id
    )
);

-- 6. ASSESSMENT GRADES
CREATE POLICY "parent_view_child_grades" ON public.assessment_grades
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE pcr.child_id = assessment_grades.student_id
        AND p.user_id = auth.uid()
    )
);

-- 7. CLASSES
CREATE POLICY "parent_view_child_classes" ON public.classes
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.student_class_assignments sca
        JOIN public.parent_child_relationships pcr ON pcr.child_id = sca.student_id
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE p.user_id = auth.uid()
        AND classes.id = sca.class_id
    )
);

-- 8. STUDENT CLASS ASSIGNMENTS
CREATE POLICY "parent_view_child_schedule" ON public.student_class_assignments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.parent_child_relationships pcr
        JOIN public.profiles p ON p.id = pcr.parent_id
        WHERE pcr.child_id = student_class_assignments.student_id
        AND p.user_id = auth.uid()
    )
);

-- 9. PARENT NOTIFICATIONS
CREATE POLICY "parent_manage_own_notifications" ON public.parent_notifications
FOR ALL TO authenticated
USING (
    parent_notifications.parent_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    parent_notifications.parent_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
);

-- 10. PERFORMANCE BENCHMARKS
CREATE POLICY "parent_view_school_benchmarks" ON public.performance_benchmarks
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.parent_child_relationships pcr
        JOIN public.profiles parent_prof ON parent_prof.id = pcr.parent_id
        JOIN public.profiles child_prof ON child_prof.id = pcr.child_id
        WHERE parent_prof.user_id = auth.uid()
        AND performance_benchmarks.school_id = child_prof.school_id
    )
);

-- Verify policies created
SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%parent%'
ORDER BY tablename;

-- Summary
SELECT '✅ Parent access policies created successfully!' as status;
