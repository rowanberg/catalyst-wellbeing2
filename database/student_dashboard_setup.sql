-- Student Dashboard Complete Setup SQL
-- This file ensures all tables and data structures needed for the student dashboard are properly created

-- Ensure all required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix parent_child_relationships table with proper foreign keys
DROP TABLE IF EXISTS parent_child_relationships CASCADE;
CREATE TABLE parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'caregiver')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Create or update profiles table with all required columns for student dashboard
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS class_name TEXT,
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_quests_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_mood TEXT,
ADD COLUMN IF NOT EXISTS pet_happiness INTEGER DEFAULT 85,
ADD COLUMN IF NOT EXISTS pet_name TEXT DEFAULT 'Whiskers';

-- Create mood tracking table
CREATE TABLE IF NOT EXISTS mood_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious')),
  mood_emoji TEXT NOT NULL,
  energy INTEGER DEFAULT 50 CHECK (energy >= 0 AND energy <= 100),
  stress INTEGER DEFAULT 30 CHECK (stress >= 0 AND stress <= 100),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create daily quests table
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('gratitude', 'kindness', 'courage', 'breathing', 'water', 'sleep')),
  completed BOOLEAN DEFAULT FALSE,
  date DATE DEFAULT CURRENT_DATE,
  xp_earned INTEGER DEFAULT 10,
  gems_earned INTEGER DEFAULT 2,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_type, date)
);

-- Create mindfulness sessions table
CREATE TABLE IF NOT EXISTS mindfulness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('breathing', 'affirmation', 'gratitude')),
  duration_seconds INTEGER DEFAULT 300,
  xp_earned INTEGER DEFAULT 15,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure habit tracker table exists
CREATE TABLE IF NOT EXISTS habit_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  water_glasses INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1) DEFAULT 0,
  exercise_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Ensure kindness counter table exists
CREATE TABLE IF NOT EXISTS kindness_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_acts INTEGER DEFAULT 0,
  weekly_acts INTEGER DEFAULT 0,
  monthly_acts INTEGER DEFAULT 0,
  last_act_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date ON mood_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON daily_quests(user_id, date);
CREATE INDEX IF NOT EXISTS idx_mindfulness_sessions_user ON mindfulness_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_tracker_user_date ON habit_tracker(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Row Level Security (RLS) Policies
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindfulness_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_counter ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mood_tracking
DROP POLICY IF EXISTS "Users can view own mood tracking" ON mood_tracking;
CREATE POLICY "Users can view own mood tracking" ON mood_tracking
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mood tracking" ON mood_tracking;
CREATE POLICY "Users can insert own mood tracking" ON mood_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mood tracking" ON mood_tracking;
CREATE POLICY "Users can update own mood tracking" ON mood_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for daily_quests
DROP POLICY IF EXISTS "Users can view own daily quests" ON daily_quests;
CREATE POLICY "Users can view own daily quests" ON daily_quests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily quests" ON daily_quests;
CREATE POLICY "Users can insert own daily quests" ON daily_quests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily quests" ON daily_quests;
CREATE POLICY "Users can update own daily quests" ON daily_quests
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mindfulness_sessions
DROP POLICY IF EXISTS "Users can view own mindfulness sessions" ON mindfulness_sessions;
CREATE POLICY "Users can view own mindfulness sessions" ON mindfulness_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mindfulness sessions" ON mindfulness_sessions;
CREATE POLICY "Users can insert own mindfulness sessions" ON mindfulness_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for habit_tracker
DROP POLICY IF EXISTS "Users can view own habit tracker" ON habit_tracker;
CREATE POLICY "Users can view own habit tracker" ON habit_tracker
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habit tracker" ON habit_tracker;
CREATE POLICY "Users can insert own habit tracker" ON habit_tracker
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habit tracker" ON habit_tracker;
CREATE POLICY "Users can update own habit tracker" ON habit_tracker
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for kindness_counter
DROP POLICY IF EXISTS "Users can view own kindness counter" ON kindness_counter;
CREATE POLICY "Users can view own kindness counter" ON kindness_counter
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own kindness counter" ON kindness_counter;
CREATE POLICY "Users can insert own kindness counter" ON kindness_counter
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own kindness counter" ON kindness_counter;
CREATE POLICY "Users can update own kindness counter" ON kindness_counter
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create daily quests for new users
CREATE OR REPLACE FUNCTION create_daily_quests_for_user(user_uuid UUID, quest_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  quest_type TEXT;
  quest_types TEXT[] := ARRAY['gratitude', 'kindness', 'courage', 'breathing', 'water', 'sleep'];
BEGIN
  FOREACH quest_type IN ARRAY quest_types
  LOOP
    INSERT INTO daily_quests (user_id, quest_type, date, completed, xp_earned, gems_earned)
    VALUES (user_uuid, quest_type, quest_date, FALSE, 0, 0)
    ON CONFLICT (user_id, quest_type, date) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user dashboard data
CREATE OR REPLACE FUNCTION initialize_user_dashboard_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Create kindness counter entry
  INSERT INTO kindness_counter (user_id, total_acts, weekly_acts, monthly_acts)
  VALUES (user_uuid, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create today's daily quests
  PERFORM create_daily_quests_for_user(user_uuid);
  
  -- Create habit tracker entry for today
  INSERT INTO habit_tracker (user_id, date, water_glasses, sleep_hours, exercise_minutes)
  VALUES (user_uuid, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically initialize dashboard data for new profiles
CREATE OR REPLACE FUNCTION trigger_initialize_dashboard_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'student' THEN
    PERFORM initialize_user_dashboard_data(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS initialize_dashboard_data_trigger ON profiles;
CREATE TRIGGER initialize_dashboard_data_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_dashboard_data();

-- Function to update user stats after quest completion
CREATE OR REPLACE FUNCTION update_user_stats_on_quest_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    -- Update profile stats
    UPDATE profiles 
    SET 
      xp = COALESCE(xp, 0) + NEW.xp_earned,
      gems = COALESCE(gems, 0) + NEW.gems_earned,
      total_quests_completed = COALESCE(total_quests_completed, 0) + 1,
      level = GREATEST(1, FLOOR((COALESCE(xp, 0) + NEW.xp_earned) / 100) + 1)
    WHERE user_id = NEW.user_id;
    
    -- Update pet happiness
    UPDATE profiles 
    SET pet_happiness = LEAST(100, COALESCE(pet_happiness, 85) + 5)
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS quest_completion_stats_trigger ON daily_quests;
CREATE TRIGGER quest_completion_stats_trigger
  AFTER UPDATE ON daily_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_quest_completion();

-- RLS Policies for parent_child_relationships
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view own children" ON parent_child_relationships;
CREATE POLICY "Parents can view own children" ON parent_child_relationships
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can manage own children relationships" ON parent_child_relationships;
CREATE POLICY "Parents can manage own children relationships" ON parent_child_relationships
  FOR ALL USING (auth.uid() = parent_id);

-- Create indexes for parent_child_relationships
CREATE INDEX IF NOT EXISTS idx_parent_child_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child_id ON parent_child_relationships(child_id);
