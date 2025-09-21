-- Attendance System Schema
-- This schema handles daily attendance tracking for students

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one attendance record per student per date
  UNIQUE(student_id, date)
);

-- Attendance summary table for quick analytics
CREATE TABLE IF NOT EXISTS attendance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_students INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  late_count INTEGER NOT NULL DEFAULT 0,
  excused_count INTEGER NOT NULL DEFAULT 0,
  attendance_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(school_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- RLS Policies
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- Teachers can view and manage attendance for their school
CREATE POLICY "Teachers can manage attendance for their school" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'teacher' 
      AND profiles.school_id = attendance.school_id
    )
  );

-- Admins can view and manage all attendance for their school
CREATE POLICY "Admins can manage attendance for their school" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = attendance.school_id
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id = attendance.student_id
    )
  );

-- Attendance summary policies
CREATE POLICY "School staff can view attendance summary" ON attendance_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.school_id = attendance_summary.school_id
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "School staff can manage attendance summary" ON attendance_summary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.school_id = attendance_summary.school_id
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Function to update attendance summary when attendance records change
CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing summary for the date and school
  DELETE FROM attendance_summary 
  WHERE school_id = COALESCE(NEW.school_id, OLD.school_id) 
  AND date = COALESCE(NEW.date, OLD.date);
  
  -- Recalculate and insert new summary
  INSERT INTO attendance_summary (
    school_id, 
    date, 
    total_students, 
    present_count, 
    absent_count, 
    late_count, 
    excused_count, 
    attendance_rate
  )
  SELECT 
    school_id,
    date,
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE status = 'present') as present_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    COUNT(*) FILTER (WHERE status = 'excused') as excused_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status IN ('present', 'late')) * 100.0 / COUNT(*)), 2)
      ELSE 0.00 
    END as attendance_rate
  FROM attendance 
  WHERE school_id = COALESCE(NEW.school_id, OLD.school_id) 
  AND date = COALESCE(NEW.date, OLD.date)
  GROUP BY school_id, date;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attendance summary
DROP TRIGGER IF EXISTS trigger_update_attendance_summary ON attendance;
CREATE TRIGGER trigger_update_attendance_summary
  AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_summary();

-- Function to get attendance statistics for a date range
CREATE OR REPLACE FUNCTION get_attendance_stats(
  p_school_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  total_students INTEGER,
  present_count INTEGER,
  absent_count INTEGER,
  late_count INTEGER,
  excused_count INTEGER,
  attendance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.date,
    s.total_students,
    s.present_count,
    s.absent_count,
    s.late_count,
    s.excused_count,
    s.attendance_rate
  FROM attendance_summary s
  WHERE s.school_id = p_school_id
  AND s.date BETWEEN p_start_date AND p_end_date
  ORDER BY s.date DESC;
END;
$$ LANGUAGE plpgsql;
