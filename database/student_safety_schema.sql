-- Student Safety Management System Schema
-- This schema handles safety incidents, digital safety monitoring, and prevention programs

-- Safety Incidents Table
CREATE TABLE safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('bullying', 'cyberbullying', 'inappropriate_content', 'safety_concern', 'harassment', 'violence', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'escalated', 'closed')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  witness_accounts JSONB DEFAULT '[]',
  evidence_files JSONB DEFAULT '[]',
  reported_by_id UUID REFERENCES profiles(id),
  reported_by_type TEXT CHECK (reported_by_type IN ('student', 'teacher', 'parent', 'admin', 'anonymous')),
  assigned_to_id UUID REFERENCES profiles(id),
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  is_anonymous BOOLEAN DEFAULT FALSE,
  parent_notified BOOLEAN DEFAULT FALSE,
  parent_notification_date TIMESTAMPTZ,
  resolution_notes TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Safety Actions Table (tracks actions taken for each incident)
CREATE TABLE safety_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES safety_incidents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('investigation', 'interview', 'mediation', 'counseling', 'disciplinary', 'parent_contact', 'law_enforcement', 'follow_up', 'other')),
  description TEXT NOT NULL,
  taken_by_id UUID NOT NULL REFERENCES profiles(id),
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  outcome TEXT,
  next_steps TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital Safety Monitoring Table
CREATE TABLE digital_safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_date TIMESTAMPTZ DEFAULT NOW(),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  flagged_content_count INTEGER DEFAULT 0,
  content_categories JSONB DEFAULT '[]', -- ['inappropriate_language', 'bullying', 'violence', etc.]
  platforms_checked JSONB DEFAULT '[]', -- ['email', 'chat', 'social_media', etc.]
  ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score BETWEEN 0 AND 1),
  manual_review_required BOOLEAN DEFAULT FALSE,
  parent_notified BOOLEAN DEFAULT FALSE,
  parent_notification_date TIMESTAMPTZ,
  reviewed_by_id UUID REFERENCES profiles(id),
  review_notes TEXT,
  false_positive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Programs Table
CREATE TABLE safety_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT CHECK (program_type IN ('digital_citizenship', 'anti_bullying', 'peer_mediation', 'conflict_resolution', 'mental_health', 'other')),
  target_grades INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  facilitator_id UUID REFERENCES profiles(id),
  completion_rate DECIMAL(5,2) DEFAULT 0,
  effectiveness_rating DECIMAL(3,2) CHECK (effectiveness_rating BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Program Participation Table
CREATE TABLE student_program_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES safety_programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  completion_status TEXT DEFAULT 'enrolled' CHECK (completion_status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Alerts Table (for real-time notifications)
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('incident_reported', 'high_risk_detected', 'escalation_required', 'follow_up_due', 'system_alert')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_incident_id UUID REFERENCES safety_incidents(id),
  related_student_id UUID REFERENCES profiles(id),
  assigned_to_id UUID REFERENCES profiles(id),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Resources Table
CREATE TABLE safety_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('handbook', 'guideline', 'procedure', 'training_material', 'form', 'contact_info', 'other')),
  target_audience TEXT[] DEFAULT '{}', -- ['students', 'parents', 'teachers', 'administrators']
  file_url TEXT,
  external_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  download_count INTEGER DEFAULT 0,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_safety_incidents_school_id ON safety_incidents(school_id);
CREATE INDEX idx_safety_incidents_student_id ON safety_incidents(student_id);
CREATE INDEX idx_safety_incidents_status ON safety_incidents(status);
CREATE INDEX idx_safety_incidents_severity ON safety_incidents(severity);
CREATE INDEX idx_safety_incidents_created_at ON safety_incidents(created_at);
CREATE INDEX idx_safety_incidents_assigned_to ON safety_incidents(assigned_to_id);

CREATE INDEX idx_safety_actions_incident_id ON safety_actions(incident_id);
CREATE INDEX idx_safety_actions_taken_by ON safety_actions(taken_by_id);

CREATE INDEX idx_digital_safety_checks_school_id ON digital_safety_checks(school_id);
CREATE INDEX idx_digital_safety_checks_student_id ON digital_safety_checks(student_id);
CREATE INDEX idx_digital_safety_checks_risk_level ON digital_safety_checks(risk_level);
CREATE INDEX idx_digital_safety_checks_date ON digital_safety_checks(check_date);

CREATE INDEX idx_safety_programs_school_id ON safety_programs(school_id);
CREATE INDEX idx_safety_programs_active ON safety_programs(is_active);

CREATE INDEX idx_student_program_participation_program_id ON student_program_participation(program_id);
CREATE INDEX idx_student_program_participation_student_id ON student_program_participation(student_id);

CREATE INDEX idx_safety_alerts_school_id ON safety_alerts(school_id);
CREATE INDEX idx_safety_alerts_assigned_to ON safety_alerts(assigned_to_id);
CREATE INDEX idx_safety_alerts_unread ON safety_alerts(is_read) WHERE is_read = FALSE;

-- Row Level Security Policies
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_program_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safety_incidents
CREATE POLICY "Users can view incidents from their school" ON safety_incidents
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and counselors can manage incidents" ON safety_incidents
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'counselor', 'principal')
    )
  );

-- RLS Policies for safety_actions
CREATE POLICY "Users can view actions for incidents in their school" ON safety_actions
  FOR SELECT USING (
    incident_id IN (
      SELECT id FROM safety_incidents 
      WHERE school_id IN (
        SELECT school_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Authorized users can manage actions" ON safety_actions
  FOR ALL USING (
    incident_id IN (
      SELECT id FROM safety_incidents 
      WHERE school_id IN (
        SELECT school_id FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'counselor', 'principal', 'teacher')
      )
    )
  );

-- RLS Policies for digital_safety_checks
CREATE POLICY "Users can view digital checks from their school" ON digital_safety_checks
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage digital safety checks" ON digital_safety_checks
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal')
    )
  );

-- Similar RLS policies for other tables...
CREATE POLICY "School users can view programs" ON safety_programs
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage programs" ON safety_programs
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'principal', 'counselor')
    )
  );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON safety_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_safety_checks_updated_at BEFORE UPDATE ON digital_safety_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_programs_updated_at BEFORE UPDATE ON safety_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_program_participation_updated_at BEFORE UPDATE ON student_program_participation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_alerts_updated_at BEFORE UPDATE ON safety_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for analytics and reporting
CREATE OR REPLACE FUNCTION get_safety_metrics(p_school_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  SELECT json_build_object(
    'total_incidents', (
      SELECT COUNT(*) FROM safety_incidents 
      WHERE school_id = p_school_id 
      AND created_at::date BETWEEN start_date AND end_date
    ),
    'active_incidents', (
      SELECT COUNT(*) FROM safety_incidents 
      WHERE school_id = p_school_id 
      AND status IN ('reported', 'investigating')
    ),
    'resolved_incidents', (
      SELECT COUNT(*) FROM safety_incidents 
      WHERE school_id = p_school_id 
      AND status = 'resolved'
      AND created_at::date BETWEEN start_date AND end_date
    ),
    'high_risk_students', (
      SELECT COUNT(DISTINCT student_id) FROM digital_safety_checks 
      WHERE school_id = p_school_id 
      AND risk_level IN ('high', 'critical')
      AND check_date::date BETWEEN start_date AND end_date
    ),
    'average_response_time', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric, 2)
      FROM safety_incidents 
      WHERE school_id = p_school_id 
      AND status = 'resolved'
      AND resolved_at IS NOT NULL
      AND created_at::date BETWEEN start_date AND end_date
    ),
    'incidents_by_type', (
      SELECT json_object_agg(incident_type, count)
      FROM (
        SELECT incident_type, COUNT(*) as count
        FROM safety_incidents 
        WHERE school_id = p_school_id 
        AND created_at::date BETWEEN start_date AND end_date
        GROUP BY incident_type
      ) t
    ),
    'incidents_by_severity', (
      SELECT json_object_agg(severity, count)
      FROM (
        SELECT severity, COUNT(*) as count
        FROM safety_incidents 
        WHERE school_id = p_school_id 
        AND created_at::date BETWEEN start_date AND end_date
        GROUP BY severity
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student safety profile
CREATE OR REPLACE FUNCTION get_student_safety_profile(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_incidents', (
      SELECT COUNT(*) FROM safety_incidents WHERE student_id = p_student_id
    ),
    'recent_incidents', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'type', incident_type,
          'severity', severity,
          'status', status,
          'created_at', created_at
        )
      )
      FROM (
        SELECT id, incident_type, severity, status, created_at
        FROM safety_incidents 
        WHERE student_id = p_student_id 
        ORDER BY created_at DESC 
        LIMIT 5
      ) recent
    ),
    'digital_safety_risk', (
      SELECT risk_level FROM digital_safety_checks 
      WHERE student_id = p_student_id 
      ORDER BY check_date DESC 
      LIMIT 1
    ),
    'program_participation', (
      SELECT json_agg(
        json_build_object(
          'program_name', sp.name,
          'status', spp.completion_status,
          'progress', spp.progress_percentage
        )
      )
      FROM student_program_participation spp
      JOIN safety_programs sp ON spp.program_id = sp.id
      WHERE spp.student_id = p_student_id
      AND spp.completion_status IN ('enrolled', 'in_progress')
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
