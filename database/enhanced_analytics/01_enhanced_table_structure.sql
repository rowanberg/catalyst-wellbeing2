-- ============================================================================
-- ENHANCED WELLBEING ANALYTICS - TABLE STRUCTURE
-- ============================================================================
-- Part 1: Enhanced table with granular tracking columns
-- ============================================================================

-- Drop and recreate with enhanced structure
DROP TABLE IF EXISTS student_wellbeing_analytics_enhanced CASCADE;

CREATE TABLE student_wellbeing_analytics_enhanced (
  -- Primary Keys
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),
  
  -- ========================================================================
  -- EMOTIONAL WELLBEING (Enhanced Granularity)
  -- ========================================================================
  
  -- Mood Metrics
  mood_score_avg DECIMAL(4,2), -- Average mood score (1-10)
  mood_score_min DECIMAL(4,2), -- Lowest mood in period
  mood_score_max DECIMAL(4,2), -- Highest mood in period
  mood_score_std_dev DECIMAL(4,2), -- Mood volatility
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining', 'volatile')),
  
  -- Mood Distribution
  positive_mood_count INTEGER DEFAULT 0,
  negative_mood_count INTEGER DEFAULT 0,
  neutral_mood_count INTEGER DEFAULT 0,
  positive_mood_percentage DECIMAL(5,2),
  negative_mood_percentage DECIMAL(5,2),
  neutral_mood_percentage DECIMAL(5,2),
  
  -- Mood Patterns
  mood_entries_count INTEGER DEFAULT 0,
  mood_consistency_score DECIMAL(4,2), -- How regularly they log moods
  mood_improvement_rate DECIMAL(5,2), -- % improvement from start to end
  consecutive_positive_days INTEGER DEFAULT 0,
  consecutive_negative_days INTEGER DEFAULT 0,
  
  -- Emotional Indicators
  stress_level_avg DECIMAL(4,2),
  anxiety_indicators_count INTEGER DEFAULT 0,
  happiness_indicators_count INTEGER DEFAULT 0,
  
  -- ========================================================================
  -- ACADEMIC WELLBEING (Subject-Level Detail)
  -- ========================================================================
  
  -- Overall Academic Metrics
  gpa DECIMAL(3,2),
  gpa_trend TEXT CHECK (gpa_trend IN ('improving', 'stable', 'declining')),
  average_grade_percentage DECIMAL(5,2),
  
  -- Assessment Performance
  tests_completed INTEGER DEFAULT 0,
  tests_passed INTEGER DEFAULT 0,
  tests_failed INTEGER DEFAULT 0,
  test_pass_rate DECIMAL(5,2),
  average_test_score DECIMAL(5,2),
  highest_test_score DECIMAL(5,2),
  lowest_test_score DECIMAL(5,2),
  
  -- Academic Trends
  grade_improvement_rate DECIMAL(5,2), -- % change from previous period
  academic_consistency DECIMAL(4,2), -- Low std dev = consistent
  struggling_subjects TEXT[], -- List of subjects below 70%
  excelling_subjects TEXT[], -- List of subjects above 85%
  
  -- Assignment Metrics
  assignments_submitted INTEGER DEFAULT 0,
  assignments_total INTEGER DEFAULT 0,
  assignment_completion_rate DECIMAL(5,2),
  late_submissions_count INTEGER DEFAULT 0,
  on_time_submission_rate DECIMAL(5,2),
  
  -- ========================================================================
  -- ENGAGEMENT WELLBEING (Time-Based Patterns)
  -- ========================================================================
  
  -- Attendance Metrics
  attendance_rate DECIMAL(5,2),
  attendance_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  excused_absences INTEGER DEFAULT 0,
  unexcused_absences INTEGER DEFAULT 0,
  attendance_trend TEXT CHECK (attendance_trend IN ('improving', 'stable', 'declining')),
  perfect_attendance_weeks INTEGER DEFAULT 0,
  
  -- Quest & Activity Engagement
  quest_completion_rate DECIMAL(5,2),
  quests_completed INTEGER DEFAULT 0,
  quests_attempted INTEGER DEFAULT 0,
  quests_abandoned INTEGER DEFAULT 0,
  total_quests_available INTEGER DEFAULT 0,
  quest_completion_trend TEXT,
  
  -- Activity Patterns
  activity_streak_days INTEGER DEFAULT 0,
  longest_streak_in_period INTEGER DEFAULT 0,
  streak_breaks_count INTEGER DEFAULT 0,
  daily_login_count INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(6,2),
  weekend_activity_rate DECIMAL(5,2),
  
  -- Engagement Quality
  engagement_quality_score DECIMAL(4,2), -- Based on depth of interaction
  passive_engagement_percentage DECIMAL(5,2),
  active_engagement_percentage DECIMAL(5,2),
  
  -- ========================================================================
  -- SOCIAL WELLBEING (Interaction Quality)
  -- ========================================================================
  
  -- Gamification Metrics
  xp_earned INTEGER DEFAULT 0,
  xp_per_day DECIMAL(6,2),
  gems_earned INTEGER DEFAULT 0,
  gems_per_day DECIMAL(6,2),
  level INTEGER DEFAULT 1,
  level_progress_percentage DECIMAL(5,2),
  
  -- Achievement Metrics
  achievement_count INTEGER DEFAULT 0,
  achievement_types JSONB DEFAULT '{}', -- {"academic": 5, "social": 3, etc}
  achievement_rate DECIMAL(5,2), -- Achievements per week
  
  -- Social Interaction
  gratitude_entries_count INTEGER DEFAULT 0,
  gratitude_frequency DECIMAL(5,2), -- Entries per week
  kindness_acts_count INTEGER DEFAULT 0,
  kindness_acts_per_week DECIMAL(5,2),
  peer_interaction_score DECIMAL(4,2),
  
  -- Social-Emotional Learning
  empathy_indicators INTEGER DEFAULT 0,
  collaboration_score DECIMAL(4,2),
  leadership_indicators INTEGER DEFAULT 0,
  
  -- ========================================================================
  -- BEHAVIORAL WELLBEING (Pattern Detection)
  -- ========================================================================
  
  -- Incident Tracking
  incident_count INTEGER DEFAULT 0,
  incident_severity_avg DECIMAL(4,2), -- 1=low, 4=critical
  behavioral_improvement_rate DECIMAL(5,2),
  days_since_last_incident INTEGER,
  
  -- Help & Support
  help_requests_count INTEGER DEFAULT 0,
  urgent_help_requests_count INTEGER DEFAULT 0,
  help_request_resolution_rate DECIMAL(5,2),
  avg_help_response_time_hours DECIMAL(6,2),
  self_advocacy_score DECIMAL(4,2), -- Ability to ask for help
  
  -- Behavioral Patterns
  positive_behavior_count INTEGER DEFAULT 0,
  negative_behavior_count INTEGER DEFAULT 0,
  behavior_consistency_score DECIMAL(4,2),
  
  -- ========================================================================
  -- COMPOSITE SCORES (Multi-Dimensional)
  -- ========================================================================
  
  -- Primary Dimensions
  emotional_wellbeing_score DECIMAL(4,2),
  academic_wellbeing_score DECIMAL(4,2),
  engagement_wellbeing_score DECIMAL(4,2),
  social_wellbeing_score DECIMAL(4,2),
  behavioral_wellbeing_score DECIMAL(4,2),
  
  -- Overall Score
  overall_wellbeing_score DECIMAL(4,2),
  overall_score_trend TEXT CHECK (overall_score_trend IN ('improving', 'stable', 'declining')),
  score_change_from_previous DECIMAL(5,2), -- Percentage change
  
  -- Percentile Rankings
  school_percentile DECIMAL(5,2), -- Compared to school
  grade_percentile DECIMAL(5,2), -- Compared to grade level
  
  -- ========================================================================
  -- RISK ASSESSMENT (Advanced)
  -- ========================================================================
  
  -- Risk Classification
  risk_level TEXT CHECK (risk_level IN ('thriving', 'low', 'medium', 'high', 'critical')),
  risk_score DECIMAL(4,2), -- 0-10 scale
  risk_trend TEXT CHECK (risk_trend IN ('increasing', 'stable', 'decreasing')),
  
  -- Risk Factors (Detailed)
  risk_factors JSONB DEFAULT '[]',
  risk_factor_count INTEGER DEFAULT 0,
  critical_risk_factors TEXT[],
  
  -- Protective Factors
  protective_factors JSONB DEFAULT '[]',
  protective_factor_count INTEGER DEFAULT 0,
  resilience_score DECIMAL(4,2),
  
  -- Intervention
  intervention_recommended BOOLEAN DEFAULT FALSE,
  intervention_type TEXT,
  intervention_priority TEXT CHECK (intervention_priority IN ('immediate', 'urgent', 'moderate', 'low')),
  recommended_actions TEXT[],
  
  -- Early Warning Indicators
  early_warning_flags TEXT[],
  warning_flag_count INTEGER DEFAULT 0,
  
  -- ========================================================================
  -- PREDICTIVE ANALYTICS
  -- ========================================================================
  
  -- Trend Predictions
  predicted_next_score DECIMAL(4,2),
  predicted_risk_level TEXT,
  confidence_level DECIMAL(3,2), -- 0-1 scale
  
  -- Pattern Recognition
  behavior_pattern_type TEXT, -- 'consistent', 'improving', 'declining', 'erratic'
  seasonal_pattern_detected BOOLEAN DEFAULT FALSE,
  
  -- ========================================================================
  -- DATA QUALITY & METADATA
  -- ========================================================================
  
  data_quality_score DECIMAL(3,2), -- 0-1 based on completeness
  data_completeness_percentage DECIMAL(5,2),
  missing_data_fields TEXT[],
  data_sources_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT DEFAULT 'enhanced_etl',
  processing_duration_ms INTEGER,
  
  -- Constraints
  UNIQUE(student_id, analysis_date, period_type)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookups
CREATE INDEX idx_enhanced_student_date ON student_wellbeing_analytics_enhanced(student_id, analysis_date DESC);
CREATE INDEX idx_enhanced_school_date ON student_wellbeing_analytics_enhanced(school_id, analysis_date DESC);
CREATE INDEX idx_enhanced_period ON student_wellbeing_analytics_enhanced(period_type, analysis_date DESC);

-- Risk-based queries
CREATE INDEX idx_enhanced_risk_level ON student_wellbeing_analytics_enhanced(risk_level, school_id);
CREATE INDEX idx_enhanced_risk_score ON student_wellbeing_analytics_enhanced(risk_score DESC);
CREATE INDEX idx_enhanced_intervention ON student_wellbeing_analytics_enhanced(intervention_recommended, intervention_priority) 
  WHERE intervention_recommended = TRUE;

-- Score-based queries
CREATE INDEX idx_enhanced_overall_score ON student_wellbeing_analytics_enhanced(overall_wellbeing_score DESC);
CREATE INDEX idx_enhanced_emotional_score ON student_wellbeing_analytics_enhanced(emotional_wellbeing_score DESC);
CREATE INDEX idx_enhanced_academic_score ON student_wellbeing_analytics_enhanced(academic_wellbeing_score DESC);

-- Trend analysis
CREATE INDEX idx_enhanced_trends ON student_wellbeing_analytics_enhanced(overall_score_trend, risk_trend);
CREATE INDEX idx_enhanced_warning_flags ON student_wellbeing_analytics_enhanced(warning_flag_count DESC) 
  WHERE warning_flag_count > 0;

-- Dashboard queries
CREATE INDEX idx_enhanced_dashboard ON student_wellbeing_analytics_enhanced(
  school_id, analysis_date DESC, risk_level, overall_wellbeing_score DESC
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE student_wellbeing_analytics_enhanced ENABLE ROW LEVEL SECURITY;

-- Students can view their own analytics
CREATE POLICY "Students view own enhanced analytics" 
  ON student_wellbeing_analytics_enhanced
  FOR SELECT 
  USING (auth.uid() = student_id);

-- Teachers can view analytics for their school
CREATE POLICY "Teachers view school enhanced analytics" 
  ON student_wellbeing_analytics_enhanced
  FOR SELECT 
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'teacher'
    )
  );

-- Admins can manage all analytics for their school
CREATE POLICY "Admins manage school enhanced analytics" 
  ON student_wellbeing_analytics_enhanced
  FOR ALL 
  USING (
    school_id IN (
      SELECT school_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'counselor', 'principal')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON student_wellbeing_analytics_enhanced TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced Wellbeing Analytics Table Created!';
  RAISE NOTICE '📊 100+ detailed tracking columns';
  RAISE NOTICE '🎯 Multi-dimensional scoring system';
  RAISE NOTICE '🔍 Advanced risk assessment';
  RAISE NOTICE '📈 Predictive analytics ready';
END $$;
