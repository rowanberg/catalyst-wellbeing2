-- =====================================================
-- FIX RLS AUTH PERFORMANCE - PART 2: Attendance & Performance
-- =====================================================

-- ==================== ATTENDANCE_RECORDS ====================
DROP POLICY IF EXISTS "Parents view children attendance" ON attendance_records;
CREATE POLICY "Parents view children attendance" ON attendance_records
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== PERFORMANCE_BENCHMARKS ====================
DROP POLICY IF EXISTS "Parents view benchmarks" ON performance_benchmarks;
CREATE POLICY "Parents view benchmarks" ON performance_benchmarks
  FOR SELECT USING (
    school_id IN (
      SELECT p.school_id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parents can view benchmarks for their children's school" ON performance_benchmarks;
CREATE POLICY "Parents can view benchmarks for their children's school" ON performance_benchmarks
  FOR SELECT USING (
    school_id IN (
      SELECT p.school_id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "parent_view_school_benchmarks" ON performance_benchmarks;
CREATE POLICY "parent_view_school_benchmarks" ON performance_benchmarks
  FOR SELECT USING (
    school_id IN (
      SELECT p.school_id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== ATTENDANCE ====================
DROP POLICY IF EXISTS "Parents can view their children's attendance_test" ON attendance;
CREATE POLICY "Parents can view their children's attendance_test" ON attendance
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "teachers_select_attendance" ON attendance;
CREATE POLICY "teachers_select_attendance" ON attendance
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM teacher_class_assignments 
      WHERE teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "teachers_insert_attendance" ON attendance;
CREATE POLICY "teachers_insert_attendance" ON attendance
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT class_id FROM teacher_class_assignments 
      WHERE teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "teachers_update_attendance" ON attendance;
CREATE POLICY "teachers_update_attendance" ON attendance
  FOR UPDATE USING (
    class_id IN (
      SELECT class_id FROM teacher_class_assignments 
      WHERE teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "teachers_delete_attendance" ON attendance;
CREATE POLICY "teachers_delete_attendance" ON attendance
  FOR DELETE USING (
    class_id IN (
      SELECT class_id FROM teacher_class_assignments 
      WHERE teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "parents_select_attendance" ON attendance;
CREATE POLICY "parents_select_attendance" ON attendance
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== STUDENT_WALLETS ====================
DROP POLICY IF EXISTS "Parents can view their children's wallets" ON student_wallets;
CREATE POLICY "Parents can view their children's wallets" ON student_wallets
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== STUDENT_ACHIEVEMENTS ====================
DROP POLICY IF EXISTS "Parents can view their children's achievements" ON student_achievements;
CREATE POLICY "Parents can view their children's achievements" ON student_achievements
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== CLASSES ====================
DROP POLICY IF EXISTS "parent_view_child_classes" ON classes;
CREATE POLICY "parent_view_child_classes" ON classes
  FOR SELECT USING (
    id IN (
      SELECT sca.class_id FROM student_class_assignments sca
      JOIN parent_child_relationships pcr ON pcr.child_id = (
        SELECT user_id FROM profiles WHERE id = sca.student_id
      )
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

-- ==================== STUDENT_CLASS_ASSIGNMENTS ====================
DROP POLICY IF EXISTS "parent_view_child_schedule" ON student_class_assignments;
CREATE POLICY "parent_view_child_schedule" ON student_class_assignments
  FOR SELECT USING (
    student_id IN (
      SELECT p.id FROM profiles p
      JOIN parent_child_relationships pcr ON pcr.child_id = p.user_id
      WHERE pcr.parent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students can view their own class assignments" ON student_class_assignments;
CREATE POLICY "Students can view their own class assignments" ON student_class_assignments
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can view class assignments for their classes" ON student_class_assignments;
CREATE POLICY "Teachers can view class assignments for their classes" ON student_class_assignments
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM teacher_class_assignments
      WHERE teacher_id IN (
        SELECT id FROM profiles WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admins can view student class assignments in their school" ON student_class_assignments;
CREATE POLICY "Admins can view student class assignments in their school" ON student_class_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin' 
      AND school_id = student_class_assignments.school_id
    )
  );

DROP POLICY IF EXISTS "School admins can view their school's student class assignments" ON student_class_assignments;
CREATE POLICY "School admins can view their school's student class assignments" ON student_class_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = (select auth.uid()) 
      AND role = 'admin' 
      AND school_id = student_class_assignments.school_id
    )
  );

-- ==================== PARENT_CHILD_RELATIONSHIPS ====================
DROP POLICY IF EXISTS "parents_read_own_relationships" ON parent_child_relationships;
CREATE POLICY "parents_read_own_relationships" ON parent_child_relationships
  FOR SELECT USING (
    parent_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "parents_query_relationships" ON parent_child_relationships;
CREATE POLICY "parents_query_relationships" ON parent_child_relationships
  FOR SELECT USING (
    parent_id = (select auth.uid())
  );

SELECT 'Part 2 Complete: Attendance & Performance RLS policies optimized' as status;
