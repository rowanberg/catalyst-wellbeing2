-- =====================================================
-- WELLBEING INTERVENTIONS SYSTEM
-- Comprehensive tables for tracking student interventions
-- =====================================================

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS public.intervention_follow_ups CASCADE;
DROP TABLE IF EXISTS public.intervention_actions CASCADE;
DROP TABLE IF EXISTS public.intervention_participants CASCADE;
DROP TABLE IF EXISTS public.student_interventions CASCADE;
DROP TYPE IF EXISTS intervention_priority CASCADE;
DROP TYPE IF EXISTS intervention_status CASCADE;
DROP TYPE IF EXISTS intervention_action_type CASCADE;
DROP TYPE IF EXISTS follow_up_outcome CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

-- Priority levels for interventions
CREATE TYPE intervention_priority AS ENUM ('urgent', 'high', 'medium', 'low');

-- Status of interventions
CREATE TYPE intervention_status AS ENUM (
  'pending',        -- Created but not yet started
  'in_progress',    -- Currently being implemented
  'completed',      -- Successfully completed
  'cancelled',      -- Cancelled/no longer needed
  'on_hold'         -- Temporarily paused
);

-- Types of intervention actions/strategies
CREATE TYPE intervention_action_type AS ENUM (
  'counseling',
  'parent_contact',
  'wellness_plan',
  'support_teacher',
  'peer_support',
  'mental_health',
  'academic_support',
  'priority_checkin',
  'school_counselor',
  'break_schedule'
);

-- Outcome of follow-up sessions
CREATE TYPE follow_up_outcome AS ENUM (
  'improved',
  'no_change',
  'declined',
  'requires_escalation'
);

-- =====================================================
-- MAIN INTERVENTION TABLE
-- =====================================================

CREATE TABLE public.student_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  
  -- School Context
  school_id UUID NOT NULL,
  
  -- Intervention Details
  priority intervention_priority NOT NULL DEFAULT 'high',
  status intervention_status NOT NULL DEFAULT 'pending',
  
  -- Risk Assessment
  risk_level TEXT,
  risk_score NUMERIC(5,2),
  overall_wellbeing_score NUMERIC(5,2),
  
  -- Additional Information
  notes TEXT,
  special_instructions TEXT,
  
  -- Metadata
  created_by UUID NOT NULL,  -- Admin/staff who created it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Implementation Timeline
  scheduled_start_date DATE,
  actual_start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  
  -- Outcome Tracking
  outcome_summary TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  
  -- Foreign Keys
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_school FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- INTERVENTION ACTIONS/STRATEGIES
-- =====================================================

CREATE TABLE public.intervention_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to main intervention
  intervention_id UUID NOT NULL,
  
  -- Action Details
  action_type intervention_action_type NOT NULL,
  action_label TEXT NOT NULL,
  action_description TEXT,
  
  -- Implementation
  assigned_to UUID,  -- Staff member responsible
  status intervention_status NOT NULL DEFAULT 'pending',
  
  -- Timeline
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date DATE,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  -- Notes and Outcomes
  implementation_notes TEXT,
  outcome TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_intervention FOREIGN KEY (intervention_id) REFERENCES public.student_interventions(id) ON DELETE CASCADE,
  CONSTRAINT fk_assigned_to FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- INTERVENTION PARTICIPANTS
-- Track all staff/parents involved in intervention
-- =====================================================

CREATE TABLE public.intervention_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to intervention
  intervention_id UUID NOT NULL,
  
  -- Participant Information
  participant_id UUID,  -- User ID if they have an account
  participant_name TEXT NOT NULL,
  participant_role TEXT NOT NULL,  -- 'counselor', 'teacher', 'parent', 'administrator'
  participant_email TEXT,
  participant_phone TEXT,
  
  -- Involvement
  involvement_type TEXT,  -- 'primary', 'supporting', 'informed'
  responsibilities TEXT,
  
  -- Notifications
  notify_on_updates BOOLEAN DEFAULT false,
  
  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  added_by UUID,
  
  -- Foreign Keys
  CONSTRAINT fk_intervention FOREIGN KEY (intervention_id) REFERENCES public.student_interventions(id) ON DELETE CASCADE,
  CONSTRAINT fk_participant FOREIGN KEY (participant_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_added_by FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- FOLLOW-UP SESSIONS
-- Track progress and updates
-- =====================================================

CREATE TABLE public.intervention_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to intervention
  intervention_id UUID NOT NULL,
  
  -- Follow-up Details
  follow_up_date DATE NOT NULL,
  follow_up_type TEXT,  -- 'scheduled', 'emergency', 'routine'
  
  -- Conducted By
  conducted_by UUID,
  conducted_by_name TEXT,
  
  -- Assessment
  outcome follow_up_outcome,
  progress_notes TEXT NOT NULL,
  concerns TEXT,
  
  -- Wellbeing Scores (at time of follow-up)
  emotional_score NUMERIC(5,2),
  academic_score NUMERIC(5,2),
  engagement_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  
  -- Actions Taken
  actions_taken TEXT,
  next_steps TEXT,
  next_follow_up_date DATE,
  
  -- Attachments/Evidence
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT fk_intervention FOREIGN KEY (intervention_id) REFERENCES public.student_interventions(id) ON DELETE CASCADE,
  CONSTRAINT fk_conducted_by FOREIGN KEY (conducted_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Main interventions table
CREATE INDEX idx_interventions_student ON public.student_interventions(student_id);
CREATE INDEX idx_interventions_school ON public.student_interventions(school_id);
CREATE INDEX idx_interventions_status ON public.student_interventions(status);
CREATE INDEX idx_interventions_priority ON public.student_interventions(priority);
CREATE INDEX idx_interventions_created_at ON public.student_interventions(created_at DESC);
CREATE INDEX idx_interventions_risk_level ON public.student_interventions(risk_level);

-- Intervention actions
CREATE INDEX idx_actions_intervention ON public.intervention_actions(intervention_id);
CREATE INDEX idx_actions_assigned_to ON public.intervention_actions(assigned_to);
CREATE INDEX idx_actions_status ON public.intervention_actions(status);
CREATE INDEX idx_actions_due_date ON public.intervention_actions(due_date);

-- Participants
CREATE INDEX idx_participants_intervention ON public.intervention_participants(intervention_id);
CREATE INDEX idx_participants_user ON public.intervention_participants(participant_id);
CREATE INDEX idx_participants_role ON public.intervention_participants(participant_role);

-- Follow-ups
CREATE INDEX idx_followups_intervention ON public.intervention_follow_ups(intervention_id);
CREATE INDEX idx_followups_date ON public.intervention_follow_ups(follow_up_date);
CREATE INDEX idx_followups_outcome ON public.intervention_follow_ups(outcome);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all intervention tables
CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON public.student_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.intervention_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_followups_updated_at
  BEFORE UPDATE ON public.intervention_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.student_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_follow_ups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Student Interventions Policies
CREATE POLICY "Admins can view all interventions in their school"
  ON public.student_interventions FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create interventions in their school"
  ON public.student_interventions FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update interventions in their school"
  ON public.student_interventions FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view interventions for their students"
  ON public.student_interventions FOR SELECT
  USING (
    student_id IN (
      SELECT sca.student_id 
      FROM public.student_class_assignments sca
      JOIN public.teacher_class_assignments tca ON tca.class_id = sca.class_id
      WHERE tca.teacher_id = auth.uid() AND tca.is_active = true
    )
  );

CREATE POLICY "Students can view their own interventions"
  ON public.student_interventions FOR SELECT
  USING (student_id = auth.uid());

-- Intervention Actions Policies
CREATE POLICY "Staff can view actions for interventions they can see"
  ON public.intervention_actions FOR SELECT
  USING (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
      )
    )
  );

CREATE POLICY "Admins can manage intervention actions"
  ON public.intervention_actions FOR ALL
  USING (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Participants Policies
CREATE POLICY "Staff can view participants"
  ON public.intervention_participants FOR SELECT
  USING (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
      )
    )
  );

CREATE POLICY "Admins can manage participants"
  ON public.intervention_participants FOR ALL
  USING (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Follow-ups Policies
CREATE POLICY "Staff can view follow-ups"
  ON public.intervention_follow_ups FOR SELECT
  USING (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
      )
    )
  );

CREATE POLICY "Staff can create follow-ups"
  ON public.intervention_follow_ups FOR INSERT
  WITH CHECK (
    intervention_id IN (
      SELECT id FROM public.student_interventions
      WHERE school_id IN (
        SELECT school_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
      )
    )
  );

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for active interventions with full details
CREATE OR REPLACE VIEW public.active_interventions_view AS
SELECT 
  si.id,
  si.student_id,
  si.student_name,
  si.school_id,
  si.priority,
  si.status,
  si.risk_level,
  si.risk_score,
  si.overall_wellbeing_score,
  si.notes,
  si.created_at,
  si.updated_at,
  si.scheduled_start_date,
  si.target_completion_date,
  -- Count of actions
  COUNT(DISTINCT ia.id) as total_actions,
  COUNT(DISTINCT ia.id) FILTER (WHERE ia.status = 'completed') as completed_actions,
  -- Count of follow-ups
  COUNT(DISTINCT if_up.id) as total_followups,
  -- Latest follow-up
  MAX(if_up.follow_up_date) as last_followup_date,
  -- Participants
  ARRAY_AGG(DISTINCT ip.participant_name) as participants
FROM public.student_interventions si
LEFT JOIN public.intervention_actions ia ON ia.intervention_id = si.id
LEFT JOIN public.intervention_follow_ups if_up ON if_up.intervention_id = si.id
LEFT JOIN public.intervention_participants ip ON ip.intervention_id = si.id
WHERE si.status IN ('pending', 'in_progress')
GROUP BY si.id;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to automatically create intervention actions from an array
CREATE OR REPLACE FUNCTION create_intervention_with_actions(
  p_student_id UUID,
  p_student_name TEXT,
  p_school_id UUID,
  p_priority intervention_priority,
  p_risk_level TEXT,
  p_risk_score NUMERIC,
  p_notes TEXT,
  p_created_by UUID,
  p_action_types intervention_action_type[]
)
RETURNS UUID AS $$
DECLARE
  v_intervention_id UUID;
  v_action_type intervention_action_type;
  v_action_label TEXT;
  v_action_description TEXT;
BEGIN
  -- Create the main intervention
  INSERT INTO public.student_interventions (
    student_id,
    student_name,
    school_id,
    priority,
    risk_level,
    risk_score,
    notes,
    created_by
  ) VALUES (
    p_student_id,
    p_student_name,
    p_school_id,
    p_priority,
    p_risk_level,
    p_risk_score,
    p_notes,
    p_created_by
  )
  RETURNING id INTO v_intervention_id;
  
  -- Create intervention actions for each type
  FOREACH v_action_type IN ARRAY p_action_types
  LOOP
    -- Get label and description based on type
    v_action_label := CASE v_action_type
      WHEN 'counseling' THEN 'Schedule Counseling Session'
      WHEN 'parent_contact' THEN 'Contact Parents/Guardians'
      WHEN 'wellness_plan' THEN 'Create Wellness Plan'
      WHEN 'support_teacher' THEN 'Assign Support Teacher'
      WHEN 'peer_support' THEN 'Peer Support Group'
      WHEN 'mental_health' THEN 'Mental Health Resources'
      WHEN 'academic_support' THEN 'Academic Tutoring'
      WHEN 'priority_checkin' THEN 'Priority Daily Check-in'
      WHEN 'school_counselor' THEN 'Refer to School Counselor'
      WHEN 'break_schedule' THEN 'Adjusted Schedule'
    END;
    
    v_action_description := CASE v_action_type
      WHEN 'counseling' THEN 'One-on-one session with school counselor'
      WHEN 'parent_contact' THEN 'Notify and involve family members'
      WHEN 'wellness_plan' THEN 'Personalized wellbeing action plan'
      WHEN 'support_teacher' THEN 'Dedicated teacher for additional support'
      WHEN 'peer_support' THEN 'Connect with peer support network'
      WHEN 'mental_health' THEN 'Provide mental health materials and contacts'
      WHEN 'academic_support' THEN 'Additional academic assistance'
      WHEN 'priority_checkin' THEN 'Daily wellbeing monitoring'
      WHEN 'school_counselor' THEN 'Professional counseling referral'
      WHEN 'break_schedule' THEN 'Modified schedule for wellbeing'
    END;
    
    INSERT INTO public.intervention_actions (
      intervention_id,
      action_type,
      action_label,
      action_description
    ) VALUES (
      v_intervention_id,
      v_action_type,
      v_action_label,
      v_action_description
    );
  END LOOP;
  
  RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.student_interventions IS 'Main table for tracking student wellbeing interventions';
COMMENT ON TABLE public.intervention_actions IS 'Individual intervention actions/strategies that make up an intervention plan';
COMMENT ON TABLE public.intervention_participants IS 'Staff, parents, and other stakeholders involved in interventions';
COMMENT ON TABLE public.intervention_follow_ups IS 'Follow-up sessions and progress tracking for interventions';

COMMENT ON COLUMN public.student_interventions.priority IS 'Urgency level: urgent, high, medium, or low';
COMMENT ON COLUMN public.student_interventions.status IS 'Current status: pending, in_progress, completed, cancelled, or on_hold';
COMMENT ON COLUMN public.student_interventions.effectiveness_rating IS 'Rating from 1-5 indicating how effective the intervention was';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.student_interventions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intervention_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intervention_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.intervention_follow_ups TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
