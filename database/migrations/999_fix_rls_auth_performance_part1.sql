-- =====================================================
-- FIX RLS AUTH PERFORMANCE - PART 1: Parent Portal & Community
-- =====================================================
-- Issue: auth.uid() is re-evaluated for EVERY row causing 10-100x slowdown
-- Fix: Use (select auth.uid()) to evaluate once per query
-- Impact: Expected 10-100x performance improvement on large datasets
-- =====================================================

-- ==================== BLACK_MARKS ====================
DROP POLICY IF EXISTS "Teachers can view black marks in their school" ON black_marks;
CREATE POLICY "Teachers can view black marks in their school" ON black_marks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'teacher' 
      AND school_id = black_marks.school_id
    )
  );

DROP POLICY IF EXISTS "Teachers can create black marks in their school" ON black_marks;
CREATE POLICY "Teachers can create black marks in their school" ON black_marks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'teacher' 
      AND school_id = school_id
    )
  );

DROP POLICY IF EXISTS "Teachers can update their own black marks" ON black_marks;
CREATE POLICY "Teachers can update their own black marks" ON black_marks
  FOR UPDATE USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can view their own black marks" ON black_marks;
CREATE POLICY "Students can view their own black marks" ON black_marks
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can update their response" ON black_marks;
CREATE POLICY "Students can update their response" ON black_marks
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all black marks in their school" ON black_marks;
CREATE POLICY "Admins can view all black marks in their school" ON black_marks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin' 
      AND school_id = black_marks.school_id
    )
  );

DROP POLICY IF EXISTS "Admins can update black marks in their school" ON black_marks;
CREATE POLICY "Admins can update black marks in their school" ON black_marks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin' 
      AND school_id = black_marks.school_id
    )
  );

DROP POLICY IF EXISTS "Admins can delete black marks in their school" ON black_marks;
CREATE POLICY "Admins can delete black marks in their school" ON black_marks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin' 
      AND school_id = black_marks.school_id
    )
  );

-- ==================== COMMUNITY_POSTS ====================
DROP POLICY IF EXISTS "Parents view relevant posts" ON community_posts;
CREATE POLICY "Parents view relevant posts" ON community_posts
  FOR SELECT USING (
    visibility = 'all_parents' OR
    (visibility = 'class_parents' AND class_id IN (
      SELECT sca.class_id 
      FROM student_class_assignments sca
      JOIN parent_child_relationships pcr ON pcr.child_id = (
        SELECT user_id FROM profiles WHERE id = sca.student_id
      )
      WHERE pcr.parent_id = (select auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Teachers manage own posts" ON community_posts;
CREATE POLICY "Teachers manage own posts" ON community_posts
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can view posts for their children's school" ON community_posts;
CREATE POLICY "Parents can view posts for their children's school" ON community_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles p ON p.user_id = pcr.child_id
      WHERE pcr.parent_id = (select auth.uid())
      AND p.school_id = community_posts.school_id
    )
  );

DROP POLICY IF EXISTS "parent_view_school_posts" ON community_posts;
CREATE POLICY "parent_view_school_posts" ON community_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles child ON child.user_id = pcr.child_id
      WHERE pcr.parent_id = (select auth.uid())
      AND child.school_id IN (
        SELECT school_id FROM profiles WHERE id = teacher_id
      )
    )
  );

-- ==================== POST_REACTIONS ====================
DROP POLICY IF EXISTS "Parents manage own reactions" ON post_reactions;
CREATE POLICY "Parents manage own reactions" ON post_reactions
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can view reactions on their school's posts" ON post_reactions;
CREATE POLICY "Parents can view reactions on their school's posts" ON post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles child ON child.user_id = pcr.child_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can manage their own reactions" ON post_reactions;
CREATE POLICY "Parents can manage their own reactions" ON post_reactions
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "parent_view_reactions" ON post_reactions;
CREATE POLICY "parent_view_reactions" ON post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = (select auth.uid()) AND role = 'parent'
    )
  );

DROP POLICY IF EXISTS "parent_manage_own_reactions" ON post_reactions;
CREATE POLICY "parent_manage_own_reactions" ON post_reactions
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== PARENT_NOTIFICATIONS ====================
DROP POLICY IF EXISTS "Parents manage own notifications" ON parent_notifications;
CREATE POLICY "Parents manage own notifications" ON parent_notifications
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can manage their own notifications" ON parent_notifications;
CREATE POLICY "Parents can manage their own notifications" ON parent_notifications
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "parent_manage_own_notifications" ON parent_notifications;
CREATE POLICY "parent_manage_own_notifications" ON parent_notifications
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== POST_VIEWS ====================
DROP POLICY IF EXISTS "Parents track own views" ON post_views;
CREATE POLICY "Parents track own views" ON post_views
  FOR ALL USING (
    parent_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

SELECT 'Part 1 Complete: Parent Portal & Community RLS policies optimized' as status;
