-- Fix assessments table RLS policies
-- Remove duplicates and ensure clean policies for teachers

BEGIN;

-- Drop ALL existing policies on assessments table
DROP POLICY IF EXISTS "Admins can view school assessments" ON public.assessments;
DROP POLICY IF EXISTS "Students can view published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can delete own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can view own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can view their own assessments" ON public.assessments;

-- Enable RLS if not already enabled
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create clean, non-duplicate policies

-- 1. Teachers can SELECT their own assessments
CREATE POLICY "teachers_select_own_assessments" ON public.assessments
FOR SELECT 
USING (teacher_id = auth.uid());

-- 2. Teachers can INSERT assessments (must be a teacher and set their own teacher_id)
CREATE POLICY "teachers_insert_assessments" ON public.assessments
FOR INSERT 
WITH CHECK (
    teacher_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- 3. Teachers can UPDATE their own assessments
CREATE POLICY "teachers_update_own_assessments" ON public.assessments
FOR UPDATE 
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- 4. Teachers can DELETE their own assessments
CREATE POLICY "teachers_delete_own_assessments" ON public.assessments
FOR DELETE 
USING (teacher_id = auth.uid());

-- 5. Admins can view all assessments in their school
CREATE POLICY "admins_view_school_assessments" ON public.assessments
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin' 
        AND profiles.school_id = assessments.school_id
    )
);

-- 6. Students can view published assessments in their classes
CREATE POLICY "students_view_published_assessments" ON public.assessments
FOR SELECT 
USING (
    is_published = true 
    AND class_id IN (
        SELECT class_id FROM student_class_assignments 
        WHERE student_id = auth.uid() 
        AND is_active = true
    )
);

COMMIT;

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'assessments'
ORDER BY cmd, policyname;
