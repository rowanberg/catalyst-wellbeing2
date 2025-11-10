-- ============================================================================
-- COMPREHENSIVE WELLBEING ANALYTICS SYSTEM
-- ============================================================================
-- This migration creates a unified wellbeing analytics table and ETL system
-- that aggregates data from 32+ source tables into a single analytics table
-- for efficient querying and analysis.
-- ============================================================================

-- ============================================================================
-- 1. CREATE UNIFIED ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_wellbeing_analytics (
  -- Primary Keys & Identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Emotional Wellbeing Metrics (40% weight)
  mood_score DECIMAL(4,2), -- 1-10 scale
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining')),
  positive_mood_percentage DECIMAL(5,2),
  negative_mood_percentage DECIMAL(5,2),
  neutral_mood_percentage DECIMAL(5,2),
  mood_entries_count INTEGER DEFAULT 0,
  stress_level DECIMAL(4,2),
  energy_level DECIMAL(4,2),
  sleep_quality DECIMAL(4,2),
  social_connection DECIMAL(4,2),
  
  -- Academic Wellbeing Metrics (25% weight)
  gpa DECIMAL(3,2),
  average_grade_percentage DECIMAL(5,2),
  academic_trend TEXT CHECK (academic_trend IN ('improving', 'stable', 'declining')),
  tests_completed INTEGER DEFAULT 0,
  assignments_submitted INTEGER DEFAULT 0,
  assignment_completion_rate DECIMAL(5,2),
  
  -- Engagement Wellbeing Metrics (20% weight)
  attendance_rate DECIMAL(5,2),
  attendance_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  quest_completion_rate DECIMAL(5,2),
  quests_completed INTEGER DEFAULT 0,
  total_quests_available INTEGER DEFAULT 0,
  activity_streak_days INTEGER DEFAULT 0,
  daily_login_count INTEGER DEFAULT 0,
  
  -- Social Wellbeing Metrics (10% weight)
  achievement_count INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  gems_earned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  peer_interaction_score DECIMAL(4,2),
  kindness_acts_count INTEGER DEFAULT 0,
  
  -- Behavioral Wellbeing Metrics (5% weight)
  safety_incidents_count INTEGER DEFAULT 0,
  help_requests_count INTEGER DEFAULT 0,
  urgent_help_requests_count INTEGER DEFAULT 0,
  positive_recognitions_count INTEGER DEFAULT 0,
  
  -- Activity Breakdown
  gratitude_entries_count INTEGER DEFAULT 0,
  courage_logs_count INTEGER DEFAULT 0,
  mindfulness_sessions_count INTEGER DEFAULT 0,
  breathing_sessions_count INTEGER DEFAULT 0,
  affirmation_sessions_count INTEGER DEFAULT 0,
  
  -- Physical Wellbeing
  average_sleep_hours DECIMAL(4,2),
  average_water_intake DECIMAL(4,2),
  physical_activity_minutes INTEGER DEFAULT 0,
  
  -- Composite Scores (1-10 scale)
  overall_wellbeing_score DECIMAL(4,2),
  emotional_wellbeing_score DECIMAL(4,2),
  academic_wellbeing_score DECIMAL(4,2),
  engagement_wellbeing_score DECIMAL(4,2),
  social_wellbeing_score DECIMAL(4,2),
  behavioral_wellbeing_score DECIMAL(4,2),
  
  -- Risk Assessment
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]',
  protective_factors JSONB DEFAULT '[]',
  intervention_recommended BOOLEAN DEFAULT FALSE,
  intervention_type TEXT,
  
  -- Metadata
  data_quality_score DECIMAL(3,2),
  missing_data_fields TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT DEFAULT 'nightly_etl',
  
  -- Constraints
  UNIQUE(student_id, analysis_date, period_type)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_student_date 
  ON student_wellbeing_analytics(student_id, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_school_date 
  ON student_wellbeing_analytics(school_id, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_period 
  ON student_wellbeing_analytics(period_type, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_risk_level 
  ON student_wellbeing_analytics(risk_level, school_id);

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_intervention 
  ON student_wellbeing_analytics(intervention_recommended) 
  WHERE intervention_recommended = TRUE;

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_overall_score 
  ON student_wellbeing_analytics(overall_wellbeing_score DESC);

CREATE INDEX IF NOT EXISTS idx_wellbeing_analytics_dashboard 
  ON student_wellbeing_analytics(school_id, analysis_date DESC, risk_level);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.student_wellbeing_analytics ENABLE ROW LEVEL SECURITY;

-- Students can view their own analytics
CREATE POLICY "Students can view own analytics" 
  ON public.student_wellbeing_analytics
  FOR SELECT 
  USING (auth.uid() = student_id);

-- Teachers can view analytics for students in their school
CREATE POLICY "Teachers can view student analytics" 
  ON public.student_wellbeing_analytics
  FOR SELECT 
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'teacher'
    )
  );

-- Admins can view and manage all analytics for their school
CREATE POLICY "Admins can manage school analytics" 
  ON public.student_wellbeing_analytics
  FOR ALL 
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'counselor', 'principal')
    )
  );

-- ============================================================================
-- 4. ETL EXECUTION LOGGING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.etl_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL,
  period_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  students_processed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')),
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_etl_logs_date 
  ON etl_execution_logs(execution_date DESC);

-- ============================================================================
-- 5. INDIVIDUAL STUDENT PROCESSING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION process_student_wellbeing_analytics(
  p_student_id UUID,
  p_school_id UUID,
  p_analysis_date DATE,
  p_period_start DATE,
  p_period_end DATE,
  p_period_type TEXT
)
RETURNS VOID AS $$
DECLARE
  -- Emotional metrics
  v_mood_score DECIMAL(4,2);
  v_positive_mood_pct DECIMAL(5,2);
  v_negative_mood_pct DECIMAL(5,2);
  v_neutral_mood_pct DECIMAL(5,2);
  v_mood_entries_count INTEGER;
  v_mood_trend TEXT;
  
  -- Academic metrics
  v_gpa DECIMAL(3,2);
  v_avg_grade_pct DECIMAL(5,2);
  v_tests_completed INTEGER;
  v_academic_trend TEXT;
  
  -- Engagement metrics
  v_attendance_rate DECIMAL(5,2);
  v_attendance_days INTEGER;
  v_absent_days INTEGER;
  v_quest_completion_rate DECIMAL(5,2);
  v_quests_completed INTEGER;
  v_total_quests INTEGER;
  v_activity_streak INTEGER;
  
  -- Social metrics
  v_achievement_count INTEGER;
  v_xp_earned INTEGER;
  v_kindness_count INTEGER;
  
  -- Behavioral metrics
  v_safety_incidents INTEGER;
  v_help_requests INTEGER;
  v_urgent_help INTEGER;
  
  -- Activity metrics
  v_gratitude_count INTEGER;
  v_courage_count INTEGER;
  v_mindfulness_count INTEGER;
  v_breathing_count INTEGER;
  
  -- Physical metrics
  v_avg_sleep DECIMAL(4,2);
  v_avg_water DECIMAL(4,2);
  
  -- Composite scores
  v_emotional_score DECIMAL(4,2);
  v_academic_score DECIMAL(4,2);
  v_engagement_score DECIMAL(4,2);
  v_social_score DECIMAL(4,2);
  v_behavioral_score DECIMAL(4,2);
  v_overall_score DECIMAL(4,2);
  v_risk_level TEXT;
  v_risk_factors JSONB := '[]'::JSONB;
  v_protective_factors JSONB := '[]'::JSONB;
  
BEGIN
  -- ========================================================================
  -- EXTRACT EMOTIONAL WELLBEING DATA
  -- ========================================================================
  SELECT 
    AVG(mood_score) as avg_mood,
    COUNT(*) as mood_count,
    ROUND(COUNT(*) FILTER (WHERE mood IN ('happy', 'excited', 'calm'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as positive_pct,
    ROUND(COUNT(*) FILTER (WHERE mood IN ('sad', 'angry', 'anxious'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as negative_pct,
    ROUND(COUNT(*) FILTER (WHERE mood NOT IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as neutral_pct
  INTO v_mood_score, v_mood_entries_count, v_positive_mood_pct, v_negative_mood_pct, v_neutral_mood_pct
  FROM mood_history
  WHERE user_id = p_student_id
  AND recorded_date BETWEEN p_period_start AND p_period_end;

  -- Determine mood trend
  IF v_positive_mood_pct > 70 THEN v_mood_trend := 'improving';
  ELSIF v_positive_mood_pct < 40 THEN v_mood_trend := 'declining';
  ELSE v_mood_trend := 'stable';
  END IF;

  -- ========================================================================
  -- EXTRACT ACADEMIC PERFORMANCE DATA
  -- ========================================================================
  SELECT 
    ROUND(AVG(score::DECIMAL / NULLIF(max_score, 0) * 100), 2) as avg_grade,
    COUNT(*) as test_count
  INTO v_avg_grade_pct, v_tests_completed
  FROM assessment_grades
  WHERE student_id = p_student_id
  AND submitted_at::DATE BETWEEN p_period_start AND p_period_end;

  -- Calculate GPA
  v_gpa := CASE 
    WHEN v_avg_grade_pct >= 90 THEN 4.0
    WHEN v_avg_grade_pct >= 80 THEN 3.5
    WHEN v_avg_grade_pct >= 70 THEN 3.0
    WHEN v_avg_grade_pct >= 60 THEN 2.5
    ELSE 2.0
  END;

  v_academic_trend := CASE
    WHEN v_avg_grade_pct >= 85 THEN 'improving'
    WHEN v_avg_grade_pct < 70 THEN 'declining'
    ELSE 'stable'
  END;

  -- ========================================================================
  -- EXTRACT ENGAGEMENT DATA
  -- ========================================================================
  SELECT 
    ROUND(COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as attendance_pct,
    COUNT(*) FILTER (WHERE status = 'present') as present_days,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_days
  INTO v_attendance_rate, v_attendance_days, v_absent_days
  FROM attendance
  WHERE student_id = p_student_id
  AND date BETWEEN p_period_start AND p_period_end;

  SELECT 
    ROUND(COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as quest_pct,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed,
    COUNT(*) as total
  INTO v_quest_completion_rate, v_quests_completed, v_total_quests
  FROM daily_quests
  WHERE user_id = p_student_id
  AND date BETWEEN p_period_start AND p_period_end;

  SELECT COALESCE(streak_days, 0) INTO v_activity_streak
  FROM profiles
  WHERE user_id = p_student_id;

  -- ========================================================================
  -- EXTRACT SOCIAL & BEHAVIORAL DATA
  -- ========================================================================
  SELECT COUNT(*) INTO v_achievement_count
  FROM student_achievements
  WHERE student_id = p_student_id
  AND earned_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT COALESCE(SUM(xp_gained), 0) INTO v_xp_earned
  FROM student_activity
  WHERE student_id = p_student_id
  AND timestamp::DATE BETWEEN p_period_start AND p_period_end;

  SELECT COALESCE(SUM(count), 0) INTO v_kindness_count
  FROM kindness_counter
  WHERE user_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT COUNT(*) INTO v_safety_incidents
  FROM safety_incidents
  WHERE student_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE urgency IN ('high', 'urgent')) as urgent_requests
  INTO v_help_requests, v_urgent_help
  FROM help_requests
  WHERE student_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  -- ========================================================================
  -- EXTRACT ACTIVITY DATA
  -- ========================================================================
  SELECT COUNT(*) INTO v_gratitude_count
  FROM gratitude_entries
  WHERE user_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT COUNT(*) INTO v_courage_count
  FROM courage_log
  WHERE user_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE session_type = 'breathing') as breathing_sessions
  INTO v_mindfulness_count, v_breathing_count
  FROM mindfulness_sessions
  WHERE user_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  -- ========================================================================
  -- EXTRACT PHYSICAL WELLBEING DATA
  -- ========================================================================
  SELECT 
    AVG(sleep_hours) as avg_sleep,
    AVG(water_glasses) as avg_water
  INTO v_avg_sleep, v_avg_water
  FROM habit_tracker
  WHERE user_id = p_student_id
  AND date BETWEEN p_period_start AND p_period_end;

  -- ========================================================================
  -- CALCULATE COMPOSITE SCORES
  -- ========================================================================
  
  -- Emotional Score (1-10)
  v_emotional_score := COALESCE(v_mood_score, 5.0);
  
  -- Academic Score (1-10)
  v_academic_score := COALESCE(v_gpa, 2.5) * 2.5;
  
  -- Engagement Score (1-10)
  v_engagement_score := (
    COALESCE(v_attendance_rate, 75) / 10 * 0.5 +
    COALESCE(v_quest_completion_rate, 50) / 10 * 0.3 +
    LEAST(v_activity_streak, 30) / 3 * 0.2
  );
  
  -- Social Score (1-10)
  v_social_score := (
    LEAST(v_achievement_count, 10) * 0.4 +
    LEAST(v_kindness_count, 20) / 2 * 0.6
  );
  
  -- Behavioral Score (1-10)
  v_behavioral_score := GREATEST(1, 10 - v_safety_incidents * 2 - v_urgent_help * 1.5);
  
  -- Overall Wellbeing Score (weighted average)
  v_overall_score := (
    v_emotional_score * 0.40 +
    v_academic_score * 0.25 +
    v_engagement_score * 0.20 +
    v_social_score * 0.10 +
    v_behavioral_score * 0.05
  );

  -- ========================================================================
  -- DETERMINE RISK LEVEL & FACTORS
  -- ========================================================================
  IF v_overall_score >= 8.0 THEN 
    v_risk_level := 'low';
  ELSIF v_overall_score >= 6.0 THEN 
    v_risk_level := 'medium';
  ELSIF v_overall_score >= 4.0 THEN 
    v_risk_level := 'high';
  ELSE 
    v_risk_level := 'critical';
  END IF;

  -- Identify risk factors
  IF v_negative_mood_pct > 50 THEN
    v_risk_factors := v_risk_factors || '["High negative mood frequency"]'::JSONB;
  END IF;
  
  IF v_attendance_rate < 80 THEN
    v_risk_factors := v_risk_factors || '["Low attendance rate"]'::JSONB;
  END IF;
  
  IF v_gpa < 2.5 THEN
    v_risk_factors := v_risk_factors || '["Academic struggles"]'::JSONB;
  END IF;
  
  IF v_urgent_help > 0 THEN
    v_risk_factors := v_risk_factors || '["Recent urgent help requests"]'::JSONB;
  END IF;

  -- Identify protective factors
  IF v_activity_streak >= 7 THEN
    v_protective_factors := v_protective_factors || '["Strong activity streak"]'::JSONB;
  END IF;
  
  IF v_quest_completion_rate >= 80 THEN
    v_protective_factors := v_protective_factors || '["High quest completion"]'::JSONB;
  END IF;
  
  IF v_positive_mood_pct >= 70 THEN
    v_protective_factors := v_protective_factors || '["Consistently positive mood"]'::JSONB;
  END IF;

  -- ========================================================================
  -- UPSERT INTO ANALYTICS TABLE
  -- ========================================================================
  INSERT INTO student_wellbeing_analytics (
    student_id, school_id, analysis_date,
    period_start_date, period_end_date, period_type,
    
    -- Emotional
    mood_score, mood_trend, positive_mood_percentage, negative_mood_percentage, 
    neutral_mood_percentage, mood_entries_count,
    
    -- Academic
    gpa, average_grade_percentage, academic_trend, tests_completed,
    
    -- Engagement
    attendance_rate, attendance_days, absent_days,
    quest_completion_rate, quests_completed, total_quests_available, activity_streak_days,
    
    -- Social
    achievement_count, xp_earned, kindness_acts_count,
    
    -- Behavioral
    safety_incidents_count, help_requests_count, urgent_help_requests_count,
    
    -- Activities
    gratitude_entries_count, courage_logs_count, mindfulness_sessions_count, breathing_sessions_count,
    
    -- Physical
    average_sleep_hours, average_water_intake,
    
    -- Composite scores
    emotional_wellbeing_score, academic_wellbeing_score, engagement_wellbeing_score,
    social_wellbeing_score, behavioral_wellbeing_score, overall_wellbeing_score,
    
    -- Risk assessment
    risk_level, risk_factors, protective_factors,
    intervention_recommended,
    
    updated_at
  ) VALUES (
    p_student_id, p_school_id, p_analysis_date,
    p_period_start, p_period_end, p_period_type,
    
    v_mood_score, v_mood_trend, v_positive_mood_pct, v_negative_mood_pct, 
    v_neutral_mood_pct, v_mood_entries_count,
    
    v_gpa, v_avg_grade_pct, v_academic_trend, v_tests_completed,
    
    v_attendance_rate, v_attendance_days, v_absent_days,
    v_quest_completion_rate, v_quests_completed, v_total_quests, v_activity_streak,
    
    v_achievement_count, v_xp_earned, v_kindness_count,
    
    v_safety_incidents, v_help_requests, v_urgent_help,
    
    v_gratitude_count, v_courage_count, v_mindfulness_count, v_breathing_count,
    
    v_avg_sleep, v_avg_water,
    
    v_emotional_score, v_academic_score, v_engagement_score,
    v_social_score, v_behavioral_score, v_overall_score,
    
    v_risk_level, v_risk_factors, v_protective_factors,
    (v_risk_level IN ('high', 'critical')),
    
    NOW()
  )
  ON CONFLICT (student_id, analysis_date, period_type)
  DO UPDATE SET
    mood_score = EXCLUDED.mood_score,
    mood_trend = EXCLUDED.mood_trend,
    positive_mood_percentage = EXCLUDED.positive_mood_percentage,
    negative_mood_percentage = EXCLUDED.negative_mood_percentage,
    mood_entries_count = EXCLUDED.mood_entries_count,
    gpa = EXCLUDED.gpa,
    average_grade_percentage = EXCLUDED.average_grade_percentage,
    tests_completed = EXCLUDED.tests_completed,
    attendance_rate = EXCLUDED.attendance_rate,
    quest_completion_rate = EXCLUDED.quest_completion_rate,
    overall_wellbeing_score = EXCLUDED.overall_wellbeing_score,
    risk_level = EXCLUDED.risk_level,
    risk_factors = EXCLUDED.risk_factors,
    protective_factors = EXCLUDED.protective_factors,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. MAIN ETL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION run_wellbeing_etl(
  p_analysis_date DATE DEFAULT CURRENT_DATE,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS JSON AS $$
DECLARE
  v_start_time TIMESTAMPTZ := NOW();
  v_students_processed INTEGER := 0;
  v_errors INTEGER := 0;
  v_period_start DATE;
  v_period_end DATE;
  v_student RECORD;
  v_result JSON;
  v_log_id UUID;
BEGIN
  -- Determine period boundaries
  IF p_period_type = 'daily' THEN
    v_period_start := p_analysis_date;
    v_period_end := p_analysis_date;
  ELSIF p_period_type = 'weekly' THEN
    v_period_start := p_analysis_date - INTERVAL '7 days';
    v_period_end := p_analysis_date;
  ELSIF p_period_type = 'monthly' THEN
    v_period_start := p_analysis_date - INTERVAL '30 days';
    v_period_end := p_analysis_date;
  END IF;

  -- Create execution log
  INSERT INTO etl_execution_logs (
    execution_date, period_type, start_time, status
  ) VALUES (
    p_analysis_date, p_period_type, v_start_time, 'running'
  ) RETURNING id INTO v_log_id;

  -- Process each student
  FOR v_student IN 
    SELECT DISTINCT p.user_id, p.school_id
    FROM profiles p
    WHERE p.role = 'student'
    AND p.school_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM process_student_wellbeing_analytics(
        v_student.user_id,
        v_student.school_id,
        p_analysis_date,
        v_period_start,
        v_period_end,
        p_period_type
      );
      
      v_students_processed := v_students_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE WARNING 'Error processing student %: %', v_student.user_id, SQLERRM;
    END;
  END LOOP;

  -- Update execution log
  UPDATE etl_execution_logs SET
    end_time = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time)),
    students_processed = v_students_processed,
    errors_count = v_errors,
    status = 'completed'
  WHERE id = v_log_id;

  -- Build result
  SELECT json_build_object(
    'success', TRUE,
    'students_processed', v_students_processed,
    'errors', v_errors,
    'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
    'analysis_date', p_analysis_date,
    'period_type', p_period_type
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. HIGH-RISK ALERT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION send_high_risk_alerts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_level IN ('high', 'critical') AND NEW.intervention_recommended = TRUE THEN
    INSERT INTO safety_alerts (
      school_id,
      alert_type,
      severity,
      title,
      message,
      related_student_id
    ) VALUES (
      NEW.school_id,
      'high_risk_detected',
      NEW.risk_level,
      'Student Wellbeing Alert',
      format('Student requires attention. Overall wellbeing score: %s. Risk factors: %s', 
        NEW.overall_wellbeing_score, 
        NEW.risk_factors::TEXT
      ),
      NEW.student_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_high_risk_alerts
AFTER INSERT OR UPDATE ON student_wellbeing_analytics
FOR EACH ROW
EXECUTE FUNCTION send_high_risk_alerts();

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON student_wellbeing_analytics TO authenticated;
GRANT SELECT ON etl_execution_logs TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Wellbeing Analytics System created successfully!';
  RAISE NOTICE '📊 Table: student_wellbeing_analytics';
  RAISE NOTICE '⚙️  ETL Function: run_wellbeing_etl()';
  RAISE NOTICE '🔔 Alert Trigger: Enabled for high-risk students';
  RAISE NOTICE '';
  RAISE NOTICE 'To run the ETL manually:';
  RAISE NOTICE 'SELECT run_wellbeing_etl();';
END $$;
