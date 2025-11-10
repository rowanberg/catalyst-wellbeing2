-- ============================================================================
-- FIXED WELLBEING ANALYTICS SYSTEM
-- ============================================================================
-- This version is corrected to match your actual database schema
-- ============================================================================

-- Drop existing function to recreate with fixes
DROP FUNCTION IF EXISTS process_student_wellbeing_analytics(UUID, UUID, DATE, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS run_wellbeing_etl(DATE, TEXT);

-- ============================================================================
-- FIXED INDIVIDUAL STUDENT PROCESSING FUNCTION
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
  v_achievement_count INTEGER := 0;
  v_xp_earned INTEGER := 0;
  v_kindness_count INTEGER := 0;
  
  -- Behavioral metrics
  v_safety_incidents INTEGER := 0;
  v_help_requests INTEGER := 0;
  v_urgent_help INTEGER := 0;
  
  -- Activity metrics
  v_gratitude_count INTEGER := 0;
  v_courage_count INTEGER := 0;
  v_mindfulness_count INTEGER := 0;
  v_breathing_count INTEGER := 0;
  
  -- Physical metrics
  v_avg_sleep DECIMAL(4,2) := 0;
  v_avg_water DECIMAL(4,2) := 0;
  
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

  -- Set defaults if no mood data
  v_mood_score := COALESCE(v_mood_score, 5.0);
  v_mood_entries_count := COALESCE(v_mood_entries_count, 0);
  v_positive_mood_pct := COALESCE(v_positive_mood_pct, 0);
  v_negative_mood_pct := COALESCE(v_negative_mood_pct, 0);
  v_neutral_mood_pct := COALESCE(v_neutral_mood_pct, 0);

  -- Determine mood trend
  IF v_positive_mood_pct > 70 THEN v_mood_trend := 'improving';
  ELSIF v_positive_mood_pct < 40 THEN v_mood_trend := 'declining';
  ELSE v_mood_trend := 'stable';
  END IF;

  -- ========================================================================
  -- EXTRACT ACADEMIC PERFORMANCE DATA (FIXED)
  -- ========================================================================
  SELECT 
    ROUND(AVG(percentage), 2) as avg_grade,
    COUNT(*) as test_count
  INTO v_avg_grade_pct, v_tests_completed
  FROM assessment_grades
  WHERE student_id = p_student_id
  AND created_at::DATE BETWEEN p_period_start AND p_period_end;

  -- Set defaults
  v_avg_grade_pct := COALESCE(v_avg_grade_pct, 0);
  v_tests_completed := COALESCE(v_tests_completed, 0);

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

  -- Set defaults
  v_attendance_rate := COALESCE(v_attendance_rate, 0);
  v_attendance_days := COALESCE(v_attendance_days, 0);
  v_absent_days := COALESCE(v_absent_days, 0);

  SELECT 
    ROUND(COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as quest_pct,
    COUNT(*) FILTER (WHERE completed = TRUE) as completed,
    COUNT(*) as total
  INTO v_quest_completion_rate, v_quests_completed, v_total_quests
  FROM daily_quests
  WHERE user_id = p_student_id
  AND date BETWEEN p_period_start AND p_period_end;

  -- Set defaults
  v_quest_completion_rate := COALESCE(v_quest_completion_rate, 0);
  v_quests_completed := COALESCE(v_quests_completed, 0);
  v_total_quests := COALESCE(v_total_quests, 0);

  SELECT COALESCE(streak_days, 0) INTO v_activity_streak
  FROM profiles
  WHERE user_id = p_student_id;

  v_activity_streak := COALESCE(v_activity_streak, 0);

  -- ========================================================================
  -- EXTRACT SOCIAL & BEHAVIORAL DATA (with error handling)
  -- ========================================================================
  
  -- Achievements (may not exist)
  BEGIN
    SELECT COUNT(*) INTO v_achievement_count
    FROM student_achievements
    WHERE student_id = p_student_id
    AND earned_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_achievement_count := 0;
  END;

  -- Student activity XP (may not exist)
  BEGIN
    SELECT COALESCE(SUM(xp_gained), 0) INTO v_xp_earned
    FROM student_activity
    WHERE student_id = p_student_id
    AND timestamp::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_xp_earned := 0;
  END;

  -- Kindness counter (may not exist)
  BEGIN
    SELECT COALESCE(SUM(count), 0) INTO v_kindness_count
    FROM kindness_counter
    WHERE user_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_kindness_count := 0;
  END;

  -- Safety incidents (may not exist)
  BEGIN
    SELECT COUNT(*) INTO v_safety_incidents
    FROM safety_incidents
    WHERE student_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_safety_incidents := 0;
  END;

  -- Help requests
  BEGIN
    SELECT 
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE urgency IN ('high', 'urgent')) as urgent_requests
    INTO v_help_requests, v_urgent_help
    FROM help_requests
    WHERE student_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_help_requests := 0;
    v_urgent_help := 0;
  END;

  -- ========================================================================
  -- EXTRACT ACTIVITY DATA (with error handling)
  -- ========================================================================
  
  BEGIN
    SELECT COUNT(*) INTO v_gratitude_count
    FROM gratitude_entries
    WHERE user_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_gratitude_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_courage_count
    FROM courage_log
    WHERE user_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_courage_count := 0;
  END;

  BEGIN
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE session_type = 'breathing') as breathing_sessions
    INTO v_mindfulness_count, v_breathing_count
    FROM mindfulness_sessions
    WHERE user_id = p_student_id
    AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_mindfulness_count := 0;
    v_breathing_count := 0;
  END;

  -- ========================================================================
  -- EXTRACT PHYSICAL WELLBEING DATA (with error handling)
  -- ========================================================================
  BEGIN
    SELECT 
      AVG(sleep_hours) as avg_sleep,
      AVG(water_glasses) as avg_water
    INTO v_avg_sleep, v_avg_water
    FROM habit_tracker
    WHERE user_id = p_student_id
    AND date BETWEEN p_period_start AND p_period_end;
  EXCEPTION WHEN OTHERS THEN
    v_avg_sleep := 0;
    v_avg_water := 0;
  END;

  v_avg_sleep := COALESCE(v_avg_sleep, 0);
  v_avg_water := COALESCE(v_avg_water, 0);

  -- ========================================================================
  -- CALCULATE COMPOSITE SCORES
  -- ========================================================================
  
  -- Emotional Score (1-10)
  v_emotional_score := v_mood_score;
  
  -- Academic Score (1-10)
  v_academic_score := v_gpa * 2.5;
  
  -- Engagement Score (1-10)
  v_engagement_score := (
    v_attendance_rate / 10 * 0.5 +
    v_quest_completion_rate / 10 * 0.3 +
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
-- RECREATE MAIN ETL FUNCTION
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
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FIXED Wellbeing Analytics System functions recreated!';
  RAISE NOTICE '📊 Ready to process students';
  RAISE NOTICE '';
  RAISE NOTICE 'Run this to test:';
  RAISE NOTICE 'SELECT run_wellbeing_etl();';
END $$;
