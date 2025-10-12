-- =====================================================
-- CONSOLIDATE DUPLICATE RLS POLICIES - PART 3
-- =====================================================
-- Final consolidation of remaining duplicate policies

-- STUDENT_MOODS: Consolidate
CREATE POLICY "Student moods view access" ON public.student_moods
FOR SELECT USING (
    -- Admins and teachers can view student moods in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_moods.school_id AND role IN ('admin', 'teacher'))
    OR
    -- Students can view their own moods
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view student moods in their school" ON public.student_moods;
DROP POLICY IF EXISTS "Students can manage their own moods" ON public.student_moods;
DROP POLICY IF EXISTS "Teachers can view student moods in their school" ON public.student_moods;

-- STUDENT_PROJECTS: Consolidate
CREATE POLICY "Student projects view access" ON public.student_projects
FOR SELECT USING (
    -- Users can view their own projects
    student_id = (SELECT auth.uid())
    OR
    -- Users can view published projects in their school
    (is_published = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_projects.school_id))
);

DROP POLICY IF EXISTS "Users can manage their own projects" ON public.student_projects;
DROP POLICY IF EXISTS "Users can view published projects in their school" ON public.student_projects;

-- STUDENT_QUEST_PROGRESS: Consolidate
CREATE POLICY "Student quest progress view access" ON public.student_quest_progress
FOR SELECT USING (
    -- Students can view their own progress
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view progress in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_quest_progress.school_id AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Student quest progress update access" ON public.student_quest_progress
FOR UPDATE USING (
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Students can view their own quest progress" ON public.student_quest_progress;
DROP POLICY IF EXISTS "System can manage quest progress" ON public.student_quest_progress;
DROP POLICY IF EXISTS "Teachers can view quest progress in their school" ON public.student_quest_progress;
DROP POLICY IF EXISTS "Students can update their own quest progress" ON public.student_quest_progress;

-- STUDENT_RECOGNITION_STATS: Consolidate
CREATE POLICY "Student recognition stats view access" ON public.student_recognition_stats
FOR SELECT USING (
    -- Students can view their own stats
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view stats in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_recognition_stats.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can view their own recognition stats" ON public.student_recognition_stats;
DROP POLICY IF EXISTS "System can manage recognition stats" ON public.student_recognition_stats;
DROP POLICY IF EXISTS "Teachers can view recognition stats in their school" ON public.student_recognition_stats;

-- STUDENT_SHOUT_OUTS: Consolidate
CREATE POLICY "Student shout outs view access" ON public.student_shout_outs
FOR SELECT USING (
    -- Admins can view all shout-outs in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_shout_outs.school_id AND role = 'admin')
    OR
    -- Teachers can view shout-outs in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_shout_outs.school_id AND role = 'teacher')
    OR
    -- Public shout-outs visible to school community
    (is_public = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_shout_outs.school_id))
    OR
    -- Students can view shout-outs about themselves
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all shout-outs in their school" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Public shout-outs visible to school community" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Students can view shout-outs about themselves" ON public.student_shout_outs;
DROP POLICY IF EXISTS "Teachers can view shout-outs in their school" ON public.student_shout_outs;

-- STUDENT_WHATSAPP_CONFIG: Consolidate
CREATE POLICY "Student whatsapp config view access" ON public.student_whatsapp_config
FOR SELECT USING (
    -- Students can view/manage own config
    student_id = (SELECT auth.uid())
    OR
    -- Teachers can view student configs in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = student_whatsapp_config.school_id AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "Students can manage own whatsapp config" ON public.student_whatsapp_config;
DROP POLICY IF EXISTS "Teachers can view student whatsapp configs in their school" ON public.student_whatsapp_config;

-- SUBJECT_PROGRESS: Consolidate
CREATE POLICY "Subject progress view access" ON public.subject_progress
FOR SELECT USING (
    -- School staff can view student progress
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = subject_progress.school_id AND role IN ('admin', 'teacher'))
    OR
    -- Students can view own progress
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "School staff can view student progress" ON public.subject_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON public.subject_progress;
DROP POLICY IF EXISTS "Teachers can manage student progress" ON public.subject_progress;

-- TEACHER_CLASS_ASSIGNMENTS: Consolidate
CREATE POLICY "Teacher class assignments view access" ON public.teacher_class_assignments
FOR SELECT USING (
    -- Admins can view all
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_class_assignments.school_id AND role = 'admin')
    OR
    -- Teachers can view their own assignments
    teacher_id = (SELECT auth.uid())
    OR
    -- Users can view teacher assignments from their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_class_assignments.school_id)
);

CREATE POLICY "Teacher class assignments insert access" ON public.teacher_class_assignments
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_class_assignments.school_id AND role = 'admin')
);

CREATE POLICY "Teacher class assignments update access" ON public.teacher_class_assignments
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_class_assignments.school_id AND role = 'admin')
);

CREATE POLICY "Teacher class assignments delete access" ON public.teacher_class_assignments
FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_class_assignments.school_id AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage teacher assignments in their school" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can view their own class assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Users can view teacher assignments from their school" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can insert their own class assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can update their own class assignments" ON public.teacher_class_assignments;
DROP POLICY IF EXISTS "Teachers can delete their own class assignments" ON public.teacher_class_assignments;

-- TEACHER_GRADE_ASSIGNMENTS: Consolidate
CREATE POLICY "Teacher grade assignments view access" ON public.teacher_grade_assignments
FOR SELECT USING (
    -- Admins can view all
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_grade_assignments.school_id AND role = 'admin')
    OR
    -- Teachers can view their own
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage teacher grade assignments" ON public.teacher_grade_assignments;
DROP POLICY IF EXISTS "Teachers can view their grade assignments" ON public.teacher_grade_assignments;

-- TEACHER_INTERVENTION_STATS: Consolidate
CREATE POLICY "Teacher intervention stats view access" ON public.teacher_intervention_stats
FOR SELECT USING (
    -- Admins can view stats in their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_intervention_stats.school_id AND role = 'admin')
    OR
    -- Teachers can view their own stats
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view teacher stats in their school" ON public.teacher_intervention_stats;
DROP POLICY IF EXISTS "System can manage teacher stats" ON public.teacher_intervention_stats;
DROP POLICY IF EXISTS "Teachers can view their own stats" ON public.teacher_intervention_stats;

-- TEACHER_OFFICE_HOURS: Consolidate all CRUD
CREATE POLICY "Teacher office hours full access" ON public.teacher_office_hours
FOR ALL USING (
    -- Admins can manage
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_office_hours.school_id AND role = 'admin')
    OR
    -- Teachers can manage their own
    teacher_id = (SELECT auth.uid())
);

CREATE POLICY "Teacher office hours student view" ON public.teacher_office_hours
FOR SELECT USING (
    -- Students can view teacher office hours from their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_office_hours.school_id AND role = 'student')
);

DROP POLICY IF EXISTS "Admins can manage office hours in their school" ON public.teacher_office_hours;
DROP POLICY IF EXISTS "Teachers can manage their own office hours" ON public.teacher_office_hours;
DROP POLICY IF EXISTS "Students can view teacher office hours from their school" ON public.teacher_office_hours;

-- TEACHER_SETTINGS: Consolidate
CREATE POLICY "Teacher settings view access" ON public.teacher_settings
FOR SELECT USING (
    -- Admins can view settings from their school
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = teacher_settings.school_id AND role = 'admin')
    OR
    -- Teachers can view own settings
    teacher_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view teacher settings from their school" ON public.teacher_settings;
DROP POLICY IF EXISTS "Teachers can view own settings" ON public.teacher_settings;

-- USER_SESSIONS: Consolidate
CREATE POLICY "User sessions view access" ON public.user_sessions
FOR SELECT USING (
    -- Admins can view all school sessions
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = user_sessions.school_id AND role = 'admin')
    OR
    -- Users can view their own sessions
    user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all school sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

-- WELLBEING_ASSESSMENTS: Consolidate
CREATE POLICY "Wellbeing assessments view access" ON public.wellbeing_assessments
FOR SELECT USING (
    -- Admins and teachers can view school assessments
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = wellbeing_assessments.school_id AND role IN ('admin', 'teacher'))
    OR
    -- Students can view their own assessments
    student_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON public.wellbeing_assessments;
DROP POLICY IF EXISTS "Students can view their own assessments" ON public.wellbeing_assessments;

-- COURAGE_LOG: Consolidate
CREATE POLICY "Courage log view access" ON public.courage_log
FOR SELECT USING (
    -- Users can view own entries
    user_id = (SELECT auth.uid())
    OR
    -- Users can view courage in their school (if public)
    (is_public = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = courage_log.school_id))
);

DROP POLICY IF EXISTS "Users can view courage in their school" ON public.courage_log;
DROP POLICY IF EXISTS "Users can view own courage entries" ON public.courage_log;

-- GRATITUDE_ENTRIES: Consolidate
CREATE POLICY "Gratitude entries view access" ON public.gratitude_entries
FOR SELECT USING (
    -- Users can view own entries
    user_id = (SELECT auth.uid())
    OR
    -- Users can view gratitude in their school (if public)
    (is_public = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = gratitude_entries.school_id))
);

DROP POLICY IF EXISTS "Users can view gratitude in their school" ON public.gratitude_entries;
DROP POLICY IF EXISTS "Users can view own gratitude entries" ON public.gratitude_entries;

-- HABIT_TRACKER: Consolidate
CREATE POLICY "Habit tracker view access" ON public.habit_tracker
FOR SELECT USING (
    -- Users can view own habits
    user_id = (SELECT auth.uid())
    OR
    -- Users can view habits in their school (if shared)
    (is_shared = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND school_id = habit_tracker.school_id))
);

DROP POLICY IF EXISTS "Users can manage own habits" ON public.habit_tracker;
DROP POLICY IF EXISTS "Users can view habits in their school" ON public.habit_tracker;

-- Verification
DO $$
DECLARE
    duplicate_count INTEGER;
    remaining_tables TEXT;
BEGIN
    SELECT COUNT(*), string_agg(DISTINCT tablename, ', ')
    INTO duplicate_count, remaining_tables
    FROM (
        SELECT tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, cmd, roles
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All duplicate permissive policies have been consolidated!';
        RAISE NOTICE 'Performance warnings should now be significantly reduced.';
    ELSE
        RAISE WARNING '⚠️ Warning: % tables still have duplicate policies', duplicate_count;
        RAISE NOTICE 'Tables with remaining duplicates: %', remaining_tables;
        RAISE NOTICE 'These may need manual review for complex business logic.';
    END IF;
END $$;
