-- Mood History Migration Script
-- This script creates a mood_history table for storing a complete history of student moods
-- without being limited to one mood entry per day

-- 1. Create the mood_history table
CREATE TABLE IF NOT EXISTS public.mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (
    mood = ANY (ARRAY[
      'happy'::text,
      'excited'::text, 
      'calm'::text, 
      'sad'::text, 
      'angry'::text, 
      'anxious'::text
    ])
  ),
  mood_emoji TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_date DATE DEFAULT CURRENT_DATE,
  recorded_time TIME DEFAULT CURRENT_TIME
);

-- 2. Add comment to the table
COMMENT ON TABLE public.mood_history IS 'Stores all mood entries from students with full history';

-- 3. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON public.mood_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_created_at ON public.mood_history USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_mood_history_user_date ON public.mood_history USING btree (user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_mood_history_date_user ON public.mood_history USING btree (recorded_date, user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_user_date_recent ON public.mood_history USING btree (user_id, recorded_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood ON public.mood_history USING btree (mood);

-- 4. Apply Row Level Security for privacy
ALTER TABLE public.mood_history ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own mood history"
  ON public.mood_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood history"
  ON public.mood_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Migrate existing mood data to the history table
INSERT INTO public.mood_history (user_id, mood, mood_emoji, recorded_date, created_at)
SELECT user_id, mood, mood_emoji, date, created_at
FROM public.mood_tracking
ON CONFLICT DO NOTHING;

-- 7. Create function to handle recording new mood entries
CREATE OR REPLACE FUNCTION record_mood_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into mood_history whenever a new mood is recorded or updated
  INSERT INTO public.mood_history 
    (user_id, mood, mood_emoji, recorded_date, created_at, notes, mood_score)
  VALUES
    (NEW.user_id, NEW.mood, NEW.mood_emoji, NEW.date, NEW.created_at, NULL, 
     CASE 
       WHEN NEW.mood = 'happy' THEN 8
       WHEN NEW.mood = 'excited' THEN 10
       WHEN NEW.mood = 'calm' THEN 7
       WHEN NEW.mood = 'sad' THEN 3
       WHEN NEW.mood = 'angry' THEN 2
       WHEN NEW.mood = 'anxious' THEN 4
       ELSE 5
     END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically record mood history
DROP TRIGGER IF EXISTS mood_history_trigger ON public.mood_tracking;
CREATE TRIGGER mood_history_trigger
AFTER INSERT OR UPDATE ON public.mood_tracking
FOR EACH ROW EXECUTE FUNCTION record_mood_entry();

-- 9. Create function to get mood history for a user with pagination
CREATE OR REPLACE FUNCTION get_user_mood_history(
  user_uuid UUID, 
  days_limit INTEGER DEFAULT 30,
  page_size INTEGER DEFAULT 100,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  mood TEXT,
  mood_emoji TEXT,
  mood_score INTEGER,
  recorded_date DATE,
  recorded_time TIME,
  created_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mh.id,
    mh.mood,
    mh.mood_emoji,
    mh.mood_score,
    mh.recorded_date,
    mh.recorded_time,
    mh.created_at,
    mh.notes
  FROM public.mood_history mh
  WHERE mh.user_id = user_uuid
  AND (
    days_limit IS NULL OR 
    mh.recorded_date >= (CURRENT_DATE - days_limit::INTEGER * INTERVAL '1 day')
  )
  ORDER BY mh.recorded_date DESC, mh.created_at DESC
  LIMIT page_size
  OFFSET ((page_number - 1) * page_size);
END;
$$ LANGUAGE plpgsql;
