-- =====================================================
-- FIX RLS AUTH PERFORMANCE - PART 3: Assessments & Gamification
-- =====================================================

-- ==================== ASSESSMENTS ====================
DROP POLICY IF EXISTS "teachers_select_own_assessments" ON assessments;
CREATE POLICY "teachers_select_own_assessments" ON assessments
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "teachers_insert_assessments" ON assessments;
CREATE POLICY "teachers_insert_assessments" ON assessments
  FOR INSERT WITH CHECK (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "teachers_update_own_assessments" ON assessments;
CREATE POLICY "teachers_update_own_assessments" ON assessments
  FOR UPDATE USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "teachers_delete_own_assessments" ON assessments;
CREATE POLICY "teachers_delete_own_assessments" ON assessments
  FOR DELETE USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "students_view_published_assessments" ON assessments;
CREATE POLICY "students_view_published_assessments" ON assessments
  FOR SELECT USING (
    status = 'published' AND
    class_id IN (
      SELECT class_id FROM student_class_assignments
      WHERE student_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Teachers can view their own assessments" ON assessments;
CREATE POLICY "Teachers can view their own assessments" ON assessments
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can create assessments" ON assessments;
CREATE POLICY "Teachers can create assessments" ON assessments
  FOR INSERT WITH CHECK (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can update their own assessments" ON assessments;
CREATE POLICY "Teachers can update their own assessments" ON assessments
  FOR UPDATE USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can delete their own assessments" ON assessments;
CREATE POLICY "Teachers can delete their own assessments" ON assessments
  FOR DELETE USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== QUEST_TEMPLATES ====================
DROP POLICY IF EXISTS "Quest templates manageable by admins" ON quest_templates;
CREATE POLICY "Quest templates manageable by admins" ON quest_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== BADGE_TEMPLATES ====================
DROP POLICY IF EXISTS "Badge templates manageable by admins" ON badge_templates;
CREATE POLICY "Badge templates manageable by admins" ON badge_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== EVENT_SESSIONS ====================
DROP POLICY IF EXISTS "Event sessions visible to school members" ON event_sessions;
CREATE POLICY "Event sessions visible to school members" ON event_sessions
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== EVENT_ANNOUNCEMENTS ====================
DROP POLICY IF EXISTS "Event announcements visible to school members" ON event_announcements;
CREATE POLICY "Event announcements visible to school members" ON event_announcements
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== EVENT_VOLUNTEERS ====================
DROP POLICY IF EXISTS "Event volunteers visible to school members" ON event_volunteers;
CREATE POLICY "Event volunteers visible to school members" ON event_volunteers
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== LEADERBOARDS ====================
DROP POLICY IF EXISTS "Leaderboards visible to school members" ON leaderboards;
CREATE POLICY "Leaderboards visible to school members" ON leaderboards
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== LEADERBOARD_ENTRIES ====================
DROP POLICY IF EXISTS "Leaderboard entries visible to school members" ON leaderboard_entries;
CREATE POLICY "Leaderboard entries visible to school members" ON leaderboard_entries
  FOR SELECT USING (
    leaderboard_id IN (
      SELECT id FROM leaderboards 
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

-- ==================== REWARD_STORE_ITEMS ====================
DROP POLICY IF EXISTS "Reward items visible to school members" ON reward_store_items;
CREATE POLICY "Reward items visible to school members" ON reward_store_items
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== STUDENT_PURCHASES ====================
DROP POLICY IF EXISTS "Students can view own purchases" ON student_purchases;
CREATE POLICY "Students can view own purchases" ON student_purchases
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers/admins can view purchases in their school" ON student_purchases;
CREATE POLICY "Teachers/admins can view purchases in their school" ON student_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = (select auth.uid())
      AND p.role IN ('teacher', 'admin')
      AND p.school_id = student_purchases.school_id
    )
  );

-- ==================== GAME_LEADERBOARDS ====================
DROP POLICY IF EXISTS "Game leaderboards visible to school members" ON game_leaderboards;
CREATE POLICY "Game leaderboards visible to school members" ON game_leaderboards
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== GAME_ANALYTICS ====================
DROP POLICY IF EXISTS "Game analytics visible to school members" ON game_analytics;
CREATE POLICY "Game analytics visible to school members" ON game_analytics
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

SELECT 'Part 3 Complete: Assessments & Gamification RLS policies optimized' as status;
