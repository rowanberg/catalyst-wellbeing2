-- ============================================================================
-- ENHANCED WELLBEING ANALYTICS - REPORTING QUERIES
-- ============================================================================
-- Part 4: Pre-built analytical queries for insights
-- ============================================================================

-- ============================================================================
-- QUERY 1: Student Risk Dashboard
-- ============================================================================

CREATE OR REPLACE VIEW v_student_risk_dashboard AS
SELECT 
  p.first_name || ' ' || p.last_name as student_name,
  p.grade_level,
  p.class_name,
  swa.overall_wellbeing_score,
  swa.risk_level,
  swa.risk_score,
  swa.intervention_priority,
  swa.emotional_wellbeing_score,
  swa.academic_wellbeing_score,
  swa.engagement_wellbeing_score,
  swa.mood_score_avg,
  swa.gpa,
  swa.attendance_rate,
  swa.early_warning_flags,
  swa.warning_flag_count,
  swa.recommended_actions,
  swa.risk_factors,
  swa.protective_factors,
  swa.analysis_date
FROM student_wellbeing_analytics_enhanced swa
JOIN profiles p ON p.user_id = swa.student_id
WHERE swa.analysis_date = CURRENT_DATE
ORDER BY swa.risk_score DESC, swa.overall_wellbeing_score ASC;

-- ============================================================================
-- QUERY 2: School-Wide Wellbeing Summary
-- ============================================================================

CREATE OR REPLACE FUNCTION get_school_wellbeing_summary(p_school_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_students', COUNT(*),
    'average_wellbeing_score', ROUND(AVG(overall_wellbeing_score), 2),
    'risk_distribution', json_build_object(
      'thriving', COUNT(*) FILTER (WHERE risk_level = 'thriving'),
      'low', COUNT(*) FILTER (WHERE risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE risk_level = 'critical')
    ),
    'students_needing_intervention', COUNT(*) FILTER (WHERE intervention_recommended = TRUE),
    'average_scores', json_build_object(
      'emotional', ROUND(AVG(emotional_wellbeing_score), 2),
      'academic', ROUND(AVG(academic_wellbeing_score), 2),
      'engagement', ROUND(AVG(engagement_wellbeing_score), 2),
      'social', ROUND(AVG(social_wellbeing_score), 2),
      'behavioral', ROUND(AVG(behavioral_wellbeing_score), 2)
    ),
    'key_metrics', json_build_object(
      'average_gpa', ROUND(AVG(gpa), 2),
      'average_attendance', ROUND(AVG(attendance_rate), 2),
      'average_mood', ROUND(AVG(mood_score_avg), 2),
      'average_engagement_quality', ROUND(AVG(engagement_quality_score), 2)
    ),
    'total_warning_flags', SUM(warning_flag_count),
    'students_with_warnings', COUNT(*) FILTER (WHERE warning_flag_count > 0)
  ) INTO v_result
  FROM student_wellbeing_analytics_enhanced
  WHERE school_id = p_school_id AND analysis_date = p_date;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY 3: Grade-Level Comparison
-- ============================================================================

CREATE OR REPLACE VIEW v_grade_level_wellbeing AS
SELECT 
  p.grade_level,
  COUNT(*) as student_count,
  ROUND(AVG(swa.overall_wellbeing_score), 2) as avg_wellbeing,
  ROUND(AVG(swa.emotional_wellbeing_score), 2) as avg_emotional,
  ROUND(AVG(swa.academic_wellbeing_score), 2) as avg_academic,
  ROUND(AVG(swa.engagement_wellbeing_score), 2) as avg_engagement,
  ROUND(AVG(swa.gpa), 2) as avg_gpa,
  ROUND(AVG(swa.attendance_rate), 2) as avg_attendance,
  COUNT(*) FILTER (WHERE swa.risk_level IN ('high', 'critical')) as high_risk_count,
  ROUND(COUNT(*) FILTER (WHERE swa.risk_level IN ('high', 'critical'))::DECIMAL / COUNT(*) * 100, 2) as high_risk_percentage
FROM student_wellbeing_analytics_enhanced swa
JOIN profiles p ON p.user_id = swa.student_id
WHERE swa.analysis_date = CURRENT_DATE
GROUP BY p.grade_level
ORDER BY p.grade_level;

-- ============================================================================
-- QUERY 4: Individual Student Trend Analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION get_student_trend_analysis(
  p_student_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'student_id', p_student_id,
    'current_score', (
      SELECT overall_wellbeing_score 
      FROM student_wellbeing_analytics_enhanced 
      WHERE student_id = p_student_id 
      ORDER BY analysis_date DESC LIMIT 1
    ),
    'score_trend', (
      SELECT json_agg(json_build_object(
        'date', analysis_date,
        'score', overall_wellbeing_score,
        'risk_level', risk_level
      ) ORDER BY analysis_date)
      FROM student_wellbeing_analytics_enhanced
      WHERE student_id = p_student_id
      AND analysis_date >= CURRENT_DATE - p_days_back
    ),
    'dimension_trends', json_build_object(
      'emotional', (
        SELECT json_agg(json_build_object('date', analysis_date, 'score', emotional_wellbeing_score) ORDER BY analysis_date)
        FROM student_wellbeing_analytics_enhanced
        WHERE student_id = p_student_id AND analysis_date >= CURRENT_DATE - p_days_back
      ),
      'academic', (
        SELECT json_agg(json_build_object('date', analysis_date, 'score', academic_wellbeing_score) ORDER BY analysis_date)
        FROM student_wellbeing_analytics_enhanced
        WHERE student_id = p_student_id AND analysis_date >= CURRENT_DATE - p_days_back
      ),
      'engagement', (
        SELECT json_agg(json_build_object('date', analysis_date, 'score', engagement_wellbeing_score) ORDER BY analysis_date)
        FROM student_wellbeing_analytics_enhanced
        WHERE student_id = p_student_id AND analysis_date >= CURRENT_DATE - p_days_back
      )
    ),
    'improvement_rate', (
      SELECT ROUND(
        (MAX(overall_wellbeing_score) - MIN(overall_wellbeing_score)) / NULLIF(MIN(overall_wellbeing_score), 0) * 100, 2
      )
      FROM student_wellbeing_analytics_enhanced
      WHERE student_id = p_student_id AND analysis_date >= CURRENT_DATE - p_days_back
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUERY 5: Top Students Needing Attention
-- ============================================================================

CREATE OR REPLACE VIEW v_students_needing_attention AS
SELECT 
  p.first_name || ' ' || p.last_name as student_name,
  p.grade_level,
  swa.overall_wellbeing_score,
  swa.risk_level,
  swa.intervention_priority,
  swa.early_warning_flags,
  swa.recommended_actions,
  swa.mood_score_avg,
  swa.gpa,
  swa.attendance_rate,
  swa.analysis_date
FROM student_wellbeing_analytics_enhanced swa
JOIN profiles p ON p.user_id = swa.student_id
WHERE swa.intervention_recommended = TRUE
AND swa.analysis_date = CURRENT_DATE
ORDER BY 
  CASE swa.intervention_priority
    WHEN 'immediate' THEN 1
    WHEN 'urgent' THEN 2
    WHEN 'moderate' THEN 3
    ELSE 4
  END,
  swa.risk_score DESC;

-- ============================================================================
-- QUERY 6: Wellbeing Improvement Tracking
-- ============================================================================

CREATE OR REPLACE VIEW v_wellbeing_improvements AS
SELECT 
  p.first_name || ' ' || p.last_name as student_name,
  p.grade_level,
  curr.overall_wellbeing_score as current_score,
  prev.overall_wellbeing_score as previous_score,
  ROUND(curr.overall_wellbeing_score - prev.overall_wellbeing_score, 2) as score_change,
  ROUND((curr.overall_wellbeing_score - prev.overall_wellbeing_score) / NULLIF(prev.overall_wellbeing_score, 0) * 100, 2) as percent_change,
  curr.risk_level as current_risk,
  prev.risk_level as previous_risk,
  CASE 
    WHEN curr.overall_wellbeing_score > prev.overall_wellbeing_score THEN 'Improving'
    WHEN curr.overall_wellbeing_score < prev.overall_wellbeing_score THEN 'Declining'
    ELSE 'Stable'
  END as trend
FROM student_wellbeing_analytics_enhanced curr
JOIN student_wellbeing_analytics_enhanced prev 
  ON curr.student_id = prev.student_id 
  AND prev.analysis_date = curr.analysis_date - 7
JOIN profiles p ON p.user_id = curr.student_id
WHERE curr.analysis_date = CURRENT_DATE
ORDER BY score_change DESC;

-- ============================================================================
-- QUERY 7: Detailed Student Profile
-- ============================================================================

CREATE OR REPLACE FUNCTION get_detailed_student_profile(p_student_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'student_info', (
      SELECT json_build_object(
        'name', first_name || ' ' || last_name,
        'grade', grade_level,
        'class', class_name
      ) FROM profiles WHERE user_id = p_student_id
    ),
    'current_wellbeing', (
      SELECT json_build_object(
        'overall_score', overall_wellbeing_score,
        'risk_level', risk_level,
        'risk_score', risk_score,
        'resilience_score', resilience_score,
        'dimension_scores', json_build_object(
          'emotional', emotional_wellbeing_score,
          'academic', academic_wellbeing_score,
          'engagement', engagement_wellbeing_score,
          'social', social_wellbeing_score,
          'behavioral', behavioral_wellbeing_score
        )
      )
      FROM student_wellbeing_analytics_enhanced
      WHERE student_id = p_student_id
      ORDER BY analysis_date DESC LIMIT 1
    ),
    'detailed_metrics', (
      SELECT json_build_object(
        'mood', json_build_object(
          'average', mood_score_avg,
          'min', mood_score_min,
          'max', mood_score_max,
          'volatility', mood_score_std_dev,
          'positive_percentage', positive_mood_percentage,
          'entries_count', mood_entries_count
        ),
        'academic', json_build_object(
          'gpa', gpa,
          'average_grade', average_grade_percentage,
          'tests_completed', tests_completed,
          'test_pass_rate', test_pass_rate,
          'consistency', academic_consistency
        ),
        'engagement', json_build_object(
          'attendance_rate', attendance_rate,
          'quest_completion', quest_completion_rate,
          'streak_days', activity_streak_days,
          'quality_score', engagement_quality_score
        ),
        'social', json_build_object(
          'level', level,
          'xp_per_day', xp_per_day,
          'gratitude_count', gratitude_entries_count,
          'kindness_acts', kindness_acts_count
        )
      )
      FROM student_wellbeing_analytics_enhanced
      WHERE student_id = p_student_id
      ORDER BY analysis_date DESC LIMIT 1
    ),
    'risk_assessment', (
      SELECT json_build_object(
        'risk_factors', risk_factors,
        'protective_factors', protective_factors,
        'warning_flags', early_warning_flags,
        'recommended_actions', recommended_actions,
        'intervention_priority', intervention_priority
      )
      FROM student_wellbeing_analytics_enhanced
      WHERE student_id = p_student_id
      ORDER BY analysis_date DESC LIMIT 1
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Analytics Queries & Views Created!';
  RAISE NOTICE '📊 v_student_risk_dashboard';
  RAISE NOTICE '📈 get_school_wellbeing_summary()';
  RAISE NOTICE '📚 v_grade_level_wellbeing';
  RAISE NOTICE '📉 get_student_trend_analysis()';
  RAISE NOTICE '⚠️  v_students_needing_attention';
  RAISE NOTICE '📊 v_wellbeing_improvements';
  RAISE NOTICE '👤 get_detailed_student_profile()';
END $$;
