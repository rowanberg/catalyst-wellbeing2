-- Incident Logs Schema for Teacher Dashboard
-- Secure, private logging system for behavioral and academic observations

-- Create incident_logs table
CREATE TABLE IF NOT EXISTS incident_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Incident details
  incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
    'behavioral', 'academic', 'social', 'attendance', 'safety', 'positive', 'other'
  )),
  severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN (
    'low', 'medium', 'high', 'critical'
  )),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Context and follow-up
  location VARCHAR(100),
  witnesses TEXT[],
  action_taken TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Privacy and access control
  is_confidential BOOLEAN DEFAULT true,
  visible_to_admin BOOLEAN DEFAULT true,
  visible_to_counselor BOOLEAN DEFAULT false,
  parent_notified BOOLEAN DEFAULT false,
  parent_notification_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure teacher and student are from same school
  CONSTRAINT incident_logs_school_consistency CHECK (
    (SELECT school_id FROM profiles WHERE id = student_id) = school_id AND
    (SELECT school_id FROM profiles WHERE id = teacher_id) = school_id
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incident_logs_student_id ON incident_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_teacher_id ON incident_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_school_id ON incident_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_incident_logs_created_at ON incident_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_logs_type_severity ON incident_logs(incident_type, severity_level);
CREATE INDEX IF NOT EXISTS idx_incident_logs_follow_up ON incident_logs(follow_up_required, follow_up_date) WHERE follow_up_required = true;

-- Row Level Security (RLS) policies
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;

-- Teachers can only see logs they created for students in their school
CREATE POLICY "Teachers can view their own incident logs" ON incident_logs
  FOR SELECT USING (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher' 
      AND school_id = incident_logs.school_id
    )
  );

-- Teachers can create logs for students in their school
CREATE POLICY "Teachers can create incident logs" ON incident_logs
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher' 
      AND school_id = incident_logs.school_id
    ) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = student_id 
      AND role = 'student' 
      AND school_id = incident_logs.school_id
    )
  );

-- Teachers can update their own logs
CREATE POLICY "Teachers can update their own incident logs" ON incident_logs
  FOR UPDATE USING (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher' 
      AND school_id = incident_logs.school_id
    )
  );

-- Admins can view all logs in their school
CREATE POLICY "Admins can view all incident logs in their school" ON incident_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND school_id = incident_logs.school_id
    ) AND
    visible_to_admin = true
  );

-- Counselors can view logs they have access to
CREATE POLICY "Counselors can view accessible incident logs" ON incident_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'counselor' 
      AND school_id = incident_logs.school_id
    ) AND
    visible_to_counselor = true
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incident_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_incident_logs_updated_at
  BEFORE UPDATE ON incident_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_logs_updated_at();

-- Create view for incident log summaries
CREATE OR REPLACE VIEW incident_log_summaries AS
SELECT 
  il.id,
  il.student_id,
  il.teacher_id,
  il.school_id,
  il.incident_type,
  il.severity_level,
  il.title,
  il.created_at,
  il.follow_up_required,
  il.follow_up_date,
  s.first_name || ' ' || s.last_name AS student_name,
  s.grade_level,
  s.class_name,
  t.first_name || ' ' || t.last_name AS teacher_name
FROM incident_logs il
JOIN profiles s ON il.student_id = s.id
JOIN profiles t ON il.teacher_id = t.id
WHERE il.archived_at IS NULL
ORDER BY il.created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON incident_logs TO authenticated;
GRANT SELECT ON incident_log_summaries TO authenticated;
