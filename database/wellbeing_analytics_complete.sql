-- ============================================================================
-- COMPLETE WELLBEING ANALYTICS SYSTEM - SCHEMA-ACCURATE VERSION
-- ============================================================================
-- Based on actual table schemas provided
-- ============================================================================

-- Drop existing objects
DROP TRIGGER IF EXISTS trigger_high_risk_alerts ON student_wellbeing_analytics;
DROP FUNCTION IF EXISTS send_high_risk_alerts();
DROP FUNCTION IF EXISTS process_student_wellbeing_analytics(UUID, UUID, DATE, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS run_wellbeing_etl(DATE, TEXT);

-- Keep the analytics table and logs table (already created)
-- Just recreate the functions with correct schema

-- ============================================================================
-- INDIVIDUAL STUDENT PROCESSING FUNCTION - SCHEMA ACCURATE
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
  v_late_days INTEGER;
  v_quest_completion_rate DECIMAL(5,2);
  v_quests_completed INTEGER;
  v_total_quests INTEGER;
  v_activity_streak INTEGER;
  
  -- Social metrics
  v_xp_earned INTEGER;
  v_gems_earned INTEGER;
  v_level INTEGER;
  v_kindness_count INTEGER;
  
  -- Behavioral metrics
  v_incident_count INTEGER;
  v_help_requests INTEGER;
  v_urgent_help INTEGER;
  
  -- Activity metrics
  v_gratitude_count INTEGER;
  
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
  -- 1. EXTRACT EMOTIONAL WELLBEING DATA (mood_history table)
  -- ========================================================================
  SELECT 
    AVG(COALESCE(mood_score, 
      CASE 
        WHEN mood = 'happy' THEN 8
        WHEN mood = 'excited' THEN 10
        WHEN mood = 'calm' THEN 7
        WHEN mood = 'sad' THEN 3
        WHEN mood = 'angry' THEN 2
        WHEN mood = 'anxious' THEN 4
        ELSE 5
      END
    )) as avg_mood,
    COUNT(*) as mood_count,
    ROUND(COUNT(*) FILTER (WHERE mood IN ('happy', 'excited', 'calm'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as positive_pct,
    ROUND(COUNT(*) FILTER (WHERE mood IN ('sad', 'angry', 'anxious'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as negative_pct,
    ROUND(COUNT(*) FILTER (WHERE mood NOT IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious'))::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as neutral_pct
  INTO v_mood_score, v_mood_entries_count, v_positive_mood_pct, v_negative_mood_pct, v_neutral_mood_pct
  FROM mood_history
  WHERE user_id = p_student_id
  AND recorded_date BETWEEN p_period_start AND p_period_end;

  -- Set defaults if no mood data
  v_mood_score := COALESCE(v_mood_score, 5.0);
  v_mood_entries_count := COALESCE(v_mood_entries_count, 0);
  v_positive_mood_pct := COALESCE(v_positive_mood_pct, 0);
  v_negative_mood_pct := COALESCE(v_negative_mood_pct, 0);
  v_neutral_mood_pct := COALESCE(v_neutral_mood_pct, 0);

  -- Determine mood trend
  IF v_positive_mood_pct > 70 THEN 
    v_mood_trend := 'improving';
  ELSIF v_positive_mood_pct < 40 THEN 
    v_mood_trend := 'declining';
  ELSE 
    v_mood_trend := 'stable';
  END IF;

  -- ========================================================================
  -- 2. EXTRACT ACADEMIC PERFORMANCE (assessment_grades table)
  -- ========================================================================
  -- Using percentage column directly from assessment_grades
  SELECT 
    ROUND(AVG(percentage), 2) as avg_grade,
    COUNT(*) as test_count
  INTO v_avg_grade_pct, v_tests_completed
  FROM assessment_grades
  WHERE student_id = (SELECT id FROM profiles WHERE user_id = p_student_id)
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  v_avg_grade_pct := COALESCE(v_avg_grade_pct, 0);
  v_tests_completed := COALESCE(v_tests_completed, 0);

  -- Calculate GPA from percentage
  v_gpa := CASE 
    WHEN v_avg_grade_pct >= 90 THEN 4.0
    WHEN v_avg_grade_pct >= 80 THEN 3.5
    WHEN v_avg_grade_pct >= 70 THEN 3.0
    WHEN v_avg_grade_pct >= 60 THEN 2.5
    WHEN v_avg_grade_pct >= 50 THEN 2.0
    ELSE 1.5
  END;

  v_academic_trend := CASE
    WHEN v_avg_grade_pct >= 85 THEN 'improving'
    WHEN v_avg_grade_pct < 70 THEN 'declining'
    ELSE 'stable'
  END;

  -- ========================================================================
  -- 3. EXTRACT ENGAGEMENT DATA (attendance, daily_quests, profiles)
  -- ========================================================================
  -- Attendance - using student_id which references profiles.id
  SELECT 
    ROUND(COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as attendance_pct,
    COUNT(*) FILTER (WHERE status = 'present') as present_days,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
    COUNT(*) FILTER (WHERE status = 'late') as late_days
  INTO v_attendance_rate, v_attendance_days, v_absent_days, v_late_days
  FROM attendance
  WHERE student_id = (SELECT id FROM profiles WHERE user_id = p_student_id)
  AND date BETWEEN p_period_start AND p_period_end;

  v_attendance_rate := COALESCE(v_attendance_rate, 0);
  v_attendance_days := COALESCE(v_attendance_days, 0);
  v_absent_days := COALESCE(v_absent_days, 0);
  v_late_days := COALESCE(v_late_days, 0);

  -- Daily Quests - using user_id
  SELECT 
    ROUND(COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as quest_pct,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed,
    COUNT(*) as total
  INTO v_quest_completion_rate, v_quests_completed, v_total_quests
  FROM daily_quests
  WHERE user_id = p_student_id
  AND date BETWEEN p_period_start AND p_period_end;

  v_quest_completion_rate := COALESCE(v_quest_completion_rate, 0);
  v_quests_completed := COALESCE(v_quests_completed, 0);
  v_total_quests := COALESCE(v_total_quests, 0);

  -- Profile data - streak, XP, gems, level
  SELECT 
    COALESCE(streak_days, 0),
    COALESCE(xp, 0),
    COALESCE(gems, 0),
    COALESCE(level, 1)
  INTO v_activity_streak, v_xp_earned, v_gems_earned, v_level
  FROM profiles
  WHERE user_id = p_student_id;

  v_activity_streak := COALESCE(v_activity_streak, 0);
  v_xp_earned := COALESCE(v_xp_earned, 0);
  v_gems_earned := COALESCE(v_gems_earned, 0);
  v_level := COALESCE(v_level, 1);

  -- ========================================================================
  -- 4. EXTRACT SOCIAL WELLBEING (gratitude_entries, kindness_counter)
  -- ========================================================================
  -- Gratitude entries
  SELECT COUNT(*) INTO v_gratitude_count
  FROM gratitude_entries
  WHERE user_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  v_gratitude_count := COALESCE(v_gratitude_count, 0);

  -- Kindness counter - using last_updated for period filtering
  SELECT COALESCE(count, 0) INTO v_kindness_count
  FROM kindness_counter
  WHERE user_id = p_student_id
  AND last_updated::DATE BETWEEN p_period_start AND p_period_end;

  v_kindness_count := COALESCE(v_kindness_count, 0);

  -- ========================================================================
  -- 5. EXTRACT BEHAVIORAL DATA (incident_reports, help_requests)
  -- ========================================================================
  -- Incident reports - student can be in students_involved array
  SELECT COUNT(*) INTO v_incident_count
  FROM incident_reports
  WHERE p_student_id = ANY(students_involved)
  AND incident_date::DATE BETWEEN p_period_start AND p_period_end;

  v_incident_count := COALESCE(v_incident_count, 0);

  -- Help requests - using student_id
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE urgency IN ('high', 'urgent')) as urgent_requests
  INTO v_help_requests, v_urgent_help
  FROM help_requests
  WHERE student_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  v_help_requests := COALESCE(v_help_requests, 0);
  v_urgent_help := COALESCE(v_urgent_help, 0);

  -- ========================================================================
  -- 6. CALCULATE COMPOSITE SCORES
  -- ========================================================================
  
  -- Emotional Score (1-10) - Based on mood
  v_emotional_score := v_mood_score;
  
  -- Academic Score (1-10) - Based on GPA
  v_academic_score := v_gpa * 2.5;
  
  -- Engagement Score (1-10) - Based on attendance, quests, streak
  v_engagement_score := (
    (v_attendance_rate / 10) * 0.4 +
    (v_quest_completion_rate / 10) * 0.4 +
    (LEAST(v_activity_streak, 30) / 3) * 0.2
  );
  
  -- Social Score (1-10) - Based on XP, level, gratitude, kindness
  v_social_score := (
    (LEAST(v_level, 10)) * 0.3 +
    (LEAST(v_gratitude_count, 10)) * 0.4 +
    (LEAST(v_kindness_count, 10)) * 0.3
  );
  
  -- Behavioral Score (1-10) - Penalize incidents and urgent help requests
  v_behavioral_score := GREATEST(1, 10 - (v_incident_count * 2) - (v_urgent_help * 1.5));
  
  -- Overall Wellbeing Score (weighted average)
  v_overall_score := (
    v_emotional_score * 0.40 +
    v_academic_score * 0.25 +
    v_engagement_score * 0.20 +
    v_social_score * 0.10 +
    v_behavioral_score * 0.05
  );

  -- ========================================================================
  -- 7. DETERMINE RISK LEVEL & FACTORS
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
    v_risk_factors := v_risk_factors || jsonb_build_array('High negative mood frequency');
  END IF;
  
  IF v_attendance_rate < 80 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array('Low attendance rate');
  END IF;
  
  IF v_gpa < 2.5 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array('Academic struggles');
  END IF;
  
  IF v_urgent_help > 0 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array('Recent urgent help requests');
  END IF;
  
  IF v_incident_count > 0 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array('Behavioral incidents reported');
  END IF;
  
  IF v_mood_entries_count = 0 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array('No mood tracking engagement');
  END IF;

  -- Identify protective factors
  IF v_activity_streak >= 7 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('Strong activity streak');
  END IF;
  
  IF v_quest_completion_rate >= 80 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('High quest completion rate');
  END IF;
  
  IF v_positive_mood_pct >= 70 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('Consistently positive mood');
  END IF;
  
  IF v_attendance_rate >= 95 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('Excellent attendance');
  END IF;
  
  IF v_gpa >= 3.5 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('Strong academic performance');
  END IF;
  
  IF v_gratitude_count >= 5 THEN
    v_protective_factors := v_protective_factors || jsonb_build_array('Regular gratitude practice');
  END IF;

  -- ========================================================================
  -- 8. UPSERT INTO ANALYTICS TABLE
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
    attendance_rate, attendance_days, absent_days, late_days,
    quest_completion_rate, quests_completed, total_quests_available, activity_streak_days,
    
    -- Social
    xp_earned, gems_earned, level, kindness_acts_count,
    
    -- Behavioral
    help_requests_count, urgent_help_requests_count,
    
    -- Activities
    gratitude_entries_count,
    
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
    
    v_attendance_rate, v_attendance_days, v_absent_days, v_late_days,
    v_quest_completion_rate, v_quests_completed, v_total_quests, v_activity_streak,
    
    v_xp_earned, v_gems_earned, v_level, v_kindness_count,
    
    v_help_requests, v_urgent_help,
    
    v_gratitude_count,
    
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
    neutral_mood_percentage = EXCLUDED.neutral_mood_percentage,
    mood_entries_count = EXCLUDED.mood_entries_count,
    gpa = EXCLUDED.gpa,
    average_grade_percentage = EXCLUDED.average_grade_percentage,
    academic_trend = EXCLUDED.academic_trend,
    tests_completed = EXCLUDED.tests_completed,
    attendance_rate = EXCLUDED.attendance_rate,
    attendance_days = EXCLUDED.attendance_days,
    absent_days = EXCLUDED.absent_days,
    late_days = EXCLUDED.late_days,
    quest_completion_rate = EXCLUDED.quest_completion_rate,
    quests_completed = EXCLUDED.quests_completed,
    total_quests_available = EXCLUDED.total_quests_available,
    activity_streak_days = EXCLUDED.activity_streak_days,
    xp_earned = EXCLUDED.xp_earned,
    gems_earned = EXCLUDED.gems_earned,
    level = EXCLUDED.level,
    kindness_acts_count = EXCLUDED.kindness_acts_count,
    help_requests_count = EXCLUDED.help_requests_count,
    urgent_help_requests_count = EXCLUDED.urgent_help_requests_count,
    gratitude_entries_count = EXCLUDED.gratitude_entries_count,
    emotional_wellbeing_score = EXCLUDED.emotional_wellbeing_score,
    academic_wellbeing_score = EXCLUDED.academic_wellbeing_score,
    engagement_wellbeing_score = EXCLUDED.engagement_wellbeing_score,
    social_wellbeing_score = EXCLUDED.social_wellbeing_score,
    behavioral_wellbeing_score = EXCLUDED.behavioral_wellbeing_score,
    overall_wellbeing_score = EXCLUDED.overall_wellbeing_score,
    risk_level = EXCLUDED.risk_level,
    risk_factors = EXCLUDED.risk_factors,
    protective_factors = EXCLUDED.protective_factors,
    intervention_recommended = EXCLUDED.intervention_recommended,
    updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAIN ETL FUNCTION
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
    AND p.user_id IS NOT NULL
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
    status = CASE WHEN v_errors = 0 THEN 'completed' ELSE 'completed_with_errors' END
  WHERE id = v_log_id;

  -- Build result
  SELECT json_build_object(
    'success', TRUE,
    'students_processed', v_students_processed,
    'errors', v_errors,
    'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time)),
    'analysis_date', p_analysis_date,
    'period_type', p_period_type,
    'period_start', v_period_start,
    'period_end', v_period_end
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HIGH-RISK ALERT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION send_high_risk_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send alerts for high and critical risk levels
  IF NEW.risk_level IN ('high', 'critical') AND NEW.intervention_recommended = TRUE THEN
    -- Insert into incident_reports for tracking
    INSERT INTO incident_reports (
      school_id,
      incident_type,
      severity,
      description,
      students_involved,
      status,
      incident_date
    ) VALUES (
      NEW.school_id,
      'wellbeing_alert',
      NEW.risk_level,
      format('Automated wellbeing alert: Student wellbeing score is %s (%s). Risk factors: %s. Protective factors: %s', 
        NEW.overall_wellbeing_score,
        NEW.risk_level,
        NEW.risk_factors::TEXT,
        NEW.protective_factors::TEXT
      ),
      ARRAY[NEW.student_id],
      'open',
      NEW.analysis_date
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_high_risk_alerts
AFTER INSERT OR UPDATE ON student_wellbeing_analytics
FOR EACH ROW
WHEN (NEW.risk_level IN ('high', 'critical'))
EXECUTE FUNCTION send_high_risk_alerts();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON student_wellbeing_analytics TO authenticated;
GRANT SELECT ON etl_execution_logs TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ COMPLETE Wellbeing Analytics System created successfully!';
  RAISE NOTICE '📊 All functions use correct table schemas';
  RAISE NOTICE '🔗 Linked tables: assessment_grades, mood_history, profiles, gratitude_entries, kindness_counter, incident_reports, help_requests, attendance, daily_quests';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 To run the ETL:';
  RAISE NOTICE '   SELECT run_wellbeing_etl();';
  RAISE NOTICE '';
  RAISE NOTICE '📈 To view results:';
  RAISE NOTICE '   SELECT * FROM student_wellbeing_analytics ORDER BY analysis_date DESC LIMIT 10;';
END $$;
