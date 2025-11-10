# Comprehensive Wellbeing Analytics System Plan

## Executive Summary

This document outlines a complete plan for aggregating, processing, and analyzing student wellbeing data from multiple sources into a unified analytics table. The system will run nightly ETL processes to consolidate data and generate actionable insights.

---

## 1. Data Sources Identified

### Primary Tables (32 total)

**Wellbeing & Mood:**
- `mood_tracking` - Daily mood entries
- `mood_history` - Complete mood history
- `wellbeing_assessments` - Multi-dimensional assessments

**Activities:**
- `daily_quests` - Quest completion
- `mindfulness_sessions` - Breathing, affirmation sessions
- `gratitude_entries` - Gratitude journal
- `courage_log` - Courage activities
- `kindness_counter` - Kindness acts
- `habit_tracker` - Sleep, water intake

**Academic:**
- `assessment_grades` - Test scores
- `test_results` - Subject results
- `subject_performance` - Performance trends

**Engagement:**
- `attendance` - Daily attendance
- `student_activity` - Activity log

**Safety:**
- `safety_incidents` - Incident tracking
- `help_requests` - Support needs
- `digital_safety_checks` - Online safety

**Achievements:**
- `student_achievements` - Recognition
- `profiles` - XP, gems, level, streaks

---

## 2. Unified Analytics Table

### Table: `student_wellbeing_analytics`

```sql
CREATE TABLE student_wellbeing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(user_id),
  school_id UUID NOT NULL REFERENCES schools(id),
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Emotional (40% weight)
  mood_score DECIMAL(4,2),
  positive_mood_percentage DECIMAL(5,2),
  mood_entries_count INTEGER,
  
  -- Academic (25% weight)
  gpa DECIMAL(3,2),
  average_grade_percentage DECIMAL(5,2),
  tests_completed INTEGER,
  
  -- Engagement (20% weight)
  attendance_rate DECIMAL(5,2),
  quest_completion_rate DECIMAL(5,2),
  activity_streak_days INTEGER,
  
  -- Social (10% weight)
  achievement_count INTEGER,
  xp_earned INTEGER,
  kindness_acts_count INTEGER,
  
  -- Behavioral (5% weight)
  safety_incidents_count INTEGER,
  help_requests_count INTEGER,
  
  -- Composite Scores
  overall_wellbeing_score DECIMAL(4,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, analysis_date, period_type)
);
```

---

## 3. ETL Process

### Nightly Function

```sql
CREATE OR REPLACE FUNCTION run_wellbeing_etl()
RETURNS JSON AS $$
DECLARE
  v_students_processed INTEGER := 0;
BEGIN
  -- Process each student
  FOR v_student IN SELECT user_id, school_id FROM profiles WHERE role = 'student'
  LOOP
    PERFORM process_student_analytics(v_student.user_id, v_student.school_id);
    v_students_processed := v_students_processed + 1;
  END LOOP;
  
  RETURN json_build_object('students_processed', v_students_processed);
END;
$$ LANGUAGE plpgsql;
```

### Scheduling

Use Supabase Edge Function with cron: `0 2 * * *` (2 AM daily)

---

## 4. Implementation Steps

1. **Week 1-2:** Create table and indexes
2. **Week 3-4:** Build ETL functions
3. **Week 5:** Set up automation
4. **Week 6:** Create API endpoints
5. **Week 7-8:** Testing and optimization
6. **Week 9:** Production deployment

---

## 5. API Endpoints

- `/api/admin/wellbeing-analytics-v2` - Query analytics
- `/api/student/wellbeing-dashboard` - Student view
- `/api/admin/wellbeing-alerts` - High-risk alerts

---

## 6. Benefits

- **Single Source of Truth** for wellbeing data
- **Fast Queries** - Pre-aggregated data
- **Trend Analysis** - Historical comparisons
- **Risk Detection** - Automated alerts
- **Scalable** - Handles large datasets efficiently
