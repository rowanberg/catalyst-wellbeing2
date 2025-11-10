-- Fix RLS policies for shout-out related tables

-- ============================================
-- student_notifications table
-- ============================================

-- Enable RLS
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert student notifications" ON public.student_notifications;
DROP POLICY IF EXISTS "Students can view their notifications" ON public.student_notifications;

-- Policy: Teachers can insert notifications for students in their school
CREATE POLICY "Teachers can insert student notifications" ON public.student_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.school_id = student_notifications.school_id
    )
  );

-- Policy: Students can view their own notifications
CREATE POLICY "Students can view their notifications" ON public.student_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.id = student_notifications.student_id
    )
  );


-- ============================================
-- class_announcements table
-- ============================================

-- Enable RLS
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can insert class announcements" ON public.class_announcements;
DROP POLICY IF EXISTS "Users can view announcements in their school" ON public.class_announcements;

-- Policy: Teachers can insert announcements
CREATE POLICY "Teachers can insert class announcements" ON public.class_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.school_id = class_announcements.school_id
    )
  );

-- Policy: All authenticated users can view announcements in their school
CREATE POLICY "Users can view announcements in their school" ON public.class_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.school_id = class_announcements.school_id
    )
  );


-- ============================================
-- student_recognition_stats table
-- ============================================
-- Note: This table may not exist yet
-- Uncomment when the table is created

-- -- Enable RLS
-- ALTER TABLE public.student_recognition_stats ENABLE ROW LEVEL SECURITY;

-- -- Drop existing policies if they exist
-- DROP POLICY IF EXISTS "Teachers can upsert recognition stats" ON public.student_recognition_stats;
-- DROP POLICY IF EXISTS "Users can view recognition stats in their school" ON public.student_recognition_stats;

-- -- Policy: Teachers can insert/update recognition stats
-- CREATE POLICY "Teachers can upsert recognition stats" ON public.student_recognition_stats
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.user_id = auth.uid()
--       AND profiles.role = 'teacher'
--       AND profiles.school_id = student_recognition_stats.school_id
--     )
--   )
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.user_id = auth.uid()
--       AND profiles.role = 'teacher'
--       AND profiles.school_id = student_recognition_stats.school_id
--     )
--   );

-- -- Policy: All users can view recognition stats in their school
-- CREATE POLICY "Users can view recognition stats in their school" ON public.student_recognition_stats
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.user_id = auth.uid()
--       AND profiles.school_id = student_recognition_stats.school_id
--     )
--   );
