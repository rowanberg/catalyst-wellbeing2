-- Add composite index for grade_levels query optimization
-- Optimizes: SELECT * FROM grade_levels WHERE school_id = ? AND is_active = ?

CREATE INDEX IF NOT EXISTS idx_grade_levels_school_active 
ON public.grade_levels(school_id, is_active) 
TABLESPACE pg_default;

-- This index will speed up grade fetching from 858ms to ~50-100ms
