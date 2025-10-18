-- Performance indexes for student dashboard queries
-- Run these in your Supabase SQL editor

-- Gratitude entries index
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_created 
  ON gratitude_entries(user_id, created_at DESC);

-- Courage log index  
CREATE INDEX IF NOT EXISTS idx_courage_log_user_created
  ON courage_log(user_id, created_at DESC);

-- Kindness counter index
CREATE INDEX IF NOT EXISTS idx_kindness_counter_user_updated
  ON kindness_counter(user_id, last_updated DESC);

-- Breathing sessions index
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_created
  ON breathing_sessions(user_id, created_at DESC);

-- Habit tracker index
CREATE INDEX IF NOT EXISTS idx_habit_tracker_user_date
  ON habit_tracker(user_id, date DESC);

-- Mood tracking index
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date
  ON mood_tracking(user_id, date DESC);

-- Help requests index
CREATE INDEX IF NOT EXISTS idx_help_requests_student_created
  ON help_requests(student_id, created_at DESC);

-- Profiles user_id index (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON profiles(user_id);

-- School details index
CREATE INDEX IF NOT EXISTS idx_school_details_school_status
  ON school_details(school_id, status);
