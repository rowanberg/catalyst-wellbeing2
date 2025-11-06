-- =====================================================
-- FIX RLS AUTH PERFORMANCE - PART 4: Portfolio & Admin
-- =====================================================

-- ==================== PORTFOLIO_SECTIONS ====================
DROP POLICY IF EXISTS "Students can manage own portfolio sections" ON portfolio_sections;
CREATE POLICY "Students can manage own portfolio sections" ON portfolio_sections
  FOR ALL USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== PORTFOLIO_GOALS ====================
DROP POLICY IF EXISTS "Students can manage own portfolio goals" ON portfolio_goals;
CREATE POLICY "Students can manage own portfolio goals" ON portfolio_goals
  FOR ALL USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== PORTFOLIO_SKILLS ====================
DROP POLICY IF EXISTS "Students can manage own portfolio skills" ON portfolio_skills;
CREATE POLICY "Students can manage own portfolio skills" ON portfolio_skills
  FOR ALL USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== PORTFOLIO_SHARES ====================
DROP POLICY IF EXISTS "Portfolio shares visible to recipients" ON portfolio_shares;
CREATE POLICY "Portfolio shares visible to recipients" ON portfolio_shares
  FOR SELECT USING (
    shared_with_id = (select auth.uid()) OR
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

-- ==================== AUDIT_LOGS ====================
DROP POLICY IF EXISTS "Audit logs visible to admins only" ON audit_logs;
CREATE POLICY "Audit logs visible to admins only" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== ATTENDANCE_ARCHIVE ====================
DROP POLICY IF EXISTS "Attendance archives visible to teachers/admins" ON attendance_archive;
CREATE POLICY "Attendance archives visible to teachers/admins" ON attendance_archive
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role IN ('teacher', 'admin')
      AND school_id = attendance_archive.school_id
    )
  );

-- ==================== ATTENDANCE_ARCHIVE_BACKUP ====================
DROP POLICY IF EXISTS "Attendance archive backup visible to admins" ON attendance_archive_backup;
CREATE POLICY "Attendance archive backup visible to admins" ON attendance_archive_backup
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== EXCHANGE_RATES ====================
DROP POLICY IF EXISTS "Exchange rates manageable by admins" ON exchange_rates;
CREATE POLICY "Exchange rates manageable by admins" ON exchange_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== PROJECT_UPDATES ====================
DROP POLICY IF EXISTS "Project updates visible to project members" ON project_updates;
CREATE POLICY "Project updates visible to project members" ON project_updates
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE student_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

-- ==================== PROMOTION_MAPPINGS ====================
DROP POLICY IF EXISTS "Admins can view promotion mappings" ON promotion_mappings;
CREATE POLICY "Admins can view promotion mappings" ON promotion_mappings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create promotion mappings" ON promotion_mappings;
CREATE POLICY "Admins can create promotion mappings" ON promotion_mappings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update promotion mappings" ON promotion_mappings;
CREATE POLICY "Admins can update promotion mappings" ON promotion_mappings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete promotion mappings" ON promotion_mappings;
CREATE POLICY "Admins can delete promotion mappings" ON promotion_mappings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== GEM_TRANSACTIONS ====================
DROP POLICY IF EXISTS "Teachers can view their own transactions" ON gem_transactions;
CREATE POLICY "Teachers can view their own transactions" ON gem_transactions
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can insert transactions" ON gem_transactions;
CREATE POLICY "Teachers can insert transactions" ON gem_transactions
  FOR INSERT WITH CHECK (
    teacher_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can view their transactions" ON gem_transactions;
CREATE POLICY "Students can view their transactions" ON gem_transactions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all transactions" ON gem_transactions;
CREATE POLICY "Admins can manage all transactions" ON gem_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== AFFIRMATION_SESSIONS ====================
DROP POLICY IF EXISTS "Students can view own affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Students can view own affirmation sessions" ON affirmation_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can insert own affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Students can insert own affirmation sessions" ON affirmation_sessions
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can update own affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Students can update own affirmation sessions" ON affirmation_sessions
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can view student affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Teachers can view student affirmation sessions" ON affirmation_sessions
  FOR SELECT USING (
    student_id IN (
      SELECT sca.student_id FROM student_class_assignments sca
      JOIN teacher_class_assignments tca ON tca.class_id = sca.class_id
      WHERE tca.teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admins can view all affirmation sessions" ON affirmation_sessions;
CREATE POLICY "Admins can view all affirmation sessions" ON affirmation_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ==================== USER_AI_QUOTAS ====================
DROP POLICY IF EXISTS "Users can view own quota" ON user_ai_quotas;
CREATE POLICY "Users can view own quota" ON user_ai_quotas
  FOR SELECT USING (
    user_id = (select auth.uid())
  );

-- ==================== AI_REQUEST_LOGS ====================
DROP POLICY IF EXISTS "Users can view own request logs" ON ai_request_logs;
CREATE POLICY "Users can view own request logs" ON ai_request_logs
  FOR SELECT USING (
    user_id = (select auth.uid())
  );

-- ==================== SCHOOL_ANNOUNCEMENTS ====================
DROP POLICY IF EXISTS "Admins can manage school announcements" ON school_announcements;
CREATE POLICY "Admins can manage school announcements" ON school_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin'
      AND school_id = school_announcements.school_id
    )
  );

SELECT 'Part 4 Complete: Portfolio & Admin RLS policies optimized' as status;
