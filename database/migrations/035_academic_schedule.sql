-- Academic Schedule Table
-- Stores all academic events, holidays, exams, deadlines for schools

CREATE TABLE IF NOT EXISTS academic_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Event Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- 'exam', 'assignment', 'holiday', 'event', 'deadline', 'meeting', 'sports', 'cultural'
  
  -- Date & Time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  
  -- Targeting
  target_audience VARCHAR[] DEFAULT ARRAY['student', 'teacher', 'parent']::VARCHAR[], -- Who should see this
  grade_levels VARCHAR[], -- Specific grades (e.g., ['Grade 1', 'Grade 2']) or NULL for all
  sections VARCHAR[], -- Specific sections or NULL for all
  
  -- Academic Details
  subject VARCHAR(100), -- For exams/assignments
  academic_year VARCHAR(20) NOT NULL, -- e.g., '2024-25'
  term VARCHAR(50), -- 'Term 1', 'Semester 1', etc.
  
  -- Status & Metadata
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'completed', 'draft'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  location VARCHAR(255), -- Physical location if applicable
  
  -- Attachments & Links
  attachment_urls TEXT[], -- Links to files, documents
  meeting_link VARCHAR(500), -- Virtual meeting link
  
  -- Notifications
  send_notification BOOLEAN DEFAULT true,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Recurrence (for repeating events)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format (e.g., 'FREQ=WEEKLY;BYDAY=MO,WE,FR')
  parent_event_id UUID REFERENCES academic_schedule(id) ON DELETE CASCADE, -- For recurring event instances
  
  -- Audit
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_academic_schedule_school_id ON academic_schedule(school_id);
CREATE INDEX idx_academic_schedule_start_date ON academic_schedule(start_date);
CREATE INDEX idx_academic_schedule_end_date ON academic_schedule(end_date);
CREATE INDEX idx_academic_schedule_event_type ON academic_schedule(event_type);
CREATE INDEX idx_academic_schedule_status ON academic_schedule(status);
CREATE INDEX idx_academic_schedule_academic_year ON academic_schedule(academic_year);
CREATE INDEX idx_academic_schedule_target_audience ON academic_schedule USING GIN(target_audience);
CREATE INDEX idx_academic_schedule_grade_levels ON academic_schedule USING GIN(grade_levels);

-- RLS Policies
ALTER TABLE academic_schedule ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see events from their school
CREATE POLICY "Users can view their school's schedule"
  ON academic_schedule
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can manage their school's schedule
CREATE POLICY "Admins can manage their school's schedule"
  ON academic_schedule
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Super admins can manage all schedules
CREATE POLICY "Super admins can manage all schedules"
  ON academic_schedule
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_academic_schedule_updated_at
  BEFORE UPDATE ON academic_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE academic_schedule IS 'Stores all academic events, holidays, exams, and deadlines for schools';
COMMENT ON COLUMN academic_schedule.target_audience IS 'Array of roles who should see this event: student, teacher, parent, admin';
COMMENT ON COLUMN academic_schedule.grade_levels IS 'Specific grades for this event, NULL means all grades';
COMMENT ON COLUMN academic_schedule.recurrence_rule IS 'iCalendar RRULE format for recurring events';
