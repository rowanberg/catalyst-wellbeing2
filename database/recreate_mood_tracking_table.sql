-- Recreate Mood Tracking Table
-- This script will drop and recreate the mood_tracking table with all necessary components

-- Step 1: Drop existing table and related objects
DROP TABLE IF EXISTS public.mood_tracking CASCADE;

-- Step 2: Create the mood_tracking table
CREATE TABLE public.mood_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  mood TEXT NOT NULL,
  mood_emoji TEXT NOT NULL,
  date DATE NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT mood_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT mood_tracking_user_id_date_key UNIQUE (user_id, date),
  CONSTRAINT mood_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT mood_tracking_mood_check CHECK (
    mood = ANY (ARRAY[
      'happy'::text,
      'excited'::text,
      'calm'::text,
      'sad'::text,
      'angry'::text,
      'anxious'::text
    ])
  )
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date_cleanup ON public.mood_tracking USING btree (date);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_id ON public.mood_tracking USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date ON public.mood_tracking USING btree (date);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date ON public.mood_tracking USING btree (user_id, date);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date_recent ON public.mood_tracking USING btree (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_tracking_date_user ON public.mood_tracking USING btree (date, user_id);

-- Step 4: Enable Row Level Security
ALTER TABLE public.mood_tracking ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own mood tracking" ON public.mood_tracking;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.mood_tracking;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.mood_tracking;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.mood_tracking;

-- Step 6: Create RLS policies for authenticated users
CREATE POLICY "Users can manage their own mood tracking"
  ON public.mood_tracking
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 7: Grant permissions
GRANT ALL ON public.mood_tracking TO authenticated;
GRANT ALL ON public.mood_tracking TO service_role;

-- Step 8: Create or replace the record_mood_entry function for mood_history sync
CREATE OR REPLACE FUNCTION public.record_mood_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into mood_history whenever a new mood is recorded or updated
  INSERT INTO public.mood_history 
    (user_id, mood, mood_emoji, recorded_date, created_at, mood_score)
  VALUES
    (NEW.user_id, NEW.mood, NEW.mood_emoji, NEW.date, NEW.created_at,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger for mood_history sync
DROP TRIGGER IF EXISTS mood_history_trigger ON public.mood_tracking;
CREATE TRIGGER mood_history_trigger
  AFTER INSERT OR UPDATE ON public.mood_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.record_mood_entry();

-- Step 10: Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'mood_tracking'
  ) THEN
    RAISE NOTICE 'Table mood_tracking created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create mood_tracking table';
  END IF;
END $$;

-- Step 11: Display table information
SELECT 
  'mood_tracking' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'mood_tracking';

-- Success message
SELECT 'Mood tracking table recreated successfully!' as status;
