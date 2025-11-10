-- ============================================================================
-- ENHANCED WELLBEING ANALYTICS - ADVANCED SCORING ALGORITHMS
-- ============================================================================
-- Part 2: Sophisticated scoring and calculation functions
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Calculate Mood Volatility
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_mood_volatility(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_std_dev DECIMAL(4,2);
BEGIN
  SELECT STDDEV(mood_score) INTO v_std_dev
  FROM mood_history
  WHERE user_id = p_student_id
  AND recorded_date BETWEEN p_start_date AND p_end_date;
  
  RETURN COALESCE(v_std_dev, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Calculate Academic Consistency
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_academic_consistency(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_std_dev DECIMAL(5,2);
  v_consistency DECIMAL(4,2);
BEGIN
  SELECT STDDEV(percentage) INTO v_std_dev
  FROM assessment_grades
  WHERE student_id = (SELECT id FROM profiles WHERE user_id = p_student_id)
  AND created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  -- Convert std dev to consistency score (lower std dev = higher consistency)
  -- Max std dev ~30, so invert: 10 - (std_dev / 3)
  v_consistency := GREATEST(0, 10 - (COALESCE(v_std_dev, 0) / 3));
  
  RETURN v_consistency;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Calculate Engagement Quality Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_engagement_quality(
  p_quests_completed INTEGER,
  p_quests_attempted INTEGER,
  p_streak_days INTEGER,
  p_login_count INTEGER,
  p_period_days INTEGER
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_completion_quality DECIMAL(4,2);
  v_consistency_quality DECIMAL(4,2);
  v_frequency_quality DECIMAL(4,2);
  v_overall_quality DECIMAL(4,2);
BEGIN
  -- Completion quality (how many attempted quests are completed)
  v_completion_quality := CASE 
    WHEN p_quests_attempted > 0 THEN 
      (p_quests_completed::DECIMAL / p_quests_attempted) * 10
    ELSE 5
  END;
  
  -- Consistency quality (streak relative to period)
  v_consistency_quality := LEAST(10, (p_streak_days::DECIMAL / GREATEST(p_period_days, 1)) * 15);
  
  -- Frequency quality (logins per day)
  v_frequency_quality := LEAST(10, (p_login_count::DECIMAL / GREATEST(p_period_days, 1)) * 10);
  
  -- Weighted average
  v_overall_quality := (
    v_completion_quality * 0.5 +
    v_consistency_quality * 0.3 +
    v_frequency_quality * 0.2
  );
  
  RETURN ROUND(v_overall_quality, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Calculate Risk Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_mood_score DECIMAL,
  p_gpa DECIMAL,
  p_attendance_rate DECIMAL,
  p_incident_count INTEGER,
  p_urgent_help INTEGER,
  p_negative_mood_pct DECIMAL,
  p_quest_completion DECIMAL
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_risk_score DECIMAL(4,2);
BEGIN
  -- Start with base score of 0 (no risk)
  v_risk_score := 0;
  
  -- Add risk points based on negative indicators
  
  -- Mood risk (0-3 points)
  IF p_mood_score < 4 THEN v_risk_score := v_risk_score + 3;
  ELSIF p_mood_score < 5.5 THEN v_risk_score := v_risk_score + 2;
  ELSIF p_mood_score < 7 THEN v_risk_score := v_risk_score + 1;
  END IF;
  
  -- Negative mood percentage (0-2 points)
  IF p_negative_mood_pct > 60 THEN v_risk_score := v_risk_score + 2;
  ELSIF p_negative_mood_pct > 40 THEN v_risk_score := v_risk_score + 1;
  END IF;
  
  -- Academic risk (0-2 points)
  IF p_gpa < 2.0 THEN v_risk_score := v_risk_score + 2;
  ELSIF p_gpa < 2.5 THEN v_risk_score := v_risk_score + 1;
  END IF;
  
  -- Attendance risk (0-1.5 points)
  IF p_attendance_rate < 70 THEN v_risk_score := v_risk_score + 1.5;
  ELSIF p_attendance_rate < 85 THEN v_risk_score := v_risk_score + 0.5;
  END IF;
  
  -- Behavioral risk (0-1.5 points)
  v_risk_score := v_risk_score + LEAST(1.5, p_incident_count * 0.5);
  v_risk_score := v_risk_score + LEAST(1, p_urgent_help * 0.5);
  
  -- Engagement risk (0-1 point)
  IF p_quest_completion < 30 THEN v_risk_score := v_risk_score + 1;
  ELSIF p_quest_completion < 50 THEN v_risk_score := v_risk_score + 0.5;
  END IF;
  
  RETURN LEAST(10, v_risk_score);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Determine Risk Level from Score
-- ============================================================================

CREATE OR REPLACE FUNCTION get_risk_level(p_risk_score DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF p_risk_score >= 8 THEN RETURN 'critical';
  ELSIF p_risk_score >= 6 THEN RETURN 'high';
  ELSIF p_risk_score >= 3.5 THEN RETURN 'medium';
  ELSIF p_risk_score >= 1.5 THEN RETURN 'low';
  ELSE RETURN 'thriving';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Calculate Resilience Score
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_resilience_score(
  p_streak_days INTEGER,
  p_quest_completion DECIMAL,
  p_positive_mood_pct DECIMAL,
  p_attendance_rate DECIMAL,
  p_gpa DECIMAL,
  p_gratitude_count INTEGER,
  p_help_requests INTEGER
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_resilience DECIMAL(4,2);
BEGIN
  v_resilience := 0;
  
  -- Consistency indicators
  IF p_streak_days >= 14 THEN v_resilience := v_resilience + 2;
  ELSIF p_streak_days >= 7 THEN v_resilience := v_resilience + 1;
  END IF;
  
  -- Achievement indicators
  IF p_quest_completion >= 80 THEN v_resilience := v_resilience + 1.5;
  ELSIF p_quest_completion >= 60 THEN v_resilience := v_resilience + 0.75;
  END IF;
  
  -- Emotional stability
  IF p_positive_mood_pct >= 70 THEN v_resilience := v_resilience + 2;
  ELSIF p_positive_mood_pct >= 50 THEN v_resilience := v_resilience + 1;
  END IF;
  
  -- Academic stability
  IF p_gpa >= 3.5 THEN v_resilience := v_resilience + 1.5;
  ELSIF p_gpa >= 3.0 THEN v_resilience := v_resilience + 0.75;
  END IF;
  
  -- Attendance reliability
  IF p_attendance_rate >= 95 THEN v_resilience := v_resilience + 1;
  ELSIF p_attendance_rate >= 85 THEN v_resilience := v_resilience + 0.5;
  END IF;
  
  -- Positive practices
  IF p_gratitude_count >= 10 THEN v_resilience := v_resilience + 1;
  ELSIF p_gratitude_count >= 5 THEN v_resilience := v_resilience + 0.5;
  END IF;
  
  -- Self-advocacy (asking for help is positive)
  IF p_help_requests BETWEEN 1 AND 3 THEN v_resilience := v_resilience + 0.5;
  END IF;
  
  RETURN LEAST(10, v_resilience);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Identify Early Warning Flags
-- ============================================================================

CREATE OR REPLACE FUNCTION identify_warning_flags(
  p_mood_score DECIMAL,
  p_negative_mood_pct DECIMAL,
  p_attendance_rate DECIMAL,
  p_gpa DECIMAL,
  p_quest_completion DECIMAL,
  p_incident_count INTEGER,
  p_urgent_help INTEGER,
  p_mood_entries INTEGER,
  p_consecutive_negative_days INTEGER,
  p_late_submissions INTEGER
)
RETURNS TEXT[] AS $$
DECLARE
  v_flags TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Emotional warning flags
  IF p_mood_score < 4 THEN 
    v_flags := array_append(v_flags, 'Very low mood score');
  END IF;
  
  IF p_negative_mood_pct > 60 THEN 
    v_flags := array_append(v_flags, 'High negative mood frequency');
  END IF;
  
  IF p_consecutive_negative_days >= 3 THEN 
    v_flags := array_append(v_flags, 'Consecutive negative mood days');
  END IF;
  
  IF p_mood_entries = 0 THEN 
    v_flags := array_append(v_flags, 'No mood tracking engagement');
  END IF;
  
  -- Academic warning flags
  IF p_gpa < 2.0 THEN 
    v_flags := array_append(v_flags, 'Critical GPA level');
  END IF;
  
  IF p_late_submissions > 5 THEN 
    v_flags := array_append(v_flags, 'Frequent late submissions');
  END IF;
  
  -- Attendance warning flags
  IF p_attendance_rate < 70 THEN 
    v_flags := array_append(v_flags, 'Chronic absenteeism');
  ELSIF p_attendance_rate < 85 THEN 
    v_flags := array_append(v_flags, 'Low attendance rate');
  END IF;
  
  -- Engagement warning flags
  IF p_quest_completion < 30 THEN 
    v_flags := array_append(v_flags, 'Very low engagement');
  END IF;
  
  -- Behavioral warning flags
  IF p_incident_count >= 3 THEN 
    v_flags := array_append(v_flags, 'Multiple behavioral incidents');
  END IF;
  
  IF p_urgent_help >= 2 THEN 
    v_flags := array_append(v_flags, 'Multiple urgent help requests');
  END IF;
  
  RETURN v_flags;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Generate Recommended Actions
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_recommended_actions(
  p_risk_level TEXT,
  p_warning_flags TEXT[],
  p_mood_score DECIMAL,
  p_gpa DECIMAL,
  p_attendance_rate DECIMAL
)
RETURNS TEXT[] AS $$
DECLARE
  v_actions TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Critical/High risk actions
  IF p_risk_level IN ('critical', 'high') THEN
    v_actions := array_append(v_actions, 'Schedule immediate counselor meeting');
    v_actions := array_append(v_actions, 'Notify parents/guardians');
  END IF;
  
  -- Mood-based actions
  IF p_mood_score < 5 THEN
    v_actions := array_append(v_actions, 'Provide emotional support resources');
    v_actions := array_append(v_actions, 'Check-in with student daily');
  END IF;
  
  -- Academic actions
  IF p_gpa < 2.5 THEN
    v_actions := array_append(v_actions, 'Arrange academic tutoring');
    v_actions := array_append(v_actions, 'Review study skills and strategies');
  END IF;
  
  -- Attendance actions
  IF p_attendance_rate < 85 THEN
    v_actions := array_append(v_actions, 'Investigate attendance barriers');
    v_actions := array_append(v_actions, 'Develop attendance improvement plan');
  END IF;
  
  -- Engagement actions
  IF 'Very low engagement' = ANY(p_warning_flags) THEN
    v_actions := array_append(v_actions, 'Explore student interests and motivations');
    v_actions := array_append(v_actions, 'Adjust learning activities to increase engagement');
  END IF;
  
  RETURN v_actions;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Advanced Scoring Algorithms Created!';
  RAISE NOTICE '🧮 Mood volatility calculation';
  RAISE NOTICE '📊 Academic consistency scoring';
  RAISE NOTICE '🎯 Engagement quality metrics';
  RAISE NOTICE '⚠️  Risk score calculation';
  RAISE NOTICE '💪 Resilience scoring';
  RAISE NOTICE '🚨 Early warning flag detection';
  RAISE NOTICE '📋 Automated action recommendations';
END $$;
