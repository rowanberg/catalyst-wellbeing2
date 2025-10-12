-- =====================================================
-- CONSOLIDATE DUPLICATE RLS POLICIES
-- =====================================================
-- Consolidates multiple permissive policies on the same table/role/action
-- to improve query performance

-- PROFILES: Consolidate duplicate view/update policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- Keep: "Users can view own profile"

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
-- Keep: "Users can update own profile"

-- ASSESSMENTS: Consolidate teacher policies
DROP POLICY IF EXISTS "Teachers can view their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON public.assessments;
-- Keep: "Teachers can view own assessments", "Teachers can update own assessments", "Teachers can delete own assessments"

-- ASSESSMENT_GRADES: Consolidate parent/student/teacher policies
DROP POLICY IF EXISTS "Parents can view their children's grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Teachers can update grades for their assessments" ON public.assessment_grades;
-- Consolidate into fewer policies with OR conditions
CREATE POLICY "Assessment grades view access" ON public.assessment_grades
FOR SELECT USING (
    -- Admins can view school grades
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = assessment_grades.school_id AND role = 'admin')
    OR
    -- Teachers can view grades for their assessments
    EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_grades.assessment_id AND teacher_id = (SELECT auth.uid()))
    OR
    -- Students can view own grades
    student_id = (SELECT auth.uid())
    OR
    -- Parents can view children grades
    EXISTS (SELECT 1 FROM public.parent_child_relationships WHERE parent_id = (SELECT auth.uid()) AND child_id = assessment_grades.student_id)
);

DROP POLICY IF EXISTS "Admins can view school grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Parents can view children grades" ON public.assessment_grades;
DROP POLICY IF EXISTS "Teachers can view grades for their assessments" ON public.assessment_grades;

-- GRADE_TEMPLATES: Consolidate duplicate teacher policies  
DROP POLICY IF EXISTS "Teachers can manage their own templates" ON public.grade_templates;
-- Keep: "Teachers can manage own templates" (covers all CRUD)

-- OFFLINE_GRADE_SYNC: Consolidate duplicate teacher policies
DROP POLICY IF EXISTS "Teachers can manage their own offline sync" ON public.offline_grade_sync;
-- Keep: "Teachers can manage own sync data"

-- STUDENT_WALLETS: Consolidate duplicate wallet access policies
DROP POLICY IF EXISTS "Users can manage their own wallet" ON public.student_wallets;
DROP POLICY IF EXISTS "Students can create their own wallet" ON public.student_wallets;
-- Keep: "Students can access their own wallet"

-- STUDENT_GEMINI_CONFIG: Consolidate duplicate config policies
DROP POLICY IF EXISTS "Users can insert their own Gemini config" ON public.student_gemini_config;
DROP POLICY IF EXISTS "Users can update their own Gemini config" ON public.student_gemini_config;
DROP POLICY IF EXISTS "Users can delete their own Gemini config" ON public.student_gemini_config;
-- Keep: "Users can manage their own Gemini config"

-- MATH_BATTLE_PROGRESS: Consolidate duplicate student progress policies
DROP POLICY IF EXISTS "Students can view their own progress" ON public.math_battle_progress;
DROP POLICY IF EXISTS "Students can insert their own progress" ON public.math_battle_progress;
DROP POLICY IF EXISTS "Students can update their own progress" ON public.math_battle_progress;
-- Keep: "Students can view their own math battle progress", "Students can insert their own math battle progress", "Students can update their own math battle progress"

-- HELP_REQUESTS: Consolidate school isolation and duplicate policies
DROP POLICY IF EXISTS "School-isolated help requests view" ON public.help_requests;
DROP POLICY IF EXISTS "School-isolated help requests update" ON public.help_requests;
DROP POLICY IF EXISTS "Students can create help requests for their school" ON public.help_requests;
DROP POLICY IF EXISTS "Admins can update help requests from their school" ON public.help_requests;
-- Keep consolidated versions

-- GAME_SESSIONS: Consolidate isolation policies with functional policies
DROP POLICY IF EXISTS "Users can view and manage their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "game_sessions_isolation" ON public.game_sessions;

CREATE POLICY "Game sessions full access" ON public.game_sessions
FOR ALL USING (student_id = (SELECT auth.uid()));

-- STUDENT_PORTFOLIOS: Consolidate isolation policies
CREATE POLICY "Student portfolios access" ON public.student_portfolios
FOR ALL USING (
    -- Students can manage own portfolios
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view portfolios in their school
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('teacher', 'admin') AND school_id = student_portfolios.school_id))
);

DROP POLICY IF EXISTS "Students can manage their own portfolios" ON public.student_portfolios;
DROP POLICY IF EXISTS "Teachers can view portfolios in their school" ON public.student_portfolios;
DROP POLICY IF EXISTS "student_portfolios_isolation" ON public.student_portfolios;

-- STUDENT_ACHIEVEMENTS: Consolidate isolation policies
CREATE POLICY "Student achievements access" ON public.student_achievements
FOR ALL USING (
    student_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'service_role')
);

DROP POLICY IF EXISTS "Students can view their own achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "Students can update their own achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "System can insert student achievements" ON public.student_achievements;
DROP POLICY IF EXISTS "student_achievements_isolation" ON public.student_achievements;

-- SCHOOL_EVENTS: Consolidate isolation policies
CREATE POLICY "School events access" ON public.school_events
FOR ALL USING (
    -- Organizers can manage
    organizer_id = (SELECT auth.uid())
    OR
    -- Users can view published events in their school
    (status = 'published' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = school_events.school_id))
);

DROP POLICY IF EXISTS "Event organizers can manage their events" ON public.school_events;
DROP POLICY IF EXISTS "Users can view published events in their school" ON public.school_events;
DROP POLICY IF EXISTS "school_events_isolation" ON public.school_events;

-- STUDY_GROUPS: Consolidate isolation policies
CREATE POLICY "Study groups access" ON public.study_groups
FOR ALL USING (
    -- Users in same school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = study_groups.school_id)
    AND
    (
        -- Can view active groups
        (status = 'active') OR
        -- Or is creator/moderator
        (created_by = (SELECT auth.uid()))
    )
);

DROP POLICY IF EXISTS "Users can create groups in their school" ON public.study_groups;
DROP POLICY IF EXISTS "Users can view active groups in their school" ON public.study_groups;
DROP POLICY IF EXISTS "Group creators and moderators can update groups" ON public.study_groups;
DROP POLICY IF EXISTS "study_groups_school_isolation" ON public.study_groups;

-- STUDY_GROUP_MEMBERS: Consolidate isolation policies
CREATE POLICY "Study group members access" ON public.study_group_members
FOR ALL USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
        SELECT 1 FROM public.study_groups sg
        JOIN public.study_group_members sgm ON sg.id = sgm.group_id
        WHERE sg.id = study_group_members.group_id
        AND sgm.user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can join groups" ON public.study_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON public.study_group_members;
DROP POLICY IF EXISTS "study_group_members_school_isolation" ON public.study_group_members;

-- STUDENT_CLASS_ASSIGNMENTS: Remove duplicate admin policy
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.student_class_assignments;
-- Keep: "Admins can view all student class assignments"

-- SCHOOL_ANNOUNCEMENTS: Consolidate role-specific view policies
CREATE POLICY "View school announcements" ON public.school_announcements
FOR SELECT USING (
    -- Admins can manage
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = school_announcements.school_id AND role = 'admin')
    OR
    -- Active announcements visible to target roles
    (is_active = true AND 
     EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.school_id = school_announcements.school_id 
             AND ('all' = ANY(target_roles) OR p.role = ANY(target_roles))))
);

DROP POLICY IF EXISTS "Parents can view active announcements" ON public.school_announcements;
DROP POLICY IF EXISTS "Students can view active announcements" ON public.school_announcements;
DROP POLICY IF EXISTS "Teachers can view active announcements" ON public.school_announcements;
DROP POLICY IF EXISTS "Users can view announcements for their role" ON public.school_announcements;
-- Keep: "Admins can manage school announcements"

-- Verification
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT schemaname, tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No duplicate permissive policies remain!';
    ELSE
        RAISE WARNING '⚠️ Warning: % tables still have duplicate policies', duplicate_count;
    END IF;
END $$;
