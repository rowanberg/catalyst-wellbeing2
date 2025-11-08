-- =============================================
-- Daily Topics Schema
-- =============================================
-- Purpose: Store teacher's daily topics for each class
-- Features: 
--   - One topic per class per day
--   - Automatic upsert (update if exists for today)
--   - Efficient querying by date and teacher
-- =============================================

-- Create daily_topics table
CREATE TABLE IF NOT EXISTS public.daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  topic TEXT NOT NULL CHECK (char_length(topic) >= 3 AND char_length(topic) <= 1000),
  topic_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one topic per class per day
  CONSTRAINT unique_topic_per_class_per_day UNIQUE (teacher_id, class_id, topic_date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_daily_topics_teacher_date 
  ON public.daily_topics(teacher_id, topic_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_topics_class_date 
  ON public.daily_topics(class_id, topic_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_topics_school_date 
  ON public.daily_topics(school_id, topic_date DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_topics_updated_at
  BEFORE UPDATE ON public.daily_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_topics_updated_at();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.daily_topics ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own topics
CREATE POLICY "Teachers can view their own daily topics"
  ON public.daily_topics
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR
    -- Allow school admins to view all topics in their school
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.school_id = daily_topics.school_id
      AND profiles.role IN ('admin', 'school_admin')
    )
  );

-- Policy: Teachers can insert their own topics
CREATE POLICY "Teachers can create daily topics"
  ON public.daily_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND
    -- Verify teacher belongs to the school
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.school_id = daily_topics.school_id
      AND profiles.role = 'teacher'
    )
    AND
    -- Verify teacher is assigned to the class
    EXISTS (
      SELECT 1 FROM public.teacher_class_assignments
      WHERE teacher_class_assignments.teacher_id = auth.uid()
      AND teacher_class_assignments.class_id = daily_topics.class_id
    )
  );

-- Policy: Teachers can update their own topics
CREATE POLICY "Teachers can update their own daily topics"
  ON public.daily_topics
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Policy: Teachers can delete their own topics
CREATE POLICY "Teachers can delete their own daily topics"
  ON public.daily_topics
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- =============================================
-- Cleanup Function (Optional)
-- =============================================
-- Automatically delete topics older than 30 days
-- Can be run as a scheduled job

CREATE OR REPLACE FUNCTION cleanup_old_daily_topics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.daily_topics
  WHERE topic_date < CURRENT_DATE - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_daily_topics() TO authenticated;

-- =============================================
-- Helper View: Recent Topics with Class Info
-- =============================================

CREATE OR REPLACE VIEW public.daily_topics_with_details AS
SELECT 
  dt.id,
  dt.teacher_id,
  dt.class_id,
  dt.school_id,
  dt.topic,
  dt.topic_date,
  dt.created_at,
  dt.updated_at,
  c.class_name,
  c.subject,
  c.room_number,
  c.grade_level_id,
  p.first_name || ' ' || p.last_name AS teacher_name
FROM public.daily_topics dt
JOIN public.classes c ON dt.class_id = c.id
JOIN public.profiles p ON dt.teacher_id = p.user_id
ORDER BY dt.topic_date DESC, dt.updated_at DESC;

-- Grant access to the view
GRANT SELECT ON public.daily_topics_with_details TO authenticated;

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE public.daily_topics IS 'Stores daily topics taught by teachers for each class. Only one topic per class per day is allowed.';
COMMENT ON COLUMN public.daily_topics.topic_date IS 'The date for which this topic was taught (defaults to today)';
COMMENT ON COLUMN public.daily_topics.topic IS 'The topic or lesson content taught (3-1000 characters)';
COMMENT ON CONSTRAINT unique_topic_per_class_per_day ON public.daily_topics IS 'Ensures only one topic per class per day - updates instead of duplicates';
