-- ============================================================================
-- ENHANCED WELLBEING ANALYTICS - ETL PROCESSOR
-- ============================================================================
-- Part 3: Main ETL function with detailed data extraction
-- ============================================================================

CREATE OR REPLACE FUNCTION process_student_enhanced_analytics(
  p_student_id UUID,
  p_school_id UUID,
  p_analysis_date DATE,
  p_period_start DATE,
  p_period_end DATE,
  p_period_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_period_days INTEGER;
  v_profile_id UUID;
  
  -- Mood variables
  v_mood_avg DECIMAL; v_mood_min DECIMAL; v_mood_max DECIMAL; v_mood_std DECIMAL;
  v_positive_count INT; v_negative_count INT; v_neutral_count INT;
  v_mood_total INT; v_pos_pct DECIMAL; v_neg_pct DECIMAL; v_neu_pct DECIMAL;
  v_mood_trend TEXT; v_mood_improvement DECIMAL; v_consec_pos INT; v_consec_neg INT;
  v_mood_consistency DECIMAL;
  
  -- Academic variables
  v_gpa DECIMAL; v_avg_grade DECIMAL; v_tests_done INT; v_tests_passed INT; v_tests_failed INT;
  v_test_pass_rate DECIMAL; v_avg_test DECIMAL; v_high_test DECIMAL; v_low_test DECIMAL;
  v_grade_improvement DECIMAL; v_academic_consistency DECIMAL;
  v_struggling_subjects TEXT[]; v_excelling_subjects TEXT[];
  v_assignments_submitted INT; v_assignments_total INT; v_assignment_rate DECIMAL;
  v_late_submissions INT; v_ontime_rate DECIMAL; v_academic_trend TEXT;
  
  -- Engagement variables
  v_attendance_rate DECIMAL; v_attend_days INT; v_absent_days INT; v_late_days INT;
  v_excused INT; v_unexcused INT; v_perfect_weeks INT; v_attendance_trend TEXT;
  v_quest_rate DECIMAL; v_quests_done INT; v_quests_attempted INT; v_quests_abandoned INT;
  v_quests_total INT; v_streak INT; v_longest_streak INT; v_streak_breaks INT;
  v_login_count INT; v_engagement_quality DECIMAL;
  
  -- Social variables
  v_xp INT; v_xp_per_day DECIMAL; v_gems INT; v_gems_per_day DECIMAL; v_level INT;
  v_achievement_count INT; v_gratitude_count INT; v_gratitude_freq DECIMAL;
  v_kindness_count INT; v_kindness_per_week DECIMAL;
  
  -- Behavioral variables
  v_incident_count INT; v_help_count INT; v_urgent_help INT;
  v_days_since_incident INT;
  
  -- Composite scores
  v_emotional_score DECIMAL; v_academic_score DECIMAL; v_engagement_score DECIMAL;
  v_social_score DECIMAL; v_behavioral_score DECIMAL; v_overall_score DECIMAL;
  
  -- Risk assessment
  v_risk_score DECIMAL; v_risk_level TEXT; v_resilience DECIMAL;
  v_risk_factors JSONB := '[]'::JSONB; v_protective_factors JSONB := '[]'::JSONB;
  v_warning_flags TEXT[]; v_recommended_actions TEXT[];
  v_intervention_type TEXT; v_intervention_priority TEXT;
  
BEGIN
  v_period_days := p_period_end - p_period_start + 1;
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = p_student_id;
  
  -- ========================================================================
  -- EMOTIONAL WELLBEING - DETAILED EXTRACTION
  -- ========================================================================
  
  SELECT 
    AVG(COALESCE(mood_score, CASE mood 
      WHEN 'happy' THEN 8 WHEN 'excited' THEN 10 WHEN 'calm' THEN 7
      WHEN 'sad' THEN 3 WHEN 'angry' THEN 2 WHEN 'anxious' THEN 4 ELSE 5 END)),
    MIN(COALESCE(mood_score, CASE mood 
      WHEN 'happy' THEN 8 WHEN 'excited' THEN 10 WHEN 'calm' THEN 7
      WHEN 'sad' THEN 3 WHEN 'angry' THEN 2 WHEN 'anxious' THEN 4 ELSE 5 END)),
    MAX(COALESCE(mood_score, CASE mood 
      WHEN 'happy' THEN 8 WHEN 'excited' THEN 10 WHEN 'calm' THEN 7
      WHEN 'sad' THEN 3 WHEN 'angry' THEN 2 WHEN 'anxious' THEN 4 ELSE 5 END)),
    COUNT(*),
    COUNT(*) FILTER (WHERE mood IN ('happy', 'excited', 'calm')),
    COUNT(*) FILTER (WHERE mood IN ('sad', 'angry', 'anxious')),
    COUNT(*) FILTER (WHERE mood NOT IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious'))
  INTO v_mood_avg, v_mood_min, v_mood_max, v_mood_total, v_positive_count, v_negative_count, v_neutral_count
  FROM mood_history
  WHERE user_id = p_student_id AND recorded_date BETWEEN p_period_start AND p_period_end;
  
  v_mood_avg := COALESCE(v_mood_avg, 5.0);
  v_mood_total := COALESCE(v_mood_total, 0);
  v_positive_count := COALESCE(v_positive_count, 0);
  v_negative_count := COALESCE(v_negative_count, 0);
  v_neutral_count := COALESCE(v_neutral_count, 0);
  
  v_pos_pct := CASE WHEN v_mood_total > 0 THEN ROUND((v_positive_count::DECIMAL / v_mood_total) * 100, 2) ELSE 0 END;
  v_neg_pct := CASE WHEN v_mood_total > 0 THEN ROUND((v_negative_count::DECIMAL / v_mood_total) * 100, 2) ELSE 0 END;
  v_neu_pct := CASE WHEN v_mood_total > 0 THEN ROUND((v_neutral_count::DECIMAL / v_mood_total) * 100, 2) ELSE 0 END;
  
  v_mood_std := calculate_mood_volatility(p_student_id, p_period_start, p_period_end);
  v_mood_consistency := CASE WHEN v_mood_total > 0 THEN LEAST(10, (v_mood_total::DECIMAL / v_period_days) * 10) ELSE 0 END;
  
  v_mood_trend := CASE 
    WHEN v_mood_std > 2.5 THEN 'volatile'
    WHEN v_pos_pct > 70 THEN 'improving'
    WHEN v_pos_pct < 40 THEN 'declining'
    ELSE 'stable'
  END;
  
  -- ========================================================================
  -- ACADEMIC WELLBEING - DETAILED EXTRACTION
  -- ========================================================================
  
  SELECT 
    ROUND(AVG(percentage), 2),
    COUNT(*),
    COUNT(*) FILTER (WHERE percentage >= 60),
    COUNT(*) FILTER (WHERE percentage < 60),
    ROUND(AVG(percentage) FILTER (WHERE percentage IS NOT NULL), 2),
    MAX(percentage),
    MIN(percentage)
  INTO v_avg_grade, v_tests_done, v_tests_passed, v_tests_failed, 
       v_avg_test, v_high_test, v_low_test
  FROM assessment_grades
  WHERE student_id = v_profile_id AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  
  v_avg_grade := COALESCE(v_avg_grade, 0);
  v_tests_done := COALESCE(v_tests_done, 0);
  v_tests_passed := COALESCE(v_tests_passed, 0);
  v_tests_failed := COALESCE(v_tests_failed, 0);
  
  v_test_pass_rate := CASE WHEN v_tests_done > 0 THEN ROUND((v_tests_passed::DECIMAL / v_tests_done) * 100, 2) ELSE 0 END;
  
  v_gpa := CASE 
    WHEN v_avg_grade >= 90 THEN 4.0 WHEN v_avg_grade >= 80 THEN 3.5
    WHEN v_avg_grade >= 70 THEN 3.0 WHEN v_avg_grade >= 60 THEN 2.5
    WHEN v_avg_grade >= 50 THEN 2.0 ELSE 1.5
  END;
  
  v_academic_consistency := calculate_academic_consistency(p_student_id, p_period_start, p_period_end);
  
  v_academic_trend := CASE
    WHEN v_avg_grade >= 85 THEN 'improving'
    WHEN v_avg_grade < 70 THEN 'declining'
    ELSE 'stable'
  END;
  
  -- ========================================================================
  -- ENGAGEMENT WELLBEING - DETAILED EXTRACTION
  -- ========================================================================
  
  SELECT 
    ROUND(COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
    COUNT(*) FILTER (WHERE status = 'present'),
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*) FILTER (WHERE status = 'late')
  INTO v_attendance_rate, v_attend_days, v_absent_days, v_late_days
  FROM attendance
  WHERE student_id = v_profile_id AND date BETWEEN p_period_start AND p_period_end;
  
  v_attendance_rate := COALESCE(v_attendance_rate, 0);
  v_attend_days := COALESCE(v_attend_days, 0);
  v_absent_days := COALESCE(v_absent_days, 0);
  v_late_days := COALESCE(v_late_days, 0);
  
  v_attendance_trend := CASE
    WHEN v_attendance_rate >= 95 THEN 'improving'
    WHEN v_attendance_rate < 80 THEN 'declining'
    ELSE 'stable'
  END;
  
  SELECT 
    ROUND(COUNT(*) FILTER (WHERE completed = TRUE)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2),
    COUNT(*) FILTER (WHERE completed = TRUE),
    COUNT(*),
    COUNT(*) - COUNT(*) FILTER (WHERE completed = TRUE)
  INTO v_quest_rate, v_quests_done, v_quests_total, v_quests_abandoned
  FROM daily_quests
  WHERE user_id = p_student_id AND date BETWEEN p_period_start AND p_period_end;
  
  v_quest_rate := COALESCE(v_quest_rate, 0);
  v_quests_done := COALESCE(v_quests_done, 0);
  v_quests_total := COALESCE(v_quests_total, 0);
  
  SELECT COALESCE(streak_days, 0), COALESCE(xp, 0), COALESCE(gems, 0), COALESCE(level, 1)
  INTO v_streak, v_xp, v_gems, v_level
  FROM profiles WHERE user_id = p_student_id;
  
  v_xp_per_day := CASE WHEN v_period_days > 0 THEN ROUND(v_xp::DECIMAL / v_period_days, 2) ELSE 0 END;
  v_gems_per_day := CASE WHEN v_period_days > 0 THEN ROUND(v_gems::DECIMAL / v_period_days, 2) ELSE 0 END;
  
  v_engagement_quality := calculate_engagement_quality(
    v_quests_done, v_quests_total, v_streak, v_mood_total, v_period_days
  );
  
  -- ========================================================================
  -- SOCIAL & BEHAVIORAL WELLBEING
  -- ========================================================================
  
  SELECT COUNT(*) INTO v_gratitude_count FROM gratitude_entries
  WHERE user_id = p_student_id AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  v_gratitude_count := COALESCE(v_gratitude_count, 0);
  
  SELECT COALESCE(count, 0) INTO v_kindness_count FROM kindness_counter WHERE user_id = p_student_id;
  
  SELECT COUNT(*) INTO v_incident_count FROM incident_reports
  WHERE p_student_id = ANY(students_involved) AND incident_date::DATE BETWEEN p_period_start AND p_period_end;
  v_incident_count := COALESCE(v_incident_count, 0);
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE urgency IN ('high', 'urgent'))
  INTO v_help_count, v_urgent_help FROM help_requests
  WHERE student_id = p_student_id AND created_at::DATE BETWEEN p_period_start AND p_period_end;
  v_help_count := COALESCE(v_help_count, 0);
  v_urgent_help := COALESCE(v_urgent_help, 0);
  
  -- ========================================================================
  -- CALCULATE COMPOSITE SCORES
  -- ========================================================================
  
  v_emotional_score := v_mood_avg;
  v_academic_score := v_gpa * 2.5;
  v_engagement_score := (v_attendance_rate / 10 * 0.4) + (v_quest_rate / 10 * 0.4) + (LEAST(v_streak, 30) / 3 * 0.2);
  v_social_score := (LEAST(v_level, 10) * 0.3) + (LEAST(v_gratitude_count, 10) * 0.4) + (LEAST(v_kindness_count, 10) * 0.3);
  v_behavioral_score := GREATEST(1, 10 - (v_incident_count * 2) - (v_urgent_help * 1.5));
  
  v_overall_score := (
    v_emotional_score * 0.40 +
    v_academic_score * 0.25 +
    v_engagement_score * 0.20 +
    v_social_score * 0.10 +
    v_behavioral_score * 0.05
  );
  
  -- ========================================================================
  -- RISK ASSESSMENT
  -- ========================================================================
  
  v_risk_score := calculate_risk_score(
    v_mood_avg, v_gpa, v_attendance_rate, v_incident_count, 
    v_urgent_help, v_neg_pct, v_quest_rate
  );
  
  v_risk_level := get_risk_level(v_risk_score);
  
  v_resilience := calculate_resilience_score(
    v_streak, v_quest_rate, v_pos_pct, v_attendance_rate, 
    v_gpa, v_gratitude_count, v_help_count
  );
  
  v_warning_flags := identify_warning_flags(
    v_mood_avg, v_neg_pct, v_attendance_rate, v_gpa, v_quest_rate,
    v_incident_count, v_urgent_help, v_mood_total, 0, 0
  );
  
  v_recommended_actions := generate_recommended_actions(
    v_risk_level, v_warning_flags, v_mood_avg, v_gpa, v_attendance_rate
  );
  
  v_intervention_priority := CASE
    WHEN v_risk_level = 'critical' THEN 'immediate'
    WHEN v_risk_level = 'high' THEN 'urgent'
    WHEN v_risk_level = 'medium' THEN 'moderate'
    ELSE 'low'
  END;
  
  -- Build risk and protective factors
  IF v_neg_pct > 50 THEN v_risk_factors := v_risk_factors || jsonb_build_array('High negative mood'); END IF;
  IF v_attendance_rate < 80 THEN v_risk_factors := v_risk_factors || jsonb_build_array('Low attendance'); END IF;
  IF v_gpa < 2.5 THEN v_risk_factors := v_risk_factors || jsonb_build_array('Academic struggles'); END IF;
  
  IF v_streak >= 7 THEN v_protective_factors := v_protective_factors || jsonb_build_array('Strong streak'); END IF;
  IF v_quest_rate >= 80 THEN v_protective_factors := v_protective_factors || jsonb_build_array('High engagement'); END IF;
  IF v_pos_pct >= 70 THEN v_protective_factors := v_protective_factors || jsonb_build_array('Positive mood'); END IF;
  
  -- ========================================================================
  -- INSERT INTO ENHANCED ANALYTICS TABLE
  -- ========================================================================
  
  RAISE NOTICE 'Inserting data for student: %, school: %', p_student_id, p_school_id;
  RAISE NOTICE 'Scores - Overall: %, Risk: %, Mood: %', v_overall_score, v_risk_score, v_mood_avg;
  
  INSERT INTO student_wellbeing_analytics_enhanced (
    student_id, school_id, analysis_date, period_start_date, period_end_date, period_type,
    mood_score_avg, mood_score_min, mood_score_max, mood_score_std_dev, mood_trend,
    positive_mood_count, negative_mood_count, neutral_mood_count,
    positive_mood_percentage, negative_mood_percentage, neutral_mood_percentage,
    mood_entries_count, mood_consistency_score,
    gpa, average_grade_percentage, tests_completed, tests_passed, tests_failed,
    test_pass_rate, average_test_score, highest_test_score, lowest_test_score,
    academic_consistency, academic_trend,
    attendance_rate, attendance_days, absent_days, late_days, attendance_trend,
    quest_completion_rate, quests_completed, total_quests_available, quests_abandoned,
    activity_streak_days, engagement_quality_score,
    xp_earned, xp_per_day, gems_earned, gems_per_day, level,
    gratitude_entries_count, kindness_acts_count,
    help_requests_count, urgent_help_requests_count,
    emotional_wellbeing_score, academic_wellbeing_score, engagement_wellbeing_score,
    social_wellbeing_score, behavioral_wellbeing_score, overall_wellbeing_score,
    risk_score, risk_level, resilience_score,
    risk_factors, protective_factors, risk_factor_count, protective_factor_count,
    intervention_recommended, intervention_priority, recommended_actions,
    early_warning_flags, warning_flag_count,
    processing_duration_ms, updated_at
  ) VALUES (
    p_student_id, p_school_id, p_analysis_date, p_period_start, p_period_end, p_period_type,
    v_mood_avg, v_mood_min, v_mood_max, v_mood_std, v_mood_trend,
    v_positive_count, v_negative_count, v_neutral_count,
    v_pos_pct, v_neg_pct, v_neu_pct,
    v_mood_total, v_mood_consistency,
    v_gpa, v_avg_grade, v_tests_done, v_tests_passed, v_tests_failed,
    v_test_pass_rate, v_avg_test, v_high_test, v_low_test,
    v_academic_consistency, v_academic_trend,
    v_attendance_rate, v_attend_days, v_absent_days, v_late_days, v_attendance_trend,
    v_quest_rate, v_quests_done, v_quests_total, v_quests_abandoned,
    v_streak, v_engagement_quality,
    v_xp, v_xp_per_day, v_gems, v_gems_per_day, v_level,
    v_gratitude_count, v_kindness_count,
    v_help_count, v_urgent_help,
    v_emotional_score, v_academic_score, v_engagement_score,
    v_social_score, v_behavioral_score, v_overall_score,
    v_risk_score, v_risk_level, v_resilience,
    v_risk_factors, v_protective_factors, 
    jsonb_array_length(v_risk_factors), jsonb_array_length(v_protective_factors),
    (v_risk_level IN ('high', 'critical')), v_intervention_priority, v_recommended_actions,
    v_warning_flags, array_length(v_warning_flags, 1),
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER, NOW()
  )
  ON CONFLICT (student_id, analysis_date, period_type) DO UPDATE SET
    mood_score_avg = EXCLUDED.mood_score_avg,
    overall_wellbeing_score = EXCLUDED.overall_wellbeing_score,
    risk_level = EXCLUDED.risk_level,
    updated_at = NOW();
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MAIN ENHANCED ETL FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION run_enhanced_wellbeing_etl(
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
BEGIN
  IF p_period_type = 'daily' THEN
    v_period_start := p_analysis_date; v_period_end := p_analysis_date;
  ELSIF p_period_type = 'weekly' THEN
    v_period_start := p_analysis_date - 7; v_period_end := p_analysis_date;
  ELSIF p_period_type = 'monthly' THEN
    v_period_start := p_analysis_date - 30; v_period_end := p_analysis_date;
  END IF;

  FOR v_student IN 
    SELECT user_id, school_id FROM profiles 
    WHERE role = 'student' AND school_id IS NOT NULL AND user_id IS NOT NULL
  LOOP
    BEGIN
      PERFORM process_student_enhanced_analytics(
        v_student.user_id, v_student.school_id, p_analysis_date,
        v_period_start, v_period_end, p_period_type
      );
      v_students_processed := v_students_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE, 'students_processed', v_students_processed,
    'errors', v_errors, 'duration_seconds', EXTRACT(EPOCH FROM (NOW() - v_start_time))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced ETL Processor Created!';
  RAISE NOTICE '🚀 Run: SELECT run_enhanced_wellbeing_etl();';
END $$;
