-- ============================================
-- Student Rank System with Materialized Views
-- ============================================
-- Creates automated ranking system for students by class and grade
-- Uses materialized views for performance with nightly refresh via pg_cron

-- ============================================
-- 1. Create rank_history table to track changes
-- ============================================
CREATE TABLE IF NOT EXISTS public.rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL,
  grade_level TEXT NOT NULL,
  class_name TEXT,
  class_rank INTEGER,
  grade_rank INTEGER,
  total_students_in_class INTEGER,
  total_students_in_grade INTEGER,
  average_score DECIMAL(5,2),
  rank_change_class INTEGER DEFAULT 0,
  rank_change_grade INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rank_history_student ON public.rank_history(student_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_history_school_grade ON public.rank_history(school_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_rank_history_class ON public.rank_history(school_id, grade_level, class_name);

-- ============================================
-- 2. Materialized View: Class-wise Rankings
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_class_ranks AS
WITH student_scores AS (
  SELECT 
    p.id AS student_id,
    p.school_id,
    p.grade_level,
    p.class_name,
    p.first_name,
    p.last_name,
    -- Calculate average from BOTH academic_assessments and assessment_grades
    COALESCE(
      AVG(
        COALESCE(
          -- From academic_assessments (score/max_score * 100)
          CASE 
            WHEN aa.score IS NOT NULL AND aa.max_score > 0 
            THEN (aa.score::DECIMAL / aa.max_score::DECIMAL) * 100 
            ELSE NULL 
          END,
          -- From assessment_grades (percentage already calculated)
          ag.percentage
        )
      ), 0
    ) AS average_score,
    COUNT(DISTINCT COALESCE(aa.id, ag.id)) AS total_assessments
  FROM profiles p
  LEFT JOIN academic_assessments aa ON aa.student_id = p.id
  LEFT JOIN assessment_grades ag ON ag.student_id = p.id
  WHERE 
    p.role = 'student'
    AND p.grade_level IS NOT NULL
    AND p.class_name IS NOT NULL
    AND p.school_id IS NOT NULL
  GROUP BY p.id, p.school_id, p.grade_level, p.class_name, p.first_name, p.last_name
)
SELECT 
  student_id,
  school_id,
  grade_level,
  class_name,
  first_name,
  last_name,
  average_score,
  total_assessments,
  RANK() OVER (
    PARTITION BY school_id, grade_level, class_name 
    ORDER BY average_score DESC, total_assessments DESC
  ) AS class_rank,
  COUNT(*) OVER (PARTITION BY school_id, grade_level, class_name) AS total_students_in_class,
  NOW() AS last_updated
FROM student_scores
WHERE average_score > 0 OR total_assessments > 0;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_class_ranks_student 
ON public.mv_class_ranks(student_id);

CREATE INDEX IF NOT EXISTS idx_mv_class_ranks_class 
ON public.mv_class_ranks(school_id, grade_level, class_name, class_rank);

CREATE INDEX IF NOT EXISTS idx_mv_class_ranks_score 
ON public.mv_class_ranks(school_id, grade_level, class_name, average_score DESC);

-- ============================================
-- 3. Materialized View: Grade-wise Rankings
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_grade_ranks AS
WITH student_scores AS (
  SELECT 
    p.id AS student_id,
    p.school_id,
    p.grade_level,
    p.first_name,
    p.last_name,
    -- Calculate average from BOTH academic_assessments and assessment_grades
    COALESCE(
      AVG(
        COALESCE(
          -- From academic_assessments (score/max_score * 100)
          CASE 
            WHEN aa.score IS NOT NULL AND aa.max_score > 0 
            THEN (aa.score::DECIMAL / aa.max_score::DECIMAL) * 100 
            ELSE NULL 
          END,
          -- From assessment_grades (percentage already calculated)
          ag.percentage
        )
      ), 0
    ) AS average_score,
    COUNT(DISTINCT COALESCE(aa.id, ag.id)) AS total_assessments
  FROM profiles p
  LEFT JOIN academic_assessments aa ON aa.student_id = p.id
  LEFT JOIN assessment_grades ag ON ag.student_id = p.id
  WHERE 
    p.role = 'student'
    AND p.grade_level IS NOT NULL
    AND p.school_id IS NOT NULL
  GROUP BY p.id, p.school_id, p.grade_level, p.first_name, p.last_name
)
SELECT 
  student_id,
  school_id,
  grade_level,
  first_name,
  last_name,
  average_score,
  total_assessments,
  RANK() OVER (
    PARTITION BY school_id, grade_level 
    ORDER BY average_score DESC, total_assessments DESC
  ) AS grade_rank,
  COUNT(*) OVER (PARTITION BY school_id, grade_level) AS total_students_in_grade,
  NOW() AS last_updated
FROM student_scores
WHERE average_score > 0 OR total_assessments > 0;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_grade_ranks_student 
ON public.mv_grade_ranks(student_id);

CREATE INDEX IF NOT EXISTS idx_mv_grade_ranks_grade 
ON public.mv_grade_ranks(school_id, grade_level, grade_rank);

CREATE INDEX IF NOT EXISTS idx_mv_grade_ranks_score 
ON public.mv_grade_ranks(school_id, grade_level, average_score DESC);

-- ============================================
-- 4. Function: Refresh Rankings and Track History
-- ============================================
CREATE OR REPLACE FUNCTION public.refresh_student_ranks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_students INTEGER := 0;
BEGIN
  -- Refresh materialized views concurrently (non-blocking)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_class_ranks;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_grade_ranks;
  
  -- Record rank history with change tracking
  INSERT INTO public.rank_history (
    student_id,
    school_id,
    grade_level,
    class_name,
    class_rank,
    grade_rank,
    total_students_in_class,
    total_students_in_grade,
    average_score,
    rank_change_class,
    rank_change_grade,
    recorded_at
  )
  SELECT 
    cr.student_id,
    cr.school_id,
    cr.grade_level,
    cr.class_name,
    cr.class_rank,
    gr.grade_rank,
    cr.total_students_in_class,
    gr.total_students_in_grade,
    cr.average_score,
    -- Calculate rank change (negative means improvement)
    COALESCE(
      (SELECT rh.class_rank - cr.class_rank 
       FROM rank_history rh 
       WHERE rh.student_id = cr.student_id 
       ORDER BY rh.recorded_at DESC 
       LIMIT 1), 
      0
    ) AS rank_change_class,
    COALESCE(
      (SELECT rh.grade_rank - gr.grade_rank 
       FROM rank_history rh 
       WHERE rh.student_id = gr.student_id 
       ORDER BY rh.recorded_at DESC 
       LIMIT 1), 
      0
    ) AS rank_change_grade,
    NOW()
  FROM public.mv_class_ranks cr
  JOIN public.mv_grade_ranks gr ON cr.student_id = gr.student_id;
  
  GET DIAGNOSTICS v_affected_students = ROW_COUNT;
  
  -- Clean up old history (keep last 90 days)
  DELETE FROM public.rank_history 
  WHERE recorded_at < NOW() - INTERVAL '90 days';
  
  RETURN v_affected_students;
END;
$$;

-- ============================================
-- 5. RPC Function: Get Student Rank Data
-- ============================================
CREATE OR REPLACE FUNCTION public.get_student_rank_data(p_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'student_id', cr.student_id,
    'first_name', cr.first_name,
    'last_name', cr.last_name,
    'school_id', cr.school_id,
    'grade_level', cr.grade_level,
    'class_name', cr.class_name,
    'average_score', ROUND(cr.average_score, 2),
    'total_assessments', cr.total_assessments,
    'class_rank', cr.class_rank,
    'total_students_in_class', cr.total_students_in_class,
    'grade_rank', gr.grade_rank,
    'total_students_in_grade', gr.total_students_in_grade,
    'rank_change_class', COALESCE(rh.rank_change_class, 0),
    'rank_change_grade', COALESCE(rh.rank_change_grade, 0),
    'last_updated', cr.last_updated,
    'percentile_class', ROUND((1 - (cr.class_rank::DECIMAL / cr.total_students_in_class::DECIMAL)) * 100, 1),
    'percentile_grade', ROUND((1 - (gr.grade_rank::DECIMAL / gr.total_students_in_grade::DECIMAL)) * 100, 1),
    'performance_trend', CASE 
      WHEN COALESCE(rh.rank_change_class, 0) > 0 THEN 'improving'
      WHEN COALESCE(rh.rank_change_class, 0) < 0 THEN 'declining'
      ELSE 'stable'
    END
  )
  INTO v_result
  FROM public.mv_class_ranks cr
  LEFT JOIN public.mv_grade_ranks gr ON cr.student_id = gr.student_id
  LEFT JOIN LATERAL (
    SELECT rank_change_class, rank_change_grade
    FROM public.rank_history
    WHERE student_id = p_student_id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) rh ON true
  WHERE cr.student_id = p_student_id;
  
  RETURN COALESCE(v_result, json_build_object('error', 'Student rank data not found'));
END;
$$;

-- ============================================
-- 6. Set up pg_cron for Nightly Refresh
-- ============================================
-- Schedule nightly refresh at midnight UTC
-- Note: This requires pg_cron extension to be enabled
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('refresh-student-ranks-nightly');
    
    -- Schedule new job (runs at midnight UTC daily)
    PERFORM cron.schedule(
      'refresh-student-ranks-nightly',
      '0 0 * * *',  -- Every day at midnight
      $CRON$SELECT public.refresh_student_ranks();$CRON$
    );
    
    RAISE NOTICE 'pg_cron job scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not available. Please enable it manually.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$$;

-- ============================================
-- 7. Grant Permissions
-- ============================================
GRANT SELECT ON public.mv_class_ranks TO authenticated, anon;
GRANT SELECT ON public.mv_grade_ranks TO authenticated, anon;
GRANT SELECT ON public.rank_history TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_student_rank_data(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.refresh_student_ranks() TO service_role;

-- ============================================
-- 8. Initial Refresh
-- ============================================
-- Perform initial refresh to populate data
SELECT public.refresh_student_ranks();

-- ============================================
-- Comments and Documentation
-- ============================================
COMMENT ON MATERIALIZED VIEW public.mv_class_ranks IS 'Class-wise student rankings based on assessment performance';
COMMENT ON MATERIALIZED VIEW public.mv_grade_ranks IS 'Grade-wise student rankings based on assessment performance';
COMMENT ON TABLE public.rank_history IS 'Historical tracking of student rank changes';
COMMENT ON FUNCTION public.get_student_rank_data IS 'Returns comprehensive rank data for a student including trends';
COMMENT ON FUNCTION public.refresh_student_ranks IS 'Refreshes materialized views and records rank history';

-- ============================================
-- Summary
-- ============================================
-- CREATED:
-- - rank_history table for tracking rank changes
-- - mv_class_ranks materialized view with concurrent refresh
-- - mv_grade_ranks materialized view with concurrent refresh
-- - refresh_student_ranks() function for automated updates
-- - get_student_rank_data(student_id) RPC for fast retrieval
-- - pg_cron job scheduled for midnight daily refresh
--
-- FEATURES:
-- - Automatic nightly refresh at midnight
-- - Rank change tracking (improvement/decline)
-- - Percentile calculation
-- - Performance trend analysis
-- - Efficient indexing for fast queries
-- - Concurrent refresh to avoid blocking
-- - 90-day rank history retention
