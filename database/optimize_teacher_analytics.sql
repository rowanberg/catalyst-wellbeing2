-- Performance Optimization for Teacher Analytics
-- Indexes to speed up the analytics queries

-- Teacher and class assignment lookups
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_active 
ON teacher_class_assignments(teacher_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_active 
ON student_class_assignments(class_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_student_class_assignments_student 
ON student_class_assignments(student_id, class_id);

-- Profile lookups by user_id (for student data)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role 
ON profiles(user_id, role);

-- Mood tracking recent data (last 7 days query)
CREATE INDEX IF NOT EXISTS idx_mood_tracking_user_date_recent 
ON mood_tracking(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_mood_tracking_date_user 
ON mood_tracking(date, user_id);

-- Help requests recent data (last 30 days query)
CREATE INDEX IF NOT EXISTS idx_help_requests_student_recent 
ON help_requests(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_help_requests_status_urgency 
ON help_requests(status, urgency) 
WHERE status = 'pending';

-- Daily quests recent data (last 7 days query)
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date_recent 
ON daily_quests(user_id, date DESC, completed);

CREATE INDEX IF NOT EXISTS idx_daily_quests_date_completed 
ON daily_quests(date, completed);

-- Habit tracker recent data (last 7 days query)
CREATE INDEX IF NOT EXISTS idx_habit_tracker_user_date_recent 
ON habit_tracker(user_id, date DESC);

-- Kindness counter by user
CREATE INDEX IF NOT EXISTS idx_kindness_counter_user 
ON kindness_counter(user_id);

-- Composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_role 
ON profiles(school_id, role) 
WHERE role = 'student';

-- Analyze tables to update statistics
ANALYZE teacher_class_assignments;
ANALYZE student_class_assignments;
ANALYZE profiles;
ANALYZE mood_tracking;
ANALYZE help_requests;
ANALYZE daily_quests;
ANALYZE habit_tracker;
ANALYZE kindness_counter;
