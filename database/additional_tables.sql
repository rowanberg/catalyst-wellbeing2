-- Additional tables needed for comprehensive school management dashboard

-- Add missing columns to existing schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS academic_year_start DATE DEFAULT '2024-09-01',
ADD COLUMN IF NOT EXISTS academic_year_end DATE DEFAULT '2025-06-30',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_notifications": true,
  "sms_notifications": false,
  "push_notifications": true,
  "weekly_reports": true,
  "urgent_alerts": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "data_retention_days": 365,
  "allow_analytics": true,
  "share_anonymous_data": false,
  "require_parent_consent": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS wellbeing_settings JSONB DEFAULT '{
  "daily_check_ins": true,
  "anonymous_reporting": true,
  "crisis_intervention": true,
  "counselor_access": true
}'::jsonb;

-- Add missing columns to profiles table for enhanced user management
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
  xp_earned INTEGER DEFAULT 0,
  gems_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_type, date)
);

-- Create mindfulness sessions table
CREATE TABLE IF NOT EXISTS mindfulness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('breathing', 'affirmation', 'gratitude')),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics tracking table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'activity_complete', 'help_request', etc.
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table for better activity tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create school announcements table
CREATE TABLE IF NOT EXISTS school_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_roles TEXT[] DEFAULT ARRAY['student', 'teacher', 'parent'],
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create school classes table for better organization
CREATE TABLE IF NOT EXISTS school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT,
  teacher_id UUID REFERENCES profiles(user_id),
  room_number TEXT,
  subject TEXT,
  academic_year TEXT,
  max_students INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES school_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  UNIQUE(class_id, student_id)
);

-- Create wellbeing assessments table
CREATE TABLE IF NOT EXISTS wellbeing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  assessment_date DATE DEFAULT CURRENT_DATE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  social_connection INTEGER CHECK (social_connection >= 1 AND social_connection <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incident reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(user_id),
  incident_type TEXT NOT NULL, -- 'bullying', 'academic', 'behavioral', 'safety', etc.
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  location TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  students_involved UUID[],
  witnesses UUID[],
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(user_id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate parent-child relationships table with correct foreign keys
DROP TABLE IF EXISTS parent_child_relationships CASCADE;
CREATE TABLE parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  child_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'emergency_contact')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Add RLS policies for new tables
ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindfulness_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_child_relationships
DROP POLICY IF EXISTS "Parents can view own children" ON parent_child_relationships;
CREATE POLICY "Parents can view own children" ON parent_child_relationships
  FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can manage own children relationships" ON parent_child_relationships;
CREATE POLICY "Parents can manage own children relationships" ON parent_child_relationships
  FOR ALL USING (auth.uid() = parent_id);

-- Create indexes for parent_child_relationships
CREATE INDEX IF NOT EXISTS idx_parent_child_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child_id ON parent_child_relationships(child_id);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mood_tracking
DROP POLICY IF EXISTS "Users can manage their own mood tracking" ON mood_tracking;
CREATE POLICY "Users can manage their own mood tracking" ON mood_tracking
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for daily_quests
DROP POLICY IF EXISTS "Users can manage their own daily quests" ON daily_quests;
CREATE POLICY "Users can manage their own daily quests" ON daily_quests
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for mindfulness_sessions
DROP POLICY IF EXISTS "Users can manage their own mindfulness sessions" ON mindfulness_sessions;
CREATE POLICY "Users can manage their own mindfulness sessions" ON mindfulness_sessions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for analytics_events
DROP POLICY IF EXISTS "Users can view their own analytics events" ON analytics_events;
CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all school analytics events" ON analytics_events;
CREATE POLICY "Admins can view all school analytics events" ON analytics_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = analytics_events.school_id
    )
  );

-- RLS Policies for user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all school sessions" ON user_sessions;
CREATE POLICY "Admins can view all school sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = user_sessions.school_id
    )
  );

-- RLS Policies for school_announcements
DROP POLICY IF EXISTS "Users can view announcements for their role" ON school_announcements;
CREATE POLICY "Users can view announcements for their role" ON school_announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.school_id = school_announcements.school_id
      AND profiles.role = ANY(school_announcements.target_roles)
    )
  );

DROP POLICY IF EXISTS "Admins can manage school announcements" ON school_announcements;
CREATE POLICY "Admins can manage school announcements" ON school_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin' 
      AND profiles.school_id = school_announcements.school_id
    )
  );

-- RLS Policies for school_classes
DROP POLICY IF EXISTS "School members can view classes" ON school_classes;
CREATE POLICY "School members can view classes" ON school_classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.school_id = school_classes.school_id
    )
  );

DROP POLICY IF EXISTS "Admins and teachers can manage classes" ON school_classes;
CREATE POLICY "Admins and teachers can manage classes" ON school_classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.school_id = school_classes.school_id
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for wellbeing_assessments
DROP POLICY IF EXISTS "Students can view their own assessments" ON wellbeing_assessments;
CREATE POLICY "Students can view their own assessments" ON wellbeing_assessments
  FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create their own assessments" ON wellbeing_assessments;
CREATE POLICY "Students can create their own assessments" ON wellbeing_assessments
  FOR INSERT WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins and teachers can view school assessments" ON wellbeing_assessments;
CREATE POLICY "Admins and teachers can view school assessments" ON wellbeing_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.school_id = wellbeing_assessments.school_id
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for incident_reports
DROP POLICY IF EXISTS "Users can view reports they created or are involved in" ON incident_reports;
CREATE POLICY "Users can view reports they created or are involved in" ON incident_reports
  FOR SELECT USING (
    reported_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    auth.uid() = ANY(students_involved) OR
    auth.uid() = ANY(witnesses)
  );

DROP POLICY IF EXISTS "Admins and teachers can manage incident reports" ON incident_reports;
CREATE POLICY "Admins and teachers can manage incident reports" ON incident_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.school_id = incident_reports.school_id
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_school_id ON analytics_events(school_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_school_id ON user_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_school_announcements_school_id ON school_announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_school_id ON school_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_assessments_student_id ON wellbeing_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_assessments_school_id ON wellbeing_assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_school_id ON incident_reports(school_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
