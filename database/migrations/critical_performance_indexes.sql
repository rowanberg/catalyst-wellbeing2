-- Critical Performance Indexes Migration
-- Addresses missing indexes causing slow queries across the application
-- Expected Impact: 50-80% faster query performance
-- Date: November 1, 2025

-- ============================================================================
-- PROFILES TABLE INDEXES
-- Most queried table (174+ queries across codebase)
-- ============================================================================

-- Primary lookup by user_id (auth.users FK)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- Lookup by school_id for school-wide queries
CREATE INDEX IF NOT EXISTS idx_profiles_school_id 
ON profiles(school_id) 
WHERE school_id IS NOT NULL;

-- Role-based filtering (student, teacher, admin, parent)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- Composite index for school + role queries
CREATE INDEX IF NOT EXISTS idx_profiles_school_role 
ON profiles(school_id, role) 
WHERE school_id IS NOT NULL;

-- Class-based student lookups (only if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' AND column_name = 'class_id') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_class_id ON profiles(class_id);
    END IF;
END $$;

-- Email lookups for verification
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- ============================================================================
-- ATTENDANCE TABLE INDEXES
-- Slow queries identified in performance analysis
-- ============================================================================

-- Student attendance by date (most common query) - conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'student_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
    ON attendance(student_id, date DESC);
  END IF;
END $$;

-- Class attendance queries (conditional on column existence)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'attendance' AND column_name = 'class_id') THEN
        CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_attendance_class_status_date ON attendance(class_id, status, date DESC);
    END IF;
END $$;

-- Attendance status filtering
CREATE INDEX IF NOT EXISTS idx_attendance_status 
ON attendance(status, date DESC);

-- ============================================================================
-- TEACHER CLASS ASSIGNMENTS
-- Sequential query bottleneck (4 calls = 3.7s)
-- ============================================================================

-- Teacher assignment lookups (active assignments)
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher 
ON teacher_class_assignments(teacher_id, is_active) 
WHERE is_active = true;

-- School-wide teacher queries
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school 
ON teacher_class_assignments(school_id, is_active) 
WHERE is_active = true;

-- Class teacher lookups
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class 
ON teacher_class_assignments(class_id, is_active) 
WHERE is_active = true;

-- Academic year filtering (conditional - only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teacher_class_assignments' 
    AND column_name = 'academic_year'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments_year 
    ON teacher_class_assignments(academic_year, is_active) 
    WHERE is_active = true;
  END IF;
END $$;

-- ============================================================================
-- ASSESSMENTS TABLE INDEXES
-- N+1 query pattern identified
-- ============================================================================

-- Student assessments ordered by date - conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'student_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assessments_student_date 
    ON assessments(student_id, created_at DESC);
  END IF;
END $$;

-- Class assessments (conditional)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'class_id') THEN
        CREATE INDEX IF NOT EXISTS idx_assessments_class_date ON assessments(class_id, created_at DESC);
    END IF;
END $$;

-- Subject-based queries - conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'subject'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assessments_subject 
    ON assessments(subject, created_at DESC);
  END IF;
END $$;

-- Grade filtering with date - conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'grade'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assessments_grade_date 
    ON assessments(grade, created_at DESC) 
    WHERE grade IS NOT NULL;
  END IF;
END $$;

-- Assessment type filtering - conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'assessment_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assessments_type_date 
    ON assessments(assessment_type, created_at DESC) 
    WHERE assessment_type IS NOT NULL;
  END IF;
END $$;

-- Composite for student subject performance - conditional (both columns)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'student_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'subject'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assessments_student_subject 
    ON assessments(student_id, subject, created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- STUDENT ACTIVITY TABLE INDEXES
-- High-frequency logging table (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  -- Only create indexes if student_activity table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'student_activity'
  ) THEN
    -- Student activity timeline
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_activity' AND column_name = 'student_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_student_activity_student_time 
      ON student_activity(student_id, timestamp DESC);
    END IF;

    -- Activity type filtering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_activity' AND column_name = 'activity_type'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_student_activity_type 
      ON student_activity(activity_type, timestamp DESC);
    END IF;

    -- School-wide activity monitoring
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_activity' AND column_name = 'school_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_student_activity_school 
      ON student_activity(school_id, timestamp DESC) 
      WHERE school_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- MESSAGES & COMMUNICATIONS
-- Real-time messaging performance (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  -- Only create indexes if messages table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'messages'
  ) THEN
    -- Sender messages
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'sender_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_sender_time 
      ON messages(sender_id, created_at DESC);
    END IF;

    -- Recipient messages
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'recipient_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_time 
      ON messages(recipient_id, created_at DESC);
      
      -- Unread messages (composite)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'is_read'
      ) THEN
        CREATE INDEX IF NOT EXISTS idx_messages_recipient_read 
        ON messages(recipient_id, is_read, created_at DESC);
      END IF;
    END IF;

    -- Thread-based messages
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'thread_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_thread 
      ON messages(thread_id, created_at ASC) 
      WHERE thread_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- WALLET / CREDITS SYSTEM
-- Transaction history queries (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wallet_transactions'
  ) THEN
    -- Student wallet balance queries
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'wallet_transactions' AND column_name = 'student_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_student 
      ON wallet_transactions(student_id, created_at DESC);
    END IF;

    -- Transaction type filtering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'wallet_transactions' AND column_name = 'transaction_type'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type 
      ON wallet_transactions(transaction_type, created_at DESC);
    END IF;

    -- Pending transactions
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'wallet_transactions' AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status 
      ON wallet_transactions(status, created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ACHIEVEMENTS & PROGRESS
-- Gamification system queries (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  -- Only create indexes if student_achievements table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'student_achievements'
  ) THEN
    -- Student achievements by earned date
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'student_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'earned_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_achievements_student 
      ON student_achievements(student_id, earned_at DESC);
    END IF;

    -- Achievement type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'achievement_type'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'earned_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_achievements_type 
      ON student_achievements(achievement_type, earned_at DESC);
    END IF;

    -- School-wide achievements
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'school_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_achievements' AND column_name = 'earned_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_achievements_school 
      ON student_achievements(school_id, earned_at DESC) 
      WHERE school_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- BLACK MARKS / INCIDENTS
-- Discipline tracking (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'black_marks'
  ) THEN
    -- Student black marks
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'black_marks' AND column_name = 'student_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_black_marks_student 
      ON black_marks(student_id, created_at DESC);
    END IF;

    -- Active/resolved filtering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'black_marks' AND column_name = 'is_resolved'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_black_marks_resolved 
      ON black_marks(is_resolved, created_at DESC);
    END IF;

    -- Severity filtering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'black_marks' AND column_name = 'severity'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_black_marks_severity 
      ON black_marks(severity, created_at DESC) 
      WHERE severity IS NOT NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ANNOUNCEMENTS
-- Broadcast messaging (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'announcements'
  ) THEN
    -- School announcements by date
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'announcements' AND column_name = 'school_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_announcements_school_date 
      ON announcements(school_id, created_at DESC);
    END IF;

    -- Target audience filtering
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'announcements' AND column_name = 'target_audience'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_announcements_target 
      ON announcements(target_audience, created_at DESC);
    END IF;

    -- Active announcements
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'announcements' AND column_name = 'is_active'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_announcements_active 
      ON announcements(is_active, created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- POLLS & SURVEYS
-- Engagement tracking (conditional - tables may not exist)
-- ============================================================================

DO $$
BEGIN
  -- Polls table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'polls'
  ) THEN
    -- School polls
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'polls' AND column_name = 'school_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'polls' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_polls_school_date 
      ON polls(school_id, created_at DESC);
    END IF;

    -- Active polls
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'polls' AND column_name = 'is_active'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'polls' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_polls_active 
      ON polls(is_active, created_at DESC);
    END IF;
  END IF;

  -- Poll responses table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'poll_responses'
  ) THEN
    -- Poll responses by poll
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'poll_responses' AND column_name = 'poll_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'poll_responses' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_poll_responses_poll 
      ON poll_responses(poll_id, created_at DESC);
    END IF;

    -- User responses
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'poll_responses' AND column_name = 'user_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'poll_responses' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_poll_responses_user 
      ON poll_responses(user_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SCHOOLS TABLE
-- Organization queries (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'schools'
  ) THEN
    -- School code lookup (unique, fast access)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'schools' AND column_name = 'school_code'
    ) THEN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_code 
      ON schools(school_code);
    END IF;

    -- Active schools
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'schools' AND column_name = 'is_active'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_schools_active 
      ON schools(is_active) 
      WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PARENT-CHILD RELATIONSHIPS
-- Family linking (conditional - table may not exist)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'parent_child_relationships'
  ) THEN
    -- Parent's children
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parent_child_relationships' AND column_name = 'parent_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parent_child_relationships' AND column_name = 'is_active'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_parent_child_parent 
      ON parent_child_relationships(parent_id, is_active) 
      WHERE is_active = true;
    END IF;

    -- Child's parents
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parent_child_relationships' AND column_name = 'child_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parent_child_relationships' AND column_name = 'is_active'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_parent_child_child 
      ON parent_child_relationships(child_id, is_active) 
      WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- Updates statistics for better query plans (conditional on table existence)
-- ============================================================================

DO $$
BEGIN
  -- Only analyze tables that exist in public schema
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE 'ANALYZE profiles';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
    EXECUTE 'ANALYZE attendance';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_class_assignments') THEN
    EXECUTE 'ANALYZE teacher_class_assignments';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assessments') THEN
    EXECUTE 'ANALYZE assessments';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_activity') THEN
    EXECUTE 'ANALYZE student_activity';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    EXECUTE 'ANALYZE messages';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_transactions') THEN
    EXECUTE 'ANALYZE wallet_transactions';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_achievements') THEN
    EXECUTE 'ANALYZE student_achievements';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'black_marks') THEN
    EXECUTE 'ANALYZE black_marks';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN
    EXECUTE 'ANALYZE announcements';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'polls') THEN
    EXECUTE 'ANALYZE polls';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'poll_responses') THEN
    EXECUTE 'ANALYZE poll_responses';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') THEN
    EXECUTE 'ANALYZE schools';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parent_child_relationships') THEN
    EXECUTE 'ANALYZE parent_child_relationships';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify index creation
-- ============================================================================

-- Check all indexes on profiles table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'profiles';

-- Check index usage statistics
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To remove all indexes created by this migration:
/*
DROP INDEX IF EXISTS idx_profiles_user_id;
DROP INDEX IF EXISTS idx_profiles_school_id;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_school_role;
DROP INDEX IF EXISTS idx_profiles_class_id;
DROP INDEX IF EXISTS idx_profiles_email;
-- ... (add all other indexes)
*/
