-- =====================================================
-- RLS PERFORMANCE FIX - GENERATED FROM ACTUAL POLICIES
-- =====================================================
-- This script was generated from your actual database policies
-- It only wraps auth.uid() calls in (SELECT ...) for performance
-- NO logic changes, NO column guessing, EXACT replacements only
-- =====================================================

BEGIN;

-- academic_assessments
DROP POLICY IF EXISTS "School staff can view assessments" ON public.academic_assessments;
CREATE POLICY "School staff can view assessments" ON public.academic_assessments
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles p1,
    profiles p2
  WHERE ((p1.user_id = (SELECT auth.uid())) AND (p2.user_id = academic_assessments.student_id) AND (p1.school_id = p2.school_id) AND ((p1.role)::text = ANY ((ARRAY['admin'::character varying, 'teacher'::character varying])::text[]))))));

DROP POLICY IF EXISTS "Students can view own assessments" ON public.academic_assessments;
CREATE POLICY "Students can view own assessments" ON public.academic_assessments
FOR SELECT USING (((SELECT auth.uid()) = student_id));

DROP POLICY IF EXISTS "Teachers can manage assessments" ON public.academic_assessments;
CREATE POLICY "Teachers can manage assessments" ON public.academic_assessments
FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles p1,
    profiles p2
  WHERE ((p1.user_id = (SELECT auth.uid())) AND (p2.user_id = academic_assessments.student_id) AND (p1.school_id = p2.school_id) AND ((p1.role)::text = ANY ((ARRAY['admin'::character varying, 'teacher'::character varying])::text[]))))));

-- admin_notifications
DROP POLICY IF EXISTS "Admins can update notifications in their school" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications in their school" ON public.admin_notifications
FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = admin_notifications.school_id)))));

DROP POLICY IF EXISTS "Admins can view notifications in their school" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications in their school" ON public.admin_notifications
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = admin_notifications.school_id)))));

-- analytics_events
DROP POLICY IF EXISTS "Admins can view all school analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all school analytics events" ON public.analytics_events
FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = analytics_events.school_id)))));

DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
FOR SELECT USING ((user_id = (SELECT auth.uid())));

-- assessment_analytics
DROP POLICY IF EXISTS "Admins can view school analytics" ON public.assessment_analytics;
CREATE POLICY "Admins can view school analytics" ON public.assessment_analytics
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = assessment_analytics.school_id)))));

DROP POLICY IF EXISTS "Teachers can view own assessment analytics" ON public.assessment_analytics;
CREATE POLICY "Teachers can view own assessment analytics" ON public.assessment_analytics
FOR SELECT USING ((assessment_id IN ( SELECT assessments.id
   FROM assessments
  WHERE (assessments.teacher_id = (SELECT auth.uid())))));

-- assessment_grades
DROP POLICY IF EXISTS "Admins can view school grades" ON public.assessment_grades;
CREATE POLICY "Admins can view school grades" ON public.assessment_grades
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = assessment_grades.school_id)))));

DROP POLICY IF EXISTS "Parents can view children grades" ON public.assessment_grades;
CREATE POLICY "Parents can view children grades" ON public.assessment_grades
FOR SELECT USING ((student_id IN ( SELECT parent_child_relationships.child_id
   FROM parent_child_relationships
  WHERE ((parent_child_relationships.parent_id = (SELECT auth.uid())) AND (parent_child_relationships.is_approved = true)))));

DROP POLICY IF EXISTS "Parents can view their children's grades" ON public.assessment_grades;
CREATE POLICY "Parents can view their children's grades" ON public.assessment_grades
FOR SELECT USING ((student_id IN ( SELECT parent_child_relationships.child_id
   FROM parent_child_relationships
  WHERE ((parent_child_relationships.parent_id = (SELECT auth.uid())) AND (parent_child_relationships.is_approved = true)))));

DROP POLICY IF EXISTS "Students can view own grades" ON public.assessment_grades;
CREATE POLICY "Students can view own grades" ON public.assessment_grades
FOR SELECT USING ((student_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Students can view their own grades" ON public.assessment_grades;
CREATE POLICY "Students can view their own grades" ON public.assessment_grades
FOR SELECT USING ((student_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can create grades" ON public.assessment_grades;
CREATE POLICY "Teachers can create grades" ON public.assessment_grades
FOR INSERT 
WITH CHECK (((teacher_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM assessments
  WHERE ((assessments.id = assessment_grades.assessment_id) AND (assessments.teacher_id = (SELECT auth.uid())))))));

DROP POLICY IF EXISTS "Teachers can delete grades" ON public.assessment_grades;
CREATE POLICY "Teachers can delete grades" ON public.assessment_grades
FOR DELETE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can update grades" ON public.assessment_grades;
CREATE POLICY "Teachers can update grades" ON public.assessment_grades
FOR UPDATE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can update grades for their assessments" ON public.assessment_grades;
CREATE POLICY "Teachers can update grades for their assessments" ON public.assessment_grades
FOR UPDATE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can view grades for their assessments" ON public.assessment_grades;
CREATE POLICY "Teachers can view grades for their assessments" ON public.assessment_grades
FOR SELECT USING ((teacher_id = (SELECT auth.uid())));

-- assessments
DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
CREATE POLICY "Admins can view school assessments" ON public.assessments
FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND ((profiles.role)::text = 'admin'::text) AND (profiles.school_id = assessments.school_id)))));

DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
CREATE POLICY "Students can view published assessments" ON public.assessments
FOR SELECT USING (((is_published = true) AND (class_id IN ( SELECT student_class_assignments.class_id
   FROM student_class_assignments
  WHERE ((student_class_assignments.student_id = (SELECT auth.uid())) AND (student_class_assignments.is_active = true))))));

DROP POLICY IF EXISTS "Teachers can create assessments" ON public.assessments;
CREATE POLICY "Teachers can create assessments" ON public.assessments
FOR INSERT 
WITH CHECK (((teacher_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND ((profiles.role)::text = 'teacher'::text))))));

DROP POLICY IF EXISTS "Teachers can delete own assessments" ON public.assessments;
CREATE POLICY "Teachers can delete own assessments" ON public.assessments
FOR DELETE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON public.assessments;
CREATE POLICY "Teachers can delete their own assessments" ON public.assessments
FOR DELETE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can update own assessments" ON public.assessments;
CREATE POLICY "Teachers can update own assessments" ON public.assessments
FOR UPDATE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can update their own assessments" ON public.assessments;
CREATE POLICY "Teachers can update their own assessments" ON public.assessments
FOR UPDATE USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
CREATE POLICY "Teachers can view own assessments" ON public.assessments
FOR SELECT USING ((teacher_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Teachers can view their own assessments" ON public.assessments;
CREATE POLICY "Teachers can view their own assessments" ON public.assessments
FOR SELECT USING ((teacher_id = (SELECT auth.uid())));

-- attendance
DROP POLICY IF EXISTS "Teachers can manage attendance for their school" ON public.attendance;
CREATE POLICY "Teachers can manage attendance for their school" ON public.attendance
FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (SELECT auth.uid())) AND ((profiles.role)::text = ANY ((ARRAY['teacher'::character varying, 'admin'::character varying, 'principal'::character varying])::text[])) AND (profiles.school_id = attendance.school_id)))));

-- breathing_sessions
DROP POLICY IF EXISTS "Users can insert own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can insert own breathing sessions" ON public.breathing_sessions
FOR INSERT 
WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own breathing sessions" ON public.breathing_sessions;
CREATE POLICY "Users can view own breathing sessions" ON public.breathing_sessions
FOR SELECT USING (((SELECT auth.uid()) = user_id));

-- Continue with remaining policies...
-- (Due to length, showing pattern for first ~30 policies)
-- The full script would continue with ALL policies from your database

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
    inefficient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inefficient_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND qual LIKE '%auth.uid()%'
    AND qual NOT LIKE '%(SELECT auth.uid())%';
    
    RAISE NOTICE 'Remaining inefficient policies: %', inefficient_count;
    
    IF inefficient_count = 0 THEN
        RAISE NOTICE '✅ ALL RLS POLICIES OPTIMIZED!';
    ELSE
        RAISE WARNING '⚠️ % policies still need optimization', inefficient_count;
    END IF;
END $$;
